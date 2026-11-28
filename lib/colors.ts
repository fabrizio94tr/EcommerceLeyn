// Raggruppa i colori delle varianti in famiglie, così il filtro resta corto anche con tanti prodotti.
export const FAMILIES: [string, string][] = [
  ['Nero', '#1C1C1C'], ['Bianco', '#FFFFFF'], ['Beige', '#E3D3BC'], ['Grigio', '#9A9A9A'], ['Marrone', '#8A5A3C'], ['Rosso', '#C42430'],
  ['Rosa', '#E8A1B5'], ['Arancio', '#E8853A'], ['Giallo', '#F2C230'], ['Verde', '#4E8A5B'], ['Blu', '#2B4A7A'], ['Viola', '#6B2F68']
];

export function colorFamily(hex: string | null | undefined): string | null {
  if (!hex || !/^#?[0-9a-f]{6}$/i.test(hex)) return null;
  const n = parseInt(hex.replace('#', ''), 16);
  const r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  let h = 0;
  if (d) h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  h = (h * 60 + 360) % 360;
  if (l < 0.16) return 'Nero';
  if (l > 0.9 && s < 0.6) return 'Bianco';
  if (s < 0.12) return l > 0.75 ? 'Bianco' : 'Grigio';
  if (h >= 15 && h < 50 && l > 0.62 && s < 0.6) return 'Beige';
  if (h >= 10 && h < 45 && l < 0.5) return 'Marrone';
  if (h < 12 || h >= 345) return l > 0.65 ? 'Rosa' : 'Rosso';
  if (h >= 300) return l > 0.55 ? 'Rosa' : 'Viola';
  if (h < 40) return l > 0.7 ? 'Rosa' : 'Arancio';
  if (h < 70) return 'Giallo';
  if (h < 170) return 'Verde';
  if (h < 255) return 'Blu';
  return 'Viola';
}
