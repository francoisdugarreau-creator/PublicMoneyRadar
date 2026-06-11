import { describe, expect, it } from 'vitest';
import { aggregateBuyer, aggregateSupplier, searchContracts } from './search';
import type { ContractRecord } from './types';

const sample: ContractRecord[] = [
  {
    id: 'm1',
    decpId: 'm1',
    sourceRowIndex: 0,
    title: 'Maintenance de capteurs IoT',
    buyerName: 'Ville de Lyon',
    buyerId: '21690123100011',
    supplierName: 'Four Data',
    supplierId: '12345678900010',
    amount: 120000,
    date: '2025-02-10',
    year: 2025,
    location: 'Lyon',
    cpv: '72000000',
    procedure: 'Appel d offres',
    sourceUrl: 'https://example.com/a',
    raw: {}
  },
  {
    id: 'm2',
    decpId: 'm2',
    sourceRowIndex: 1,
    title: 'Plateforme data énergie',
    buyerName: 'Métropole de Lyon',
    buyerId: '24690012300010',
    supplierName: 'Data Publique',
    supplierId: '98765432100011',
    amount: 80000,
    date: '2024-06-01',
    year: 2024,
    location: 'Rhône',
    cpv: '72000000',
    procedure: 'MAPA',
    sourceUrl: 'https://example.com/b',
    raw: {}
  }
];

describe('PublicMoney Radar search helpers', () => {
  it('searches by supplier, buyer, keyword and SIRET-like id', () => {
    expect(searchContracts(sample, 'four data')).toHaveLength(1);
    expect(searchContracts(sample, 'métropole')).toHaveLength(1);
    expect(searchContracts(sample, 'capteurs')).toHaveLength(1);
    expect(searchContracts(sample, '98765432100011')[0].id).toBe('m2');
  });

  it('aggregates supplier profile totals, buyers, keywords and yearly evolution', () => {
    const profile = aggregateSupplier(sample, '12345678900010');
    expect(profile?.totalAmount).toBe(120000);
    expect(profile?.contractsWon).toBe(1);
    expect(profile?.mainBuyers[0]).toEqual({ name: 'Ville de Lyon', count: 1, amount: 120000 });
    expect(profile?.yearly).toEqual([{ year: 2025, amount: 120000, count: 1 }]);
    expect(profile?.keywords).toContain('maintenance');
  });

  it('aggregates buyer spending and main suppliers', () => {
    const profile = aggregateBuyer(sample, '21690123100011');
    expect(profile?.totalSpending).toBe(120000);
    expect(profile?.contractsPublished).toBe(1);
    expect(profile?.mainSuppliers[0]).toEqual({ name: 'Four Data', count: 1, amount: 120000 });
  });
});
