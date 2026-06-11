# Backlog

## Next priorities

1. Apply `supabase/schema.sql` once SQL admin access is available.
2. Load all relevant DECP monthly/yearly resources instead of a single sample file.
3. Support multiple suppliers/titulaires per market.
4. Add better CPV labels and location labels.
5. Add pagination and server-side search when the dataset grows.
6. Add buyer/supplier alias normalization.
7. Add CSV export for search results.
8. Add a data freshness badge and scheduled import.
9. Add basic monitoring for failed imports/deployments.
10. Add tests for route rendering and data import edge cases.

## Known MVP limitations

- Sample dataset only.
- Hash-based routing for simplicity.
- No authentication.
- No advanced charts.
- Supplier/buyer profiles are computed in the browser from the loaded sample.
