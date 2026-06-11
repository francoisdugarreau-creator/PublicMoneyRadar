#!/usr/bin/env python3
"""Import a small real DECP sample and enrich SIRET/SIREN names with public SIRENE data.

Sources:
- DECP file published on data.gouv.fr by marches-publics.info / AWSolutions.
- Recherche Entreprises API (api.gouv.fr) for SIRENE-based organization names.

The MVP intentionally keeps a compact JSON sample for fast Vercel deployment.
"""
from __future__ import annotations

import json
import time
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any

DECP_URL = "https://static.data.gouv.fr/resources/donnees-essentielles-de-la-commande-publique-decp-de-marches-publics-info-awsolutions/20260525-000444/aws-2026-01.json"
DATASET_PAGE = "https://www.data.gouv.fr/datasets/donnees-essentielles-de-la-commande-publique-decp-de-marches-publics-info-awsolutions/"
RAW_PATH = Path("data/raw/aws-2026-01.json")
OUT_PATH = Path("public/data/contracts.json")
MAX_CONTRACTS = 650
MAX_ENRICH_IDS = 700


def fetch_json(url: str, timeout: int = 60) -> Any:
    req = urllib.request.Request(url, headers={"User-Agent": "PublicMoneyRadar/0.1"})
    with urllib.request.urlopen(req, timeout=timeout) as response:
        return json.load(response)


def first_text(*values: Any) -> str:
    for value in values:
        if value is None:
            continue
        text = str(value).strip()
        if text:
            return text
    return ""


def entity_id(entity: Any) -> str:
    if isinstance(entity, dict):
        return first_text(entity.get("id"), entity.get("siret"), entity.get("siren"))
    return ""


def titulaire_id(item: dict[str, Any]) -> str:
    titulaires = item.get("titulaires") or []
    if isinstance(titulaires, dict):
        titulaires = [titulaires]
    for wrapper in titulaires:
        titulaire = wrapper.get("titulaire") if isinstance(wrapper, dict) else None
        ident = entity_id(titulaire)
        if ident:
            return ident
    return ""


def location(item: dict[str, Any]) -> str:
    lieu = item.get("lieuExecution") or {}
    if not isinstance(lieu, dict):
        return ""
    code = first_text(lieu.get("code"), lieu.get("nom"), lieu.get("adresse"))
    typ = first_text(lieu.get("typeCode"))
    return f"{code} ({typ})" if code and typ else code


def enrich_name(identifier: str, cache: dict[str, dict[str, Any]]) -> dict[str, Any]:
    if not identifier:
        return {"name": "Non renseigné", "siren": "", "address": ""}
    if identifier in cache:
        return cache[identifier]
    url = "https://recherche-entreprises.api.gouv.fr/search?" + urllib.parse.urlencode({"q": identifier, "per_page": 1})
    try:
        data = fetch_json(url, timeout=20)
        result = (data.get("results") or [{}])[0]
        siege = result.get("siege") or {}
        enriched = {
            "name": first_text(result.get("nom_complet"), result.get("nom_raison_sociale"), identifier),
            "siren": first_text(result.get("siren"), identifier[:9]),
            "address": first_text(siege.get("adresse"), siege.get("libelle_commune"), siege.get("code_postal")),
        }
    except Exception:
        enriched = {"name": identifier, "siren": identifier[:9], "address": ""}
    cache[identifier] = enriched
    time.sleep(0.03)
    return enriched


def main() -> None:
    RAW_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)

    if RAW_PATH.exists():
        raw = json.loads(RAW_PATH.read_text())
    else:
        raw = fetch_json(DECP_URL)
        RAW_PATH.write_text(json.dumps(raw, ensure_ascii=False), encoding="utf-8")

    rows = raw.get("marches", {}).get("marche", [])
    rows = [r for r in rows if isinstance(r, dict) and r.get("objet")]
    rows = rows[:MAX_CONTRACTS]

    ids: list[str] = []
    for item in rows:
        buyer = entity_id(item.get("acheteur"))
        supplier = titulaire_id(item)
        if buyer:
            ids.append(buyer)
        if supplier:
            ids.append(supplier)
    unique_ids = list(dict.fromkeys(ids))[:MAX_ENRICH_IDS]
    cache: dict[str, dict[str, Any]] = {}
    for ident in unique_ids:
        enrich_name(ident, cache)

    contracts = []
    for item in rows:
        buyer_id = entity_id(item.get("acheteur"))
        supplier_id = titulaire_id(item)
        buyer = cache.get(buyer_id) or enrich_name(buyer_id, cache)
        supplier = cache.get(supplier_id) or enrich_name(supplier_id, cache)
        date = first_text(item.get("dateNotification"), item.get("datePublicationDonnees"))
        try:
            year = int(date[:4]) if date else None
        except ValueError:
            year = None
        amount = item.get("montant")
        if amount is not None:
            try:
                amount = float(amount)
            except (TypeError, ValueError):
                amount = None
        contracts.append({
            "id": first_text(item.get("id"), f"decp-{len(contracts)+1}"),
            "title": first_text(item.get("objet"), "Marché sans objet renseigné"),
            "buyerName": buyer["name"],
            "buyerId": buyer_id,
            "supplierName": supplier["name"],
            "supplierId": supplier_id,
            "amount": amount,
            "date": date,
            "year": year,
            "location": location(item),
            "cpv": first_text(item.get("codeCPV")),
            "procedure": first_text(item.get("procedure"), item.get("nature")),
            "sourceUrl": DECP_URL,
            "raw": {
                "decpId": item.get("id"),
                "nature": item.get("nature"),
                "datePublicationDonnees": item.get("datePublicationDonnees"),
                "acheteur": item.get("acheteur"),
                "titulaires": item.get("titulaires"),
                "lieuExecution": item.get("lieuExecution"),
            },
        })

    payload = {
        "generatedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "source": {
            "name": "Données essentielles de la commande publique (DECP) de marches-publics.info (AWSolutions)",
            "datasetPage": DATASET_PAGE,
            "resourceUrl": DECP_URL,
            "sireneEnrichment": "https://recherche-entreprises.api.gouv.fr/",
            "limitation": f"MVP sample of {len(contracts)} contracts from the January 2026 resource."
        },
        "contracts": contracts,
    }
    OUT_PATH.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Imported {len(contracts)} contracts to {OUT_PATH}")
    print("Example queries: GROUPAMA, Lyon, assurance, 77983836600028")


if __name__ == "__main__":
    main()
