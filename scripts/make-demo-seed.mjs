// Genera supabase/demo/demo-seed.sql (catalogo DIMOSTRATIVO con foto Unsplash) e demo-remove.sql.
// Uso: node scripts/make-demo-seed.mjs  → poi esegui il file SQL su Supabase (SQL editor o psql).
import { writeFileSync, mkdirSync } from 'node:fs';

const U = (id, w, h, extra = '') => `https://images.unsplash.com/photo-${id}?w=${w}&h=${h}&fit=crop&crop=${extra || 'center'}&q=80&auto=format`;
const ZOOM = ['focalpoint&fp-x=0.5&fp-y=0.3&fp-z=1.6', 'focalpoint&fp-x=0.5&fp-y=0.62&fp-z=1.9', 'focalpoint&fp-x=0.5&fp-y=0.85&fp-z=2.1'];
const IMG = {
  'abito-floreale': '1496747611176-843222e1e57c', 'abito-bianco': '1515372039744-b8f02a3ae446', 'pantalone-righe': '1509631179647-0177331693ae', tuta: '1515886657613-9f3515b0c78f',
  'camicia-righe': '1544005313-94ddf0286df2', 'abito-pizzo': '1551803091-e20673f15770', 'abito-viola': '1566174053879-31528523f8ae', 'abito-rosso': '1572804013309-59a88b7e92f1',
  'pantalone-rosa': '1594633312681-425c7b97ccd1', bomber: '1591047139829-d91aecb6caea', trench: '1618244972963-dbee1a7edc95', felpa: '1620799140408-edc6dcb6d633',
  jeans: '1541099649105-f69ad21f3246', poncho: '1434389677669-e08b4cac3105', cappotto: '1485968579580-b6d095142e6e', 'top-nero': '1524504388940-b1c1722653e1',
  'siero-vitc': '1576426863848-c21f53c60b19', 'olio-corpo': '1611930022073-b7a4ba5fcccd', 'siero-viso': '1617897903246-719242758050', crema: '1619451334792-150fd785ee74',
  detergente: '1620916566398-39f1143ab7be', rossetto: '1625093742435-6fa192b6fb10', tonico: '1631729371254-42c2892f0e6e', balsamo: '1599305090598-fe179d501227',
  illuminante: '1503236823255-94609f598e71', palette: '1596704017254-9b121068fb31', pennelli: '1596462502278-27bfdc403348', smalto: '1604654894610-df63bc536371',
  'h-viola': '1566174053879-31528523f8ae', 'h-siero': '1617897903246-719242758050', 'h-crema': '1619451334792-150fd785ee74', 'h-trucco': '1487412947147-5cebf100ffc2', 'h-floreale': '1496747611176-843222e1e57c'
};
const q = (v) => (v == null ? 'null' : `'${String(v).replace(/'/g, "''")}'`);
const c = (n) => Math.round(n * 100);

