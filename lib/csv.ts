export const csvCell = (v: unknown) => {
  let s = v == null ? '' : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`; // evita formule quando si apre in Excel
  return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
export const csv = (rows: unknown[][]) => '﻿' + rows.map((r) => r.map(csvCell).join(';')).join('\n');
