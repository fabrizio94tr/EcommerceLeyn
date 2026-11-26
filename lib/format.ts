import type { Variant } from './types';

// Formato della proposta grafica: "€ 64,90"
export const eur = (cents: number) =>
  `€ ${new Intl.NumberFormat('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(cents / 100)}`;

/** Prezzo per litro o per kg (obbligatorio per i cosmetici venduti a volume/peso). */
export function unitPrice(cents: number, format: string | null | undefined) {
  const m = format?.replace(',', '.').match(/^\s*([\d.]+)\s*(ml|l|g|kg)\b/i);
  if (!m) return null;
  const n = parseFloat(m[1]), u = m[2].toLowerCase();
  if (!n) return null;
  const base = u === 'ml' ? n / 1000 : u === 'g' ? n / 1000 : n;
  return `${eur(Math.round(cents / base))} / ${u === 'ml' || u === 'l' ? 'litro' : 'kg'}`;
}

export const dateIt = (d: string | Date, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }) =>
  new Intl.DateTimeFormat('it-IT', { ...opts, timeZone: 'Europe/Rome' }).format(new Date(d));

export const variantLabel = (v: Pick<Variant, 'color_name' | 'size' | 'format'>) =>
  [v.color_name, v.size ? `Taglia ${v.size}` : null, v.format].filter(Boolean).join(' · ');

export const slugify = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 80);

export const discountPct = (price: number, compare: number | null) => (compare && compare > price ? Math.round((1 - price / compare) * 100) : 0);

export const SIZE_ORDER = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '38', '40', '42', '44', '46', '48', 'Unica'];
export const sortSizes = (a: string, b: string) => {
  const ia = SIZE_ORDER.indexOf(a), ib = SIZE_ORDER.indexOf(b);
  return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || a.localeCompare(b);
};

export const ORDER_STATUS: Record<string, { label: string; cls: string }> = {
  pending: { label: 'In attesa di pagamento', cls: 'off' },
  paid: { label: 'Da spedire', cls: 'prep' },
  shipped: { label: 'Spedito', cls: 'ship' },
  delivered: { label: 'Consegnato', cls: 'ok' },
  cancelled: { label: 'Annullato', cls: 'off' },
  refunded: { label: 'Rimborsato', cls: 'ret' }
};
export const RETURN_STATUS: Record<string, { label: string; cls: string }> = {
  requested: { label: 'Da approvare', cls: 'prep' },
  approved: { label: 'Approvato', cls: 'ship' },
  rejected: { label: 'Rifiutato', cls: 'bad' },
  received: { label: 'Pacco ricevuto', cls: 'ship' },
  completed: { label: 'Chiuso', cls: 'ok' }
};
