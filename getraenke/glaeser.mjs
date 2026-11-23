/* getraenke/glaeser.mjs — Glastypen und Temperaturen.

   WOHER (QC_Mixarium_20_04_26.html): `GLASS_TYPES` (~5753), `TEMPS` (~5764),
   `glassName` / `tempName` (~6131).

   ⚠ WAS ERGÄNZT IST: die alte App führt Gläser und Temperaturen nur in VIER
   Sprachen (de, en, ru, zh); im `LANGS`-Objekt stehen sie nicht. Die Namen für
   es, fr, it, pt sind hier NEU ergänzt und in `ERGAENZT` benannt — sie sind
   nicht von Klaus gegengelesen.

   Symbole: `symbol` ist eine sprachfreie Kennung für eine Zeichnung, die der
   Kern bzw. die Oberfläche liefert. Das Emoji der alten App steht nur noch als
   `altEmoji` daneben (kein Pflichtfeld, nur für die Übernahme). */

export const SPRACHEN = Object.freeze(['de', 'en', 'ru', 'zh', 'es', 'fr', 'it', 'pt']);
/* Diese Sprachen sind in dieser Datei ergänzt, nicht aus der alten App übernommen. */
export const ERGAENZT = Object.freeze(['es', 'fr', 'it', 'pt']);

export const GLAESER = Object.freeze([
  { id: 'highball', symbol: 'glas-highball', altEmoji: '🥃', de: 'Highball', en: 'Highball', ru: 'Хайбол', zh: '高球杯', es: 'Vaso highball', fr: 'Verre highball', it: 'Highball', pt: 'Copo highball' },
  { id: 'tumbler', symbol: 'glas-tumbler', altEmoji: '🥃', de: 'Tumbler', en: 'Tumbler', ru: 'Тумблер', zh: '古典杯', es: 'Vaso bajo', fr: 'Tumbler', it: 'Tumbler', pt: 'Copo baixo' },
  { id: 'martini', symbol: 'glas-martini', altEmoji: '🍸', de: 'Martiniglas', en: 'Martini', ru: 'Мартини', zh: '马天尼', es: 'Copa de martini', fr: 'Verre à martini', it: 'Coppa Martini', pt: 'Taça de martini' },
  { id: 'wine', symbol: 'glas-wein', altEmoji: '🍷', de: 'Weinglas', en: 'Wine glass', ru: 'Бокал', zh: '红酒杯', es: 'Copa de vino', fr: 'Verre à vin', it: 'Calice da vino', pt: 'Taça de vinho' },
  { id: 'shot', symbol: 'glas-shot', altEmoji: '🥂', de: 'Shotglas', en: 'Shot glass', ru: 'Рюмка', zh: '烈酒杯', es: 'Vaso de chupito', fr: 'Verre à shot', it: 'Bicchierino', pt: 'Copo de shot' },
  { id: 'mug', symbol: 'glas-becher', altEmoji: '☕', de: 'Becher/Tasse', en: 'Mug/Cup', ru: 'Кружка', zh: '马克杯', es: 'Taza', fr: 'Tasse', it: 'Tazza', pt: 'Caneca' },
  { id: 'smoothie', symbol: 'glas-smoothie', altEmoji: '🥤', de: 'Smoothie-Glas', en: 'Smoothie', ru: 'Стакан', zh: '奶昔杯', es: 'Vaso para batido', fr: 'Verre à smoothie', it: 'Bicchiere da frullato', pt: 'Copo para batido' },
  { id: 'oth', symbol: 'glas-sonstiges', altEmoji: '🫗', de: 'Sonstiges', en: 'Other', ru: 'Другое', zh: '其他', es: 'Otro', fr: 'Autre', it: 'Altro', pt: 'Outro' },
].map(Object.freeze));

export const TEMPERATUREN = Object.freeze([
  { id: 'kalt', symbol: 'temp-kalt', altEmoji: '🧊', de: 'Kalt/Eisgekühlt', en: 'Cold/Iced', ru: 'Холодный', zh: '冷', es: 'Frío/Con hielo', fr: 'Froid/Glacé', it: 'Freddo/Ghiacciato', pt: 'Frio/Gelado' },
  { id: 'room', symbol: 'temp-raum', altEmoji: '💧', de: 'Zimmertemperatur', en: 'Room temp', ru: 'Комнатный', zh: '常温', es: 'Temperatura ambiente', fr: 'Température ambiante', it: 'Temperatura ambiente', pt: 'Temperatura ambiente' },
  { id: 'warm', symbol: 'temp-warm', altEmoji: '♨️', de: 'Warm', en: 'Warm', ru: 'Тёплый', zh: '温', es: 'Templado', fr: 'Tiède', it: 'Tiepido', pt: 'Morno' },
  { id: 'hot', symbol: 'temp-heiss', altEmoji: '🔥', de: 'Heiß', en: 'Hot', ru: 'Горячий', zh: '热', es: 'Caliente', fr: 'Chaud', it: 'Caldo', pt: 'Quente' },
].map(Object.freeze));

function _name(liste, id, sprache) {
  const e = liste.find(x => x.id === id);
  if (!e) return id;                       // wie alt: eine unbekannte Kennung bleibt sichtbar
  return e[sprache] || e.de;
}
/* Wie `glassName(id)`: Name in der Sprache, Rückfall Deutsch; unbekannt → die Kennung.
   ⚠ In Klaus' Sicherungen kommt `glass:"bowle"` vor, und TheCocktailDB liefert
   freie Texte („Highball glass"). Beides ist KEINE Kennung dieser Liste und
   bleibt stehen, wie es ist — geraten wird nicht. */
export function glasName(id, sprache) { return _name(GLAESER, id, sprache || 'de'); }
export function tempName(id, sprache) { return _name(TEMPERATUREN, id, sprache || 'de'); }
export function glas(id) { return GLAESER.find(g => g.id === id) || null; }
export function temperatur(id) { return TEMPERATUREN.find(t => t.id === id) || null; }
export function istBekanntesGlas(id) { return !!glas(id); }
