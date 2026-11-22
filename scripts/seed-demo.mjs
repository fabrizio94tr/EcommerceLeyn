// Carica un catalogo DIMOSTRATIVO (foto di esempio Unsplash) per provare il sito.
// Uso: node --env-file=.env.local scripts/seed-demo.mjs
// Da NON usare in produzione dopo aver caricato i prodotti veri.
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const IMG_DIR = join(process.cwd(), 'design/src/img');

async function upload(name) {
  const path = `demo/${name}.jpg`;
  await sb.storage.from('media').upload(path, readFileSync(join(IMG_DIR, `${name}.jpg`)), { contentType: 'image/jpeg', upsert: true });
  return sb.storage.from('media').getPublicUrl(path).data.publicUrl;
}
const must = (r) => { if (r.error) throw r.error; return r.data; };

const CATS = [
  ['abbigliamento', 'Abiti', 'abiti', 'abito-viola'], ['abbigliamento', 'Top e camicie', 'top-e-camicie', 'camicia-righe'], ['abbigliamento', 'Pantaloni', 'pantaloni', 'jeans'],
  ['abbigliamento', 'Giacche e cappotti', 'giacche', 'trench'], ['abbigliamento', 'Maglieria', 'maglieria', 'poncho'], ['abbigliamento', 'Tute', 'tute', 'tuta'],
  ['cosmetici', 'Viso', 'viso', 'crema'], ['cosmetici', 'Occhi', 'occhi', 'palette'], ['cosmetici', 'Labbra', 'labbra', 'rossetto'], ['cosmetici', 'Corpo', 'corpo', 'olio-corpo'],
  ['cosmetici', 'Unghie', 'unghie', 'smalto'], ['cosmetici', 'Accessori', 'accessori', 'pennelli']
];
// slug, nome, prezzo, prezzo pieno, categoria, colori [[nome,hex]] | formati, in evidenza
const CLOTHES = [
  ['abito-floreale', 'Abito a portafoglio floreale', 59.9, 0, 'abiti', [['Avorio', '#F4EFE6'], ['Rosa', '#C9566B']], true],
  ['abito-bianco', 'Abito spalle scoperte', 49.9, 0, 'abiti', [['Bianco', '#FFFFFF']], true],
  ['pantalone-righe', 'Pantalone palazzo a righe', 45.9, 0, 'pantaloni', [['Nero', '#1C1C1C']], false],
  ['tuta', 'Completo felpa e jogger', 54.9, 68.9, 'tute', [['Giallo', '#F2C230'], ['Azzurro', '#9FB6CD']], false],
  ['camicia-righe', 'Camicia a righe oversize', 35.9, 0, 'top-e-camicie', [['Blu', '#1C2433']], false],
  ['abito-pizzo', 'Abito in pizzo blu notte', 79.9, 0, 'abiti', [['Blu notte', '#1E2A55']], true],
  ['abito-viola', 'Abito in raso prugna', 69.9, 0, 'abiti', [['Prugna', '#5B1F45'], ['Nero', '#1C1C1C']], true],
  ['abito-rosso', 'Abito midi con cintura', 64.9, 79.9, 'abiti', [['Rosso', '#C42430'], ['Nero', '#1C1C1C']], true],
  ['pantalone-rosa', 'Pantalone cargo cipria', 39.9, 0, 'pantaloni', [['Cipria', '#E5B9AE']], false],
  ['bomber', 'Bomber in raso cammello', 59.9, 0, 'giacche', [['Cammello', '#A9673F']], false],
  ['trench', 'Trench doppiopetto', 89.9, 0, 'giacche', [['Beige', '#C8A983']], false],
  ['felpa', 'Felpa girocollo in cotone', 32.9, 0, 'maglieria', [['Bianco', '#FFFFFF'], ['Rosa', '#E8A1B5']], false],
  ['jeans', 'Jeans mom fit', 44.9, 0, 'pantaloni', [['Chiaro', '#6F8FB3']], false],
  ['poncho', 'Poncho in maglia', 39.9, 49.9, 'maglieria', [['Crema', '#EFE6D6']], false],
  ['cappotto', 'Cappotto a quadri', 99.9, 0, 'giacche', [['Blu', '#2B3C57']], false],
  ['top-nero', 'Blusa in velo', 34.9, 0, 'top-e-camicie', [['Nero', '#1C1C1C']], false]
];
const COSM = [
  ['siero-vitc', 'Siero illuminante vitamina C', 29.9, 0, 'viso', [['30 ml', null], ['50 ml', 42.9]], true],
  ['siero-viso', 'Siero acido ialuronico', 27.9, 34.9, 'viso', [['30 ml', null]], true],
  ['crema', 'Crema idratante viso', 32.9, 0, 'viso', [['50 ml', null]], true],
  ['detergente', 'Gel detergente delicato', 18.9, 0, 'viso', [['150 ml', null]], false],
  ['tonico', 'Lozione tonica riequilibrante', 21.9, 0, 'viso', [['200 ml', null]], false],
  ['illuminante', 'Illuminante in polvere Rose Gold', 22.9, 0, 'viso', [['8 g', null]], true],
  ['olio-corpo', 'Olio corpo nutriente', 24.9, 0, 'corpo', [['100 ml', null]], false],
  ['rossetto', 'Rossetto cremoso Nude 02', 19.9, 0, 'labbra', [['3,5 g', null]], false],
  ['balsamo', 'Balsamo labbra al karité', 12.9, 0, 'labbra', [['15 ml', null]], false],
  ['palette', 'Palette ombretti 35 colori', 34.9, 42.9, 'occhi', [['35 × 1,2 g', null]], true],
  ['pennelli', 'Set pennelli trucco', 29.9, 0, 'accessori', [['8 pezzi', null]], false],
  ['smalto', 'Smalto effetto gel Nero', 9.9, 0, 'unghie', [['10 ml', null]], false]
];
const c = (n) => Math.round(n * 100);

