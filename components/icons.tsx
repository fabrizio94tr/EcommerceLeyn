import type { SVGProps } from 'react';

const P = (p: SVGProps<SVGSVGElement>) => ({ viewBox: '0 0 24 24', 'aria-hidden': true, ...p });
const S = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

export const I = {
  search: (p: SVGProps<SVGSVGElement>) => <svg {...P(p)}><circle cx="10.5" cy="10.5" r="6.5" {...S} /><path d="m15.5 15.5 5 5" {...S} /></svg>,
  user: (p: SVGProps<SVGSVGElement>) => <svg {...P(p)}><circle cx="12" cy="8" r="4" {...S} /><path d="M4 21c1-4 4-6 8-6s7 2 8 6" {...S} /></svg>,
  heart: (p: SVGProps<SVGSVGElement>) => <svg {...P(p)}><path d="M12 20s-7.5-4.6-9.2-9.4C1.6 7 4 4 7.2 4c2 0 3.6 1.1 4.8 2.8C13.2 5.1 14.8 4 16.8 4 20 4 22.4 7 21.2 10.6 19.5 15.4 12 20 12 20z" {...S} /></svg>,
  heartf: (p: SVGProps<SVGSVGElement>) => <svg {...P(p)}><path d="M12 20s-7.5-4.6-9.2-9.4C1.6 7 4 4 7.2 4c2 0 3.6 1.1 4.8 2.8C13.2 5.1 14.8 4 16.8 4 20 4 22.4 7 21.2 10.6 19.5 15.4 12 20 12 20z" fill="currentColor" /></svg>,
  bag: (p: SVGProps<SVGSVGElement>) => <svg {...P(p)}><path d="M5 8h14l-1 12H6z" {...S} /><path d="M9 8V6a3 3 0 0 1 6 0v2" {...S} /></svg>,
  menu: (p: SVGProps<SVGSVGElement>) => <svg {...P(p)}><path d="M3 7h18M3 12h18M3 17h18" {...S} /></svg>,
  close: (p: SVGProps<SVGSVGElement>) => <svg {...P(p)}><path d="M6 6l12 12M18 6 6 18" {...S} /></svg>,
  truck: (p: SVGProps<SVGSVGElement>) => <svg {...P(p)}><path d="M2 6h11v10H2zM13 9h4l4 4v3h-8z" {...S} strokeWidth={1.6} /><circle cx="6" cy="17.5" r="2" {...S} strokeWidth={1.6} /><circle cx="17" cy="17.5" r="2" {...S} strokeWidth={1.6} /></svg>,
  ret: (p: SVGProps<SVGSVGElement>) => <svg {...P(p)}><path d="M4 12a8 8 0 1 0 2.4-5.7M4 4v4h4" {...S} strokeWidth={1.6} /></svg>,
  lock: (p: SVGProps<SVGSVGElement>) => <svg {...P(p)}><rect x="5" y="10" width="14" height="10" rx="2" {...S} strokeWidth={1.6} /><path d="M8 10V7a4 4 0 0 1 8 0v3" {...S} strokeWidth={1.6} /></svg>,
  leaf: (p: SVGProps<SVGSVGElement>) => <svg {...P(p)}><path d="M5 19C5 10 11 5 20 4c0 9-5 15-14 15zM5 19l7-7" {...S} strokeWidth={1.6} /></svg>,
  check: (p: SVGProps<SVGSVGElement>) => <svg {...P(p)}><path d="m5 12.5 4.5 4.5L19 7.5" {...S} strokeWidth={2.2} /></svg>,
  bell: (p: SVGProps<SVGSVGElement>) => <svg {...P(p)}><path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 20a2 2 0 0 0 4 0" {...S} strokeWidth={1.7} /></svg>,
  plus: (p: SVGProps<SVGSVGElement>) => <svg {...P(p)}><path d="M12 5v14M5 12h14" {...S} /></svg>,
  minus: (p: SVGProps<SVGSVGElement>) => <svg {...P(p)}><path d="M5 12h14" {...S} /></svg>,
  filter: (p: SVGProps<SVGSVGElement>) => <svg {...P(p)}><path d="M4 6h16M7 12h10M10 18h4" {...S} /></svg>,
  chev: (p: SVGProps<SVGSVGElement>) => <svg {...P(p)}><path d="m9 6 6 6-6 6" {...S} /></svg>,
  down: (p: SVGProps<SVGSVGElement>) => <svg {...P(p)}><path d="m6 9 6 6 6-6" {...S} /></svg>,
  upload: (p: SVGProps<SVGSVGElement>) => <svg {...P(p)}><path d="M12 16V4m0 0-5 5m5-5 5 5M4 16v4h16v-4" {...S} /></svg>
};
