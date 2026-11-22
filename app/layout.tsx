import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import { SITE_URL } from '@/lib/env';

// Font ospitati nel progetto (licenza OFL): nessun download da Google durante la build.
const bodoni = localFont({
  src: [{ path: './fonts/bodoni-moda-latin-wght-normal.woff2', weight: '400 900' }],
  variable: '--font-bodoni', display: 'swap', fallback: ['Didot', 'Georgia', 'serif']
});
const manrope = localFont({
  src: [{ path: './fonts/manrope-latin-wght-normal.woff2', weight: '200 800' }],
  variable: '--font-manrope', display: 'swap', fallback: ['system-ui', 'sans-serif']
});

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
