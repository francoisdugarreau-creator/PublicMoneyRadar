# PublicMoney Radar

MVP web app for searching French public procurement contracts from open DECP data.

## What it does

- Search by supplier/company name, public buyer name, keyword, SIREN or SIRET.
- Show a clean list of matching public contracts.
- Open a contract detail page with buyer, supplier, object/title, amount, date, location, CPV/procedure and source URL.
- Open supplier pages with contracts won, total amount, main public buyers, keywords and yearly evolution.
- Open public buyer pages with contracts, total spending, main suppliers and recurring topics.

## Stack

- Vite + React + TypeScript
- Static JSON dataset generated from public open data
- Supabase Storage for hosting the generated dataset in production
- Vercel for deployment

## Local setup

```bash
npm install
npm run import:data
npm test
npm run build
npm run dev
```

Open http://localhost:5173 and try:

- `GROUPAMA`
- `assurance`
- `Lyon`
- `77983836600028`

In local dev, the app defaults to `/data/contracts.json`, so `npm run import:data` immediately affects the local app. In production, the default is the public Supabase Storage JSON URL unless overridden with an env var.

## Environment variables

Copy `.env.example` to `.env` only if you want to override the data URL:

```bash
VITE_DATA_URL=/data/contracts.json
VITE_SUPABASE_PUBLIC_DATA_URL=https://<project>.supabase.co/storage/v1/object/public/publicmoney-radar/contracts.json
```

The browser app only needs public URLs. Do not expose Supabase secret/service keys with `VITE_`.

## Data import

```bash
npm run import:data
```

The script downloads a DECP JSON resource from data.gouv.fr, keeps a compact sample, enriches buyer/supplier names via the public Recherche Entreprises API, and writes `public/data/contracts.json`.

Notes:

- The raw downloaded file is cached under `data/raw/` and ignored by Git.
- Enrichment uses public network calls and can degrade gracefully to identifiers if the API is unavailable.
- DECP market IDs are not unique in the source resource. The import therefore generates a unique row `id` for routing/database loading and preserves the original market identifier as `decpId`.
- `contracts.json.source.missingFieldCounts` documents missing core fields in the generated sample.

## Supabase

The working production demo reads `contracts.json` from Supabase Storage. A SQL schema is provided in `supabase/schema.sql` for a future table-backed version, but it was not applied during the MVP because Supabase SQL/admin access returned `403 error code: 1010`.

When SQL/admin access is available, the normalized records can be loaded into the `contracts` table. The table primary key is the generated unique row `id`; the original DECP market id is stored separately as `decp_id`.

## Deployment

```bash
npm run build
npx vercel deploy --prod --yes --token "$VERCEL_TOKEN"
```
