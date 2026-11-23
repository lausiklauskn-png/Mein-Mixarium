/* getraenke/einheiten.mjs — Mengen lesen, Einheiten erkennen, umrechnen, skalieren.

   WOHER (QC_Mixarium_20_04_26.html):
   - `parseAmt`, `fmtNum`, `scaleAmt`  — Abschnitt „SERVING SIZE SCALING" (~12029–12085)
   - `_IMP_UNITS`, `_MET_UNITS`, `_normUnit`, `_unitKind`, `unitsMatchSystem`,
     `convertAmtUnitLocal`               — „Unit locale system" (~5623–5670)

   Was die alte App rechnet, kommt hier gleich heraus; die Probe
   tests/getraenke/einheiten.test.mjs lädt die alten Funktionen aus der QC-Datei
   und vergleicht. Die zwei benannten Abweichungen stehen bei `mengeLesen`.

   Reines ESM, keine Abhängigkeiten, kein DOM, kein Speicher. */

/* ── Systeme ─────────────────────────────────────────────────────────────
   Neu heißen sie 'metrisch' und 'us'. Die alte App nannte sie 'metric' und
   'imperial'; beide Schreibweisen werden angenommen. */
export const SYSTEME = Object.freeze(['metrisch', 'us']);
export function systemName(s) {
  const t = String(s || '').toLowerCase();
  if (t === 'us' || t === 'imperial') return 'us';
  if (t === 'metrisch' || t === 'metric') return 'metrisch';
  return null;
}

/* Länder mit US-Maßen: USA, Liberia, Myanmar. Alles andere ist metrisch. */
const US_LAENDER = new Set(['US', 'LR', 'MM']);
/* Sprachen, deren wahrscheinlichstes Land (CLDR „likely subtags") ein US-Maß-Land
   ist, wenn die Locale KEIN Land nennt: `en` → US, `my` → MM.
   ⚠ BENANNTE ENTSCHEIDUNG: ein nacktes `en` gilt als US. Die alte App stellte
   `en` (und `pt`!) über LANG_UNIT_SYSTEM auf imperial; `pt` ist hier metrisch. */
const US_SPRACHEN_OHNE_LAND = new Set(['en', 'my']);

/* Standard-Einheitensystem aus einer Locale: 'us' oder 'metrisch'.
   Versteht `en-US`, `en_US`, `en-Latn-US`, `es-419`, `my`, sowie die
   Unicode-Erweiterung `-u-ms-metric` / `-u-ms-ussystem` (die gewinnt). */
export function systemVonLocale(locale) {
  const roh = String(locale || '').trim().replace(/_/g, '-');
  if (!roh) return 'metrisch';
  const ms = roh.toLowerCase().match(/-u(?:-[a-z0-9]+)*?-ms-(metric|ussystem|uksystem)/);
  if (ms) return ms[1] === 'ussystem' ? 'us' : 'metrisch';
  const teile = roh.split(/-[uUxX]-/)[0].split('-');
  const sprache = (teile[0] || '').toLowerCase();
  let land = '';
  for (let i = 1; i < teile.length; i++) {
    if (/^[A-Za-z]{2}$/.test(teile[i]) || /^\d{3}$/.test(teile[i])) { land = teile[i].toUpperCase(); break; }
  }
  if (land) return US_LAENDER.has(land) ? 'us' : 'metrisch';
  return US_SPRACHEN_OHNE_LAND.has(sprache) ? 'us' : 'metrisch';
}
/* Die Einheit, in der Flüssigkeiten zuerst gezeigt werden. Umschaltbar ml ↔ cl ↔ oz. */
export const VOLUMEN_EINHEITEN = Object.freeze(['ml', 'cl', 'oz']);
export function standardVolumenEinheit(system) { return systemName(system) === 'us' ? 'oz' : 'ml'; }

