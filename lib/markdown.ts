// Markdown minimo per il blog: ## titoli, ### sottotitoli, - elenchi, **grassetto**, *corsivo*, [testo](link), ![alt](immagine).
// Una riga [prodotto:slug] inserisce la scheda di un prodotto del negozio.
// Righe consecutive [[Titolo|testo]] diventano schede affiancate (es. i tipi di pelle).
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
const safeUrl = (u: string) => (/^(https?:\/\/|\/)/.test(u) ? u : '#');

function inline(s: string) {
  return esc(s)
    .replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (_, a, u) => `<img src="${safeUrl(u)}" alt="${a}" loading="lazy">`)
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, t, u) => `<a href="${safeUrl(u)}"${u.startsWith('http') ? ' target="_blank" rel="noopener"' : ''}>${t}</a>`)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>');
}

export type Block = { kind: 'html'; html: string } | { kind: 'product'; slug: string };

export function renderMarkdown(md: string): Block[] {
  const out: Block[] = [];
  let buf: string[] = [], list: string[] = [], cards: [string, string][] = [];
  const flushP = () => { if (buf.length) out.push({ kind: 'html', html: `<p>${inline(buf.join(' '))}</p>` }); buf = []; };
  const flushL = () => {
    if (list.length) out.push({ kind: 'html', html: `<ul>${list.map((l) => `<li>${inline(l)}</li>`).join('')}</ul>` }); list = [];
    if (cards.length) out.push({ kind: 'html', html: `<div class="skin">${cards.map(([t, d]) => `<div><b>${inline(t)}</b>${inline(d)}</div>`).join('')}</div>` }); cards = [];
  };
  for (const raw of md.replace(/\r/g, '').split('\n')) {
    const l = raw.trim();
    const prod = l.match(/^\[prodotto:([a-z0-9-]+)\]$/i);
    if (!l) { flushP(); flushL(); continue; }
    if (prod) { flushP(); flushL(); out.push({ kind: 'product', slug: prod[1] }); continue; }
    const card = l.match(/^\[\[([^|\]]+)\|([^\]]+)\]\]$/);
    if (card) { flushP(); if (list.length) { const c = cards; cards = []; flushL(); cards = c; } cards.push([card[1].trim(), card[2].trim()]); continue; }
    if (l.startsWith('### ')) { flushP(); flushL(); out.push({ kind: 'html', html: `<h3>${inline(l.slice(4))}</h3>` }); continue; }
    if (l.startsWith('## ')) { flushP(); flushL(); out.push({ kind: 'html', html: `<h2>${inline(l.slice(3))}</h2>` }); continue; }
    if (/^[-*] /.test(l)) { flushP(); list.push(l.slice(2)); continue; }
    flushL(); buf.push(l);
  }
  flushP(); flushL();
  return out;
}

export const headings = (md: string) => md.split('\n').filter((l) => l.trim().startsWith('## ')).map((l) => l.trim().slice(3));
