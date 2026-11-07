// Alana Beauty · parti comuni dei mockup (intestazione, piè di pagina, schede prodotto).
// Il tema si sceglie dall'URL: pagina.html#a | #b | #c | #d
(function () {
  var t = (location.hash || '#a').slice(1);
  if (!/^[abcd]$/.test(t)) t = 'a';
  document.documentElement.setAttribute('data-theme', t);
  window.AB_THEME = t;
})();

var IMG = function (n) { return '../../src/img/' + n + '.jpg'; };
function fill(id, html) { var el = document.getElementById(id); if (el) el.innerHTML = html; }
function eur(n) { return '€ ' + n.toFixed(2).replace('.', ','); }

var ICON = {
  search: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="m15.5 15.5 5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  user: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>',
  heart: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7.5-4.6-9.2-9.4C1.6 7 4 4 7.2 4c2 0 3.6 1.1 4.8 2.8C13.2 5.1 14.8 4 16.8 4 20 4 22.4 7 21.2 10.6 19.5 15.4 12 20 12 20z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
  heartf: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7.5-4.6-9.2-9.4C1.6 7 4 4 7.2 4c2 0 3.6 1.1 4.8 2.8C13.2 5.1 14.8 4 16.8 4 20 4 22.4 7 21.2 10.6 19.5 15.4 12 20 12 20z" fill="currentColor"/></svg>',
  bag: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h14l-1 12H6z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M9 8V6a3 3 0 0 1 6 0v2" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>',
  menu: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7h18M3 12h18M3 17h18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  truck: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" d="M2 6h11v10H2zM13 9h4l4 4v3h-8z"/><circle cx="6" cy="17.5" r="2" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="17" cy="17.5" r="2" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>',
  ret: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12a8 8 0 1 0 2.4-5.7M4 4v4h4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  lock: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10" width="14" height="10" rx="2" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M8 10V7a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>',
  leaf: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 19C5 10 11 5 20 4c0 9-5 15-14 15zM5 19l7-7" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  star: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="m12 3 2.7 5.6 6.1.8-4.5 4.2 1.1 6-5.4-2.9-5.4 2.9 1.1-6L3.2 9.4l6.1-.8z"/></svg>',
  bell: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 20a2 2 0 0 0 4 0" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>',
  plus: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  minus: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  filter: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M7 12h10M10 18h4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  chev: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  down: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  mail: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="m4 7 8 6 8-6" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>',
  spark: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 1.5c.6 5.2 2.9 7.9 9 10.5-6.1 2.6-8.4 5.3-9 10.5-.6-5.2-2.9-7.9-9-10.5 6.1-2.6 8.4-5.3 9-10.5z"/></svg>'
};

// Logo: cambia con la proposta grafica
function logo(big) {
  var t = window.AB_THEME;
  var s = '<span class="logo' + (big ? ' big' : '') + '">';
  if (t === 'a') s += '<span class="lw">ALANA</span><span class="ls"><i>' + ICON.spark + '</i>BEAUTY<i>' + ICON.spark + '</i></span>';
  else if (t === 'b') s += '<span class="lw">Alana</span><span class="ls">BEAUTY</span>';
  else if (t === 'c') s += '<span class="lw">ALANA</span><span class="ls">— BEAUTY —</span>';
  else s += '<span class="lw">alana<b></b></span><span class="ls">beauty</span>';
  return s + '</span>';
}