/* ── Mengen lesen ────────────────────────────────────────────────────────
   Wie `parseAmt` (die GÜLTIGE Fassung, QC ~12032): null (leer / kein Zahlwert),
   Zahl, oder [von, bis] bei Spannen.
   ⚠ In der QC-Datei stehen ZWEI `function parseAmt` (~11037 und ~12032) im
   selben Skript. Funktions-Deklarationen werden hochgezogen, die spätere
   gewinnt — auch für die Einkaufsliste (~10970), über der die frühere steht.
   Die frühere (gibt 0 statt null, kennt keine Spannen) ist toter Code.

   ⚠ ZWEI BENANNTE ABWEICHUNGEN VON DER ALTEN APP — beides Rechenfehler dort:
   1. „10.5", „20,5", „100.25" (Zahl, die vor dem Komma auf 0 endet): `parseAmt`
      las 1,5 / 2,5 / 10,25. Die Regel für „1½" (`mixed2`) suchte nach dem
      Ersetzen der Bruchzeichen „Zahl + 0.x" und zerlegte „10.5" in 1 + 0.5.
      Hier wird ein Bruchzeichen nur dort gelesen, wo wirklich eines STEHT.
   2. „1 ½" (ganze Zahl, Leerzeichen, Bruchzeichen): `parseAmt` las 1. Die
      Schreibweise kommt in Klaus' Beispielbuch vor. Hier ist es 1,5.
   Alles andere ist gleich; die Probe vergleicht gegen die alte Funktion und
   nagelt die zwei Abweichungen mit den alten Werten fest. */
const BRUCHZEICHEN = { '¼': '0.25', '½': '0.5', '¾': '0.75', '⅓': '0.333', '⅔': '0.667', '⅛': '0.125', '⅜': '0.375', '⅝': '0.625', '⅞': '0.875' };
export function mengeLesen(s) {
  if (!s) return null;
  s = String(s).trim();
  const mitBruch = s.match(/^(\d+(?:[.,]\d+)?)\s*([¼½¾⅓⅔⅛⅜⅝⅞])$/); // „1½", „1 ½", „1,5½"
  if (mitBruch) return parseFloat(mitBruch[1].replace(',', '.')) + parseFloat(BRUCHZEICHEN[mitBruch[2]]);
  s = s.replace(/[¼½¾⅓⅔⅛⅜⅝⅞]/g, z => BRUCHZEICHEN[z]);
  s = s.replace(',', '.');                                   // deutsches Dezimalkomma (wie alt: das erste)
  const gemischt = s.match(/^(\d+)\s+(\d+)\/(\d+)$/);         // „1 1/2"
  if (gemischt) return parseInt(gemischt[1], 10) + parseInt(gemischt[2], 10) / parseInt(gemischt[3], 10);
  const bruch = s.match(/^(\d+)\/(\d+)$/);                    // „1/2"
  if (bruch) return parseInt(bruch[1], 10) / parseInt(bruch[2], 10);
  const spanne = s.match(/^([\d.,]+)\s*[-–]\s*([\d.,]+)$/);   // „2-3", „25–30"
  if (spanne) return [parseFloat(spanne[1].replace(',', '.')), parseFloat(spanne[2].replace(',', '.'))];
  const n = parseFloat(s);
  return isNaN(n) ? null : n;
}

/* Wie `fmtNum`: schöne Brüche, sonst sinnvoll gerundet. */
const SCHOENE_BRUECHE = [[1 / 8, '⅛'], [1 / 4, '¼'], [1 / 3, '⅓'], [3 / 8, '⅜'], [1 / 2, '½'], [5 / 8, '⅝'], [2 / 3, '⅔'], [3 / 4, '¾'], [7 / 8, '⅞']];
export function zahlFormatieren(n) {
  if (n === null) return null;
  if (Array.isArray(n)) return zahlFormatieren(n[0]) + '-' + zahlFormatieren(n[1]);
  const ganz = Math.floor(n), rest = n - ganz;
  for (const [v, z] of SCHOENE_BRUECHE) { if (Math.abs(rest - v) < 0.04) return (ganz ? ganz : '') + '' + z; }
  if (n >= 10) return Math.round(n).toString();
  if (n >= 1) return (Math.round(n * 4) / 4).toFixed(n % 1 ? 1 : 0).replace(/\.0$/, '');
  return (Math.round(n * 8) / 8).toString().replace(/\.0$/, '');
}

/* Wie `scaleAmt`: eine Mengen-Zeichenkette mit einem Faktor malnehmen.
   Text, den man nicht rechnen kann („nach Belieben"), bleibt unverändert. */
export function mengeSkalieren(menge, faktor) {
  if (Math.abs(faktor - 1) < 0.001) return { menge, geaendert: false };
  const gelesen = mengeLesen(menge);
  if (gelesen === null) return { menge, geaendert: false };
  const neu = Array.isArray(gelesen)
    ? zahlFormatieren(gelesen[0] * faktor) + '-' + zahlFormatieren(gelesen[1] * faktor)
    : zahlFormatieren(gelesen * faktor);
  if (neu === null) return { menge, geaendert: false };
  return { menge: neu, geaendert: true, original: menge };
}

