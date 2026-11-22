'use client';
import Image from 'next/image';
import { useState } from 'react';
import type { ProductImage } from '@/lib/types';

export function Gallery({ images, name }: { images: ProductImage[]; name: string }) {
  const [i, setI] = useState(0);
  const cur = images[i];
  return (
    <div className={`gal${images.length > 1 ? '' : ' one'}`}>
      {images.length > 1 && <div className="th">{images.map((im, k) => (
        <button key={im.id} type="button" onClick={() => setI(k)} aria-label={`Foto ${k + 1}`}>
          <Image className={k === i ? 'on' : ''} src={im.url} alt="" width={88} height={110} style={{ objectFit: 'cover' }} />
        </button>))}</div>}
      <div className="main">
        {cur && <Image src={cur.url} alt={cur.alt || name} fill priority sizes="(max-width:600px) 100vw, 55vw" style={{ objectFit: 'cover' }} />}
        {images.length > 1 && <span className="gdots">{images.map((im, k) => <i key={im.id} className={k === i ? 'on' : ''} onClick={() => setI(k)} />)}</span>}
      </div>
    </div>
  );
}
