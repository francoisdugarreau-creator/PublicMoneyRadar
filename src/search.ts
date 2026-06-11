import type { ContractRecord, RankedStat, YearStat } from './types';

function normalize(value: string | number | null | undefined): string {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function amountOf(contract: ContractRecord): number {
  return typeof contract.amount === 'number' && Number.isFinite(contract.amount) ? contract.amount : 0;
}

function rankMap(map: Map<string, RankedStat>, limit = 8): RankedStat[] {
  return Array.from(map.values())
    .sort((a, b) => b.amount - a.amount || b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, limit);
}

function addRank(map: Map<string, RankedStat>, name: string, amount: number): void {
  const key = name || 'Non renseigné';
  const current = map.get(key) ?? { name: key, count: 0, amount: 0 };
  current.count += 1;
  current.amount += amount;
  map.set(key, current);
}

function yearlyStats(contracts: ContractRecord[]): YearStat[] {
  const map = new Map<number, YearStat>();
  for (const contract of contracts) {
    if (!contract.year) continue;
    const current = map.get(contract.year) ?? { year: contract.year, amount: 0, count: 0 };
    current.count += 1;
    current.amount += amountOf(contract);
    map.set(contract.year, current);
  }
  return Array.from(map.values()).sort((a, b) => a.year - b.year);
}

const STOPWORDS = new Set([
  'avec', 'dans', 'des', 'les', 'pour', 'une', 'marché', 'marche', 'public', 'prestation', 'service', 'services',
  'fourniture', 'travaux', 'objet', 'accord', 'cadre', 'sans', 'commune', 'ville'
]);

function keywords(contracts: ContractRecord[], limit = 12): string[] {
  const counts = new Map<string, number>();
  for (const contract of contracts) {
    for (const token of normalize(contract.title).split(/[^a-z0-9]+/)) {
      if (token.length < 4 || STOPWORDS.has(token)) continue;
      counts.set(token, (counts.get(token) ?? 0) + 1);
    }
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([word]) => word);
}

export function searchContracts(contracts: ContractRecord[], query: string): ContractRecord[] {
  const q = normalize(query);
  if (!q) return contracts.slice(0, 50);
  return contracts
    .filter((contract) => {
      const haystack = normalize([
        contract.title,
        contract.buyerName,
        contract.buyerId,
        contract.supplierName,
        contract.supplierId,
        contract.location,
        contract.cpv,
        contract.procedure,
        contract.amount
      ].join(' '));
      return haystack.includes(q);
    })
    .sort((a, b) => (b.date || '').localeCompare(a.date || '') || amountOf(b) - amountOf(a))
    .slice(0, 100);
}

export function aggregateSupplier(contracts: ContractRecord[], supplierIdOrName: string) {
  const q = normalize(supplierIdOrName);
  const rows = contracts.filter((contract) => normalize(contract.supplierId) === q || normalize(contract.supplierName) === q);
  if (!rows.length) return null;
  const buyers = new Map<string, RankedStat>();
  let totalAmount = 0;
  for (const contract of rows) {
    const amount = amountOf(contract);
    totalAmount += amount;
    addRank(buyers, contract.buyerName, amount);
  }
  return {
    id: rows[0].supplierId,
    name: rows[0].supplierName,
    contractsWon: rows.length,
    totalAmount,
    mainBuyers: rankMap(buyers),
    keywords: keywords(rows),
    yearly: yearlyStats(rows),
    contracts: rows
  };
}

export function aggregateBuyer(contracts: ContractRecord[], buyerIdOrName: string) {
  const q = normalize(buyerIdOrName);
  const rows = contracts.filter((contract) => normalize(contract.buyerId) === q || normalize(contract.buyerName) === q);
  if (!rows.length) return null;
  const suppliers = new Map<string, RankedStat>();
  let totalSpending = 0;
  for (const contract of rows) {
    const amount = amountOf(contract);
    totalSpending += amount;
    addRank(suppliers, contract.supplierName, amount);
  }
  return {
    id: rows[0].buyerId,
    name: rows[0].buyerName,
    contractsPublished: rows.length,
    totalSpending,
    mainSuppliers: rankMap(suppliers),
    recurringTopics: keywords(rows),
    yearly: yearlyStats(rows),
    contracts: rows
  };
}

export function formatEuro(amount: number | null | undefined): string {
  if (typeof amount !== 'number' || !Number.isFinite(amount)) return 'Montant non renseigné';
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(amount);
}
