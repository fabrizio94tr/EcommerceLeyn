import type { Metadata, Viewport } from 'next';
import { Bodoni_Moda, Manrope } from 'next/font/google';
import './globals.css';
import { SITE_URL } from '@/lib/env';

const bodoni = Bodoni_Moda({ subsets: ['latin'], weight: ['500', '600', '700'], variable: '--font-bodoni', display: 'swap' });
const manrope = Manrope({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'], variable: '--font-manrope', display: 'swap' });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: 'Alana Beauty · Abbigliamento donna e cosmetici', template: '%s · Alana Beauty' },
  description: 'Abiti, maglieria e cosmetici selezionati. Spedizione gratuita sopra 49 €, resi e cambi entro 14 giorni.',
  openGraph: { type: 'website', locale: 'it_IT', siteName: 'Alana Beauty' },
  alternates: { canonical: '/' }
};
export const viewport: Viewport = { themeColor: '#0F0E10' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" className={`${bodoni.variable} ${manrope.variable}`}>
      <body>{children}</body>
    </html>
  );
}
