'use client';
import { useActionState, useState, useTransition } from 'react';
import { importCatalog, updateStock, type ImportPreview } from '@/app/admin/actions';

export function StockCell({ id, stock, threshold }: { id: string; stock: number; threshold: number }) {
  const [s, setS] = useState(stock), [t, setT] = useState(threshold);
  const [msg, setMsg] = useState('');
  const [pending, start] = useTransition();
  const dirty = s !== stock || t !== threshold;
  return (
    <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
      <input className={`stkin${s <= 0 ? ' zero' : s <= t ? ' low' : ''}`} type="number" min={0} value={s} onChange={(e) => setS(Number(e.target.value))} aria-label="Pezzi" />
      <input className="stkin" type="number" min={0} value={t} onChange={(e) => setT(Number(e.target.value))} aria-label="Scorta minima" title="Scorta minima" />
      {dirty && <button className="b sm" disabled={pending} onClick={() => start(async () => { const r = await updateStock(id, s, t); setMsg(r.notified ? `Avvisate ${r.notified} clienti` : 'Salvato'); })}>Salva</button>}
      {msg && !dirty && <small className="note">{msg}</small>}
    </span>
  );
}

export function ImportBox() {
  const [st, action, pending] = useActionState<ImportPreview, FormData>(importCatalog, null);
  const [file, setFile] = useState<File | null>(null);
  const [, start] = useTransition();
  const send = (confirm: boolean) => { if (!file) return; const fd = new FormData(); fd.set('file', file); fd.set('confirm', confirm ? '1' : '0'); start(() => action(fd)); };
  const blocking = st?.errors?.some((e) => e.startsWith('Riga'));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <label className="drop"><b>{file ? file.name : 'Scegli il file CSV o Excel'}</b>una riga per variante (taglia, colore o formato)<input type="file" accept=".csv,.xlsx,.xls" style={{ marginTop: 8 }} onChange={(e) => setFile(e.target.files?.[0] ?? null)} /></label>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button type="button" className="b g" disabled={!file || pending} onClick={() => send(false)}>{pending ? 'Attendi…' : 'Controlla il file'}</button>
        {st?.products && !st.message && !blocking && <button type="button" className="b" disabled={pending} onClick={() => send(true)}>Conferma import ({st.products.length} prodotti)</button>}
        <a className="b g" href="/admin/export/modello">Scarica il modello</a>
      </div>
      {st?.error && <p className="msg bad">{st.error}</p>}
      {st?.message && <p className="msg ok">{st.message}</p>}
      {st?.errors?.map((e) => <p key={e} className={`msg ${e.startsWith('Riga') ? 'bad' : ''}`} style={!e.startsWith('Riga') ? { background: 'var(--a-soft)' } : undefined}>{e}</p>)}
      {st?.products && !st.message && <div className="tbl-wrap"><table><thead><tr><th>Prodotto</th><th className="n">Varianti</th><th>Azione</th></tr></thead><tbody>
        {st.products.map((p) => <tr key={p.name}><td>{p.name}</td><td className="n">{p.variants}</td><td><span className={`st ${p.isNew ? 'ok' : 'ship'}`}>{p.isNew ? 'Nuovo' : 'Aggiorna'}</span></td></tr>)}
      </tbody></table></div>}
    </div>
  );
}
