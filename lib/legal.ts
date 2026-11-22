// Testi legali di partenza. ATTENZIONE: vanno verificati e approvati dalla titolare (o dal suo consulente),
// che resta titolare del trattamento (contratto, art. 13.2). Le parti tra [ ] sono da completare.
export const SELLER = {
  name: 'Alana Beauty di Victoria Molina Layne',
  address: 'Via Ernesto Basile 124, 00128 Roma (RM)',
  vat: '18656601004',
  pec: 'victoriamolinalayne@pec.it',
  email: '[info@alanabeauty.it]'
};

export const LEGAL: Record<string, { title: string; body: string }> = {
  'condizioni-di-vendita': { title: 'Condizioni di vendita', body: `
## 1. Venditore
Il sito alanabeauty.it è gestito da ${SELLER.name}, ${SELLER.address}, P. IVA ${SELLER.vat}, PEC ${SELLER.pec}, email ${SELLER.email}.

## 2. Prodotti e prezzi
I prezzi sono in euro e comprendono l'IVA. Il costo di spedizione è indicato nel carrello prima del pagamento. Le foto sono il più possibile fedeli ai prodotti; piccole differenze di colore dipendono dallo schermo.

## 3. Ordine e pagamento
Il contratto si conclude quando ricevi l'email di conferma dell'ordine. Puoi pagare con carta di credito o debito, Apple Pay, Google Pay (tramite Stripe) o PayPal. Non conserviamo i dati della tua carta.

## 4. Spedizione
Spediamo solo in Italia con corriere espresso, di solito in 24/48 ore lavorative dalla conferma. Il codice di tracking arriva per email.

## 5. Diritto di recesso
Hai 14 giorni dalla consegna per recedere dall'acquisto senza dare spiegazioni (artt. 52 e seguenti del Codice del Consumo). Puoi chiederlo dalla tua area cliente o scrivendo a ${SELLER.email}. I prodotti vanno restituiti integri, con etichette e confezione originale. Il rimborso arriva entro 14 giorni dalla ricezione del reso, con lo stesso metodo di pagamento. [Costo della spedizione di reso: a carico della cliente / gratuito].

Per motivi igienici il recesso è escluso per i cosmetici sigillati aperti dopo la consegna (art. 59, lett. e, Codice del Consumo).

## 6. Cambi
Puoi chiedere il cambio di taglia o colore dall'area cliente entro 14 giorni dalla consegna, se il prodotto è disponibile.

## 7. Garanzia legale
I prodotti sono coperti dalla garanzia legale di conformità di 24 mesi (artt. 128 e seguenti del Codice del Consumo).

## 8. Cosmetici
I cosmetici sono conformi al Regolamento CE 1223/2009: in etichetta trovi la persona responsabile nell'Unione Europea, gli ingredienti e le avvertenze in italiano.

## 9. Risoluzione delle controversie
Per i reclami scrivi a ${SELLER.email}. Puoi anche usare la piattaforma europea ODR: https://ec.europa.eu/consumers/odr. Foro competente: quello di residenza della consumatrice.
` },
  privacy: { title: 'Informativa privacy', body: `
## Titolare del trattamento
${SELLER.name}, ${SELLER.address}, P. IVA ${SELLER.vat}, PEC ${SELLER.pec}.

## Quali dati trattiamo e perché
- **Ordini:** nome, indirizzo, email, telefono e prodotti acquistati, per gestire e spedire l'ordine e per gli obblighi fiscali (base giuridica: contratto e obbligo di legge). Conservazione: 10 anni.
- **Account cliente:** email, nome, indirizzi salvati, preferiti, storico ordini e resi, finché mantieni l'account.
- **Newsletter e coupon di benvenuto:** email, solo con il tuo consenso, fino alla revoca.
- **Avviso "torna disponibile":** email e prodotto richiesto, solo con il tuo consenso, fino all'invio dell'avviso.

## Chi riceve i dati
Fornitori che ci aiutano a far funzionare il negozio, nominati responsabili del trattamento: hosting e database (Vercel, Supabase), pagamenti (Stripe, PayPal), invio email (Resend), corriere [nome]. Alcuni fornitori possono trattare dati fuori dall'UE con le garanzie previste dal GDPR (clausole contrattuali standard).

## I tuoi diritti
Puoi chiedere accesso, rettifica, cancellazione, limitazione, portabilità dei dati e opporti al trattamento scrivendo a ${SELLER.email}. Puoi revocare il consenso alla newsletter in ogni momento. Hai diritto di reclamo al Garante per la protezione dei dati personali (garanteprivacy.it).
` },
  'cookie-policy': { title: 'Cookie policy', body: `
## Cookie che usiamo
Il sito usa solo **cookie tecnici**, necessari al suo funzionamento e che non richiedono consenso:
- accesso all'area cliente (Supabase);
- carrello e preferenze, salvati nel tuo browser;
- pagamento sicuro, sulle pagine di Stripe e PayPal.

Non usiamo cookie di profilazione o pubblicitari. Se in futuro attiveremo strumenti statistici o di marketing, li useremo solo dopo il tuo consenso dal banner.

## Come gestirli
Puoi cancellare i cookie dalle impostazioni del browser. Per cambiare la scelta fatta nel banner, cancella i dati del sito: il banner comparirà di nuovo.
` },
  'spedizioni-e-resi': { title: 'Spedizioni e resi', body: `
## Spedizioni
Spediamo in tutta Italia con corriere espresso in 24/48 ore lavorative. Il costo è indicato nel carrello; sopra la soglia di spedizione gratuita non paghi nulla. Appena il pacco parte ricevi il codice di tracking via email.

## Resi e cambi
Hai 14 giorni dalla consegna per chiedere un reso o un cambio di taglia o colore.
- Accedi alla tua area cliente, apri "I miei ordini" e scegli "Richiedi reso o cambio".
- Ti scriviamo con le istruzioni per la spedizione.
- Quando riceviamo il pacco ti rimborsiamo, o ti spediamo la nuova taglia.

I cosmetici sigillati non possono essere resi se aperti, per motivi igienici.

Se hai comprato come ospite, crea un account con la stessa email usata per l'ordine: lo troverai nella tua area.
` },
  contatti: { title: 'Contatti', body: `
## Scrivici
Email: ${SELLER.email}

PEC: ${SELLER.pec}

## Dati aziendali
${SELLER.name}

${SELLER.address}

P. IVA ${SELLER.vat}
` }
};
