import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { Top } from '@/components/admin/Top';
import { dateIt } from '@/lib/format';

export default async function BlogAdmin() {
  const { data } = await supabaseAdmin().from('blog_posts').select('id, title, slug, published, published_at, category').order('created_at', { ascending: false });
  return (
    <>
      <Top title="Blog" sub="Articoli con titolo, descrizione e indirizzo per Google"><Link className="b" href="/admin/blog/nuovo">+ Nuovo articolo</Link></Top>
      <div className="pane"><table className="rt"><thead><tr><th>Titolo</th><th className="hide-m">Categoria</th><th>Stato</th></tr></thead><tbody>
        {(data ?? []).map((b) => <tr key={b.id} className="rowlink"><td className="full"><Link href={`/admin/blog/${b.id}`}><b>{b.title}</b></Link></td><td className="hide-m">{b.category || '–'}</td><td><span className={`st ${b.published ? 'ok' : 'off'}`}>{b.published ? `Pubblicato${b.published_at ? ' ' + dateIt(b.published_at) : ''}` : 'Bozza'}</span></td></tr>)}
        {!data?.length && <tr><td colSpan={3} className="note">Nessun articolo.</td></tr>}
      </tbody></table></div>
    </>
  );
}
