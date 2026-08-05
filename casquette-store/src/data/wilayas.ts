import type { Wilaya } from "@/types";

/**
 * All 58 wilayas with per-wilaya shipping (DZD).
 * Prices follow the agreed bands — edit any single value freely:
 *   Alger/Blida/Boumerdès/Tipaza 400/250 · north 500–650/300–400 ·
 *   high plateaus 700–800/400–450 · northern Sahara 800–1000/450–600 ·
 *   deep south 1000–1400/600–800 (desk: null = no stopdesk agency).
 */
export const WILAYAS: Wilaya[] = [
  { code: "01", name: "Adrar", nameAr: "أدرار", shipping: { home: 1200, desk: 700 } },
  { code: "02", name: "Chlef", nameAr: "الشلف", shipping: { home: 550, desk: 300 } },
  { code: "03", name: "Laghouat", nameAr: "الأغواط", shipping: { home: 800, desk: 450 } },
  { code: "04", name: "Oum El Bouaghi", nameAr: "أم البواقي", shipping: { home: 700, desk: 400 } },
  { code: "05", name: "Batna", nameAr: "باتنة", shipping: { home: 700, desk: 400 } },
  { code: "06", name: "Béjaïa", nameAr: "بجاية", shipping: { home: 550, desk: 300 } },
  { code: "07", name: "Biskra", nameAr: "بسكرة", shipping: { home: 800, desk: 450 } },
  { code: "08", name: "Béchar", nameAr: "بشار", shipping: { home: 1000, desk: 600 } },
  { code: "09", name: "Blida", nameAr: "البليدة", shipping: { home: 400, desk: 250 } },
  { code: "10", name: "Bouira", nameAr: "البويرة", shipping: { home: 550, desk: 300 } },
  { code: "11", name: "Tamanrasset", nameAr: "تمنراست", shipping: { home: 1400, desk: 800 } },
  { code: "12", name: "Tébessa", nameAr: "تبسة", shipping: { home: 750, desk: 450 } },
  { code: "13", name: "Tlemcen", nameAr: "تلمسان", shipping: { home: 600, desk: 350 } },
  { code: "14", name: "Tiaret", nameAr: "تيارت", shipping: { home: 700, desk: 400 } },
  { code: "15", name: "Tizi Ouzou", nameAr: "تيزي وزو", shipping: { home: 550, desk: 300 } },
  { code: "16", name: "Alger", nameAr: "الجزائر", shipping: { home: 400, desk: 250 } },
  { code: "17", name: "Djelfa", nameAr: "الجلفة", shipping: { home: 800, desk: 450 } },
  { code: "18", name: "Jijel", nameAr: "جيجل", shipping: { home: 600, desk: 350 } },
  { code: "19", name: "Sétif", nameAr: "سطيف", shipping: { home: 550, desk: 300 } },
  { code: "20", name: "Saïda", nameAr: "سعيدة", shipping: { home: 700, desk: 400 } },
  { code: "21", name: "Skikda", nameAr: "سكيكدة", shipping: { home: 600, desk: 350 } },
  { code: "22", name: "Sidi Bel Abbès", nameAr: "سيدي بلعباس", shipping: { home: 550, desk: 300 } },
  { code: "23", name: "Annaba", nameAr: "عنابة", shipping: { home: 550, desk: 300 } },
  { code: "24", name: "Guelma", nameAr: "قالمة", shipping: { home: 600, desk: 350 } },
  { code: "25", name: "Constantine", nameAr: "قسنطينة", shipping: { home: 550, desk: 300 } },
  { code: "26", name: "Médéa", nameAr: "المدية", shipping: { home: 550, desk: 300 } },
  { code: "27", name: "Mostaganem", nameAr: "مستغانم", shipping: { home: 550, desk: 300 } },
  { code: "28", name: "M'Sila", nameAr: "المسيلة", shipping: { home: 700, desk: 400 } },
  { code: "29", name: "Mascara", nameAr: "معسكر", shipping: { home: 550, desk: 300 } },
  { code: "30", name: "Ouargla", nameAr: "ورقلة", shipping: { home: 900, desk: 500 } },
  { code: "31", name: "Oran", nameAr: "وهران", shipping: { home: 500, desk: 300 } },
  { code: "32", name: "El Bayadh", nameAr: "البيض", shipping: { home: 800, desk: 450 } },
  { code: "33", name: "Illizi", nameAr: "إليزي", shipping: { home: 1400, desk: 800 } },
  { code: "34", name: "Bordj Bou Arreridj", nameAr: "برج بوعريريج", shipping: { home: 600, desk: 350 } },
  { code: "35", name: "Boumerdès", nameAr: "بومرداس", shipping: { home: 400, desk: 250 } },
  { code: "36", name: "El Tarf", nameAr: "الطارف", shipping: { home: 600, desk: 350 } },
  { code: "37", name: "Tindouf", nameAr: "تندوف", shipping: { home: 1400, desk: 800 } },
  { code: "38", name: "Tissemsilt", nameAr: "تيسمسيلت", shipping: { home: 700, desk: 400 } },
  { code: "39", name: "El Oued", nameAr: "الوادي", shipping: { home: 900, desk: 500 } },
  { code: "40", name: "Khenchela", nameAr: "خنشلة", shipping: { home: 700, desk: 450 } },
  { code: "41", name: "Souk Ahras", nameAr: "سوق أهراس", shipping: { home: 650, desk: 400 } },
  { code: "42", name: "Tipaza", nameAr: "تيبازة", shipping: { home: 400, desk: 250 } },
  { code: "43", name: "Mila", nameAr: "ميلة", shipping: { home: 600, desk: 350 } },
  { code: "44", name: "Aïn Defla", nameAr: "عين الدفلى", shipping: { home: 550, desk: 300 } },
  { code: "45", name: "Naâma", nameAr: "النعامة", shipping: { home: 800, desk: 450 } },
  { code: "46", name: "Aïn Témouchent", nameAr: "عين تموشنت", shipping: { home: 550, desk: 300 } },
  { code: "47", name: "Ghardaïa", nameAr: "غرداية", shipping: { home: 900, desk: 500 } },
  { code: "48", name: "Relizane", nameAr: "غليزان", shipping: { home: 550, desk: 300 } },
  { code: "49", name: "Timimoun", nameAr: "تيميمون", shipping: { home: 1200, desk: 700 } },
  { code: "50", name: "Béni Abbès", nameAr: "بني عباس", shipping: { home: 1100, desk: 650 } },
  { code: "51", name: "Ouled Djellal", nameAr: "أولاد جلال", shipping: { home: 1000, desk: 600 } },
  { code: "52", name: "Bordj Badji Mokhtar", nameAr: "برج باجي مختار", shipping: { home: 1400, desk: null } },
  { code: "53", name: "In Salah", nameAr: "عين صالح", shipping: { home: 1300, desk: 750 } },
  { code: "54", name: "In Guezzam", nameAr: "عين قزام", shipping: { home: 1400, desk: null } },
  { code: "55", name: "Touggourt", nameAr: "تقرت", shipping: { home: 1000, desk: 600 } },
  { code: "56", name: "Djanet", nameAr: "جانت", shipping: { home: 1400, desk: 800 } },
  { code: "57", name: "El Meghaier", nameAr: "المغير", shipping: { home: 1000, desk: 600 } },
  { code: "58", name: "El Meniaa", nameAr: "المنيعة", shipping: { home: 1100, desk: 650 } },
];

const byCode = new Map(WILAYAS.map((w) => [w.code, w]));

export function findWilaya(code: string): Wilaya | null {
  return byCode.get(code) ?? null;
}
