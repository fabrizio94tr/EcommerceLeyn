import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { Top } from '@/components/admin/Top';
import { PostEditor } from '@/components/admin/PostEditor';
import type { BlogPost } from '@/lib/types';

export default async function EditPost({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (id === 'nuovo') return <><Top title="Nuovo articolo" sub="Blog › Nuovo" /><PostEditor /></>;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const { data } = await supabaseAdmin().from('blog_posts').select('*').eq('id', id).maybeSingle();
  if (!data) notFound();
  return <><Top title={data.title} sub="Blog › Modifica" /><PostEditor p={data as BlogPost} /></>;
}
