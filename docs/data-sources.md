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

- `id`: DECP market id when available
- `title`: contract object / `objet`
- `buyerName`, `buyerId`: public buyer from DECP + SIRENE enrichment
- `supplierName`, `supplierId`: first awardee/titulaire from DECP + SIRENE enrichment
- `amount`: `montant`
- `date`, `year`: notification or publication date
- `location`: execution location code/type when available
- `cpv`: CPV code
- `procedure`: procurement procedure
- `sourceUrl`: original DECP JSON file URL
- `raw`: selected original fields useful for traceability

## Limitations

- The MVP imports a sample, not all French DECP resources.
- Only the first supplier/titulaire is used when a market has multiple awardees.
- Locations are displayed as raw DECP execution codes when no label is available.
- SIRENE enrichment depends on the public Recherche Entreprises API and may fall back to identifiers.
- Supabase SQL admin was not available during build, so the repo includes `supabase/schema.sql`; the working MVP uses a JSON dataset suitable for Supabase Storage or Vercel static hosting.

## Data rules followed

- Only public/open data sources are used.
- Source URLs are stored in each normalized contract.
- Raw selected DECP fields are kept for traceability.
- Normalization is intentionally minimal and focused on search/display.
