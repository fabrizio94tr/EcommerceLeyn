'use client';
import { useActionState, useState, useTransition } from 'react';
import { deletePost, savePost } from '@/app/admin/actions';
import { Note, Save } from './forms';
import { SingleImage, uploadFiles } from './ImageUpload';
import type { BlogPost } from '@/lib/types';

export function PostEditor({ p }: { p?: BlogPost }) {
  const [st, action] = useActionState(savePost, null);
  const [title, setTitle] = useState(p?.seo_title || p?.title || '');
  const [desc, setDesc] = useState(p?.seo_description || p?.excerpt || '');
  const [slug, setSlug] = useState(p?.slug || '');
  const [body, setBody] = useState(p?.body || '## Primo paragrafo\nScrivi qui il testo.\n\n[prodotto:slug-del-prodotto]');
  const [pending, start] = useTransition();
  const insertImage = async (files: FileList | null) => {
    if (!files?.length) return;
    const [u] = await uploadFiles(files, 'blog');
    if (u) setBody((b) => `${b}\n\n![](${u})\n`);
  };
  return (
    <form action={action}>
      {p && <input type="hidden" name="id" value={p.id} />}
      <div className="row2">
        <div className="stack">
          <div className="pane"><h2>Articolo</h2>
            <label className="f">Titolo<input name="title" required defaultValue={p?.title} onChange={(e) => !p?.seo_title && setTitle(e.target.value)} /></label>
            <div className="grid2"><label className="f">Categoria<input name="category" defaultValue={p?.category || ''} placeholder="Skincare, Make-up, Stile…" /></label><label className="f">Indirizzo (slug)<input name="slug" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="si crea dal titolo" /></label></div>
            <label className="f">Riassunto (sotto il titolo e nelle anteprime)<textarea name="excerpt" defaultValue={p?.excerpt || ''} rows={2} /></label>
            <div className="f">Immagine di copertina<SingleImage name="cover_url" initial={p?.cover_url} folder="blog" /></div>
            <label className="f">Testo<textarea className="tall" name="body" value={body} onChange={(e) => setBody(e.target.value)} />
              <small>## Titolo paragrafo · ### Sottotitolo · - elenco · **grassetto** · [testo](link) · una riga [prodotto:slug] mostra un prodotto del negozio.</small></label>
            <label className="b g" style={{ alignSelf: 'flex-start', cursor: 'pointer' }}>+ Inserisci una foto nel testo<input type="file" accept="image/*" hidden onChange={(e) => insertImage(e.target.files)} /></label>
          </div>
        </div>
        <div className="stack">
          <div className="pane"><h2>SEO <small>come appare su Google</small></h2>
            <label className="f">Titolo SEO<input name="seo_title" maxLength={70} value={title} onChange={(e) => setTitle(e.target.value)} /><small>{title.length} caratteri su 60</small></label>
            <label className="f">Meta description<textarea name="seo_description" maxLength={170} value={desc} onChange={(e) => setDesc(e.target.value)} /><small>{desc.length} caratteri su 155</small></label>
            <div className="seo"><div className="u">alanabeauty.it › blog › {slug || 'indirizzo-articolo'}</div><div className="t">{title || 'Titolo dell\'articolo'} · Alana Beauty</div>{desc || 'La descrizione che appare sotto il titolo su Google.'}</div>
          </div>
          <div className="pane"><h2>Pubblicazione</h2>
            <label className="tgl"><span>Pubblicato<small>{p?.published_at ? `dal ${new Date(p.published_at).toLocaleDateString('it-IT')}` : 'visibile sul sito'}</small></span><input type="checkbox" name="published" defaultChecked={p?.published} /></label>
            <label className="tgl"><span>Mostra in home<small>Sezione &quot;Beauty blog&quot;</small></span><input type="checkbox" name="show_home" defaultChecked={p ? p.show_home : true} /></label>
          </div>
          <Note s={st} /><Save>Salva articolo</Save>
          {p && <button type="button" className="b g" disabled={pending} onClick={() => confirm('Eliminare l\'articolo?') && start(() => deletePost(p.id))}>Elimina</button>}
        </div>
      </div>
    </form>
  );
}