const CATS = [
  ['abbigliamento', 'Abiti', 'abiti', 'abito-viola'], ['abbigliamento', 'Top e camicie', 'top-e-camicie', 'camicia-righe'], ['abbigliamento', 'Pantaloni', 'pantaloni', 'jeans'],
  ['abbigliamento', 'Giacche', 'giacche', 'trench'], ['abbigliamento', 'Maglieria', 'maglieria', 'poncho'], ['abbigliamento', 'Tute', 'tute', 'tuta'],
  ['cosmetici', 'Viso', 'viso', 'crema'], ['cosmetici', 'Occhi', 'occhi', 'palette'], ['cosmetici', 'Labbra', 'labbra', 'rossetto'], ['cosmetici', 'Corpo', 'corpo', 'olio-corpo'],
  ['cosmetici', 'Unghie', 'unghie', 'smalto'], ['cosmetici', 'Accessori', 'accessori', 'pennelli']
];
// in ordine dal più vecchio al più nuovo (le "Novità" mostrano gli ultimi inseriti)
const CLOTHES = [
  ['top-nero', 'Blusa in velo', 34.9, 0, 'top-e-camicie', [['Nero', '#1C1C1C'], ['Bianco', '#FFFFFF']], false, false],
  ['cappotto', 'Cappotto a quadri', 99.9, 0, 'giacche', [['Blu', '#2B3C57']], false, false],
  ['poncho', 'Poncho in maglia', 39.9, 49.9, 'maglieria', [['Crema', '#EFE6D6']], false, false],
  ['jeans', 'Jeans mom fit', 44.9, 0, 'pantaloni', [['Chiaro', '#6F8FB3'], ['Scuro', '#2B3C57']], false, false],
  ['felpa', 'Felpa girocollo in cotone', 32.9, 0, 'maglieria', [['Bianco', '#FFFFFF'], ['Rosa', '#E8A1B5'], ['Nero', '#1C1C1C']], false, false],
  ['bomber', 'Bomber in raso cammello', 59.9, 0, 'giacche', [['Cammello', '#A9673F'], ['Nero', '#1C1C1C']], false, false],
  ['camicia-righe', 'Camicia a righe oversize', 35.9, 0, 'top-e-camicie', [['Blu', '#1C2433'], ['Bianco', '#FFFFFF']], false, false],
  ['tuta', 'Completo felpa e jogger', 54.9, 68.9, 'tute', [['Giallo', '#F2C230'], ['Azzurro', '#9FB6CD'], ['Rosa', '#E8A1B5']], false, false],
  ['pantalone-righe', 'Pantalone palazzo a righe', 45.9, 0, 'pantaloni', [['Nero', '#1C1C1C'], ['Bianco', '#FFFFFF']], false, false],
  ['abito-bianco', 'Abito spalle scoperte', 49.9, 0, 'abiti', [['Bianco', '#FFFFFF'], ['Sabbia', '#E9D7C3']], true, false],
  ['abito-viola', 'Abito in raso prugna', 69.9, 0, 'abiti', [['Prugna', '#5B1F45'], ['Nero', '#1C1C1C']], true, false],
  ['abito-rosso', 'Abito midi con cintura', 64.9, 79.9, 'abiti', [['Rosso', '#C42430'], ['Nero', '#1C1C1C']], true, false],
  ['abito-floreale', 'Abito a portafoglio floreale', 59.9, 0, 'abiti', [['Avorio', '#F4EFE6'], ['Rosa', '#C9566B']], true, true],
  ['trench', 'Trench doppiopetto', 89.9, 0, 'giacche', [['Beige', '#C8A983']], false, true],
  ['pantalone-rosa', 'Pantalone cargo cipria', 39.9, 0, 'pantaloni', [['Cipria', '#E5B9AE'], ['Sabbia', '#C9B79C'], ['Nero', '#1C1C1C']], false, true],
  ['abito-pizzo', 'Abito in pizzo blu notte', 79.9, 0, 'abiti', [['Blu notte', '#1E2A55']], false, true]
];
const ROUT = 'Detergi: gel detergente delicato, mattina e sera, su pelle umida.\nTratta: 3-4 gocce di siero su viso e collo.\nIdrata: crema idratante viso per fissare i principi attivi.';
const COSM = [
  ['smalto', 'Smalto effetto gel Nero', 9.9, 0, 'unghie', [['10 ml', null]], false, false, ''],
  ['pennelli', 'Set pennelli trucco', 29.9, 0, 'accessori', [['8 pezzi', null]], false, false, ''],
  ['balsamo', 'Balsamo labbra al karité', 12.9, 0, 'labbra', [['15 ml', null]], false, false, 'Burro di karité, Senza profumo'],
  ['olio-corpo', 'Olio corpo nutriente', 24.9, 0, 'corpo', [['100 ml', null]], false, false, 'Pelli secche, Assorbimento rapido'],
  ['detergente', 'Gel detergente delicato', 18.9, 0, 'viso', [['150 ml', null]], false, false, 'Tutti i tipi di pelle, Senza sapone'],
  ['tonico', 'Lozione tonica riequilibrante', 21.9, 0, 'viso', [['200 ml', null]], false, false, 'Senza alcool, Pelli miste'],
  ['crema', 'Crema idratante viso', 32.9, 0, 'viso', [['50 ml', null]], true, false, 'Tutti i tipi di pelle, Idratazione 24 ore'],
  ['palette', 'Palette ombretti 35 colori', 34.9, 42.9, 'occhi', [['35 × 1,2 g', null]], true, false, 'Alta pigmentazione, Finish opachi e perlati'],
  ['illuminante', 'Illuminante in polvere Rose Gold', 22.9, 0, 'viso', [['8 g', null]], true, false, 'Effetto glow, Polvere setosa'],
  ['siero-viso', 'Siero acido ialuronico', 27.9, 34.9, 'viso', [['30 ml', null]], true, false, 'Tutti i tipi di pelle, Senza parabeni'],
  ['rossetto', 'Rossetto cremoso Nude 02', 19.9, 0, 'labbra', [['3,5 g', null]], false, true, 'Lunga tenuta, Finish cremoso'],
  ['siero-vitc', 'Siero illuminante vitamina C', 29.9, 0, 'viso', [['30 ml', null], ['50 ml', 42.9]], true, true, 'Tutti i tipi di pelle, Senza parabeni, Dermatologicamente testato']
];

