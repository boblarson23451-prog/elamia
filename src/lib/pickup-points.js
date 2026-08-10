/**
 * ELALAMIA pickup points ("points relais") — one per wilaya.
 *
 * ⚠️ THE ADDRESSES BELOW ARE PLACEHOLDERS. They are deliberately generic
 * (city centre references) rather than invented business names or street
 * numbers, so nobody is sent to a real address that has nothing to do with
 * you. Before going live you MUST replace each `address_fr` / `address_ar`
 * with the real partner location you've contracted in that wilaya, and
 * update the phone numbers.
 *
 * Schema note: pickup points live in code rather than the DB because they
 * change rarely and are the same for every deployment. If you later want
 * admins to edit them in the dashboard, move this into a `pickup_points`
 * table — the rest of the app only depends on `getPickupPointsForWilaya()`.
 */

const WILAYA_CITIES = [
  ["01", "Adrar", "أدرار"], ["02", "Chlef", "الشلف"], ["03", "Laghouat", "الأغواط"],
  ["04", "Oum El Bouaghi", "أم البواقي"], ["05", "Batna", "باتنة"], ["06", "Béjaïa", "بجاية"],
  ["07", "Biskra", "بسكرة"], ["08", "Béchar", "بشار"], ["09", "Blida", "البليدة"],
  ["10", "Bouira", "البويرة"], ["11", "Tamanrasset", "تمنراست"], ["12", "Tébessa", "تبسة"],
  ["13", "Tlemcen", "تلمسان"], ["14", "Tiaret", "تيارت"], ["15", "Tizi Ouzou", "تيزي وزو"],
  ["16", "Alger", "الجزائر"], ["17", "Djelfa", "الجلفة"], ["18", "Jijel", "جيجل"],
  ["19", "Sétif", "سطيف"], ["20", "Saïda", "سعيدة"], ["21", "Skikda", "سكيكدة"],
  ["22", "Sidi Bel Abbès", "سيدي بلعباس"], ["23", "Annaba", "عنابة"], ["24", "Guelma", "قالمة"],
  ["25", "Constantine", "قسنطينة"], ["26", "Médéa", "المدية"], ["27", "Mostaganem", "مستغانم"],
  ["28", "M'Sila", "المسيلة"], ["29", "Mascara", "معسكر"], ["30", "Ouargla", "ورقلة"],
  ["31", "Oran", "وهران"], ["32", "El Bayadh", "البيض"], ["33", "Illizi", "إليزي"],
  ["34", "Bordj Bou Arréridj", "برج بوعريريج"], ["35", "Boumerdès", "بومرداس"],
  ["36", "El Tarf", "الطارف"], ["37", "Tindouf", "تندوف"], ["38", "Tissemsilt", "تيسمسيلت"],
  ["39", "El Oued", "الوادي"], ["40", "Khenchela", "خنشلة"], ["41", "Souk Ahras", "سوق أهراس"],
  ["42", "Tipaza", "تيبازة"], ["43", "Mila", "ميلة"], ["44", "Aïn Defla", "عين الدفلى"],
  ["45", "Naâma", "النعامة"], ["46", "Aïn Témouchent", "عين تموشنت"], ["47", "Ghardaïa", "غرداية"],
  ["48", "Relizane", "غليزان"], ["49", "Timimoun", "تيميمون"],
  ["50", "Bordj Badji Mokhtar", "برج باجي مختار"], ["51", "Ouled Djellal", "أولاد جلال"],
  ["52", "Béni Abbès", "بني عباس"], ["53", "In Salah", "عين صالح"], ["54", "In Guezzam", "عين قزام"],
  ["55", "Touggourt", "تقرت"], ["56", "Djanet", "جانت"], ["57", "El M'Ghair", "المغير"],
  ["58", "El Meniaa", "المنيعة"],
];

export const PICKUP_POINTS = WILAYA_CITIES.map(([code, fr, ar]) => ({
  id: `pp-${code}`,
  wilaya_code: code,
  wilaya_fr: `${code} - ${fr}`,
  name_fr: `Point Relais ELALAMIA — ${fr}`,
  name_ar: `نقطة استلام إيلعلامية — ${ar}`,
  // PLACEHOLDER — replace with the real partner address before launch.
  address_fr: `Centre-ville de ${fr}, wilaya de ${fr} (adresse exacte à confirmer)`,
  address_ar: `وسط مدينة ${ar}، ولاية ${ar} (العنوان الدقيق قيد التأكيد)`,
  phone: null,
  hours_fr: "Sam–Jeu, 09:00–17:00",
  hours_ar: "السبت–الخميس، 09:00–17:00",
}));

export function getPickupPointsForWilaya(wilaya) {
  const code = String(wilaya || "").trim().slice(0, 2);
  return PICKUP_POINTS.filter((p) => p.wilaya_code === code);
}

export function getPickupPointById(id) {
  return PICKUP_POINTS.find((p) => p.id === id) || null;
}
