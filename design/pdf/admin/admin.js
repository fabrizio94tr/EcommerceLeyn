// Dashboard: barra laterale comune
function adminShell(active, title, sub, actions) {
  var I = {
    home: '<svg viewBox="0 0 24 24"><path d="M3 11 12 4l9 7v9h-6v-6H9v6H3z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
    ord: '<svg viewBox="0 0 24 24"><path d="M5 8h14l-1 12H6z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M9 8V6a3 3 0 0 1 6 0v2" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>',
    prod: '<svg viewBox="0 0 24 24"><path d="M8 3 4 6l2 4 2-1v12h8V9l2 1 2-4-4-3c-1 2-2.5 3-4 3S9 5 8 3z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>',
    cos: '<svg viewBox="0 0 24 24"><rect x="8" y="9" width="8" height="12" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M10 9V5h4v4M11 3h2" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>',
    mag: '<svg viewBox="0 0 24 24"><path d="M3 8 12 3l9 5v9l-9 5-9-5zM3 8l9 5 9-5M12 13v9" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>',
    promo: '<svg viewBox="0 0 24 24"><path d="M3 12V4h8l10 10-8 8z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><circle cx="7.5" cy="8.5" r="1.5" fill="currentColor"/></svg>',
    ret: '<svg viewBox="0 0 24 24"><path d="M4 12a8 8 0 1 0 2.4-5.7M4 4v4h4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    blog: '<svg viewBox="0 0 24 24"><path d="M5 4h10l4 4v12H5zM8 11h8M8 15h8M8 7h4" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>'
  };
  var nav = [['pan', 'home', 'Panoramica'], ['ord', 'ord', 'Ordini', '5'], ['prod', 'prod', 'Prodotti'], ['mag', 'mag', 'Magazzino', '3'], ['promo', 'promo', 'Promozioni e coupon'], ['ret', 'ret', 'Resi e cambi', '2'], ['blog', 'blog', 'Blog']];
  var s = '<aside class="sb">' + logo().replace('</span></span>', '</span><span class="tag">Gestione negozio</span></span>');
  nav.forEach(function (n, i) {
    s += '<a' + (active === n[0] ? ' class="on"' : '') + '>' + I[n[1]] + n[2] + (n[3] ? '<em>' + n[3] + '</em>' : '') + '</a>';
    if (i === 3) s += '<span class="sep"></span>';
  });
  s += '<div class="me"><i>L</i><span><b>Layne</b><br>Titolare</span></div></aside>';
  var t = '<div class="top"><div><h1>' + title + '</h1>' + (sub ? '<div class="sub">' + sub + '</div>' : '') + '</div><div class="tr">' + (actions || '') + '</div></div>';
  return { side: s, top: t };
}
function shell(active, title, sub, actions) {
  var x = adminShell(active, title, sub, actions);
  document.getElementById('sb').outerHTML = x.side;
  document.getElementById('top').outerHTML = x.top;
}