var P = {
  // abbigliamento: nome, prezzo, prezzo pieno, sottocategoria, colori, etichetta
  'abito-floreale': ['Abito a portafoglio floreale', 59.9, 0, 'Abiti', ['#F4EFE6', '#C9566B'], 'new'],
  'abito-bianco': ['Abito spalle scoperte', 49.9, 0, 'Abiti', ['#FFFFFF', '#E9D7C3'], ''],
  'pantalone-righe': ['Pantalone palazzo a righe', 45.9, 0, 'Pantaloni', ['#1C1C1C', '#FFFFFF'], ''],
  'tuta': ['Completo felpa e jogger', 54.9, 68.9, 'Tute', ['#F2C230', '#9FB6CD', '#E8A1B5'], 'sale'],
  'camicia-righe': ['Camicia a righe oversize', 35.9, 0, 'Top e camicie', ['#1C2433', '#FFFFFF'], ''],
  'abito-pizzo': ['Abito in pizzo blu notte', 79.9, 0, 'Abiti', ['#1E2A55'], 'new'],
  'abito-viola': ['Abito in raso prugna', 69.9, 0, 'Abiti', ['#5B1F45', '#1C1C1C'], ''],
  'abito-rosso': ['Abito midi con cintura', 64.9, 79.9, 'Abiti', ['#C42430', '#1C1C1C'], 'sale'],
  'pantalone-rosa': ['Pantalone cargo cipria', 39.9, 0, 'Pantaloni', ['#E5B9AE', '#C9B79C', '#1C1C1C'], 'new'],
  'bomber': ['Bomber in raso cammello', 59.9, 0, 'Giacche', ['#A9673F', '#1C1C1C'], ''],
  'abito-lungo': ['Abito lungo da cerimonia', 89.9, 0, 'Abiti', ['#C42430', '#1E2A55'], ''],
  'trench': ['Trench doppiopetto', 89.9, 0, 'Giacche', ['#C8A983'], 'new'],
  'felpa': ['Felpa girocollo in cotone', 32.9, 0, 'Maglieria', ['#FFFFFF', '#E8A1B5', '#1C1C1C'], ''],
  'abito-camicia': ['Abito chemisier in lino', 54.9, 0, 'Abiti', ['#F4EFE6'], ''],
  'jeans': ['Jeans mom fit', 44.9, 0, 'Pantaloni', ['#6F8FB3', '#2B3C57'], ''],
  'poncho': ['Poncho in maglia', 39.9, 49.9, 'Maglieria', ['#EFE6D6'], 'sale'],
  'cappotto': ['Cappotto a quadri', 99.9, 0, 'Giacche', ['#2B3C57'], ''],
  'top-nero': ['Blusa in velo', 34.9, 0, 'Top e camicie', ['#1C1C1C', '#FFFFFF'], ''],
  'giacca-jeans': ['Giacca di jeans', 49.9, 0, 'Giacche', ['#6F8FB3'], ''],
  // cosmetici: nome, prezzo, prezzo pieno, sottocategoria, formato, etichetta
  'siero-vitc': ['Siero illuminante vitamina C', 29.9, 0, 'Viso', '30 ml', 'new'],
  'olio-corpo': ['Olio corpo nutriente', 24.9, 0, 'Corpo', '100 ml', ''],
  'siero-viso': ['Siero acido ialuronico', 27.9, 34.9, 'Viso', '30 ml', 'sale'],
  'crema': ['Crema idratante viso', 32.9, 0, 'Viso', '50 ml', ''],
  'detergente': ['Gel detergente delicato', 18.9, 0, 'Viso', '150 ml', ''],
  'rossetto': ['Rossetto cremoso Nude 02', 19.9, 0, 'Labbra', '3,5 g', 'new'],
  'tonico': ['Lozione tonica riequilibrante', 21.9, 0, 'Viso', '200 ml', ''],
  'balsamo': ['Balsamo labbra al karité', 12.9, 0, 'Labbra', '15 ml', ''],
  'illuminante': ['Illuminante in polvere Rose Gold', 22.9, 0, 'Viso', '8 g', ''],
  'palette': ['Palette ombretti 35 colori', 34.9, 42.9, 'Occhi', '35 × 1,2 g', 'sale'],
  'pennelli': ['Set pennelli trucco', 29.9, 0, 'Accessori', '8 pezzi', ''],
  'smalto': ['Smalto effetto gel Nero', 9.9, 0, 'Unghie', '10 ml', '']
};
function isCos(id) { return typeof P[id][4] === 'string'; }

