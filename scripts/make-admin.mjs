// Rende amministratrice un account già registrato sul sito.
// Uso: node --env-file=.env.local scripts/make-admin.mjs email@esempio.it
import { createClient } from '@supabase/supabase-js';

const email = (process.argv[2] || '').trim().toLowerCase();
if (!email) { console.error('Indica l\'email: node scripts/make-admin.mjs email@esempio.it'); process.exit(1); }
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const { data, error } = await sb.auth.admin.listUsers({ perPage: 1000 });
if (error) throw error;
const u = data.users.find((x) => x.email?.toLowerCase() === email);
if (!u) { console.error('Nessun account con questa email: prima registrati sul sito.'); process.exit(1); }
await sb.from('profiles').upsert({ id: u.id, role: 'admin' });
await sb.from('settings').update({ admin_email: email }).eq('id', 1).is('admin_email', null);
console.log(`${email} ora è amministratrice.`);