/* Zutatenliste von `basis` auf `ziel` Portionen. Gibt NEUE Zutaten zurück;
   die übergebenen bleiben unberührt. Basis wie in der alten App: fehlt sie, 4. */
export function portionenSkalieren(zutaten, basis, ziel) {
  const b = Number(basis) > 0 ? Number(basis) : 4;
  const z = Number(ziel) > 0 ? Number(ziel) : b;
  const faktor = z / b;
  return (zutaten || []).map(i => {
    const e = mengeSkalieren(i && i.amt, faktor);
    return e.geaendert ? { ...i, amt: e.menge, amtOriginal: e.original } : { ...i };
  });
}

/* ── Einheiten ───────────────────────────────────────────────────────────*/
const _US = new Set(['oz', 'fl oz', 'floz', 'cup', 'cups', 'tbsp', 'tablespoon', 'tablespoons', 'tsp', 'teaspoon', 'teaspoons', 'lb', 'lbs', 'pound', 'pounds', 'quart', 'quarts', 'pint', 'pints', 'gallon', 'gallons']);
const _MET = new Set(['ml', 'cl', 'l', 'g', 'kg', 'mg', 'dl', 'el', 'tl']);

/* Wie `_normUnit`: klein, ohne Punkte, ohne Rand-Leerzeichen. */
export function einheitNormalisieren(u) { return String(u || '').toLowerCase().replace(/\./g, '').trim(); }

/* Wie `_unitKind`, mit den neuen Namen: 'keine' | 'us' | 'metrisch' | 'andere'
   (alt: 'none' | 'imperial' | 'metric' | 'other'). */
export function einheitArt(u) {
  const n = einheitNormalisieren(u);
  if (!n) return 'keine';
  if (_US.has(n)) return 'us';
  if (_MET.has(n)) return 'metrisch';
  return 'andere';
}

/* Wie `unitsMatchSystem`: passen die Einheiten eines Getränks schon zum System?
   Neutrale Einheiten (Stück, Spritzer …) stören nicht. */
export function passtZumSystem(r, system) {
  const sys = systemName(system);
  if (!r || !r.ings || !r.ings.length) return true;
  for (const i of r.ings) { const k = einheitArt(i.unit); if (k !== 'keine' && k !== 'andere' && k !== sys) return false; }
  return true;
}

/* Kanonische Einheiten. `kennung` ist sprachfrei; die Schreibweisen kommen aus
   der alten App, aus TheCocktailDB (englisch) und aus Klaus' Sicherungen.
   ⚠ `art` ist bewusst die Sicht der NEUEN App. `einheitArt` oben bleibt bei der
   engeren alten Liste, damit `passtZumSystem` gleich urteilt wie bisher. */
