import Link from 'next/link';
import { Logo } from './Logo';
import { Newsletter } from './Newsletter';
import { STORE_LEGAL } from '@/lib/env';

const SOC: [string, string][] = [['instagram_url', 'IG'], ['tiktok_url', 'TT'], ['facebook_url', 'FB']];

export function Footer({ pct, news = true, social = {} }: { pct: number; news?: boolean; social?: Record<string, string | null | undefined> }) {
  const links = SOC.filter(([k]) => social[k]);
  return (
    <>
      {news && <Newsletter pct={pct} />}
      <footer className="ft"><div className="wrap">
        <div className="g">
          <div className="fl"><Logo /><span>Abbigliamento donna e cosmetici selezionati. Spedizioni in tutta Italia.</span>
            {links.length > 0 && <span className="soc">{links.map(([k, l]) => <a key={k} href={social[k]!} target="_blank" rel="noopener" aria-label={l === 'IG' ? 'Instagram' : l === 'TT' ? 'TikTok' : 'Facebook'}><i>{l}</i></a>)}</span>}</div>
          <div><b>Shop</b><Link href="/abbigliamento">Abbigliamento</Link><Link href="/cosmetici">Cosmetici</Link><Link href="/novita">Novità</Link><Link href="/promo">Promo</Link><Link href="/blog">Beauty blog</Link></div>
          <div><b>Aiuto</b><Link href="/spedizioni-e-resi">Spedizioni e resi</Link><Link href="/account">Il mio account</Link><Link href="/contatti">Contatti</Link></div>
          <div><b>Legale</b><Link href="/condizioni-di-vendita">Condizioni di vendita</Link><Link href="/privacy">Privacy policy</Link><Link href="/cookie-policy">Cookie policy</Link></div>
        </div>
        <div className="pay"><span>Visa</span><span>Mastercard</span><span>Apple Pay</span><span>Google Pay</span><span>PayPal</span></div>
        <div className="bt">{STORE_LEGAL}</div>
      </div></footer>
    </>
  );
}
