// Genera il PDF "Alana Beauty · Proposte grafiche".
// Uso: node design/pdf/render.js   (serve Playwright con Chromium e pdfunite)
// 1) fotografa ogni pagina in ogni stile, da computer (1440 px), tablet (820 px) e telefono (390 px)
// 2) impagina tutto in book.html e lo stampa in un unico PDF.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const OUT = path.join(ROOT, 'build');
const PDF = path.join(ROOT, 'Alana-Beauty-Proposte-grafiche.pdf');
const DSF = 1.25;

const THEMES = [
  { id: 'a', name: 'Pink Glam', tag: 'Più vicina al tuo riferimento',
    text: "Il rosa cipria e il nero dello stile americano che ti piace: titoli larghi in maiuscolo, bottoni tondi, foto grandi. Giovane, sicura e molto riconoscibile.",
    sw: [['#F08CAF', 'Rosa'], ['#151214', 'Nero'], ['#FDE3EA', 'Cipria'], ['#D6336C', 'Fucsia promo'], ['#FFFFFF', 'Bianco']],
    ink: '#151214', fonts: 'Titoli: Archivo Expanded · Testi: DM Sans', best: 'Per un pubblico giovane e social' },
  { id: 'b', name: 'Nude Luxe', tag: '',
    text: "Toni nude, sabbia e cioccolato, titoli con le grazie in corsivo e molto spazio bianco. Elegante e raffinata, da boutique: fa percepire i prodotti come di qualità.",
    sw: [['#2B211C', 'Cioccolato'], ['#C3A083', 'Nude'], ['#F1E7DD', 'Sabbia'], ['#A3473A', 'Terracotta promo'], ['#FBF8F4', 'Avorio']],
    ink: '#2B211C', fonts: 'Titoli: Cormorant Garamond · Testi: Jost', best: 'Per un pubblico che cerca eleganza' },
  { id: 'c', name: 'Noir Editorial', tag: '',
    text: "Nero e oro champagne, come una rivista di moda. Titoli classici in maiuscolo, foto a tutta altezza, angoli netti. Mette al centro gli abiti e il look completo.",
    sw: [['#0F0E10', 'Nero'], ['#D6B98E', 'Champagne'], ['#F2EEE9', 'Grigio caldo'], ['#B3261E', 'Rosso promo'], ['#FFFFFF', 'Bianco']],
    ink: '#0F0E10', fonts: 'Titoli: Bodoni Moda · Testi: Manrope', best: 'Per puntare sulla moda e sulle serate' },
  { id: 'd', name: 'Sunset Pop', tag: '',
    text: "Corallo, pesca e lilla, forme molto morbide e caratteri tondi. Allegra e colorata, piena di energia: perfetta per make-up, colori di stagione e promozioni.",
    sw: [['#FF5C48', 'Corallo'], ['#B79DF2', 'Lilla'], ['#FFE2D5', 'Pesca'], ['#36172F', 'Prugna'], ['#FFF8F3', 'Crema']],
    ink: '#FF5C48', fonts: 'Titoli: Unbounded · Testi: Nunito Sans', best: 'Per un negozio allegro e colorato' }
];
const PAGES = [
  ['home', 'Home', "Banner a scorrimento, le due macro-categorie, novità, promo della settimana, prodotti in evidenza scelti dal pannello, blog e newsletter con il 10% di benvenuto."],
  ['abbigliamento', 'Categoria · Abbigliamento', "Sottocategorie con foto, filtri per taglia, colore, prezzo e disponibilità. Da telefono i filtri si aprono con un pulsante."],
  ['prodotto-abbigliamento', 'Scheda · Abbigliamento', "Colore e taglia con giacenza per variante. Se una taglia è esaurita la cliente lascia l'email e riceve l'avviso quando torna disponibile."],
  ['cosmetici', 'Categoria · Cosmetici', "Sottocategorie (viso, occhi, labbra, corpo…) e filtri dedicati ai cosmetici, separati da quelli dell'abbigliamento."],
  ['prodotto-cosmetico', 'Scheda · Cosmetico', "Formato, ingredienti (INCI), modo d'uso, durata dopo l'apertura, persona responsabile UE e paese di origine, come chiede la normativa."],
  ['carrello', 'Carrello e checkout', "Acquisto anche senza registrazione. Apple Pay, Google Pay, PayPal e carta (Stripe), coupon e spedizione gratuita sopra soglia."],
  ['conferma', 'Ordine confermato', "Numero d'ordine, stato della spedizione passo per passo e invito a creare l'account per chi ha comprato come ospite."],
  ['account', 'Area cliente', "Storico ordini con tracking, richiesta di reso o cambio taglia, indirizzi salvati e lista dei preferiti."],
  ['blog', 'Beauty blog', "Articoli con indice e prodotti del negozio dentro il testo, scritti per farsi trovare su Google."]
];
const ADMIN = [
  ['admin-panoramica', 'Panoramica', "Vendite del mese, grafico abbigliamento e cosmetici, cose da fare oggi, più venduti e margini per categoria."],
  ['admin-ordini', 'Ordini', "Elenco per stato e dettaglio. Inserendo il tracking parte da sola l'email «Il tuo ordine è partito»."],
  ['admin-prodotto', 'Modifica abbigliamento', "Foto, descrizione, varianti taglia × colore con i pezzi, prezzo scontato, costo d'acquisto per il margine, in evidenza in home e SEO."],
  ['admin-cosmetico', 'Modifica cosmetico', "Scheda dedicata: INCI, modo d'uso, PAO, lotto, origine e persona responsabile UE, con il controllo dell'etichetta."],
  ['admin-magazzino', 'Magazzino', "Giacenze per variante, avviso sotto la scorta minima, lista d'attesa dei prodotti esauriti e import da Excel."],
  ['admin-promozioni', 'Promozioni e coupon', "Coupon con date e minimo d'ordine, coupon di benvenuto automatico, soglia di spedizione gratuita, banner e vetrine della home."],
  ['admin-resi', 'Resi e cambi', "Le richieste arrivano dall'area cliente: si approvano o rifiutano con un clic e la cliente riceve le istruzioni."],
  ['admin-blog', 'Blog', "Editor degli articoli con titolo, descrizione e indirizzo per Google, e anteprima di come appare nei risultati."]
];

