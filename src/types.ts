export interface ContractRecord {
  id: string;
  title: string;
  buyerName: string;
  buyerId: string;
  supplierName: string;
  supplierId: string;
  amount: number | null;
  date: string;
  year: number | null;
  location: string;
  cpv: string;
  procedure: string;
  sourceUrl: string;
  raw: unknown;
}

export interface RankedStat {
  name: string;
  count: number;
  amount: number;
}

export interface YearStat {
  year: number;
  amount: number;
  count: number;
}
