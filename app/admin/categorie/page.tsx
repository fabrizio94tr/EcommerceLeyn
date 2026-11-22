import { supabaseAdmin } from '@/lib/supabase/admin';
import { Top } from '@/components/admin/Top';
import { CategoryForm } from '@/components/admin/Promo';

export default async function Categories() {
  const { data } = await supabaseAdmin().from('categories').select('*').order('sort').order('name');
  return (
    <>
      <Top title="Categorie" sub="Le sottocategorie delle due sezioni del negozio. Compaiono come filtri in alto nella pagina." />
      <div className="row2 eq">
        {(['abbigliamento', 'cosmetici'] as const).map((m) => (
          <div className="pane" key={m}><h2 style={{ textTransform: 'capitalize' }}>{m}</h2>
            {(data ?? []).filter((c) => c.macro === m).map((c) => <CategoryForm key={c.id} c={c} />)}
            <h2 style={{ marginTop: 10 }}>Nuova categoria</h2><CategoryForm macro={m} />
          </div>
        ))}
      </div>
    </>
  );
}
