import { eur } from '@/lib/format';
import type { QuoteResult } from './useQuote';

export function Totals({ q }: { q: QuoteResult }) {
  return (
    <div className="tot">
      <div><span>Subtotale</span><span>{eur(q.subtotal)}</span></div>
      {q.discount > 0 && <div className="disc"><span>Sconto {q.couponCode}</span><span>- {eur(q.discount)}</span></div>}
      <div><span>Spedizione</span><span>{q.shipping ? eur(q.shipping) : 'Gratis'}</span></div>
      <div className="g"><span>Totale</span><span>{eur(q.total)}</span></div>
      <small>IVA inclusa</small>
    </div>
  );
}
