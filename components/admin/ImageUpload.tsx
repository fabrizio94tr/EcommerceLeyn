'use client';
import { useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase/client';

export type Img = { url: string; alt?: string };

/** Carica le foto nello storage Supabase (cartella media/) e restituisce gli indirizzi pubblici. */
export async function uploadFiles(files: FileList | File[], folder: string) {
  const sb = supabaseBrowser();
  const out: string[] = [];
  for (const f of Array.from(files)) {
    if (!f.type.startsWith('image/')) continue;
    if (f.size > 6 * 1024 * 1024) { alert(`${f.name} supera 6 MB: riducila prima di caricarla.`); continue; }
    const ext = (f.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
    const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await sb.storage.from('media').upload(path, f, { cacheControl: '31536000', contentType: f.type });
    if (error) { alert(`Caricamento non riuscito: ${f.name}`); continue; }
    out.push(sb.storage.from('media').getPublicUrl(path).data.publicUrl);
  }
  return out;
}

export function ImagesField({ initial, name = 'images', folder = 'prodotti' }: { initial: Img[]; name?: string; folder?: string }) {
  const [imgs, setImgs] = useState<Img[]>(initial);
  const [busy, setBusy] = useState(false);
  const move = (i: number) => setImgs((cur) => { if (i === 0) return cur; const n = [...cur]; [n[i - 1], n[i]] = [n[i], n[i - 1]]; return n; });
  return (
    <>
      <input type="hidden" name={name} value={JSON.stringify(imgs)} />
      <div className="thumbs">
        {imgs.map((im, i) => (
          <div className="th" key={im.url}><img src={im.url} alt="" />
            {i > 0 && <button type="button" className="mv" title="Sposta prima" onClick={() => move(i)}>←</button>}
            <button type="button" title="Togli" onClick={() => setImgs((c) => c.filter((x) => x.url !== im.url))}>✕</button></div>
        ))}
        <label>{busy ? 'Carico…' : '+ Aggiungi foto'}<input type="file" accept="image/*" multiple disabled={busy} onChange={async (e) => {
          if (!e.target.files?.length) return; setBusy(true);
          const urls = await uploadFiles(e.target.files, folder); setImgs((c) => [...c, ...urls.map((url) => ({ url }))]); setBusy(false); e.target.value = '';
        }} /></label>
      </div>
      <small className="note">La prima foto è quella di copertina. Formato consigliato verticale 4:5, almeno 1200 px di altezza.</small>
    </>
  );
}

export function SingleImage({ name, initial, folder = 'banner' }: { name: string; initial?: string | null; folder?: string }) {
  const [url, setUrl] = useState(initial || '');
  const [busy, setBusy] = useState(false);
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <input type="hidden" name={name} value={url} />
      {url ? <img src={url} alt="" style={{ width: 120, height: 75, objectFit: 'cover' }} /> : null}
      <label className="b g" style={{ cursor: 'pointer' }}>{busy ? 'Carico…' : url ? 'Cambia immagine' : 'Carica immagine'}<input type="file" accept="image/*" hidden onChange={async (e) => {
        if (!e.target.files?.length) return; setBusy(true); const [u] = await uploadFiles(e.target.files, folder); if (u) setUrl(u); setBusy(false);
      }} /></label>
    </div>
  );
}
