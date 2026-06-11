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
- Supabase Storage for hosting the generated dataset when credentials allow it
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

## Environment variables

Copy `.env.example` to `.env` if you want to override the data URL:

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

## Supabase

A SQL schema is provided in `supabase/schema.sql` for a future table-backed version. In this MVP, the deployed app can run from the generated JSON file; when Supabase SQL admin is available, the same normalized records can be loaded into the `contracts` table.

## Deployment

```bash
npm run build
npx vercel deploy --prod --yes --token "$VERCEL_TOKEN"
```