const EINHEITEN_LISTE = [
  { kennung: 'ml', art: 'volumen', ml: 1, namen: ['ml', 'milliliter', 'millilitre', 'milliliters'] },
  { kennung: 'cl', art: 'volumen', ml: 10, namen: ['cl', 'zentiliter', 'centiliter', 'centilitre'] },
  { kennung: 'dl', art: 'volumen', ml: 100, namen: ['dl', 'deziliter', 'deciliter'] },
  { kennung: 'l', art: 'volumen', ml: 1000, namen: ['l', 'liter', 'litre', 'liters', 'litres', 'ltr'] },
  { kennung: 'oz', art: 'volumen', ml: 29.5735, namen: ['oz', 'fl oz', 'floz', 'fl-oz', 'ounce', 'ounces', 'unze', 'unzen'] },
  { kennung: 'cup', art: 'volumen', ml: 236.588, namen: ['cup', 'cups', 'tasse', 'tassen'] },
  { kennung: 'pint', art: 'volumen', ml: 473.176, namen: ['pint', 'pints', 'pt'] },
  { kennung: 'quart', art: 'volumen', ml: 946.353, namen: ['quart', 'quarts', 'qt'] },
  { kennung: 'gallon', art: 'volumen', ml: 3785, namen: ['gallon', 'gallons', 'gal'] },
  { kennung: 'el', art: 'loeffel', namen: ['el', 'esslöffel', 'essloeffel', 'tbsp', 'tblsp', 'tbs', 'tablespoon', 'tablespoons'] },
  { kennung: 'tl', art: 'loeffel', namen: ['tl', 'teelöffel', 'teeloeffel', 'tsp', 'teaspoon', 'teaspoons'] },
  { kennung: 'bl', art: 'loeffel', namen: ['bl', 'barlöffel', 'barloeffel', 'bar spoon', 'barspoon', 'bar spoons', 'bsp'] },
  { kennung: 'spritzer', art: 'gefuehl', namen: ['spritzer', 'dash', 'dashes', 'schuss', 'splash'] },
  { kennung: 'tropfen', art: 'gefuehl', namen: ['tropfen', 'drop', 'drops'] },
  { kennung: 'prise', art: 'gefuehl', namen: ['prise', 'prisen', 'pinch', 'pinches', 'msp', 'messerspitze'] },
  { kennung: 'handvoll', art: 'gefuehl', namen: ['handvoll', 'handful', 'handfuls', 'hand voll'] },
  { kennung: 'stueck', art: 'zahl', namen: ['stück', 'stueck', 'stk', 'st', 'piece', 'pieces', 'pc', 'pcs', 'x'] },
  { kennung: 'scheibe', art: 'zahl', namen: ['scheibe', 'scheiben', 'slice', 'slices', 'wheel', 'wheels'] },
  { kennung: 'blatt', art: 'zahl', namen: ['blatt', 'blätter', 'blaetter', 'leaf', 'leaves'] },
  { kennung: 'zweig', art: 'zahl', namen: ['zweig', 'zweige', 'sprig', 'sprigs', 'stiel', 'stiele', 'stängel', 'staengel'] },
  { kennung: 'wuerfel', art: 'zahl', namen: ['würfel', 'wuerfel', 'cube', 'cubes'] },
  { kennung: 'spalte', art: 'zahl', namen: ['spalte', 'spalten', 'wedge', 'wedges', 'achtel'] },
  { kennung: 'zeste', art: 'zahl', namen: ['zeste', 'zesten', 'twist', 'twists', 'peel'] },
  { kennung: 'stange', art: 'zahl', namen: ['stange', 'stangen', 'stick', 'sticks'] },
  { kennung: 'dose', art: 'zahl', namen: ['dose', 'dosen', 'can', 'cans'] },
  { kennung: 'flasche', art: 'zahl', namen: ['flasche', 'flaschen', 'bottle', 'bottles'] },
  { kennung: 'paeckchen', art: 'zahl', namen: ['päckchen', 'paeckchen', 'pck', 'pkg', 'packet', 'packets', 'beutel'] },
  { kennung: 'bund', art: 'zahl', namen: ['bund', 'bunch', 'bunches'] },
  { kennung: 'g', art: 'gewicht', g: 1, namen: ['g', 'gr', 'gramm', 'gram', 'grams'] },
  { kennung: 'kg', art: 'gewicht', g: 1000, namen: ['kg', 'kilo', 'kilogramm', 'kilogram'] },
  { kennung: 'mg', art: 'gewicht', g: 0.001, namen: ['mg'] },
  { kennung: 'lb', art: 'gewicht', g: 453.592, namen: ['lb', 'lbs', 'pound', 'pounds', 'pfund'] },
];
const _NACH_NAME = new Map();
for (const e of EINHEITEN_LISTE) for (const n of e.namen) _NACH_NAME.set(n, e);
export const EINHEITEN = Object.freeze(EINHEITEN_LISTE.map(e => Object.freeze({ ...e, namen: Object.freeze([...e.namen]) })));

/* Kanonische Kennung zu einer Schreibweise, oder null, wenn sie niemand kennt.
   ⚠ Eine unbekannte Einheit wird NICHT geraten — sie bleibt, wie sie dasteht. */
export function einheitKennung(u) {
  const n = einheitNormalisieren(u);
  if (!n) return null;
  const e = _NACH_NAME.get(n);
  return e ? e.kennung : null;
}
export function einheitInfo(u) {
  const n = einheitNormalisieren(u);
  return (n && _NACH_NAME.get(n)) || null;
}

