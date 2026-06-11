import React from 'react';
import { createRoot } from 'react-dom/client';
import { ArrowLeft, Building2, ExternalLink, Landmark, Search } from 'lucide-react';
import { aggregateBuyer, aggregateSupplier, formatEuro, searchContracts } from './search';
import type { ContractRecord } from './types';
import './styles.css';

interface DataPayload {
  generatedAt: string;
  source: {
    name: string;
    datasetPage: string;
    resourceUrl: string;
    sireneEnrichment: string;
    limitation: string;
  };
  contracts: ContractRecord[];
}

type Route =
  | { page: 'home' }
  | { page: 'contract'; id: string }
  | { page: 'supplier'; id: string }
  | { page: 'buyer'; id: string };

const defaultQuery = new URLSearchParams(window.location.search).get('q') || 'assurance';

const SUPABASE_PUBLIC_DATA_URL = 'https://whfjhpzvfuaezpbthjtj.supabase.co/storage/v1/object/public/publicmoney-radar/contracts.json';

function dataUrl(): string {
  return import.meta.env.VITE_SUPABASE_PUBLIC_DATA_URL || import.meta.env.VITE_DATA_URL || SUPABASE_PUBLIC_DATA_URL;
}

function parseRoute(): Route {
  const hash = window.location.hash.replace(/^#\/?/, '');
  const [page, ...rest] = hash.split('/');
  const id = decodeURIComponent(rest.join('/'));
  if (page === 'contract' && id) return { page: 'contract', id };
  if (page === 'supplier' && id) return { page: 'supplier', id };
  if (page === 'buyer' && id) return { page: 'buyer', id };
  return { page: 'home' };
}

function go(route: Route): void {
  if (route.page === 'home') window.location.hash = '/';
  if (route.page === 'contract') window.location.hash = `/contract/${encodeURIComponent(route.id)}`;
  if (route.page === 'supplier') window.location.hash = `/supplier/${encodeURIComponent(route.id)}`;
  if (route.page === 'buyer') window.location.hash = `/buyer/${encodeURIComponent(route.id)}`;
}

function StatCard({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="stat"><span>{label}</span><strong>{value}</strong></div>;
}

function ContractList({ contracts }: { contracts: ContractRecord[] }) {
  if (!contracts.length) return <div className="empty">Aucun marché trouvé. Essaie “GROUPAMA”, “assurance”, “Lyon” ou un SIRET.</div>;
  return <div className="results">
    {contracts.map(contract => <article className="card" key={`${contract.id}-${contract.supplierId}`}>
      <button className="linklike title" onClick={() => go({ page: 'contract', id: contract.id })}>{contract.title}</button>
      <div className="meta">
        <button className="chip" onClick={() => go({ page: 'buyer', id: contract.buyerId })}><Landmark size={14} /> {contract.buyerName}</button>
        <button className="chip" onClick={() => go({ page: 'supplier', id: contract.supplierId })}><Building2 size={14} /> {contract.supplierName}</button>
      </div>
      <div className="row">
        <span>{formatEuro(contract.amount)}</span>
        <span>{contract.date || 'Date non renseignée'}</span>
        <span>{contract.location || 'Lieu non renseigné'}</span>
      </div>
    </article>)}
  </div>;
}

function Home({ data }: { data: DataPayload }) {
  const [query, setQuery] = React.useState(defaultQuery);
  const results = React.useMemo(() => searchContracts(data.contracts, query), [data.contracts, query]);
  const total = React.useMemo(() => data.contracts.reduce((sum, contract) => sum + (contract.amount || 0), 0), [data.contracts]);
  return <>
    <section className="hero">
      <p className="eyebrow">French open procurement data</p>
      <h1>PublicMoney Radar</h1>
      <p>Recherche ultra simple dans un échantillon réel DECP : entreprise, acheteur public, mot-clé, SIREN/SIRET.</p>
      <div className="searchBox">
        <Search size={20} />
        <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Ex: GROUPAMA, assurance, Lyon, 77983836600028" autoFocus />
      </div>
      <div className="stats">
        <StatCard label="Marchés importés" value={data.contracts.length} />
        <StatCard label="Montant dans l’échantillon" value={formatEuro(total)} />
        <StatCard label="Résultats affichés" value={results.length} />
      </div>
    </section>
    <section>
      <h2>Résultats</h2>
      <ContractList contracts={results} />
    </section>
  </>;
}

function ContractDetail({ data, id }: { data: DataPayload; id: string }) {
  const contract = data.contracts.find(row => row.id === id);
  if (!contract) return <NotFound />;
  return <section className="detail">
    <button className="back" onClick={() => go({ page: 'home' })}><ArrowLeft size={16} /> Retour</button>
    <h1>{contract.title}</h1>
    <div className="stats">
      <StatCard label="Montant" value={formatEuro(contract.amount)} />
      <StatCard label="Date" value={contract.date || 'Non renseignée'} />
      <StatCard label="Lieu" value={contract.location || 'Non renseigné'} />
    </div>
    <dl className="facts">
      <dt>Acheteur public</dt><dd><button className="linklike" onClick={() => go({ page: 'buyer', id: contract.buyerId })}>{contract.buyerName}</button> <small>{contract.buyerId}</small></dd>
      <dt>Fournisseur / titulaire</dt><dd><button className="linklike" onClick={() => go({ page: 'supplier', id: contract.supplierId })}>{contract.supplierName}</button> <small>{contract.supplierId}</small></dd>
      <dt>Procédure</dt><dd>{contract.procedure || 'Non renseignée'}</dd>
      <dt>Code CPV</dt><dd>{contract.cpv || 'Non renseigné'}</dd>
      <dt>Source</dt><dd><a href={contract.sourceUrl} target="_blank" rel="noreferrer">Fichier DECP source <ExternalLink size={14} /></a></dd>
    </dl>
    <details><summary>Donnée brute conservée</summary><pre>{JSON.stringify(contract.raw, null, 2)}</pre></details>
  </section>;
}

function SupplierPage({ data, id }: { data: DataPayload; id: string }) {
  const profile = aggregateSupplier(data.contracts, id);
  if (!profile) return <NotFound />;
  return <section className="detail">
    <button className="back" onClick={() => go({ page: 'home' })}><ArrowLeft size={16} /> Retour</button>
    <h1>{profile.name}</h1>
    <p className="muted">SIREN/SIRET : {profile.id || 'non renseigné'}</p>
    <div className="stats">
      <StatCard label="Marchés remportés" value={profile.contractsWon} />
      <StatCard label="Montant total" value={formatEuro(profile.totalAmount)} />
      <StatCard label="Mots-clés" value={profile.keywords.slice(0, 4).join(', ') || '—'} />
    </div>
    <TwoColumns leftTitle="Principaux acheteurs publics" left={profile.mainBuyers} rightTitle="Évolution annuelle" right={profile.yearly.map(y => ({ name: String(y.year), count: y.count, amount: y.amount }))} />
    <h2>Contrats remportés</h2><ContractList contracts={profile.contracts} />
  </section>;
}

function BuyerPage({ data, id }: { data: DataPayload; id: string }) {
  const profile = aggregateBuyer(data.contracts, id);
  if (!profile) return <NotFound />;
  return <section className="detail">
    <button className="back" onClick={() => go({ page: 'home' })}><ArrowLeft size={16} /> Retour</button>
    <h1>{profile.name}</h1>
    <p className="muted">Identifiant acheteur : {profile.id || 'non renseigné'}</p>
    <div className="stats">
      <StatCard label="Marchés publiés / attribués" value={profile.contractsPublished} />
      <StatCard label="Dépense totale" value={formatEuro(profile.totalSpending)} />
      <StatCard label="Sujets récurrents" value={profile.recurringTopics.slice(0, 4).join(', ') || '—'} />
    </div>
    <TwoColumns leftTitle="Principaux fournisseurs" left={profile.mainSuppliers} rightTitle="Évolution annuelle" right={profile.yearly.map(y => ({ name: String(y.year), count: y.count, amount: y.amount }))} />
    <h2>Marchés</h2><ContractList contracts={profile.contracts} />
  </section>;
}

function TwoColumns({ leftTitle, left, rightTitle, right }: { leftTitle: string; left: { name: string; count: number; amount: number }[]; rightTitle: string; right: { name: string; count: number; amount: number }[] }) {
  return <div className="columns">
    <section><h2>{leftTitle}</h2><RankedList rows={left} /></section>
    <section><h2>{rightTitle}</h2><RankedList rows={right} /></section>
  </div>;
}

function RankedList({ rows }: { rows: { name: string; count: number; amount: number }[] }) {
  return <ul className="ranked">
    {rows.map(row => <li key={row.name}><span>{row.name}</span><strong>{formatEuro(row.amount)}</strong><small>{row.count} marché(s)</small></li>)}
  </ul>;
}

function NotFound() {
  return <section className="detail"><button className="back" onClick={() => go({ page: 'home' })}><ArrowLeft size={16} /> Retour</button><h1>Introuvable</h1><p>Cette page n’existe pas dans l’échantillon chargé.</p></section>;
}

function App() {
  const [payload, setPayload] = React.useState<DataPayload | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [route, setRoute] = React.useState<Route>(parseRoute());

  React.useEffect(() => {
    fetch(dataUrl())
      .then(response => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      })
      .then(setPayload)
      .catch(err => setError(`Impossible de charger les données: ${err.message}`));
  }, []);

  React.useEffect(() => {
    const onHash = () => setRoute(parseRoute());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  return <main>
    <header className="top"><button className="brand" onClick={() => go({ page: 'home' })}>PublicMoney Radar</button><a href="https://github.com/francoisdugarreau-creator/PublicMoneyRadar/blob/main/docs/data-sources.md" target="_blank" rel="noreferrer">Sources</a></header>
    {error && <div className="error">{error}</div>}
    {!payload && !error && <div className="loading">Chargement des marchés publics…</div>}
    {payload && route.page === 'home' && <Home data={payload} />}
    {payload && route.page === 'contract' && <ContractDetail data={payload} id={route.id} />}
    {payload && route.page === 'supplier' && <SupplierPage data={payload} id={route.id} />}
    {payload && route.page === 'buyer' && <BuyerPage data={payload} id={route.id} />}
    {payload && <footer>Source : <a href={payload.source.datasetPage} target="_blank" rel="noreferrer">{payload.source.name}</a>. {payload.source.limitation}</footer>}
  </main>;
}

createRoot(document.getElementById('root')!).render(<App />);