const cats = {};
for (const [macro, name, slug, img] of CATS) {
  const row = must(await sb.from('categories').upsert({ macro, name, slug, image_url: await upload(img), sort: Object.keys(cats).length }, { onConflict: 'slug' }).select('id').single());
  cats[slug] = row.id;
}
let i = 0;
for (const [slug, name, price, compare, cat, colors, featured] of CLOTHES) {
  const p = must(await sb.from('products').upsert({ type: 'clothing', slug, name, price_cents: c(price), compare_at_cents: compare ? c(compare) : null, cost_cents: c(price * 0.48), category_id: cats[cat], published: true, featured, is_new: i++ < 8,
    description: `${name} dalla nuova collezione. Morbido e comodo, si porta dal giorno alla sera.\n\nFoto e testo di esempio: verranno sostituiti con quelli del prodotto reale.`, material: '100% viscosa', fit: 'Regolare', care: 'Lavaggio a 30°, delicato' }, { onConflict: 'slug' }).select('id').single());
  await sb.from('product_variants').delete().eq('product_id', p.id);
  await sb.from('product_images').delete().eq('product_id', p.id);
  await sb.from('product_images').insert({ product_id: p.id, url: await upload(slug), alt: name, sort: 0 });
  const vs = colors.flatMap(([cn, hex], ci) => ['XS', 'S', 'M', 'L', 'XL'].map((size, si) => ({ product_id: p.id, sku: `${slug}-${ci}-${size}`.toUpperCase(), size, color_name: cn, color_hex: hex, stock: slug === 'abito-rosso' && size === 'S' && ci === 0 ? 0 : 2 + ((si + ci * 3) % 6), low_stock_threshold: 2, sort: ci * 10 + si })));
  must(await sb.from('product_variants').insert(vs));
}
for (const [slug, name, price, compare, cat, formats, featured] of COSM) {
  const p = must(await sb.from('products').upsert({ type: 'cosmetic', slug, name, price_cents: c(price), compare_at_cents: compare ? c(compare) : null, cost_cents: c(price * 0.42), category_id: cats[cat], published: true, featured, is_new: i++ < 22,
    description: `${name}: formula delicata per tutti i giorni.\n\nTesto di esempio: verrà sostituito con quello dell'etichetta.`, inci: 'Aqua, Glycerin, Niacinamide, Sodium Hyaluronate, Panthenol, Phenoxyethanol, Ethylhexylglycerin (esempio)',
    usage: 'Applicare su pelle pulita mattina e sera (esempio).', warnings: 'Solo per uso esterno. Evitare il contatto con gli occhi.', pao_months: 12, origin_country: 'Regno Unito', eu_responsible_person: '[Nome e indirizzo UE come da etichetta]' }, { onConflict: 'slug' }).select('id').single());
  await sb.from('product_variants').delete().eq('product_id', p.id);
  await sb.from('product_images').delete().eq('product_id', p.id);
  await sb.from('product_images').insert({ product_id: p.id, url: await upload(slug), alt: name, sort: 0 });
  must(await sb.from('product_variants').insert(formats.map(([f, fp], k) => ({ product_id: p.id, sku: `${slug}-${k}`.toUpperCase(), format: f, price_cents: fp ? c(fp) : null, stock: slug === 'palette' ? 0 : 6 + k * 4, low_stock_threshold: 3, sort: k }))));
}
await sb.from('banners').delete().neq('id', '00000000-0000-0000-0000-000000000000');
must(await sb.from('banners').insert([
  { kicker: 'Nuova collezione autunno', title: 'Nuova stagione. Nuova te.', subtitle: 'Abiti, maglieria e la tua beauty routine in un unico posto.', image_url: await upload('h-viola'), link: '/abbigliamento', cta: 'Shop abbigliamento', sort: 1 },
  { kicker: 'Promo della settimana', title: '-20% su tutta la skincare viso', subtitle: 'Sieri, creme e detergenti in promozione fino a domenica con il codice SKIN20.', image_url: await upload('h-crema'), link: '/cosmetici?sub=viso', cta: 'Approfitta ora', sort: 2 }
]));
await sb.from('coupons').upsert({ code: 'SKIN20', kind: 'percent', value: 20, applies_to: 'cosmetici' }, { onConflict: 'code' });
await sb.from('blog_posts').upsert({ slug: 'come-scegliere-la-crema-giusta', title: 'Come scegliere la crema giusta per la tua pelle', category: 'Skincare', cover_url: await upload('h-crema'), published: true, published_at: new Date().toISOString(),
  excerpt: 'Pelle secca, mista, grassa o sensibile: riconoscila in un minuto e costruisci una routine che funziona.',
  body: `## Riconosci il tuo tipo di pelle\nLava il viso con un detergente delicato e aspetta un'ora senza applicare nulla. Poi guarda e tocca la pelle.\n\n- **Secca:** tira e a volte si squama\n- **Grassa:** lucida su tutto il viso\n- **Mista:** lucida solo sulla zona T\n\n## Gli ingredienti da cercare\nLeggi sempre l'elenco degli ingredienti (INCI): sono in ordine di quantità.\n\n[prodotto:siero-viso]\n\n## Giorno e notte\nDi giorno una texture leggera e la protezione solare; la sera una crema più ricca.`,
  seo_title: 'Come scegliere la crema viso giusta', seo_description: 'Pelle secca, mista o grassa? La guida in 4 passi per scegliere la crema viso giusta.' }, { onConflict: 'slug' });
console.log('Catalogo dimostrativo caricato.');