/* Menge in Milliliter (Zahl oder [von, bis]), nur für echte Volumen-Einheiten.
   EL/TL/Barlöffel sind hier ABSICHTLICH nicht dabei: die alte App rechnet sie
   nie in ml um (EL ↔ tbsp, TL ↔ tsp, 1:1), und ein Löffel ist kein Messbecher. */
export function inMl(menge, einheit) {
  const e = einheitInfo(einheit);
  if (!e || e.art !== 'volumen') return null;
  const m = mengeLesen(menge);
  if (m === null) return null;
  return Array.isArray(m) ? [m[0] * e.ml, m[1] * e.ml] : m * e.ml;
}

function _rund(ml, ziel) {
  if (ziel === 'ml') return ml >= 10 ? Math.round(ml) : Math.round(ml * 2) / 2;
  if (ziel === 'cl') return Math.round(ml / 10 * 2) / 2;             // halbe Zentiliter, wie am Messbecher
  let oz = Math.round(ml / 29.5735 * 4) / 4;                          // Viertel-Unzen, wie die alte App
  if (oz === 0) oz = Math.round(ml / 29.5735 * 8) / 8;
  return oz;
}
function _zahlText(n, ziel, dezimal) {
  if (ziel === 'oz') return zahlFormatieren(n);
  return String(n).replace('.', dezimal || '.');
}

/* Umschalter ml ↔ cl ↔ oz. Rechnet NUR, was ein Flüssigkeitsmaß ist (ml, cl,
   dl, l, oz, cup, pint, quart, gallon); alles andere → null (bleibt stehen).
   Rundung: ml ganz (unter 10 ml auf halbe), cl auf halbe, oz auf Viertel.
   Rundet eine Menge auf 0, wird NICHT umgerechnet — eine Null wäre eine Lüge.
   Spannen und Brüche werden mitgerechnet (das konnte die alte App nicht). */
export function volumenUmrechnen(menge, einheit, ziel, optionen) {
  const z = einheitKennung(ziel);
  if (!VOLUMEN_EINHEITEN.includes(z)) return null;
  const ml = inMl(menge, einheit);
  if (ml === null) return null;
  if (einheitKennung(einheit) === z) return null;                    // schon dort
  const dez = optionen && optionen.dezimal;
  if (Array.isArray(ml)) {
    const a = _rund(ml[0], z), b = _rund(ml[1], z);
    if (!(a > 0) || !(b > 0)) return null;
    return { amt: _zahlText(a, z, dez) + '-' + _zahlText(b, z, dez), unit: z, wert: [a, b] };
  }
  const w = _rund(ml, z);
  if (!(w > 0)) return null;
  return { amt: _zahlText(w, z, dez), unit: z, wert: w };
}

/* Eine Zutat (Kopie) in der gewünschten Volumen-Einheit. Was sich nicht
   umrechnen lässt, kommt unverändert zurück. */
export function zutatUmstellen(zutat, ziel, optionen) {
  const e = zutat ? volumenUmrechnen(zutat.amt, zutat.unit, ziel, optionen) : null;
  return e ? { ...zutat, amt: e.amt, unit: e.unit } : { ...zutat };
}

/* Wie `convertAmtUnitLocal`: feste Tabelle zwischen den Systemen.
   Gibt {amt, unit} oder null. Nur einfache Zahlen — Spannen, Brüche, Text → null
   (genau wie alt; dafür gibt es `volumenUmrechnen`). */