async function shoot(browser, url, width, file) {
  const page = await browser.newPage({ viewport: { width, height: 900 }, deviceScaleFactor: DSF });
  await page.goto(url);
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(200);
  const h = await page.evaluate(() => Math.ceil(document.documentElement.scrollHeight));
  const sw = await page.evaluate(() => document.documentElement.scrollWidth);
  if (sw > width) console.warn('OVERFLOW', url, width, sw);
  await page.screenshot({ path: file, fullPage: true, type: 'jpeg', quality: 76 });
  await page.close();
  return h;
}

function phoneCols(src, mh, maxH, w) {
  const cols = Math.max(1, Math.ceil(mh / maxH));
  const colH = Math.ceil(mh / cols);
  let m = '';
  for (let i = 0; i < cols; i++) m += `<div class="dvc ${w > 500 ? 'tab' : 'phone'}" style="height:${colH + 24}px"><div class="scr" style="width:${w}px;height:${colH}px"><img src="${src}" style="width:${w}px;margin-top:-${i * colH}px" alt=""></div>${cols > 1 ? `<span class="cont">${i + 1} / ${cols}</span>` : ''}</div>`;
  return { html: m, cols, colH };
}

function spread(id, kicker, title, desc, chip, shot) {
  const PAD = 70, HEAD = 170, GAP = 70;
  const deskH = shot.dh + 38;
  const maxH = Math.max(deskH, 1800);
  const t = phoneCols(shot.t, shot.th, maxH, 820);
  const m = phoneCols(shot.m, shot.mh, maxH, 390);
  const W = PAD + 1440 + GAP + t.cols * 844 + (t.cols - 1) * 28 + GAP + m.cols * 414 + (m.cols - 1) * 28 + PAD;
  const H = HEAD + Math.max(deskH, t.colH + 24, m.colH + 24) + 70 + PAD;
  return {
    css: `@page ${id}{size:${W}px ${H}px;margin:0}`,
    html: `<section class="pg spread" style="page:${id};width:${W}px;height:${H}px">
      <header class="sh"><div><span class="kick">${kicker}</span><h2>${title}</h2><p>${desc}</p></div>${chip}</header>
      <div class="row">
        <div class="dev"><span class="lab">Computer · 1440 px</span><div class="desk"><div class="bar"><i></i><i></i><i></i><span>alanabeauty.it</span></div><img src="${shot.d}" alt=""></div></div>
        <div class="dev"><span class="lab">Tablet · 820 px</span><div class="phones">${t.html}</div></div>
        <div class="dev"><span class="lab">Telefono · 390 px</span><div class="phones">${m.html}</div></div>
      </div></section>`
  };
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const site = 'file://' + path.join(ROOT, 'site') + '/';
  const adm = 'file://' + path.join(ROOT, 'admin') + '/';
  const shots = {};
  for (const t of THEMES) {
    for (const [p] of PAGES.concat(ADMIN)) {
      const u = (p.startsWith('admin') ? adm : site) + p + '.html#' + t.id;
      const f = k => path.join(OUT, `${p}-${t.id}-${k}.jpg`);
      shots[p + t.id] = { d: f('d'), t: f('t'), m: f('m'),
        dh: await shoot(browser, u, 1440, f('d')), th: await shoot(browser, u, 820, f('t')), mh: await shoot(browser, u, 390, f('m')) };
      console.log('ok', p, t.id);
    }
    const page = await browser.newPage({ viewport: { width: 1440, height: 600 }, deviceScaleFactor: 3 });
    await page.goto(site + 'home.html#' + t.id); await page.waitForLoadState('networkidle'); await page.evaluate(() => document.fonts.ready);
    await (await page.$('.hd .logo')).screenshot({ path: path.join(OUT, `logo-${t.id}.png`), omitBackground: true });
    await page.close();
  }

  const css = [], body = [];
  const W0 = 2100, H0 = 1300;
  const nScreens = PAGES.length + ADMIN.length;
  css.push(`@page cover{size:${W0}px ${H0}px;margin:0}`);
  body.push(`<section class="pg cover" style="page:cover;width:${W0}px;height:${H0}px">
    <div class="cv-l"><span class="kick">Proposte grafiche · Novembre 2026</span><h1>Alana Beauty</h1><p class="lead">Lo store online di abbigliamento donna e cosmetici · alanabeauty.it</p>
    <p class="cvtxt">${THEMES.length} proposte grafiche. Ognuna è mostrata su tutte le ${PAGES.length} pagine del sito e su tutte le ${ADMIN.length} schermate della Dashboard di gestione, in 3 visualizzazioni: computer, tablet e telefono.</p>
    <p class="small">Le foto sono di esempio (Unsplash) e verranno sostituite con quelle dei tuoi prodotti. Prezzi, numeri, ingredienti e nomi delle clienti sono esempi.</p></div>
    <div class="cv-r">${THEMES.map((t, i) => `<div class="cvt"><img src="${path.join(OUT, `logo-${t.id}.png`)}" alt=""><div><b>${i + 1}. ${t.name}</b>${t.tag ? ` <em>${t.tag}</em>` : ''}<span>${t.best}</span></div><span class="sws">${t.sw.map(s => `<i style="background:${s[0]}"></i>`).join('')}</span></div>`).join('')}
    <div class="cvt idx"><b>Sito · ${PAGES.length} pagine</b><span>${PAGES.map(p => p[1]).join(' · ')}</span></div>
    <div class="cvt idx"><b>Dashboard · ${ADMIN.length} schermate</b><span>${ADMIN.map(p => p[1]).join(' · ')}</span></div></div>
  </section>`);

  THEMES.forEach((t, i) => {
    const id = 'th' + t.id;
    css.push(`@page ${id}{size:${W0}px ${H0}px;margin:0}`);
    body.push(`<section class="pg divider" style="page:${id};width:${W0}px;height:${H0}px;--c:${t.ink};--c2:${t.sw[1][0]};--soft:${t.sw[2][0]}">
      <div class="dv-l"><span class="kick">Proposta ${i + 1} di ${THEMES.length}${t.tag ? ' · ' + t.tag : ''}</span><h1>${t.name}</h1><p class="lead">${t.text}</p>
        <dl><dt>Caratteri</dt><dd>${t.fonts}</dd><dt>Adatta</dt><dd>${t.best}</dd><dt>Sito</dt><dd>${PAGES.map(p => p[1]).join(' · ')}</dd><dt>Dashboard</dt><dd>${ADMIN.map(p => p[1]).join(' · ')}</dd></dl></div>
      <div class="dv-r"><div class="logobox"><img src="${path.join(OUT, `logo-${t.id}.png`)}" alt=""></div>
        <div class="pal">${t.sw.map(s => `<div><i style="background:${s[0]}"></i><b>${s[1]}</b><span>${s[0]}</span></div>`).join('')}</div>
        <div class="peeks"><img class="peek" src="${shots['home' + t.id].d}" alt=""><img class="peek" src="${shots['admin-panoramica' + t.id].d}" alt=""></div></div>
    </section>`);
    const chip = `<span class="chip"><i style="background:${t.sw[0][0]}"></i><i style="background:${t.sw[1][0]}"></i>Proposta ${i + 1} · ${t.name}</span>`;
    PAGES.forEach(([p, name, desc], j) => {
      const s = spread(`s${t.id}${j}`, `Proposta ${i + 1} · ${t.name} · Sito · pagina ${j + 1} di ${PAGES.length}`, name, desc, chip, shots[p + t.id]);
      css.push(s.css); body.push(s.html);
    });
    ADMIN.forEach(([p, name, desc], j) => {
      const s = spread(`a${t.id}${j}`, `Proposta ${i + 1} · ${t.name} · Dashboard · schermata ${j + 1} di ${ADMIN.length}`, name, desc, chip, shots[p + t.id]);
      css.push(s.css); body.push(s.html);
    });
  });

  const book = `<!doctype html><html lang="it"><head><meta charset="utf-8"><title>Alana Beauty · Proposte grafiche</title>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&family=Bricolage+Grotesque:opsz,wght@12..96,700;12..96,800&display=swap">
  <style>
  *{box-sizing:border-box}body{margin:0;font-family:"Atkinson Hyperlegible",sans-serif;color:#1A1517;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .pg{position:relative;overflow:hidden}
  h1,h2{font-family:"Bricolage Grotesque",sans-serif;margin:0;letter-spacing:-.02em;line-height:1.02}
  .kick{font-size:22px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#6E5F65}
  .lead{font-size:34px;line-height:1.35;max-width:30ch;margin:28px 0 0}
  .cover{background:#1A1517;color:#fff;display:grid;grid-template-columns:1fr 1fr;gap:80px;padding:110px}
  .cover .kick{color:#F4B6CB}.cover h1{font-size:150px;margin-top:24px}.cover .cvtxt{font-size:26px;line-height:1.5;margin-top:44px;color:#E9DCE1;max-width:36ch}
  .cover .small{font-size:20px;color:#B9A8AF;margin-top:40px}
  .cv-r{display:flex;flex-direction:column;gap:16px;justify-content:center}
  .cvt{background:#fff;color:#1A1517;border-radius:22px;padding:22px 26px;display:grid;grid-template-columns:260px 1fr auto;gap:22px;align-items:center}
  .cvt img{max-height:62px;max-width:260px}.cvt b{font-size:26px;display:block}.cvt em{font-style:normal;font-size:16px;font-weight:700;background:#FDE3EA;color:#8B2350;border-radius:99px;padding:3px 10px}
  .cvt span{font-size:19px;color:#6E5F65}.sws{display:flex;gap:6px}.sws i{width:30px;height:30px;border-radius:8px;border:1px solid rgba(0,0,0,.12)}
  .cvt.idx{grid-template-columns:1fr;background:#2E2529;color:#fff}.cvt.idx span{color:#D8C8CF}
  .divider{display:grid;grid-template-columns:1fr 1.05fr;gap:80px;padding:110px;background:var(--soft)}
  .divider h1{font-size:120px;margin-top:20px;color:var(--c)}
  .divider dl{display:grid;grid-template-columns:auto 1fr;gap:14px 28px;font-size:24px;margin-top:50px;max-width:820px}
  .divider dt{font-weight:700}.divider dd{margin:0;color:#3E4A58}
  .dv-r{position:relative;display:flex;flex-direction:column;gap:30px}
  .logobox{background:#fff;border-radius:24px;padding:36px;display:flex;align-items:center;justify-content:center;height:200px}.logobox img{max-height:110px}
  .pal{display:grid;grid-template-columns:repeat(5,1fr);gap:14px}
  .pal div{background:#fff;border-radius:18px;padding:14px;display:flex;flex-direction:column;gap:6px;font-size:18px}
  .pal i{height:90px;border-radius:12px;border:1px solid rgba(0,0,0,.1)}.pal span{color:#6E5F65;font-size:16px}
  .peeks{display:grid;grid-template-columns:1fr 1fr;gap:20px}.peek{width:100%;height:560px;object-fit:cover;object-position:top;border-radius:20px;box-shadow:0 30px 60px -30px rgba(0,0,0,.4)}
  .spread{background:#EFEAEC;padding:70px}
  .sh{display:flex;justify-content:space-between;align-items:flex-start;gap:40px;height:130px;margin-bottom:40px}
  .sh h2{font-size:58px;margin-top:6px}.sh p{font-size:22px;color:#46525F;margin:8px 0 0;max-width:80ch}
  .chip{display:inline-flex;align-items:center;gap:10px;background:#fff;border-radius:99px;padding:12px 22px;font-size:22px;font-weight:700;white-space:nowrap}
  .chip i{width:22px;height:22px;border-radius:50%}
  .row{display:flex;gap:70px;align-items:flex-start}
  .dev{display:flex;flex-direction:column;gap:12px}.lab{font-size:20px;font-weight:700;color:#6E5F65}
  .desk{width:1440px;border-radius:14px;overflow:hidden;background:#fff;box-shadow:0 24px 60px -30px rgba(10,30,60,.45)}
  .desk>img{width:1440px;display:block}
  .bar{height:38px;background:#D9DFE6;display:flex;align-items:center;gap:8px;padding:0 14px}.bar i{width:12px;height:12px;border-radius:50%;background:#B7C0CB}
  .bar span{margin-left:12px;background:#fff;border-radius:7px;padding:4px 14px;font-size:14px;color:#6E5F65;width:420px}
  .phones{display:flex;gap:28px;align-items:flex-start}
  .dvc{background:#1D232B;border-radius:34px;padding:12px;position:relative}.phone{width:414px}.tab{width:844px;border-radius:30px}
  .scr{overflow:hidden;border-radius:22px;background:#fff}.scr img{display:block}
  .cont{position:absolute;bottom:-34px;left:0;right:0;text-align:center;font-size:18px;font-weight:700;color:#6E5F65}
  </style></head><body>${body.join('\n')}</body></html>`;
  const bookPath = path.join(OUT, 'book.html');
  fs.writeFileSync(bookPath, book);
  // ogni pagina in un PDF a parte con la sua misura esatta, poi un unico file
  const page = await browser.newPage();
  await page.goto('file://' + bookPath);
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => document.fonts.ready);
  const n = await page.evaluate(() => document.querySelectorAll('.pg').length);
  const parts = [];
  for (let i = 0; i < n; i++) {
    const info = await page.evaluate(i => {
      const all = [...document.querySelectorAll('.pg')];
      all.forEach((el, j) => { el.style.display = j === i ? '' : 'none'; });
      const el = all[i];
      return { w: el.offsetWidth, h: el.offsetHeight, sw: el.scrollWidth, sh: el.scrollHeight };
    }, i);
    if (info.sw > info.w || info.sh > info.h) console.warn('OVERFLOW page', i + 1, info);
    await page.addStyleTag({ content: `@page{size:${info.w}px ${info.h}px;margin:0}` });
    const f = path.join(OUT, `part-${String(i).padStart(3, '0')}.pdf`);
    await page.pdf({ path: f, width: info.w + 'px', height: info.h + 'px', printBackground: true, pageRanges: '1' });
    parts.push(f);
  }
  require('child_process').execFileSync('pdfunite', [...parts, PDF]);
  await browser.close();
  console.log('PDF', PDF, (fs.statSync(PDF).size / 1048576).toFixed(1) + ' MB');
})();
