# Alana Beauty · e-commerce

Negozio online di abbigliamento donna e cosmetici (alanabeauty.it), stile grafico **Noir Editorial** approvato dalla cliente.
Next.js 15 + Supabase (database, accessi, foto) + Vercel. Pagamenti Stripe (carte, Apple Pay, Google Pay) e PayPal.

## Cosa c'è (contratto CTR-2026-LAYNE-01, Parte I)

| Contratto | Dove |
|---|---|
| Due macro-categorie con sottocategorie, filtri e ricerca | `/abbigliamento`, `/cosmetici`, `/cerca`, pannello › Categorie |
| Varianti taglia e colore con giacenza per variante | scheda prodotto, pannello › Prodotti |
| Schede cosmetici con INCI, formato, modo d'uso | scheda prodotto (+ PAO, origine, persona responsabile UE) |
| Promozioni: coupon, sconti, prodotti in evidenza in home | pannello › Promozioni e coupon, opzione "In evidenza" |
| Carrello e checkout anche come ospite | `/carrello`, `/checkout` |
| Stripe (carte, Apple Pay, Google Pay) e PayPal | `lib/stripe.ts`, `lib/paypal.ts`, `app/api/*` |
| Spedizione a tariffa fissa con soglia gratuita configurabile | pannello › Promozioni › Spedizioni |
| Email automatiche: conferma ordine e spedizione | `lib/email.ts` (Resend) |
| Area cliente con storico ordini e indirizzi | `/account` |
| Pannello per prodotti, ordini, giacenze, coupon | `/admin` |
| SEO di base: meta tag, sitemap, URL puliti, dati strutturati | `generateMetadata`, `app/sitemap.ts`, JSON-LD Product |
| Privacy, cookie policy, condizioni di vendita, cookie banner | `lib/legal.ts` (testi DA VERIFICARE con la titolare) |
| Lista d'attesa "Avvisami" con consenso | scheda prodotto; email automatica al rifornimento |
| Alert scorte minime | soglia per variante, email alla titolare |
| Import massivo CSV/Excel | pannello › Magazzino (con anteprima e modello) |
| Resi e cambi dall'area cliente | `/account` › I miei ordini; pannello › Resi e cambi |
| Wishlist | cuore sui prodotti, `/account?tab=preferiti` |
| Coupon di benvenuto con la newsletter | codice personale automatico via email |
| Blog con SEO | `/blog`, pannello › Blog |
| Dashboard vendite e margini | pannello › Panoramica (margini dal costo d'acquisto) |

Le funzioni dell'Allegato A (opzionali) **non** sono incluse: niente badge "ultimi pezzi/esaurito", recensioni, guida taglie,
barra spedizione gratuita, prodotti correlati, carrello abbandonato, ecc.

## Avvio in locale

```bash
npm install
npx supabase start            # serve Docker; applica supabase/migrations
cp .env.example .env.local    # e incolla URL e chiavi stampate da "supabase start"
psql "$DB_URL" -f supabase/demo/demo-seed.sql       # catalogo di esempio (foto Unsplash)
npm run dev
```
Registrati su http://localhost:3000/registrati, poi: `node --env-file=.env.local scripts/make-admin.mjs tua@email.it`.

## Messa online

1. **Supabase**: crea il progetto (regione Francoforte), poi applica la migrazione `supabase/migrations/20261122000000_init.sql`
   (`npx supabase link --project-ref …` e `npx supabase db push`, oppure SQL editor).
   - Authentication › URL configuration: Site URL `https://alanabeauty.it`, Redirect URL `https://alanabeauty.it/auth/callback`
     (aggiungi anche l'indirizzo `*.vercel.app` per le anteprime).
   - Authentication › Email: lascia **attiva la conferma email** (serve per collegare all'account gli ordini fatti come ospite).
   - Authentication › SMTP: imposta lo SMTP di Resend, altrimenti Supabase invia pochissime email l'ora.
   - Traduci in italiano i modelli email di Supabase (conferma registrazione, recupero password).
2. **Vercel**: importa il repository, imposta le variabili di `.env.example`, collega il dominio `alanabeauty.it`.
3. **Stripe**: chiavi live in `STRIPE_SECRET_KEY`; webhook `https://alanabeauty.it/api/stripe/webhook` con gli eventi
   `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.expired` → `STRIPE_WEBHOOK_SECRET`.
   Attiva Apple Pay e Google Pay in Settings › Payment methods e verifica il dominio per Apple Pay.
4. **PayPal**: app REST live su developer.paypal.com → `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_ENV=live`.
5. **Resend**: verifica il dominio alanabeauty.it (record DNS) → `RESEND_API_KEY`, `EMAIL_FROM`, `ADMIN_EMAIL`.
6. Crea l'account di Layne dal sito e rendilo amministratore con `scripts/make-admin.mjs`.
7. Carica categorie e prodotti veri (o importa da Excel). Il catalogo dimostrativo si toglie con `supabase/demo/demo-remove.sql`
   (SQL editor di Supabase); si rigenera con `node scripts/make-demo-seed.mjs`.

## Note tecniche

- Importi sempre in centesimi; i prezzi del carrello sono ricalcolati sul server a ogni passaggio.
- `mark_order_paid` (SQL) scala il magazzino ed è idempotente: webhook, ritorno PayPal e pagina di conferma possono chiamarla senza doppi addebiti di stock o email doppie.
- Tutte le tabelle hanno Row Level Security; le scritture "pubbliche" (ordini, newsletter, lista d'attesa) passano da azioni server con la chiave di servizio.
- I mockup delle 4 proposte grafiche sono in `design/` (PDF e sorgenti).
