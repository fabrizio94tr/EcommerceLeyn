-- Toglie il catalogo DIMOSTRATIVO (prodotti, banner e articoli di esempio). Le categorie restano.
begin;
delete from public.products where slug in ('top-nero', 'cappotto', 'poncho', 'jeans', 'felpa', 'bomber', 'camicia-righe', 'tuta', 'pantalone-righe', 'abito-bianco', 'abito-viola', 'abito-rosso', 'abito-floreale', 'trench', 'pantalone-rosa', 'abito-pizzo', 'smalto', 'pennelli', 'balsamo', 'olio-corpo', 'detergente', 'tonico', 'crema', 'palette', 'illuminante', 'siero-viso', 'rossetto', 'siero-vitc');
delete from public.banners where image_url like 'https://images.unsplash.com/%';
delete from public.blog_posts where slug in ('abiti-di-stagione-come-abbinarli', 'trucco-occhi-luminoso-in-5-minuti', 'come-scegliere-la-crema-giusta');
delete from public.coupons where code = 'SKIN20' and usage_count = 0;
commit;
