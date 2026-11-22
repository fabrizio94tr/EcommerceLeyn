import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { LEGAL } from '@/lib/legal';
import { renderMarkdown } from '@/lib/markdown';

type Props = { params: Promise<{ legal: string }> };
export const dynamicParams = false;
export function generateStaticParams() { return Object.keys(LEGAL).map((legal) => ({ legal })); }
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const l = LEGAL[(await params).legal];
  return l ? { title: l.title, alternates: { canonical: `/${(await params).legal}` } } : {};
}

export default async function Legal({ params }: Props) {
  const l = LEGAL[(await params).legal];
  if (!l) notFound();
  return (
    <div className="wrap"><article className="prose">
      <h1>{l.title}</h1>
      {renderMarkdown(l.body).map((b, i) => b.kind === 'html' ? <div key={i} dangerouslySetInnerHTML={{ __html: b.html }} /> : null)}
    </article></div>
  );
}