const out = ['-- Catalogo DIMOSTRATIVO Alana Beauty (foto di esempio Unsplash). Generato da scripts/make-demo-seed.mjs', 'begin;'];
CATS.forEach(([macro, name, slug, img], i) => out.push(`insert into public.categories (macro, name, slug, image_url, sort) values (${q(macro)}, ${q(name)}, ${q(slug)}, ${q(U(IMG[img], 120, 120))}, ${i}) on conflict (slug) do update set name = excluded.name, macro = excluded.macro, image_url = excluded.image_url, sort = excluded.sort;`));

let t = 0;
const lit = (v) => (typeof v === 'number' || typeof v === 'boolean' ? String(v) : v === null ? 'null' : v.startsWith('(select') ? v : q(v));
const DEL = 'del' + 'ete from';
const product = (row, imgs, variants) => {
  t++;
  const cols = Object.keys(row);
  out.push(`insert into public.products (${cols.join(', ')}, created_at) values (${Object.values(row).map(lit).join(', ')}, now() - interval '${100 - t} hours') on conflict (slug) do update set ${cols.filter((k) => k !== 'slug').map((k) => `${k} = excluded.${k}`).join(', ')}, created_at = excluded.created_at;`);
  const pid = `(select id from public.products where slug = ${q(row.slug)})`;
  out.push(`${DEL} public.product_images where product_id = ${pid};`);
  out.push(`insert into public.product_images (product_id, url, alt, sort) values ${imgs.map((u, i) => `(${pid}, ${q(u)}, ${q(row.name)}, ${i})`).join(', ')};`);
  out.push(`insert into public.product_variants (product_id, sku, size, color_name, color_hex, format, price_cents, stock, low_stock_threshold, sort) values ${variants.map((v) => `(${pid}, ${q(v.sku)}, ${q(v.size)}, ${q(v.color)}, ${q(v.hex)}, ${q(v.format)}, ${v.price ?? 'null'}, ${v.stock}, ${v.low}, ${v.sort})`).join(', ')} on conflict (sku) do update set product_id = excluded.product_id, size = excluded.size, color_name = excluded.color_name, color_hex = excluded.color_hex, format = excluded.format, price_cents = excluded.price_cents, stock = excluded.stock, sort = excluded.sort;`);
};
for (const [slug, name, price, compare, cat, colors, featured, isNew] of CLOTHES) {
  const id = IMG[slug];
  product({ type: 'clothing', slug, name, price_cents: c(price), compare_at_cents: compare ? c(compare) : null, cost_cents: c(price * 0.48), category_id: `(select id from public.categories where slug = ${q(cat)})`, published: true, featured, is_new: isNew,
    description: `${name} della nuova collezione. Morbido e comodo, si porta dal giorno alla sera.\n\nFoto e testo di esempio: verranno sostituiti con quelli del prodotto reale.`, material: '100% viscosa', fit: 'Regolare · la modella indossa la S', care: 'A mano o in lavatrice a 30°, non candeggiare' },
  [U(id, 1200, 1500), ...ZOOM.map((z) => U(id, 1200, 1500, z))],
  colors.flatMap(([cn, hex], ci) => ['XS', 'S', 'M', 'L', 'XL'].map((size, si) => ({ sku: `${slug}-${ci}-${size}`.toUpperCase(), size, color: cn, hex, format: null, price: null, stock: slug === 'abito-rosso' && size === 'S' && ci === 0 ? 0 : 2 + ((si + ci * 3) % 6), low: 2, sort: ci * 10 + si }))));
}
for (const [slug, name, price, compare, cat, formats, featured, isNew, claims] of COSM) {
  const id = IMG[slug];
  product({ type: 'cosmetic', slug, name, price_cents: c(price), compare_at_cents: compare ? c(compare) : null, cost_cents: c(price * 0.42), category_id: `(select id from public.categories where slug = ${q(cat)})`, published: true, featured, is_new: isNew,
    description: `${name}: formula delicata per tutti i giorni.\n\nTesto di esempio: verrà sostituito con quello dell'etichetta.`, inci: 'Aqua, Glycerin, Niacinamide, Sodium Hyaluronate, Panthenol, Phenoxyethanol, Ethylhexylglycerin (esempio)',
    usage: 'Applicare su pelle pulita mattina e sera (esempio).', warnings: 'Solo per uso esterno. Evitare il contatto con gli occhi.', pao_months: 12, origin_country: 'Regno Unito', eu_responsible_person: '[Nome e indirizzo UE come da etichetta]',
    claims: claims || null, routine: cat === 'viso' ? ROUT : null },
  [U(id, 1200, 1500), U(IMG['h-siero'], 1200, 1500), U(IMG['h-crema'], 1200, 1500), U(id, 1200, 1500, ZOOM[1])],
  formats.map(([f, fp], k) => ({ sku: `${slug}-${k}`.toUpperCase(), size: null, color: null, hex: null, format: f, price: fp ? c(fp) : null, stock: slug === 'palette' ? 0 : 6 + k * 4, low: 3, sort: k })));
}
out.push(`${DEL} public.banners where image_url like 'https://images.unsplash.com/%';`);
out.push(`insert into public.banners (kicker, title, subtitle, image_url, image2_url, link, cta, sort) values ('Nuova collezione autunno', 'Nuova stagione. Nuova te.', 'Abiti, maglieria e la tua beauty routine in un unico posto. Spedizione gratuita sopra € 49.', ${q(U(IMG['h-viola'], 1400, 1600))}, ${q(U(IMG['h-siero'], 900, 1600))}, '/abbigliamento', 'Shop abbigliamento', 1);`);
out.push(`insert into public.banners (kicker, title, subtitle, image_url, promo_code, link, cta, sort) values ('Promo della settimana', '-20% su tutta la skincare viso', 'Sieri, creme e detergenti in promozione fino a domenica. Lo sconto si applica nel carrello con il codice.', ${q(U(IMG['h-crema'], 1400, 1000))}, 'SKIN20', '/cosmetici?sub=viso', 'Approfitta ora', 2);`);
out.push(`insert into public.coupons (code, kind, value, applies_to) values ('SKIN20', 'percent', 20, 'cosmetici') on conflict (code) do nothing;`);
const POSTS = [
  ['abiti-di-stagione-come-abbinarli', 'Abiti di stagione: come abbinarli', 'Stile', 'h-floreale', 'Tre look facili dal giorno alla sera.', '## 1. Di giorno\nAbito midi, sneakers bianche e una giacca leggera.\n\n[prodotto:abito-floreale]\n\n## 2. In ufficio\nAggiungi un trench e una borsa strutturata.\n\n## 3. La sera\nSandali con il tacco e un rossetto deciso.'],
  ['trucco-occhi-luminoso-in-5-minuti', 'Trucco occhi luminoso in 5 minuti', 'Make-up', 'h-trucco', 'Palette, illuminante e un solo pennello.', "## 1. Prepara la palpebra\nUn velo di base uniforma il colore.\n\n## 2. Colore\nSfuma un tono caldo nella piega dell'occhio.\n\n[prodotto:palette]\n\n## 3. Luce\nUn tocco di illuminante nell'angolo interno."],
  ['come-scegliere-la-crema-giusta', 'Come scegliere la crema giusta per la tua pelle', 'Skincare', 'h-crema', 'Pelle secca, mista, grassa o sensibile: riconoscila in un minuto e costruisci una routine che funziona davvero.',
    "## 1. Riconosci il tuo tipo di pelle\nLava il viso con un detergente delicato e aspetta un'ora senza applicare nulla. Poi guarda e tocca la pelle: ti dirà quasi tutto quello che serve.\n\n[[Secca|Tira e a volte si squama.]]\n[[Grassa|Lucida su tutto il viso.]]\n[[Mista|Lucida solo sulla zona T.]]\n[[Sensibile|Si arrossa facilmente.]]\n\n## 2. Gli ingredienti da cercare\nLeggi sempre l'elenco degli ingredienti (INCI): sono in ordine di quantità. Per la pelle secca cerca glicerina, burri e acido ialuronico; per la grassa formule leggere con niacinamide.\n\n[prodotto:siero-viso]\n\n## 3. Giorno e notte\nDi giorno una texture leggera e la protezione solare; la sera una crema più ricca che lavori mentre dormi.\n\n- Mattina: detergente, siero, crema, protezione solare\n- Sera: struccante, detergente, siero, crema nutriente\n\n[prodotto:crema]\n[prodotto:detergente]\n[prodotto:tonico]"]
];
POSTS.forEach(([slug, title, cat, img, excerpt, body], i) => out.push(`insert into public.blog_posts (slug, title, category, cover_url, excerpt, body, published, show_home, published_at, seo_title, seo_description) values (${q(slug)}, ${q(title)}, ${q(cat)}, ${q(U(IMG[img], 1600, 1000))}, ${q(excerpt)}, ${q(body)}, true, true, now() - interval '${3 - i} days', ${q(title)}, ${q(excerpt)}) on conflict (slug) do update set title = excluded.title, category = excluded.category, cover_url = excluded.cover_url, excerpt = excluded.excerpt, body = excluded.body, published_at = excluded.published_at;`));
out.push('commit;');

const slugs = [...CLOTHES, ...COSM].map((p) => q(p[0])).join(', ');
const remove = ['-- Toglie il catalogo DIMOSTRATIVO (prodotti, banner e articoli di esempio). Le categorie restano.', 'begin;',
  `${DEL} public.products where slug in (${slugs});`,
  `${DEL} public.banners where image_url like 'https://images.unsplash.com/%';`,
  `${DEL} public.blog_posts where slug in (${POSTS.map((p) => q(p[0])).join(', ')});`,
  `${DEL} public.coupons where code = 'SKIN20' and usage_count = 0;`, 'commit;'];
mkdirSync('supabase/demo', { recursive: true });
writeFileSync('supabase/demo/demo-seed.sql', out.join('\n') + '\n');
writeFileSync('supabase/demo/demo-remove.sql', remove.join('\n') + '\n');
console.log('Scritti supabase/demo/demo-seed.sql e demo-remove.sql');
