import { supabaseAdmin } from '@/lib/supabase/admin';
import { Top } from '@/components/admin/Top';
import { BannerForm, BannerRow, CouponForm, CouponRow, NewToggle, SettingsForm } from '@/components/admin/Promo';
import type { Coupon, Settings } from '@/lib/types';

export default async function Promo() {
  const sb = supabaseAdmin();
  const [{ data: s }, { data: coupons }, { data: banners }, { count: subs }, { data: welcome }] = await Promise.all([
    sb.from('settings').select('*').eq('id', 1).single(),
    sb.from('coupons').select('*').eq('is_welcome', false).order('created_at', { ascending: false }),
    sb.from('banners').select('*').order('sort'),
    sb.from('newsletter_subscribers').select('id', { count: 'exact', head: true }).is('unsubscribed_at', null),
    sb.from('coupons').select('usage_count').eq('is_welcome', true)
  ]);
  const welcomeUsed = (welcome ?? []).filter((w) => w.usage_count > 0).length;
  return (
    <>
      <Top title="Promozioni e coupon" sub="Sconti, coupon di benvenuto, spedizioni e cosa appare in home" />
      <div className="row2 eq">
        <div className="pane"><h2>Coupon</h2>
          {(coupons ?? []).map((c) => <CouponRow key={c.id} c={c as Coupon} />)}
          {!coupons?.length && <p className="note">Nessun coupon ancora.</p>}
          <NewToggle label="+ Nuovo coupon"><CouponForm /></NewToggle>
        </div>
        <div className="stack">
          <div className="pane"><h2>Spedizioni e impostazioni</h2><SettingsForm s={s as Settings} /></div>
          <div className="pane"><h2>Newsletter e coupon di benvenuto</h2>
            <p className="note">Chi si iscrive riceve in automatico un codice personale di {s?.welcome_discount_percent}% valido una volta.</p>
            <div className="kpis" style={{ gridTemplateColumns: '1fr 1fr' }}><div className="kpi"><span>Iscritte</span><b>{subs ?? 0}</b></div><div className="kpi"><span>Coupon di benvenuto usati</span><b>{welcomeUsed}</b></div></div>
            <a className="b g" href="/admin/export/newsletter" style={{ alignSelf: 'flex-start' }}>Scarica l&apos;elenco (CSV)</a>
          </div>
        </div>
      </div>
      <div className="pane"><h2>Home: banner <small>il primo è il banner grande in alto, il secondo la fascia promo</small></h2>
        {(banners ?? []).map((b) => <BannerRow key={b.id} b={b} />)}
        <NewToggle label="+ Nuovo banner"><BannerForm /></NewToggle>
        <p className="note">Le vetrine &quot;Novità&quot; si riempiono da sole con gli ultimi prodotti; &quot;Più amati&quot; e &quot;In evidenza&quot; mostrano i prodotti con l&apos;opzione &quot;In evidenza in home&quot; attiva.</p>
      </div>
    </>
  );
}
