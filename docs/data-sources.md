# Data sources

## Primary source: DECP

- Dataset: **Données essentielles de la commande publique (DECP) de marches-publics.info (AWSolutions)**
- Publisher page: https://www.data.gouv.fr/datasets/donnees-essentielles-de-la-commande-publique-decp-de-marches-publics-info-awsolutions/
- Resource used for the MVP sample: `aws_2026-01.json`
- Resource URL: https://static.data.gouv.fr/resources/donnees-essentielles-de-la-commande-publique-decp-de-marches-publics-info-awsolutions/20260525-000444/aws-2026-01.json

The import script keeps a compact sample from this public JSON resource to keep the demo fast and easy to deploy.

## Company enrichment: SIRENE / Recherche Entreprises

- API: https://recherche-entreprises.api.gouv.fr/
- Used to enrich buyer and supplier SIRET/SIREN identifiers with organization names and addresses when possible.

## Fields normalized for the MVP

- `id`: generated unique row identifier for frontend routing and future DB primary key.
- `decpId`: original DECP market id preserved from the source.
- `sourceRowIndex`: row position in the imported DECP sample.
- `title`: cleaned contract object / `objet`.
- `buyerName`, `buyerId`: public buyer from DECP + SIRENE enrichment.
- `supplierName`, `supplierId`: first awardee/titulaire from DECP + SIRENE enrichment. The importer handles both wrapped and direct titulaire shapes.
- `amount`: `montant`.
- `date`, `year`: notification or publication date.
- `location`: execution location code/type when available.
- `cpv`: CPV code.
- `procedure`: procurement procedure.
- `sourceUrl`: original DECP JSON file URL.
- `raw`: selected original fields used for traceability/debugging, including original `objet`, `montant`, `codeCPV`, dates, buyer, titulaire and location.

## Traceability

- Each normalized contract stores the original resource URL.
- `sourceRowIndex` identifies where the normalized row came from inside the sampled source file.
- `contracts.json.source` stores the dataset page, resource URL, enrichment API, import limitation, normalization note and missing-field counts.

## Limitations

- The MVP imports a sample, not all French DECP resources.
- Only the first supplier/titulaire is used when a market has multiple awardees.
- One original DECP market id may produce multiple normalized rows; `id` is unique per row while `decpId` may repeat.
- Locations are displayed as raw DECP execution codes when no label is available.
- SIRENE enrichment depends on the public Recherche Entreprises API and may fall back to identifiers.
- Supabase SQL admin was not available during build, so the repo includes `supabase/schema.sql`; the working MVP uses a JSON dataset hosted in Supabase Storage and also committed under `public/data/contracts.json`.

## Data rules followed

- Only public/open data sources are used.
- Source URLs are stored in each normalized contract.
- Selected raw DECP fields are kept for traceability.
- Normalization is intentionally minimal and focused on search/display.
