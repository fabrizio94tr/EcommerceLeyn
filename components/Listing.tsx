import Image from 'next/image';
import Link from 'next/link';
import { ProductCard } from './ProductCard';
import { AutoForm } from './AutoForm';
import { PriceRange } from './PriceRange';
import { I } from './icons';
import { sortSizes } from '@/lib/format';
import { FAMILIES, colorFamily } from '@/lib/colors';
import type { Category, Product } from '@/lib/types';

export type SP = Record<string, string | string[] | undefined>;
const arr = (v: string | string[] | undefined) => (v == null ? [] : Array.isArray(v) ? v : [v]);
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? '';
const PAGE = 12;

export function Listing({ title, intro, basePath, products, categories, sp, wish, banner }: {
  title: string; intro?: string; basePath: string; products: Product[]; categories: Category[]; sp: SP; wish: Set<string>; banner?: string;
}) {
  const sub = one(sp.sub), sizes = arr(sp.taglia), colors = arr(sp.colore);
  const min = Number(one(sp.min)) || 0, max = Number(one(sp.max)) || 0, sort = one(sp.ordina) || 'evidenza';
  const onlyAvail = one(sp.disp) === '1', onlyPromo = one(sp.promo) === '1', onlyNew = one(sp.nuovi) === '1';
  const page = Math.max(1, Number(one(sp.pagina)) || 1);

  const inScope = products.filter((p) => !sub || p.category?.slug === sub);
  const allSizes = [...new Set(inScope.flatMap((p) => (p.variants || []).map((v) => v.size)).filter(Boolean) as string[])].sort(sortSizes);
  const famsPresent = new Set(inScope.flatMap((p) => (p.variants || []).map((v) => colorFamily(v.color_hex))).filter(Boolean) as string[]);
  const families = FAMILIES.filter(([n]) => famsPresent.has(n) || colors.includes(n));
  const topPrice = Math.max(0, ...products.map((p) => p.price_cents)) / 100;

  let list = inScope.filter((p) => {
    const vs = (p.variants || []).filter((v) =>
      (!sizes.length || (v.size && sizes.includes(v.size))) &&
      (!colors.length || colors.includes(colorFamily(v.color_hex) || '')) &&
      (!onlyAvail || v.stock > 0));
    if ((sizes.length || colors.length || onlyAvail) && !vs.length) return false;
    if (onlyPromo && !(p.compare_at_cents && p.compare_at_cents > p.price_cents)) return false;
    if (onlyNew && !p.is_new) return false;
    if (min && p.price_cents < min * 100) return false;
    if (max && p.price_cents > max * 100) return false;
    return true;
  });
  if (sort === 'evidenza') list = [...list].sort((a, b) => Number(b.featured) - Number(a.featured));
  if (sort === 'prezzo-asc') list = [...list].sort((a, b) => a.price_cents - b.price_cents);
  if (sort === 'prezzo-desc') list = [...list].sort((a, b) => b.price_cents - a.price_cents);
  const pages = Math.max(1, Math.ceil(list.length / PAGE));
  const shown = list.slice((page - 1) * PAGE, page * PAGE);
  const hasPromo = inScope.some((p) => p.compare_at_cents && p.compare_at_cents > p.price_cents);
  const hasNew = inScope.some((p) => p.is_new);

  const qs = (patch: Record<string, string | null>, drop: [string, string?][] = []) => {
    const p = new URLSearchParams();
    Object.entries(sp).forEach(([k, v]) => arr(v).forEach((x) => { if (k !== 'pagina' && !drop.some(([dk, dv]) => dk === k && (dv === undefined || dv === x))) p.append(k, x); }));
    Object.entries(patch).forEach(([k, v]) => { p.delete(k); if (v) p.set(k, v); });
    const s = p.toString(); return s ? `${basePath}?${s}` : basePath;
  };
  const tags: [string, string][] = [
    ...sizes.map((x) => [`Taglia ${x}`, qs({}, [['taglia', x]])] as [string, string]),
    ...colors.map((x) => [x, qs({}, [['colore', x]])] as [string, string]),
    ...(min || max ? [[`€ ${min || 0} – ${max || Math.ceil(topPrice)}`, qs({}, [['min'], ['max']])] as [string, string]] : [])
  ];
  const countLabel = (n: number) => (n ? ` · ${n}` : '');

  return (
    <div className="wrap">
      <div className="crumb"><Link href="/">Home</Link> <I.chev /> <b>{title}</b></div>
      <div className="plp-h2"><h1 className="H">{title}</h1>{intro && <p>{intro}</p>}</div>
      {banner && <div className="plp-ban" style={{ position: 'relative' }}><Image src={banner} alt="" fill sizes="100vw" style={{ objectFit: 'cover', objectPosition: 'center 55%' }} /></div>}
      {categories.length > 0 && <nav className="subnav" aria-label="Sottocategorie">
        <Link href={qs({ sub: null })} className={!sub ? 'on' : ''}>Tutto</Link>
        {categories.map((c) => <Link key={c.id} href={qs({ sub: c.slug })} className={sub === c.slug ? 'on' : ''}>{c.name}</Link>)}
      </nav>}

      <AutoForm className="fbar" key={JSON.stringify(sp)}>
        {sub && <input type="hidden" name="sub" value={sub} />}
        <div className="fl">
          {allSizes.length > 0 && <details name="filtro" className="dd"><summary>Taglia{countLabel(sizes.length)} <I.down /></summary>
            <div className="pop"><div className="sizes">{allSizes.map((s) => <label key={s}><input type="checkbox" name="taglia" value={s} defaultChecked={sizes.includes(s)} /><span>{s}</span></label>)}</div></div></details>}
          {families.length > 0 && <details name="filtro" className="dd"><summary>Colore{countLabel(colors.length)} <I.down /></summary>
            <div className="pop"><div className="fams">{families.map(([n, hex]) => <label key={n}><input type="checkbox" name="colore" value={n} defaultChecked={colors.includes(n)} /><i style={{ background: hex }} />{n}</label>)}</div></div></details>}
          <details name="filtro" className="dd"><summary>Prezzo{min || max ? ' · 1' : ''} <I.down /></summary>
            <div className="pop wide"><PriceRange bound={topPrice} lo={min} hi={max} /></div></details>
          <span className="sep" aria-hidden />
          <label className="tgl"><input type="checkbox" name="disp" value="1" defaultChecked={onlyAvail} /><span>Disponibili</span></label>
          {hasNew && <label className="tgl"><input type="checkbox" name="nuovi" value="1" defaultChecked={onlyNew} /><span>Novità</span></label>}
          {hasPromo && <label className="tgl"><input type="checkbox" name="promo" value="1" defaultChecked={onlyPromo} /><span>In promo</span></label>}
        </div>
        <div className="fr">
          <span className="count">{list.length} prodotti</span>
          <label className="sel">Ordina
            <select name="ordina" defaultValue={sort} aria-label="Ordina"><option value="evidenza">In evidenza</option><option value="nuovi">Novità</option><option value="prezzo-asc">Prezzo crescente</option><option value="prezzo-desc">Prezzo decrescente</option></select>
          </label>
        </div>
      </AutoForm>
      {tags.length > 0 && <div className="ftags">{tags.map(([l, h]) => <Link key={l} href={h} className="tag" aria-label={`Togli il filtro ${l}`}>{l} ✕</Link>)}
        <Link href={qs({ taglia: null, colore: null, min: null, max: null, disp: null, promo: null, nuovi: null })} className="lnk">Togli tutti</Link></div>}

      {shown.length ? <div className="grid plp4">{shown.map((p, i) => <ProductCard key={p.id} p={p} wished={wish.has(p.id)} priority={i < 4} />)}</div>
        : <div className="empty"><h2 className="H">Nessun prodotto</h2><p className="muted">Prova a togliere qualche filtro.</p></div>}
      {pages > 1 && <div className="pager">{Array.from({ length: pages }, (_, i) => <Link key={i} href={qs({ pagina: i ? String(i + 1) : null })}><span className={page === i + 1 ? 'on' : ''}>{i + 1}</span></Link>)}</div>}
      <div style={{ height: 40 }} />
    </div>
  );
}
