/* getraenke/warengruppen.mjs — Warengruppen der Einkaufsliste für Getränke, im Format des Küchen-Kerns
   (`kern/modell/einkauf.mjs`, `einkaufMit({ gruppen })`): { id, Namen in 8 Sprachen, worte }.

   WOHER: die fünf Gruppen der neuen PWA (`GRP` in neu/app.mjs bis 10.0.0-vor7). Neu: „Spirituosen & Wein“
   (bisher landeten Rum, Gin, Wein unter „Vorrat“).

   ⚠ DER KERN NIMMT DIE ERSTE GRUPPE, DEREN WORT IM NAMEN STEHT (Teilwort, klein geschrieben, mit Leerzeichen
   davor und dahinter). Deshalb stehen Säfte vor Obst: „Limettensaft“ ist ein Saft, keine Limette – in der
   bisherigen PWA landete er unter „Obst & Kräuter“, weil /limett/ zuerst prüfte. Die Reihenfolge in der Liste
   ist zugleich die Vorgabe für die Anzeige; je Laden ist sie frei änderbar.
   Die letzte Gruppe heißt `sonstiges` – das ist die Kennung, die der Kern ohne Treffer vergibt. */
export const GETRAENKE_WARENGRUPPEN = Object.freeze([
  { id: 'saft', symbol: 'drop', de: 'Säfte & Sirupe', en: 'Juices & syrups', ru: 'Соки и сиропы', zh: '果汁和糖浆', es: 'Zumos y siropes', fr: 'Jus et sirops', it: 'Succhi e sciroppi', pt: 'Sumos e xaropes',
    worte: ['saft', 'sirup', 'nektar', 'juice', 'syrup', 'grenadine', 'püree', 'puree', 'mark '] },
  { id: 'wasser', symbol: 'glass', de: 'Sprudel & Wasser', en: 'Sparkling & water', ru: 'Газировка и вода', zh: '汽水和水', es: 'Gaseosas y agua', fr: 'Pétillant et eau', it: 'Bibite e acqua', pt: 'Gaseificados e água',
    worte: ['wasser', 'soda', 'sprudel', 'tonic', 'limonade', 'cola', 'ginger ale', 'ginger beer', 'water', 'lemonade', 'bitter lemon', 'schorle'] },
  { id: 'spirituosen', symbol: 'wine', de: 'Spirituosen & Wein', en: 'Spirits & wine', ru: 'Крепкие напитки и вино', zh: '烈酒和葡萄酒', es: 'Licores y vino', fr: 'Spiritueux et vin', it: 'Liquori e vino', pt: 'Bebidas espirituosas e vinho',
    worte: [' rum', 'gin ', 'wodka', 'vodka', 'tequila', 'whisky', 'whiskey', 'likör', 'liqueur', 'amaretto', 'wein', 'wine', 'sekt', 'prosecco', 'champagner', 'cava', 'bier ', 'beer ', 'campari', 'aperol', 'wermut', 'vermouth', 'cachaça', 'cachaca', 'brandy', 'cognac', 'schnaps', 'bitter ', 'triple sec', 'curaçao', 'curacao', 'kahlúa', 'kahlua', 'baileys', 'pisco', 'mezcal', 'sherry', 'port'] },
  { id: 'kuehl', symbol: 'snow', de: 'Kühlregal & Eis', en: 'Chilled & ice', ru: 'Охлаждённое и лёд', zh: '冷藏和冰', es: 'Refrigerados y hielo', fr: 'Frais et glace', it: 'Freschi e ghiaccio', pt: 'Refrigerados e gelo',
    worte: ['milch', 'joghurt', 'sahne', ' eis', 'eiswürfel', 'crushed', 'butter', 'quark', 'milk', 'yogurt', 'cream', ' ice', 'kefir', 'buttermilch'] },
  { id: 'obst', symbol: 'leaf', de: 'Obst & Kräuter', en: 'Fruit & herbs', ru: 'Фрукты и травы', zh: '水果和香草', es: 'Fruta y hierbas', fr: 'Fruits et herbes', it: 'Frutta ed erbe', pt: 'Fruta e ervas',
    worte: ['zitron', 'limett', 'orange', 'minz', 'gurke', 'ingwer', 'beere', 'apfel', 'äpfel', 'mango', 'basilik', 'rosmarin', 'ananas', 'pfirsich', 'banane', 'kirsch', 'melone', 'holunder', 'thymian', 'lemon', 'lime', 'mint', 'cucumber', 'ginger', 'berr', 'apple', 'peach', 'pineapple', 'basil', 'kiwi', 'maracuja', 'passionsfrucht', 'granatapfel', 'grapefruit', 'avocado', 'spinat', 'karotte', 'möhre', 'sellerie', 'lavendel', 'salbei'] },
  { id: 'sonstiges', symbol: 'list', de: 'Vorrat', en: 'Pantry', ru: 'Запасы', zh: '储藏', es: 'Despensa', fr: 'Garde-manger', it: 'Dispensa', pt: 'Despensa', worte: [] },
].map((g) => Object.freeze({ ...g, worte: Object.freeze(g.worte) })));

/* Einheiten, die die Getränke-Einkaufsliste zusätzlich zum Kern kennt (Kern: ml, cl, dl, l, TL/EL, g, kg).
   oz wie in einheiten.mjs (29,5735 ml); ein Barlöffel ist hier KEIN Volumen – wie überall im Mixarium. */
export const GETRAENKE_EINKAUF_EINHEITEN = Object.freeze({ oz: ['ml', 29.5735], 'fl oz': ['ml', 29.5735], floz: ['ml', 29.5735] });
