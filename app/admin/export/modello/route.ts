import { requireAdmin } from '@/lib/auth';

const HEAD = 'tipo;nome;categoria;descrizione;prezzo;prezzo_pieno;costo;sku;taglia;colore;colore_hex;formato;giacenza;scorta_minima;tessuto;vestibilita;lavaggio;inci;modo_uso;avvertenze;pao_mesi;origine;responsabile_ue;foto;pubblicato;in_evidenza';
const ROWS = [
  'abbigliamento;Abito midi con cintura;abiti;Abito midi a portafoglio con cintura.;64,90;79,90;31,00;AB-MIDI-ROS-S;S;Rosso;#C42430;;4;2;100% viscosa;Regolare;30° delicato;;;;;;;;si;si',
  'abbigliamento;Abito midi con cintura;abiti;;64,90;79,90;31,00;AB-MIDI-ROS-M;M;Rosso;#C42430;;6;2;;;;;;;;;;;si;si',
  'cosmetico;Siero illuminante vitamina C;viso;Siero leggero con vitamina C.;29,90;;12,40;SV-VITC-30;;;;30 ml;18;3;;;;Aqua, Glycerin, Ascorbyl Glucoside;3-4 gocce mattina e sera;Solo uso esterno;12;Regno Unito;Nome Srl, Via …, Milano;;si;no'
];

export async function GET() {
  await requireAdmin();
  return new Response('﻿' + [HEAD, ...ROWS].join('\n'), { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="modello-import-prodotti.csv"' } });
}