function card(id, opts) {
  opts = opts || {};
  var p = P[id];
  var cos = isCos(id);
  var pill = p[5] === 'new' ? '<span class="pill new">Novità</span>' : p[5] === 'sale' ? '<span class="pill sale">-' + Math.round((1 - p[1] / p[2]) * 100) + '%</span>' : '';
  var s = '<article class="card">';
  s += '<div class="im"><img src="' + IMG(id) + '" alt="">' + pill + '<span class="wish' + (opts.wished ? ' on' : '') + '">' + (opts.wished ? ICON.heartf : ICON.heart) + '</span></div>';
  s += '<div class="cb"><span class="ct">' + (cos ? p[3] + ' · ' + p[4] : p[3]) + '</span>';
  s += '<span class="nm">' + p[0] + '</span>';
  s += '<span class="pr' + (p[2] ? ' sale' : '') + '"><b>' + eur(p[1]) + '</b>' + (p[2] ? '<s>' + eur(p[2]) + '</s>' : '') + '</span>';
  if (!cos) s += '<span class="sw">' + p[4].map(function (c) { return '<i style="background:' + c + '"></i>'; }).join('') + '</span>';
  else s += '<span class="stars">' + ICON.star + ICON.star + ICON.star + ICON.star + ICON.star + '<em>' + (12 + id.length * 3) + '</em></span>';
  s += '</div></article>';
  return s;
}
function cards(list, opts) { return list.map(function (x) { return card(x, opts); }).join(''); }

function header(active) {
  var h = '<div class="topbar"><div class="wrap"><span>Spedizione gratuita sopra € 49</span><span class="tb2">-10% sul primo ordine con la newsletter</span><span class="tb3">Resi e cambi entro 14 giorni</span></div></div>';
  h += '<header class="hd"><div class="wrap">';
  h += '<span class="mmenu">' + ICON.menu + '</span>';
  h += logo();
  h += '<nav class="mainnav">';
  [['abb', 'Abbigliamento'], ['cos', 'Cosmetici'], ['new', 'Novità'], ['sale', 'Promo'], ['blog', 'Beauty blog']].forEach(function (x) {
    h += '<a' + (active === x[0] ? ' class="on"' : '') + '>' + x[1] + '</a>';
  });
  h += '</nav>';
  h += '<span class="acts"><span class="search">' + ICON.search + '<span>Cerca abiti, sieri, rossetti…</span></span><span class="ic ms">' + ICON.search + '</span><span class="ic ac">' + ICON.user + '</span><span class="ic wl">' + ICON.heart + '<em>2</em></span><span class="ic cart">' + ICON.bag + '<em>3</em></span></span>';
  h += '</div></header>';
  return h;
}

function footer(nonews) {
  var f = '';
  if (!nonews) {
    f += '<section class="news"><div class="wrap"><div class="nbox"><div class="ntx"><span class="k">Newsletter</span><h2 class="H">Iscriviti e ricevi il 10% sul primo ordine</h2><p>Novità, consigli beauty e promo riservate. Ti cancelli quando vuoi.</p></div>';
    f += '<div class="nform"><div class="nrow"><span class="inp">La tua email</span><span class="btn">Iscriviti</span></div><span class="cons"><i></i>Acconsento a ricevere email promozionali (informativa privacy)</span></div></div></div></section>';
  }
  f += '<footer class="ft"><div class="wrap"><div class="g">';
  f += '<div class="fl">' + logo() + '<span>Abbigliamento donna e cosmetici selezionati. Spedizioni in tutta Italia.</span><span class="soc"><i>IG</i><i>TT</i><i>FB</i></span></div>';
  f += '<div><b>Shop</b><span>Abbigliamento</span><span>Cosmetici</span><span>Novità</span><span>Promo</span></div>';
  f += '<div><b>Aiuto</b><span>Spedizioni</span><span>Resi e cambi</span><span>Il mio account</span><span>Contatti</span></div>';
  f += '<div><b>Legale</b><span>Condizioni di vendita</span><span>Privacy policy</span><span>Cookie policy</span></div>';
  f += '</div><div class="pay"><span>Visa</span><span>Mastercard</span><span>Apple Pay</span><span>Google Pay</span><span>PayPal</span></div>';
  f += '<div class="bt">Alana Beauty · Roma · P. IVA 18656601004</div></div></footer>';
  return f;
}

function perks() {
  return [['truck', 'Spedizione gratuita', 'sopra € 49 in tutta Italia'], ['ret', 'Resi e cambi facili', 'entro 14 giorni dall\'area cliente'], ['lock', 'Pagamenti sicuri', 'Carta, Apple Pay, Google Pay, PayPal'], ['leaf', 'Cosmetici a norma UE', 'etichetta e ingredienti in italiano']]
    .map(function (x) { return '<div class="perk">' + ICON[x[0]] + '<span><b>' + x[1] + '</b>' + x[2] + '</span></div>'; }).join('');
}