export function umrechnenInSystem(amt, unit, system) {
  const nach = systemName(system);
  const u = einheitNormalisieren(unit); if (!u) return null;
  const art = _US.has(u) ? 'us' : _MET.has(u) ? 'metrisch' : 'andere';
  if (art === nach || art === 'andere') return null;
  const n = Number(String(amt).replace(',', '.')); if (!isFinite(n) || n <= 0) return null;
  if (art === 'us' && nach === 'metrisch') {
    if (u === 'oz' || u === 'fl oz' || u === 'floz') return { amt: String(Math.round(n * 29.5735)), unit: 'ml' };
    if (u === 'cup' || u === 'cups') return { amt: String(Math.round(n * 236.588)), unit: 'ml' };
    if (u === 'tbsp' || u === 'tablespoon' || u === 'tablespoons') return { amt: String(n), unit: 'EL' };
    if (u === 'tsp' || u === 'teaspoon' || u === 'teaspoons') return { amt: String(n), unit: 'TL' };
    if (u === 'lb' || u === 'lbs' || u === 'pound' || u === 'pounds') return { amt: String(Math.round(n * 453.592)), unit: 'g' };
    if (u === 'pint' || u === 'pints') return { amt: String(Math.round(n * 473.176)), unit: 'ml' };
    if (u === 'quart' || u === 'quarts') return { amt: String(Math.round(n * 946.353)), unit: 'ml' };
    if (u === 'gallon' || u === 'gallons') return { amt: String(Math.round(n * 3.785 * 10) / 10), unit: 'l' };
  }
  if (art === 'metrisch' && nach === 'us') {
    if (u === 'ml') { if (n >= 200) return { amt: String(Math.round(n / 236.588 * 4) / 4), unit: 'cup' }; return { amt: String(Math.round(n / 29.5735 * 4) / 4), unit: 'oz' }; }
    if (u === 'cl') return { amt: String(Math.round(n * 10 / 29.5735 * 4) / 4), unit: 'oz' };
    if (u === 'l') return { amt: String(Math.round(n * 1000 / 236.588 * 4) / 4), unit: 'cup' };
    if (u === 'g') { if (n >= 100) return { amt: String(Math.round(n / 453.592 * 4) / 4), unit: 'lb' }; return { amt: String(Math.round(n / 28.3495 * 4) / 4), unit: 'oz' }; }
    if (u === 'kg') return { amt: String(Math.round(n * 1000 / 453.592 * 4) / 4), unit: 'lb' };
    if (u === 'el') return { amt: String(n), unit: 'tbsp' };
    if (u === 'tl') return { amt: String(n), unit: 'tsp' };
  }
  return null;
}

/* ── Menge und Einheit trennen ───────────────────────────────────────────
   Das Labor der alten App legt Zutaten als {amt:'4 cl', unit:''} ab (QC ~7265),
   TheCocktailDB ebenso. Getrennt wird NUR, wenn vorn eine lesbare Menge steht
   und der GANZE Rest eine bekannte Einheit ist. „1 Fresh", „Garnish with",
   „eine Handvoll" bleiben, wie sie sind — geraten wird nichts. */
const _MENGE_VORN = /^((?:\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:[.,]\d+)?\s*[¼½¾⅓⅔⅛⅜⅝⅞]?|[¼½¾⅓⅔⅛⅜⅝⅞])(?:\s*[-–]\s*\d+(?:[.,]\d+)?)?)\s*(.*)$/;
export function mengeUndEinheitTrennen(text) {
  const s = String(text == null ? '' : text).trim();
  if (!s) return null;
  const m = s.match(_MENGE_VORN);
  if (!m || !m[2]) return null;
  if (mengeLesen(m[1].trim()) === null) return null;
  if (!einheitKennung(m[2])) return null;
  return { amt: m[1].trim(), unit: m[2].trim() };
}
/* Eine Zutat aus der alten App in die getrennte Form. Unbekannte Felder
   bleiben erhalten. Wurde getrennt, steht das Original in `amtRoh`. */
export function zutatTrennen(zutat) {
  if (typeof zutat === 'string') return zutatAusText(zutat);
  const z = { ...(zutat || {}) };
  z.amt = z.amt == null ? '' : String(z.amt);
  z.unit = z.unit == null ? '' : String(z.unit);
  z.name = z.name == null ? '' : String(z.name);
  if (!z.unit.trim() && z.amt.trim()) {
    const t = mengeUndEinheitTrennen(z.amt);
    if (t) { z.amtRoh = z.amt; z.amt = t.amt; z.unit = t.unit; }
  }
  return z;
}
/* „4 cl Limettensaft" → {amt:'4', unit:'cl', name:'Limettensaft'}.
   Steht vorn keine Menge, ist alles der Name. */
export function zutatAusText(text) {
  const s = String(text == null ? '' : text).trim();
  const m = s.match(_MENGE_VORN);
  if (!m || mengeLesen(m[1].trim()) === null) return { amt: '', unit: '', name: s };
  const rest = m[2].trim();
  const woerter = rest.split(/\s+/);
  for (const n of [2, 1]) {                                          // „fl oz", „bar spoon" zuerst
    if (woerter.length > n) {
      const u = woerter.slice(0, n).join(' ');
      if (einheitKennung(u)) return { amt: m[1].trim(), unit: u, name: woerter.slice(n).join(' ') };
    }
  }
  return { amt: m[1].trim(), unit: '', name: rest };
}
