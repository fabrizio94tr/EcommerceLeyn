import Image from 'next/image';
import Link from 'next/link';
import { ProductCard } from './ProductCard';
import { AutoForm } from './AutoForm';
import { I } from './icons';
import { sortSizes } from '@/lib/format';
import type { Category, Product } from '@/lib/types';

export type SP = Record<string, string | string[] | undefined>;
const arr = (v: string | string[] | undefined) => (v == null ? [] : Array.isArray(v) ? v : [v]);
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? '';
const PAGE = 24;

export function Listing({ title, intro, basePath, products, categories, sp, wish, banner }: {
  title: string; intro?: string; basePath: string; products: Product[]; categories: Category[]; sp: SP; wish: Set<string>; banner?: string;
}) {
  const sub = one(sp.sub), sizes = arr(sp.taglia), colors = arr(sp.colore), formats = arr(sp.formato);
  const min = Number(one(sp.min)) || 0, max = Number(one(sp.max)) || 0, onlyAvail = one(sp.disp) === '1', sort = one(sp.ordina) || 'nuovi';
  const page = Math.max(1, Number(one(sp.pagina)) || 1);

  const all = products;
  const allSizes = [...new Set(all.flatMap((p) => (p.variants || []).map((v) => v.size)).filter(Boolean) as string[])].sort(sortSizes);
  const allColors = [...new Map(all.flatMap((p) => (p.variants || []).filter((v) => v.color_hex).map((v) => [v.color_name || v.color_hex!, v.color_hex!] as [string, string]))).entries()];
  const allFormats = [...new Set(all.flatMap((p) => (p.variants || []).map((v) => v.format)).filter(Boolean) as string[])];

  let list = all.filter((p) => {
    if (sub && p.category?.slug !== sub) return false;
    const vs = (p.variants || []).filter((v) =>
      (!sizes.length || (v.size && sizes.includes(v.size))) &&
      (!colors.length || (v.color_name && colors.includes(v.color_name)) || (v.color_hex && colors.includes(v.color_hex))) &&
      (!formats.length || (v.format && formats.includes(v.format))) &&
      (!onlyAvail || v.stock > 0));
    if ((sizes.length || colors.length || formats.length || onlyAvail) && !vs.length) return false;
    if (min && p.price_cents < min * 100) return false;
    if (max && p.price_cents > max * 100) return false;
    return true;
  });
  if (sort === 'prezzo-asc') list = [...list].sort((a, b) => a.price_cents - b.price_cents);
  if (sort === 'prezzo-desc') list = [...list].sort((a, b) => b.price_cents - a.price_cents);
  const pages = Math.max(1, Math.ceil(list.length / PAGE));
  const shown = list.slice((page - 1) * PAGE, page * PAGE);
  const active = sizes.length + colors.length + formats.length + (onlyAvail ? 1 : 0) + (min || max ? 1 : 0);
  const qs = (patch: Record<string, string | null>) => {
    const p = new URLSearchParams();
    Object.entries(sp).forEach(([k, v]) => arr(v).forEach((x) => p.append(k, x)));
    Object.entries(patch).forEach(([k, v]) => { p.delete(k); if (v) p.set(k, v); });
    const s = p.toString(); return s ? `${basePath}?${s}` : basePath;
  };

  const filters = (
    <>
      {allSizes.length > 0 && <div className="fg"><b>Taglia</b><div className="sizes">{allSizes.map((s) => <label key={s}><input type="checkbox" name="taglia" value={s} defaultChecked={sizes.includes(s)} /><span>{s}</span></label>)}</div></div>}
      {allColors.length > 0 && <div className="fg"><b>Colore</b><div className="cols">{allColors.map(([name, hex]) => <label key={name} title={name}><input type="checkbox" name="colore" value={name} defaultChecked={colors.includes(name)} /><i style={{ background: hex }} /><span className="sr">{name}</span></label>)}</div></div>}
      {allFormats.length > 1 && <div className="fg"><b>Formato</b>{allFormats.map((f) => <label key={f} className="chk"><input type="checkbox" name="formato" value={f} defaultChecked={formats.includes(f)} /><i />{f}</label>)}</div>}
      <div className="fg"><b>Prezzo (€)</b><div className="prices"><input className="inp" type="number" name="min" min={0} placeholder="da" defaultValue={min || ''} aria-label="Prezzo minimo" /><input className="inp" type="number" name="max" min={0} placeholder="a" defaultValue={max || ''} aria-label="Prezzo massimo" /></div></div>
      <div className="fg"><b>Disponibilità</b><label className="chk"><input type="checkbox" name="disp" value="1" defaultChecked={onlyAvail} /><i />Solo disponibili</label></div>
      {sub && <input type="hidden" name="sub" value={sub} />}
      <input type="hidden" name="ordina" value={sort} />
    </>
  );

  return (
    <div className="wrap">
      <div className="crumb"><Link href="/">Home</Link> <I.chev /> <b>{title}</b></div>
      <div className="plp-h"><h1 className="H">{sub ? categories.find((c) => c.slug === sub)?.name || title : title}</h1>{intro && <p>{intro}</p>}</div>
      {banner && <div className="plp-ban" style={{ position: 'relative' }}><Image src={banner} alt="" fill sizes="100vw" style={{ objectFit: 'cover', objectPosition: 'center 55%' }} /></div>}
      {categories.length > 0 && <div className="chips">
        <Link href={qs({ sub: null, pagina: null })} className={!sub ? 'on' : ''}><span className={!sub ? 'on' : ''} style={{ paddingLeft: 18 }}>Tutto</span></Link>
        {categories.map((c) => <Link key={c.id} href={qs({ sub: c.slug, pagina: null })}><span className={sub === c.slug ? 'on' : ''} style={c.image_url ? undefined : { paddingLeft: 18 }}>{c.image_url && <img src={c.image_url} alt="" />}{c.name}</span></Link>)}
      </div>}
      <div className="plp">
        <aside className="fil" aria-label="Filtri"><AutoForm>{filters}</AutoForm></aside>
        <div>
          <details className="mfilters"><summary className="mfil"><I.filter />Filtri{active ? ` · ${active}` : ''}</summary><div><AutoForm>{filters}</AutoForm></div></details>
          <div className="tool">
            <span className="act">{active > 0 && <Link href={qs({ taglia: null, colore: null, formato: null, min: null, max: null, disp: null, pagina: null })} className="tag">Togli filtri ✕</Link>}</span>
            <span>{list.length} prodotti</span>
            <AutoForm className="sel"><span>Ordina:</span>
              {Object.entries(sp).filter(([k]) => k !== 'ordina' && k !== 'pagina').flatMap(([k, v]) => arr(v).map((x, i) => <input key={k + i} type="hidden" name={k} value={x} />))}
              <select name="ordina" defaultValue={sort} aria-label="Ordina"><option value="nuovi">Novità</option><option value="prezzo-asc">Prezzo crescente</option><option value="prezzo-desc">Prezzo decrescente</option></select>
            </AutoForm>
          </div>
          {shown.length ? <div className="grid">{shown.map((p, i) => <ProductCard key={p.id} p={p} wished={wish.has(p.id)} priority={i < 3} />)}</div>
            : <div className="empty"><h2 className="H">Nessun prodotto</h2><p className="muted">Prova a togliere qualche filtro.</p></div>}
          {pages > 1 && <div className="pager">{Array.from({ length: pages }, (_, i) => <Link key={i} href={qs({ pagina: i ? String(i + 1) : null })}><span className={page === i + 1 ? 'on' : ''}>{i + 1}</span></Link>)}</div>}
        </div>
      </div>
    </div>
  );
}
