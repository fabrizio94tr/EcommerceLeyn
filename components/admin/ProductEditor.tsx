'use client';
import { useActionState, useState, useTransition } from 'react';
import { deleteProduct, saveProduct } from '@/app/admin/actions';
import { ImagesField, type Img } from './ImageUpload';
import { Note, Save } from './forms';
import type { Category, Product } from '@/lib/types';

type V = { id?: string; sku: string; size: string; color_name: string; color_hex: string; format: string; price: string; cost: string; stock: number; low_stock_threshold: number };
const money = (c: number | null | undefined) => (c == null ? '' : (c / 100).toFixed(2).replace('.', ','));

export function ProductEditor({ p, categories, waiting, defaultLow }: { p?: Product; categories: Category[]; waiting: Record<string, number>; defaultLow: number }) {
  const [state, action] = useActionState(saveProduct, null);
  const [type, setType] = useState<'clothing' | 'cosmetic'>(p?.type || 'clothing');
  const [vs, setVs] = useState<V[]>((p?.variants || []).map((v) => ({ id: v.id, sku: v.sku || '', size: v.size || '', color_name: v.color_name || '', color_hex: v.color_hex || '#000000', format: v.format || '', price: money(v.price_cents), cost: money(v.cost_cents), stock: v.stock, low_stock_threshold: v.low_stock_threshold })));
  const [pending, start] = useTransition();
  const blank = (): V => ({ sku: '', size: '', color_name: vs.at(-1)?.color_name || '', color_hex: vs.at(-1)?.color_hex || '#000000', format: '', price: '', cost: '', stock: 0, low_stock_threshold: defaultLow });
  const upd = (i: number, k: keyof V, val: string | number) => setVs((c) => c.map((v, j) => (j === i ? { ...v, [k]: val } : v)));
  const addSizes = () => {
    const color = prompt('Colore (es. Nero)'); if (color == null) return;
    const sizes = prompt('Taglie separate da virgola', 'XS, S, M, L, XL'); if (!sizes) return;
    setVs((c) => [...c, ...sizes.split(',').map((s) => s.trim()).filter(Boolean).map((s) => ({ ...blank(), color_name: color.trim(), size: s }))]);
  };
  const cats = categories.filter((c) => c.macro === (type === 'cosmetic' ? 'cosmetici' : 'abbigliamento'));
  const isCos = type === 'cosmetic';

  return (
    <form action={action}>
      {p && <input type="hidden" name="id" value={p.id} />}
      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="variants" value={JSON.stringify(vs.map((v) => ({ ...v, color_hex: isCos ? '' : v.color_hex })))} />
      <div className="row2">
        <div className="stack">
          <div className="pane"><h2>Foto</h2><ImagesField initial={(p?.images || []).map((i) => ({ url: i.url, alt: i.alt || undefined })) as Img[]} /></div>
          <div className="pane"><h2>Informazioni</h2>
            {!p && <div className="tabs"><button type="button" onClick={() => setType('clothing')}><span className={!isCos ? 'on' : ''}>Abbigliamento</span></button><button type="button" onClick={() => setType('cosmetic')}><span className={isCos ? 'on' : ''}>Cosmetico</span></button></div>}
            <label className="f">Nome<input name="name" required defaultValue={p?.name} /></label>
            <div className="grid2">
              <label className="f">Categoria<select name="category_id" defaultValue={p?.category_id || ''}><option value="">— scegli —</option>{cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
              <label className="f">Indirizzo pagina (slug)<input name="slug" defaultValue={p?.slug} placeholder="si crea dal nome" /></label>
            </div>
            <label className="f">Descrizione<textarea name="description" defaultValue={p?.description} rows={5} /><small>Lascia una riga vuota per andare a capo con un nuovo paragrafo.</small></label>
            {!isCos && <div className="grid2"><label className="f">Tessuto<input name="material" defaultValue={p?.material || ''} placeholder="100% viscosa" /></label><label className="f">Vestibilità<input name="fit" defaultValue={p?.fit || ''} placeholder="Regolare · la modella indossa la S" /></label><label className="f">Lavaggio<input name="care" defaultValue={p?.care || ''} placeholder="30° delicato" /></label></div>}
          </div>
          {isCos && <div className="pane"><h2>Scheda cosmetico <small>dati dell&apos;etichetta</small></h2>
            <label className="f">Ingredienti (INCI)<textarea name="inci" defaultValue={p?.inci || ''} /><small>Copiali dall&apos;etichetta, nello stesso ordine.</small></label>
            <label className="f">Modo d&apos;uso<textarea name="usage" defaultValue={p?.usage || ''} /></label>
            <label className="f">Avvertenze<textarea name="warnings" defaultValue={p?.warnings || ''} /></label>
            <div className="grid2"><label className="f">Dopo l&apos;apertura (mesi, PAO)<input name="pao_months" type="number" min={1} defaultValue={p?.pao_months || ''} /></label><label className="f">Paese di origine<input name="origin_country" defaultValue={p?.origin_country || ''} /></label></div>
            <label className="f">Persona responsabile UE (nome e indirizzo in etichetta)<input name="eu_responsible_person" defaultValue={p?.eu_responsible_person || ''} /><small>Obbligatoria per vendere in Italia: se in etichetta manca, non pubblicare il prodotto.</small></label>
          </div>}
          <div className="pane"><h2>{isCos ? 'Formati, prezzi e giacenze' : 'Varianti e giacenze'} <small>i pezzi scendono da soli a ogni ordine</small></h2>
            <div className="tbl-wrap"><table className="vm"><thead><tr>
              {!isCos && <><th>Colore</th><th>Hex</th><th>Taglia</th></>}{isCos && <th>Formato</th>}<th>SKU</th><th>Prezzo diverso (€)</th><th>Costo diverso (€)</th><th>Pezzi</th><th>Scorta min.</th><th /></tr></thead><tbody>
              {vs.map((v, i) => (
                <tr key={i}>
                  {!isCos && <><td><input className="cellin" value={v.color_name} onChange={(e) => upd(i, 'color_name', e.target.value)} placeholder="Nero" /></td><td><input type="color" className="cellin" value={v.color_hex || '#000000'} onChange={(e) => upd(i, 'color_hex', e.target.value)} aria-label="Colore" /></td><td><input className="cellin" value={v.size} onChange={(e) => upd(i, 'size', e.target.value)} placeholder="M" style={{ minWidth: 50 }} /></td></>}
                  {isCos && <td><input className="cellin" value={v.format} onChange={(e) => upd(i, 'format', e.target.value)} placeholder="30 ml" /></td>}
                  <td><input className="cellin" value={v.sku} onChange={(e) => upd(i, 'sku', e.target.value)} /></td>
                  <td><input className="cellin" value={v.price} onChange={(e) => upd(i, 'price', e.target.value)} inputMode="decimal" /></td>
                  <td><input className="cellin" value={v.cost} onChange={(e) => upd(i, 'cost', e.target.value)} inputMode="decimal" /></td>
                  <td><input className={`stkin${v.stock <= 0 ? ' zero' : v.stock <= v.low_stock_threshold ? ' low' : ''}`} type="number" min={0} value={v.stock} onChange={(e) => upd(i, 'stock', Number(e.target.value))} />{v.id && waiting[v.id] ? <small className="note"> {waiting[v.id]} in attesa</small> : null}</td>
                  <td><input className="stkin" type="number" min={0} value={v.low_stock_threshold} onChange={(e) => upd(i, 'low_stock_threshold', Number(e.target.value))} /></td>
                  <td><button type="button" className="b g sm" onClick={() => setVs((c) => c.filter((_, j) => j !== i))} aria-label="Togli variante">✕</button></td>
                </tr>
              ))}
            </tbody></table></div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button type="button" className="b g" onClick={() => setVs((c) => [...c, blank()])}>+ Aggiungi {isCos ? 'formato' : 'variante'}</button>
              {!isCos && <button type="button" className="b g" onClick={addSizes}>+ Colore con più taglie</button>}
            </div>
            <small className="note">Prezzo e costo diversi servono solo se quella variante costa diversamente (es. 50 ml). Se un esaurito torna disponibile, alla prossima modifica partono le email alla lista d&apos;attesa.</small>
          </div>
        </div>
        <div className="stack">
          <div className="pane"><h2>Prezzo</h2>
            <div className="grid2"><label className="f">Prezzo di vendita (€)<input name="price" required defaultValue={money(p?.price_cents)} inputMode="decimal" /></label><label className="f">Prezzo pieno, se scontato (€)<input name="compare_at" defaultValue={money(p?.compare_at_cents)} inputMode="decimal" /></label></div>
            <label className="f">Costo d&apos;acquisto (€)<input name="cost" defaultValue={money(p?.cost_cents)} inputMode="decimal" /><small>Serve per il margine nella Panoramica. La cliente non lo vede.</small></label>
          </div>
          <div className="pane"><h2>Visibilità</h2>
            <label className="tgl"><span>Pubblicato<small>Visibile nel negozio</small></span><input type="checkbox" name="published" defaultChecked={p?.published} /></label>
            <label className="tgl"><span>In evidenza in home<small>Sezioni &quot;Più amati&quot; e &quot;In evidenza&quot;</small></span><input type="checkbox" name="featured" defaultChecked={p?.featured} /></label>
            <label className="tgl"><span>Novità<small>Compare tra le novità</small></span><input type="checkbox" name="is_new" defaultChecked={p ? p.is_new : true} /></label>
          </div>
          <div className="pane"><h2>SEO <small>come appare su Google</small></h2>
            <label className="f">Titolo SEO<input name="seo_title" defaultValue={p?.seo_title || ''} maxLength={70} placeholder="Se vuoto, usa il nome" /></label>
            <label className="f">Meta description<textarea name="seo_description" defaultValue={p?.seo_description || ''} maxLength={160} placeholder="Se vuota, usa l'inizio della descrizione" /></label>
          </div>
          <Note s={state} />
          <Save>Salva prodotto</Save>
          {p && <button type="button" className="b g" disabled={pending} onClick={() => { if (confirm('Eliminare il prodotto? Se ha già ordini verrà solo nascosto.')) start(() => deleteProduct(p.id)); }}>Elimina prodotto</button>}
        </div>
      </div>
    </form>
  );
}
