/* Proben zu getraenke/entdecken.mjs („Bekannte Drinks entdecken“, TheCocktailDB).

   ⚠ KEIN ECHTES NETZ. Jeder Abruf geht über ein gestelltes `hol`; das echte `fetch` ist für diese Datei ersetzt und
     wird gezählt (letzte Probe).
   ⚠ DIE BEISPIEL-ANTWORTEN SIND NACH DEM FORMAT DER API AUS DEM GEDÄCHTNIS GEBAUT, NICHT ABGERUFEN. Feldnamen und
     Schreibweisen der Mengen („1 1/2 oz “, „Juice of 1 “, „2 dashes“, „4.5 cL“) folgen der Datenbank; Wortlaut und
     Nummern sind nicht gegen die echte API geprüft. `SOUR` ist so zusammengestellt, dass alle Schreibweisen vorkommen.
   Wo die alte App rechnet, wird GEGEN SIE gerechnet: `_alt.mjs` holt `discoverConfirmImport`, `_discoverCatFor`,
   `_disTrIngredient`, `_disTrUnit` und die Wörterbücher wörtlich aus der QC-Datei. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { altLaden, schlicht } from './_alt.mjs';
import * as E from '../../getraenke/entdecken.mjs';
import { KATEGORIEN } from '../../getraenke/kategorien.mjs';
import { istBekanntesGlas } from '../../getraenke/glaeser.mjs';
import { hatAlkohol, filterOhneAlkohol } from '../../getraenke/alkohol.mjs';
import { getraenkNormalisieren } from '../../getraenke/uebernahme.mjs';
import { mengeLesen, mengeSkalieren, mengeUndEinheitTrennen, portionenSkalieren, volumenUmrechnen, einheitKennung } from '../../getraenke/einheiten.mjs';

let echtesNetz = 0;
globalThis.fetch = async () => { echtesNetz++; throw new TypeError('In den Proben gibt es kein Netz.'); };

/* ── Beispiel-Antworten im Format der API ── */
function drink(felder) {
  const d = { idDrink: null, strDrink: null, strDrinkAlternate: null, strTags: null, strVideo: null, strCategory: null, strIBA: null, strAlcoholic: null, strGlass: null,
    strInstructions: null, strInstructionsES: null, strInstructionsDE: null, strInstructionsFR: null, strInstructionsIT: null, 'strInstructionsZH-HANS': null, 'strInstructionsZH-HANT': null, strDrinkThumb: null };
  for (let i = 1; i <= 15; i++) d['strIngredient' + i] = null;
  for (let i = 1; i <= 15; i++) d['strMeasure' + i] = null;
  Object.assign(d, { strImageSource: null, strImageAttribution: null, strCreativeCommonsConfirmed: 'No', dateModified: null });
  const { zutaten = [], ...rest } = felder;
  zutaten.forEach(([name, menge], i) => { d['strIngredient' + (i + 1)] = name; d['strMeasure' + (i + 1)] = menge === undefined ? null : menge; });
  return Object.assign(d, rest);
}
const BILD = 'https://www.thecocktaildb.com/images/media/drink/';
const MARGARITA = drink({ idDrink: '11007', strDrink: 'Margarita', strTags: 'IBA,ContemporaryClassic', strCategory: 'Ordinary Drink', strIBA: 'Contemporary Classics', strAlcoholic: 'Alcoholic', strGlass: 'Cocktail glass',
  strInstructions: 'Rub the rim of the glass with the lime slice to make the salt stick to it. Take care to moisten only the outer rim and sprinkle the salt on it. The salt should present to the lips of the imbiber and never mix into the cocktail. Shake the other ingredients with ice, then carefully pour into the glass.',
  strInstructionsES: 'Frota el borde del vaso con la rodaja de lima para que la sal se pegue. Agita los demás ingredientes con hielo y viértelos con cuidado en el vaso.',
  strInstructionsDE: 'Reiben Sie den Rand des Glases mit der Limettenscheibe, damit das Salz daran haftet. Achten Sie darauf, dass nur der äußere Rand angefeuchtet wird und streuen Sie das Salz darauf. Das Salz sollte sich auf den Lippen des Genießers befinden und niemals in den Cocktail einmischen. Die anderen Zutaten mit Eis schütteln und vorsichtig in das Glas geben.',
  strInstructionsFR: 'Frotter le bord du verre avec la tranche de citron vert pour faire adhérer le sel. Secouer les autres ingrédients avec de la glace, puis verser délicatement dans le verre.',
  strInstructionsIT: 'Strofina il bordo del bicchiere con la fetta di lime per far aderire il sale.\r\nAvere cura di inumidire solo il bordo esterno e cospargere di sale.\r\nShakerare gli altri ingredienti con ghiaccio, quindi versarli delicatamente nel bicchiere.',
  strDrinkThumb: BILD + '5noda61589575158.jpg', strImageSource: 'https://commons.wikimedia.org/wiki/File:Klassiche_Margarita.jpg', strImageAttribution: 'Cocktailmarler', strCreativeCommonsConfirmed: 'Yes', dateModified: '2015-08-18 14:42:59',
  zutaten: [['Tequila', '1 1/2 oz '], ['Triple sec', '1/2 oz '], ['Lime juice', '1 oz '], ['Salt', null]] });
const AFTERGLOW = drink({ idDrink: '12560', strDrink: 'Afterglow', strCategory: 'Cocktail', strAlcoholic: 'Non alcoholic', strGlass: 'Highball Glass',
  strInstructions: 'Mix. Serve over ice.', strInstructionsDE: 'Mischen. Auf Eis servieren.', strInstructionsIT: 'Mescolare. Servire con ghiaccio.', 'strInstructionsZH-HANS': '混合。加冰饮用。',
  strDrinkThumb: BILD + 'vuquyv1468876052.jpg', dateModified: '2016-07-18 22:07:32',
  zutaten: [['Grenadine', '1 part '], ['Orange juice', '4 parts '], ['Pineapple juice', '4 parts ']] });
const OLD_FASHIONED = drink({ idDrink: '11001', strDrink: 'Old Fashioned', strTags: 'IBA,Classic,Alcoholic,Expensive,Savory', strCategory: 'Cocktail', strIBA: 'Unforgettables', strAlcoholic: 'Alcoholic', strGlass: 'Old-fashioned glass',
  strInstructions: 'Place sugar cube in old fashioned glass and saturate with bitters, add a dash of plain water. Muddle until dissolved.\r\nFill the glass with ice cubes and add whiskey.\r\n\r\nGarnish with orange twist, and a cocktail cherry.',
  strInstructionsDE: 'Zuckerwürfel in ein old fashioned Glas geben und mit Bitterstoffen sättigen, einen Schuss Wasser hinzufügen. Vermischen, bis sie sich auflösen.\r\nFüllen Sie das Glas mit Eiswürfeln und fügen Sie Whiskey hinzu.\r\n\r\nMit Orangenspirale und einer Cocktailkirsche garnieren.',
  strDrinkThumb: BILD + 'vrwquq1478252802.jpg', dateModified: '2016-11-04 09:46:42',
  zutaten: [['Bourbon', '4.5 cL'], ['Angostura bitters', '2 dashes'], ['Sugar', '1 cube'], ['Water', 'dash']] });
/* Ohne deutsche Anleitung; mit „1 1/2 oz“, „Juice of 1“, „2 dashes“, einem Zusatz, einer Zahl ohne Einheit, Text ohne Zahl. */
const SOUR = drink({ idDrink: '11129', strDrink: 'Boston Sour', strCategory: 'Ordinary Drink', strAlcoholic: 'Alcoholic', strGlass: 'Whiskey sour glass',
  strInstructions: 'Shake juice of lemon, powdered sugar, blended whiskey, and egg white with cracked ice and strain into a whiskey sour glass. Add the slice of lemon, top with the cherry, and serve.',
  strInstructionsES: 'Agite el zumo de limón, el azúcar, el whisky y la clara de huevo con hielo picado y cuele en un vaso. Añada la rodaja de limón, cubra con la cereza y sirva.',
  strDrinkThumb: BILD + 'kxlgbi1504366100.jpg', dateModified: '2017-09-02 16:28:20',
  zutaten: [['Blended whiskey', '1 1/2 oz '], ['Lemon', 'Juice of 1 '], ['Angostura bitters', '2 dashes '], ['Powdered sugar', '1 tsp superfine '], ['Egg white', '1 '], ['Lemon', '1 slice '], ['Cherry', '1 '], ['Soda water', 'Fill with ']] });
/* So kurz antwortet filter.php: Name, Bild, Nummer – sonst nichts. */
const GEKUERZT = { strDrink: 'Afterglow', strDrinkThumb: BILD + 'vuquyv1468876052.jpg', idDrink: '12560' };
const ALLE = [MARGARITA, AFTERGLOW, OLD_FASHIONED, SOUR];
const SPRACHEN = ['de', 'en', 'es', 'fr', 'it', 'pt', 'ru', 'zh'];

/* ── gestelltes Netz ── */
const json = (o, status = 200) => new Response(typeof o === 'string' ? o : JSON.stringify(o), { status, headers: { 'content-type': 'application/json' } });
function netz(antwort) { const rufe = []; return { rufe, hol: async (adresse, optionen) => { rufe.push({ adresse: String(adresse), optionen }); return antwort(String(adresse), rufe.length); } }; }

/* ── die alte App ── */
const ALT = altLaden(['parseAmt', 'fmtNum', 'scaleAmt', '_DB_BASE', '_DB_LANG_FIELD', '_DB_CAT_MAP', '_DISC_INGRX', '_DISC_UNITX', '_disTrIngredient', '_disTrUnit', '_discoverCatFor', 'discoverModalClose', 'discoverConfirmImport'], `
  const window = {}; let R = []; let CL = 'de'; let _discoverCat = null;
  const document = { querySelector() { return null; }, getElementById() { return null; } };
  const localStorage = { getItem() { return null; } };
  function sv() {} function render() {} function toast() {} function h(x) { return x; } function _discoverShow() {} async function _disTrAIBackground() {}
`);
async function altUebernehmen(d, sprache) {
  ALT.__lauf('R = []; CL = ' + JSON.stringify(sprache) + '; window._discoverPending = ' + JSON.stringify(d) + ';');
  await ALT.discoverConfirmImport();
  const r = schlicht(ALT.__lauf('R[0]'));
  assert.ok(r && r.name, 'die alte App hat nichts übernommen: ' + d.strDrink + ' / ' + sprache);
  return r;
}
const paket = (name) => JSON.parse(readFileSync(new URL('../../beispiele/' + name, import.meta.url), 'utf8')).recipes;

test('Adresse und Endpunkte: search.php?s=, lookup.php?i=, ohne Zugangsdaten und ohne Herkunftsangabe', async () => {
  assert.equal(E.BASIS, 'https://www.thecocktaildb.com/api/json/v1/1/');
  assert.equal(E.BASIS, ALT._DB_BASE, 'dieselbe Adresse wie die alte App');
  const n = netz(() => json({ drinks: [MARGARITA, SOUR] }));
  const l = await E.suche('  Piña  &  Margarita?  ', { hol: n.hol });
  assert.deepEqual(l.map((d) => d.strDrink), ['Margarita', 'Boston Sour']);
  assert.equal(n.rufe.length, 1);
  assert.equal(n.rufe[0].adresse, E.BASIS + 'search.php?s=' + encodeURIComponent('Piña & Margarita?'), 'Suchtext gekürzt um Leerraum und für die Adresse verpackt');
  assert.equal(n.rufe[0].optionen.credentials, 'omit'); assert.equal(n.rufe[0].optionen.referrerPolicy, 'no-referrer');
  const n2 = netz(() => json({ drinks: [MARGARITA] }));
  assert.equal((await E.nachschlagen('11007', { hol: n2.hol })).strDrink, 'Margarita');
  assert.equal((await E.nachschlagen(MARGARITA, { hol: n2.hol })).idDrink, '11007', 'auch der Datensatz selbst oder ein Treffer aus kurz() wird angenommen');
  assert.deepEqual(n2.rufe.map((r) => r.adresse), [E.BASIS + 'lookup.php?i=11007', E.BASIS + 'lookup.php?i=11007']);
});

test('ohne Suchtext geht nichts hinaus; eine fremde Nummer kommt nicht in die Adresse', async () => {
  const n = netz(() => json({ drinks: [MARGARITA] }));
  assert.deepEqual(await E.suche('', { hol: n.hol }), []); assert.deepEqual(await E.suche('   ', { hol: n.hol }), []); assert.deepEqual(await E.suche(null, { hol: n.hol }), []);
  for (const boese of ['', null, undefined, 'abc', '11007&x=1', '../11007', '1 OR 1', {}, { idDrink: 'x' }]) assert.equal(await E.nachschlagen(boese, { hol: n.hol }), null);
  assert.deepEqual(await E.nachKategorie('gibtsnicht', { hol: n.hol }), []); assert.deepEqual(await E.nachKategorie('constructor', { hol: n.hol }), []);
  assert.equal(n.rufe.length, 0, 'kein einziger Abruf');
  assert.equal(await E.nachschlagen('17222', { hol: n.hol }), null, 'die Datenbank schickt einen ANDEREN Drink als gefragt: nicht angenommen');
  const lang = netz(() => json({ drinks: [] })); await E.suche('x'.repeat(500), { hol: lang.hol });
  assert.equal(lang.rufe[0].adresse, E.BASIS + 'search.php?s=' + 'x'.repeat(80), 'der Suchtext ist gedeckelt');
});

test('leere Antworten sind eine leere Liste: drinks null, „None Found“, leerer Körper, kaputte Einträge', async () => {
  for (const a of [{ drinks: null }, { drinks: 'None Found' }, { drinks: [] }, {}, '', '   ', { drinks: [null, 'x', { strDrink: 'ohne Nummer' }, { idDrink: 'abc', strDrink: 'Nummer ist keine Zahl' }] }]) {
    const n = netz(() => json(a));
    assert.deepEqual(await E.suche('zzzz', { hol: n.hol }), [], JSON.stringify(a)); assert.equal(n.rufe.length, 1);
  }
  assert.equal(await E.nachschlagen('99999999', { hol: netz(() => json({ drinks: null })).hol }), null, 'unbekannte Nummer');
  const gemischt = await E.suche('m', { hol: netz(() => json({ drinks: [null, MARGARITA, { strDrink: 'kaputt' }] })).hol });
  assert.deepEqual(gemischt.map((d) => d.idDrink), ['11007'], 'nur lesbare Einträge bleiben');
});

test('Fehler mit Klartext: kein Netz, keine Antwort, HTTP-Fehler, zu viele Anfragen, unlesbare Antwort (de und en)', async () => {
  const keinNetz = async () => { throw new TypeError('Failed to fetch'); };
  await assert.rejects(E.suche('margarita', { hol: keinNetz }), (f) => f.netz === true && /^Keine Verbindung zu thecocktaildb\.com\. Bitte die Internetverbindung prüfen\.$/.test(f.message));
  await assert.rejects(E.suche('margarita', { hol: keinNetz, sprache: 'en' }), (f) => f.netz === true && /^No connection to thecocktaildb\.com/.test(f.message));
  await assert.rejects(E.suche('margarita', { hol: keinNetz, sprache: 'fr' }), (f) => /^No connection to thecocktaildb\.com/.test(f.message), 'ohne Tabelle steht Englisch da, nie ein Schlüsselname');
  await assert.rejects(E.nachschlagen('11007', { hol: keinNetz }), /Keine Verbindung/);
  await assert.rejects(E.nachKategorie('mock', { hol: keinNetz }), /Keine Verbindung/);
  const haengt = (adresse, o) => new Promise((_, nein) => o.signal.addEventListener('abort', () => { const e = new Error('abgebrochen'); e.name = 'AbortError'; nein(e); }));
  await assert.rejects(E.suche('margarita', { hol: haengt, zeitMs: 5 }), (f) => f.netz === true && f.message === 'thecocktaildb.com antwortet nicht.');
  await assert.rejects(E.suche('margarita', { hol: async () => json({ fehler: 1 }, 500) }), (f) => f.status === 500 && f.message === 'thecocktaildb.com antwortet mit einem Fehler (HTTP 500).');
  await assert.rejects(E.suche('margarita', { hol: async () => json('', 429), sprache: 'en' }), (f) => f.status === 429 && /too many/.test(f.message));
  await assert.rejects(E.suche('margarita', { hol: async () => json('', 429) }), /zu viele in kurzer Zeit/);
  await assert.rejects(E.suche('margarita', { hol: async () => json('<html><body>Just a moment…</body></html>') }), (f) => f.message === 'Die Antwort von thecocktaildb.com war nicht lesbar.' && !f.netz);
  await assert.rejects(E.suche('margarita', { hol: async () => ({ ok: true, status: 200, text: async () => { throw new TypeError('terminated'); } }) }), /Keine Verbindung/, 'die Verbindung reißt beim Lesen ab');
});

test('Zufall: sechs Abrufe von random.php, Doppelte fallen weg, einzelne dürfen scheitern, alle gescheitert ist ein Fehler', async () => {
  const folge = [MARGARITA, AFTERGLOW, MARGARITA, OLD_FASHIONED, SOUR, AFTERGLOW];
  const n = netz((a, nr) => json({ drinks: [folge[nr - 1]] }));
  assert.deepEqual((await E.zufall({ hol: n.hol })).map((d) => d.strDrink), ['Margarita', 'Afterglow', 'Old Fashioned', 'Boston Sour']);
  assert.equal(n.rufe.length, 6); assert.ok(n.rufe.every((r) => r.adresse === E.BASIS + 'random.php'));
  const drei = netz(() => json({ drinks: [MARGARITA] })); await E.zufall({ hol: drei.hol, anzahl: 3 }); assert.equal(drei.rufe.length, 3);
  const halb = netz((a, nr) => { if (nr % 2) throw new TypeError('Failed to fetch'); return json({ drinks: [folge[nr - 1]] }); });
  assert.deepEqual((await E.zufall({ hol: halb.hol })).map((d) => d.strDrink), ['Afterglow', 'Old Fashioned'], 'was ankam, wird gezeigt');
  await assert.rejects(E.zufall({ hol: async () => { throw new TypeError('Failed to fetch'); } }), (f) => f.netz === true && /Keine Verbindung zu thecocktaildb\.com/.test(f.message));
  assert.deepEqual(await E.zufall({ hol: async () => json({ drinks: null }) }), [], 'nichts geliefert, aber auch kein Fehler');
});

test('Filter nach Kategorie: wie _DB_CAT_MAP (plus Bowlen), filter.php?a= oder ?c=, höchstens zwölf, gemischt', async () => {
  const alt = schlicht(ALT._DB_CAT_MAP), neu = Object.fromEntries(Object.entries(E.KAT_FILTER).map(([k, v]) => [k, { type: v.art, val: v.wert }]));
  const { bowle, ...ohneBowle } = neu;
  assert.deepEqual(ohneBowle, alt); assert.deepEqual(bowle, { type: 'category', val: 'Punch / Party Drink' });
  const ids = new Set(KATEGORIEN.map((c) => c.id)); for (const k of Object.keys(E.KAT_FILTER)) assert.ok(ids.has(k), 'Filter für eine Kategorie, die es nicht gibt: ' + k);
  const viele = Array.from({ length: 30 }, (_, i) => ({ strDrink: 'Drink ' + i, strDrinkThumb: BILD + i + '.jpg', idDrink: String(1000 + i) }));
  const n = netz(() => json({ drinks: viele }));
  let s = 1; const wuerfel = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const a = await E.nachKategorie('mock', { hol: n.hol, wuerfel });
  assert.equal(n.rufe[0].adresse, E.BASIS + 'filter.php?a=Non_Alcoholic');
  assert.equal(a.length, 12); assert.equal(new Set(a.map((d) => d.idDrink)).size, 12, 'keiner doppelt');
  assert.notDeepEqual(a.map((d) => d.idDrink), viele.slice(0, 12).map((d) => d.idDrink), 'gemischt, nicht die ersten zwölf');
  await E.nachKategorie('smooth', { hol: n.hol }); await E.nachKategorie('tee', { hol: n.hol, anzahl: 5 });
  assert.equal(n.rufe[1].adresse, E.BASIS + 'filter.php?c=' + encodeURIComponent('Milk / Float / Shake')); assert.equal(n.rufe[2].adresse, E.BASIS + 'filter.php?c=Coffee%20%2F%20Tea');
  assert.equal((await E.nachKategorie('ckt', { hol: n.hol, anzahl: 5 })).length, 5);
  assert.deepEqual(await E.nachKategorie('limo', { hol: async () => json('') }), [], 'leere Antwort der Datenbank');
});

test('Wörterbücher und Sprach-Felder: wörtlich wie in der alten App', () => {
  assert.deepEqual(schlicht(E.ZUTAT_WOERTER), schlicht(ALT._DISC_INGRX)); assert.deepEqual(schlicht(E.MASS_WOERTER), schlicht(ALT._DISC_UNITX));
  assert.deepEqual(schlicht(E.ANLEITUNG_FELD), schlicht(ALT._DB_LANG_FIELD));
  assert.ok(Object.keys(E.ZUTAT_WOERTER).length >= 90 && E.MASS_WOERTER.length >= 35, 'der Vergleich hat etwas verglichen');
  let n = 0;
  for (const l of SPRACHEN) for (const name of [...Object.keys(E.ZUTAT_WOERTER), 'LIME JUICE', ' Vodka ', 'Blended whiskey', 'Godiva liqueur', 'constructor', 'toString', '']) {
    assert.equal(E.zutatName(name, l), ALT._disTrIngredient(name, l) || name.replace(/\s+/g, ' ').trim(), `${name} / ${l}`); n++;
  }
  assert.ok(n > 700);
  assert.equal(E.zutatName('Lime juice', 'de'), 'Limettensaft'); assert.equal(E.zutatName('Lime juice', 'en'), 'Lime juice'); assert.equal(E.zutatName('Blended whiskey', 'de'), 'Blended whiskey', 'unbekannt bleibt, wie geliefert');
});

test('Mengen zerlegen: Zahl, Einheit und Zusatz – „1 1/2 oz“, „Juice of 1“, „2 dashes“ und die übrigen Schreibweisen', () => {
  const f = (s, l = 'de') => { const m = E.mengeZerlegen(s, l); return [m.amt, m.unit, m.zusatz]; };
  const soll = {
    '1 1/2 oz ': ['1 1/2', 'oz', ''], '1/2 oz ': ['1/2', 'oz', ''], '1 oz ': ['1', 'oz', ''], '1.5 oz': ['1.5', 'oz', ''], '½ oz': ['½', 'oz', ''], '2-3 oz': ['2-3', 'oz', ''], '2 ounces': ['2', 'Unzen', ''],
    'Juice of 1': ['1', '', 'Saft'], 'Juice of 1/2 ': ['1/2', '', 'Saft'], 'juice of 2': ['2', '', 'Saft'],
    '2 dashes ': ['2', 'Spritzer', ''], '1 dash': ['1', 'Spritzer', ''], '1-2 dash': ['1-2', 'Spritzer', ''], dash: ['Spritzer', '', ''],
    '4.5 cL': ['4.5', 'cl', ''], '5 cl': ['5', 'cl', ''], '50 ml': ['50', 'ml', ''], '1 L': ['1', 'l', ''], '70ml/2fl oz': ['70', 'ml', ''], '50ml/1¾fl oz': ['50', 'ml', ''],
    '1 tsp ': ['1', 'TL', ''], '1 tblsp ': ['1', 'EL', ''], '1 tbsp': ['1', 'EL', ''], '1 cup ': ['1', 'Tasse', ''], '2 cups hot': ['2', 'Tassen', 'hot'], '3 drops': ['3', 'Tropfen', ''], '1 pinch': ['1', 'Prise', ''], '1 splash': ['1', 'Schuss', ''],
    '1 part ': ['1', 'Teil', ''], '4 parts ': ['4', 'Teile', ''], '1 shot': ['1', 'Shot', ''], '2 shots': ['2', 'Shots', ''], '1 can': ['1', 'Dose', ''], '1 cube': ['1', 'cube', ''], '2 slices': ['2', 'slices', ''],
    '1 tsp superfine ': ['1', 'TL', 'superfine'], '2 oz light': ['2', 'oz', 'light'], '12 oz frozen': ['12', 'oz', 'frozen'], '1 Fresh': ['1', '', 'Fresh'], '1 long strip': ['1', '', 'long strip'], '1 fifth': ['1', '', 'fifth'],
    1: ['1', '', ''], '2-3': ['2-3', '', ''], '1/2': ['1/2', '', ''],
    'Fill with': ['Fill with', '', ''], Top: ['Top', '', ''], 'Twist of ': ['Twist of', '', ''], Crushed: ['Crushed', '', ''], 'to taste': ['nach Geschmack', '', ''], 'Juice of a': ['Juice of a', '', ''], 'Juice of': ['Juice of', '', ''],
  };
  for (const [s, e] of Object.entries(soll)) assert.deepEqual(f(s), e, JSON.stringify(s));
  for (const leer of [null, undefined, '', '   ', '\n']) assert.deepEqual(f(leer), ['', '', '']);
  assert.deepEqual(f('Juice of 1', 'en'), ['1', '', 'juice']); assert.deepEqual(f('2 dashes ', 'en'), ['2', 'dashes', '']); assert.deepEqual(f('1 tblsp ', 'en'), ['1', 'tblsp', '']);
  /* beginnt `amt` mit einer Ziffer, steht dort NUR die Zahl (die App kann sie lesen); Text ohne Zahl bleibt ganz in `amt` */
  let mitZahl = 0, nurText = 0;
  for (const s of Object.keys(soll)) for (const l of SPRACHEN) {
    const m = E.mengeZerlegen(s, l), wo = `${JSON.stringify(s)} / ${l} → ${JSON.stringify(m)}`;
    if (/^[\d¼½¾⅓⅔⅛⅜⅝⅞]/.test(m.amt)) { assert.ok(!/\p{L}/u.test(m.amt), 'in amt steht mehr als die Zahl: ' + wo); assert.notEqual(mengeLesen(m.amt), null, wo); assert.equal(mengeUndEinheitTrennen(m.amt), null, wo); mitZahl++; }
    else { assert.equal(m.unit + m.zusatz, '', 'Text ohne Zahl bleibt ganz in amt: ' + wo); assert.ok(m.amt, wo); nurText++; }
  }
  assert.ok(mitZahl >= 300 && nurText >= 60, `${mitZahl} / ${nurText}`);
  /* nichts geht verloren: jedes Wort der Angabe steht danach in Menge, Einheit oder Zusatz (Englisch, also unübersetzt).
     Einzige Ausnahme: „70ml/2fl oz“ – dieselbe Menge ein zweites Mal, in einem anderen Maß. */
  for (const s of Object.keys(soll)) {
    if (/\d\s*ml\//.test(s)) continue;
    const m = E.mengeZerlegen(s, 'en'), danach = [m.amt, m.unit, m.zusatz].join(' ').toLowerCase();
    for (const wort of s.trim().toLowerCase().split(/\s+/)) if (wort !== 'of' || !m.zusatz) assert.ok(danach.includes(wort), `„${wort}“ aus ${JSON.stringify(s)} fehlt in ${JSON.stringify(m)}`);
  }
});

test('Mengen ohne Zahl: übersetzt wie _disTrUnit der alten App, in allen Sprachen', () => {
  let n = 0;
  for (const l of SPRACHEN) for (const s of ['dash', 'Dash', 'splash', 'to taste', 'Fill with', 'Top up with', 'Garnish with', 'Twist of', 'Crushed', 'cubes', 'Add a splash of', 'Chilled', 'a pinch', 'About 2 oz', 'Fill to top with ounces']) {
    assert.equal(E.mengeZerlegen(s, l).amt, ALT._disTrUnit(s, l), `${s} / ${l}`); assert.equal(E.mengeZerlegen(s, l).unit, ''); n++;
  }
  assert.ok(n >= 100);
});

test('Zutaten der Margarita: vollständig und richtig zerlegt, in Deutsch und Englisch', () => {
  const z = (d, l) => E.zutatenAusDb(d, l).map((x) => [x.amt, x.unit, x.name]);
  assert.deepEqual(z(MARGARITA, 'de'), [['1 1/2', 'oz', 'Tequila'], ['1/2', 'oz', 'Triple Sec'], ['1', 'oz', 'Limettensaft'], ['', '', 'Salz']]);
  assert.deepEqual(z(MARGARITA, 'en'), [['1 1/2', 'oz', 'Tequila'], ['1/2', 'oz', 'Triple sec'], ['1', 'oz', 'Lime juice'], ['', '', 'Salt']]);
  assert.deepEqual(z(AFTERGLOW, 'de'), [['1', 'Teil', 'Grenadine'], ['4', 'Teile', 'Orangensaft'], ['4', 'Teile', 'Ananassaft']]);
  assert.deepEqual(z(OLD_FASHIONED, 'de'), [['4.5', 'cl', 'Bourbon'], ['2', 'Spritzer', 'Angostura-Bitter'], ['1', 'cube', 'Zucker'], ['Spritzer', '', 'Wasser']]);
  assert.deepEqual(z(SOUR, 'de'), [['1 1/2', 'oz', 'Blended whiskey'], ['1', '', 'Zitrone (Saft)'], ['2', 'Spritzer', 'Angostura-Bitter'], ['1', 'TL', 'Powdered sugar (superfine)'], ['1', '', 'Eiweiß'], ['1', 'slice', 'Zitrone'], ['1', '', 'Kirsche'], ['Fill with', '', 'Sodawasser']]);
  assert.deepEqual(z(SOUR, 'en')[1], ['1', '', 'Lemon (juice)']);
  for (const d of ALLE) for (const l of SPRACHEN) for (const x of E.zutatenAusDb(d, l)) assert.deepEqual(Object.keys(x).sort(), ['amt', 'ck', 'id', 'name', 'note', 'unit'], 'genau die Felder einer Zutat der App');
  assert.deepEqual(E.zutatenAusDb(SOUR, 'de').map((x) => x.id), [0, 1, 2, 3, 4, 5, 6, 7]);
  /* alle 15 Plätze, Lücken, Menge ohne Namen, Leerraum */
  const voll = drink({ idDrink: '1', strDrink: 'Voll', zutaten: Array.from({ length: 15 }, (_, i) => ['Zutat ' + (i + 1), (i + 1) + ' oz']) });
  assert.equal(E.zutatenAusDb(voll, 'de').length, 15); assert.deepEqual([E.zutatenAusDb(voll, 'de')[14].amt, E.zutatenAusDb(voll, 'de')[14].name], ['15', 'Zutat 15']);
  const luecke = drink({ idDrink: '2', strDrink: 'Lücke', zutaten: [['Gin', '2 oz'], [null, '1 oz'], ['  ', null], ['Tonic water', ' Fill  with '], ['', ''], ['Lime', '1 wedge\r\n']] });
  assert.deepEqual(z(luecke, 'de'), [['2', 'oz', 'Gin'], ['Fill with', '', 'Tonic Water'], ['1', 'wedge', 'Limette']], 'eine Lücke beendet die Liste nicht (alt: break)');
});

test('gegen die alte App: Name, Nummer, Schritte, Zutaten-Namen und einfache Mengen – jede Antwort in jeder Sprache', async () => {
  let gleich = 0, rechenbar = 0, mitZusatz = 0;
  for (const d of ALLE) for (const l of SPRACHEN) {
    const alt = await altUebernehmen(d, l), neu = E.getraenkAusDb(d, { sprache: l, jetzt: 7 }), wo = `${d.strDrink} / ${l}`;
    assert.equal(neu.name, alt.name, wo); assert.equal(neu.dbId, alt.dbId, wo); assert.equal(neu.dbSource, alt.dbSource, wo); assert.equal(neu.alcohol, alt.alcohol, wo); assert.equal(neu.cat, alt.cat, wo);
    assert.deepEqual(neu.steps.map((s) => s.txt), alt.steps.map((s) => s.txt), 'Schritte ' + wo);
    assert.equal(neu.ings.length, alt.ings.length, wo);
    alt.ings.forEach((a, i) => {
      const roh = d['strIngredient' + (i + 1)], m = E.mengeZerlegen(d['strMeasure' + (i + 1)], l), meins = [m.amt, m.unit].filter(Boolean).join(' ');
      assert.equal(E.zutatName(roh, l), a.name, 'Zutat ' + wo);
      if (m.zusatz) { assert.equal(neu.ings[i].name, `${a.name} (${m.zusatz})`, wo); mitZusatz++; return; }
      assert.equal(neu.ings[i].name, a.name, wo);
      if (meins.toLowerCase() === a.amt.toLowerCase()) { gleich++; return; }
      /* die einzige erlaubte Abweichung: eine rechenbare Einheit bleibt rechenbar (alt: „унц.“, „盎司“, „сл“ …) */
      assert.ok(['ml', 'cl', 'oz'].includes(einheitKennung(m.unit)) && volumenUmrechnen(m.amt, m.unit, 'ml') !== null && mengeUndEinheitTrennen(a.amt) === null, `Menge weicht ab: ${wo}: neu „${meins}“, alt „${a.amt}“`);
      rechenbar++;
    });
  }
  assert.deepEqual({ gleich, mitZusatz, rechenbar }, { gleich: 126, mitZusatz: 16, rechenbar: 10 }, '19 Zutaten × 8 Sprachen = 152: zwei Zusätze in SOUR je Sprache, fünf oz/cl-Mengen in ru und zh');
  /* was die alte App anders ablegte – festgenagelt mit ihren Werten */
  const alt = await altUebernehmen(MARGARITA, 'de'), neu = E.getraenkAusDb(MARGARITA, { sprache: 'de' });
  assert.deepEqual([alt.ings[0].amt, alt.ings[0].unit], ['1 1/2 oz', '']); assert.deepEqual([neu.ings[0].amt, neu.ings[0].unit], ['1 1/2', 'oz']);
  assert.equal(ALT.scaleAmt(alt.ings[0].amt, 2).scaled, '2', 'alt (scaleAmt der alten App): beim Verdoppeln fielen Bruch und Einheit weg');
  assert.equal(mengeSkalieren(alt.ings[0].amt, 2).menge, '2', 'und die neue Schicht rechnete mit der alten Ablage genauso falsch');
  assert.deepEqual([alt.servings, neu.servings], [2, 1]); assert.deepEqual([alt.prepTime, neu.prepTime], [0, null]); assert.deepEqual([alt.glass, neu.glass], ['Cocktail glass', 'martini']);
  assert.deepEqual([alt.img, neu.img], [MARGARITA.strDrinkThumb, ''], 'kein Bild von fremder Adresse im Getränk');
  assert.deepEqual([(await altUebernehmen(SOUR, 'de')).ings[1].amt, (await altUebernehmen(SOUR, 'de')).ings[1].name], ['Juice of 1', 'Zitrone']);
  assert.deepEqual([(await altUebernehmen(MARGARITA, 'ru')).ings[0].amt, E.getraenkAusDb(MARGARITA, { sprache: 'ru' }).ings[0].unit], ['1 1/2 унц.', 'oz']);
});

test('Sprache der Anleitung: die gewünschte, sonst Englisch – und es steht dabei, was geliefert wurde', () => {
  assert.equal(E.anleitung(MARGARITA, 'de').sprache, 'de'); assert.ok(E.anleitung(MARGARITA, 'de').text.startsWith('Reiben Sie den Rand'));
  assert.ok(E.anleitung(MARGARITA, 'fr').text.startsWith('Frotter le bord')); assert.ok(E.anleitung(MARGARITA, 'es').text.startsWith('Frota el borde'));
  assert.deepEqual([E.anleitung(MARGARITA, 'en').sprache, E.anleitung(MARGARITA, 'en').text.slice(0, 11)], ['en', 'Rub the rim'], 'Englisch bleibt Englisch, auch wenn es Deutsch gäbe');
  for (const l of ['pt', 'ru', 'zh', 'xx']) assert.deepEqual([E.anleitung(MARGARITA, l).sprache, E.anleitung(MARGARITA, l).text.slice(0, 11)], ['en', 'Rub the rim'], 'Rückfall Englisch: ' + l);
  assert.deepEqual(E.anleitung(AFTERGLOW, 'zh'), { text: '混合。加冰饮用。', sprache: 'zh' }, 'das Feld mit Bindestrich (strInstructionsZH-HANS) wird gelesen');
  assert.equal(E.anleitung(SOUR, 'de').sprache, 'en', 'ohne deutsche Anleitung: Englisch');
  assert.ok(E.getraenkAusDb(SOUR, { sprache: 'de' }).steps[0].txt.startsWith('Shake juice of lemon'));
  assert.ok(E.getraenkAusDb(SOUR, { sprache: 'es' }).steps[0].txt.startsWith('Agite el zumo'));
  assert.equal(E.anleitung(drink({ idDrink: '3', strInstructions: 'Stir.', strInstructionsDE: '  \r\n ' }), 'de').sprache, 'en', 'ein leeres deutsches Feld zählt nicht');
  assert.deepEqual(E.anleitung(drink({ idDrink: '3' }), 'de'), { text: '', sprache: '' });
  assert.deepEqual(E.getraenkAusDb(MARGARITA, { sprache: 'de' }).steps.map((s) => s.txt), ['Reiben Sie den Rand des Glases mit der Limettenscheibe, damit das Salz daran haftet.', 'Achten Sie darauf, dass nur der äußere Rand angefeuchtet wird und streuen Sie das Salz darauf.', 'Das Salz sollte sich auf den Lippen des Genießers befinden und niemals in den Cocktail einmischen.', 'Die anderen Zutaten mit Eis schütteln und vorsichtig in das Glas geben.']);
  assert.deepEqual(E.getraenkAusDb(MARGARITA, { sprache: 'de' }).steps.map((s) => s.id), [0, 1, 2, 3]);
  assert.deepEqual(E.schritteAus('1. Fill glass with ice\r\n2. Add vodka\r\n3. Stir').map((s) => s.txt), ['Fill glass with ice', 'Add vodka', 'Stir'], 'Zeilen sind Schritte, auch ohne Satzzeichen');
  assert.deepEqual(E.schritteAus('Add 1.5 oz vodka. Stir!  Serve?').map((s) => s.txt), ['Add 1.5 oz vodka.', 'Stir!', 'Serve?']);
  assert.deepEqual(E.schritteAus('Mix'), [{ id: 0, txt: 'Mix' }]); assert.deepEqual(E.schritteAus(''), []); assert.deepEqual(E.schritteAus(null), []);
  assert.deepEqual(E.nochEnglisch(SOUR, 'de'), { zutaten: ['Blended whiskey', 'Powdered sugar'], anleitung: true });
  assert.deepEqual(E.nochEnglisch(MARGARITA, 'de'), { zutaten: [], anleitung: false }); assert.deepEqual(E.nochEnglisch(SOUR, 'en'), { zutaten: [], anleitung: false });
  assert.deepEqual(E.nochEnglisch(MARGARITA, 'pt'), { zutaten: [], anleitung: true });
});

test('Treffer für die Liste (kurz): Nummer, Name, Vorschaubild, Kategorie, Glas, Alkohol, die ersten vier Zutaten', () => {
  assert.deepEqual(E.kurz(MARGARITA), { id: '11007', name: 'Margarita', bild: BILD + '5noda61589575158.jpg/preview', kategorie: 'ckt', glas: 'martini', alkohol: true, zutaten: ['Tequila', 'Triple Sec', 'Limettensaft', 'Salz'], voll: true });
  assert.deepEqual(E.kurz(AFTERGLOW, { sprache: 'en' }), { id: '12560', name: 'Afterglow', bild: BILD + 'vuquyv1468876052.jpg/preview', kategorie: 'mock', glas: 'highball', alkohol: false, zutaten: ['Grenadine', 'Orange juice', 'Pineapple juice'], voll: true });
  assert.equal(E.kurz(SOUR).zutaten.length, 4); assert.equal(E.kurz(SOUR).glas, 'Whiskey sour glass');
  assert.deepEqual(E.kurz(GEKUERZT), { id: '12560', name: 'Afterglow', bild: BILD + 'vuquyv1468876052.jpg/preview', kategorie: '', glas: '', alkohol: null, zutaten: [], voll: false }, 'gekürzter Treffer: was nicht dasteht, wird nicht geraten');
  assert.equal(E.kurz(GEKUERZT, { kategorie: 'mock' }).kategorie, 'mock', 'die gewählte Filter-Kategorie gilt (alt: _discoverCat)');
  assert.equal(E.istVoll(GEKUERZT), false); assert.equal(E.istVoll(MARGARITA), true); assert.equal(E.istVoll(null), false);
  assert.equal(E.bildAdresse(MARGARITA), MARGARITA.strDrinkThumb); assert.equal(E.bildAdresse(drink({ idDrink: '4' })), '');
  assert.equal(E.kurz({ idDrink: 5, strDrink: '  Zwei   Worte ', strDrinkThumb: 'https://boese.example/x.jpg' }).bild, '', 'ein Bild von einer fremden Adresse wird nicht gezeigt');
  assert.equal(E.kurz({ idDrink: 5, strDrink: '  Zwei   Worte ' }).name, 'Zwei Worte'); assert.equal(E.kurz({ idDrink: 5 }).id, '5');
});

test('Alkohol-Kennzeichen: wie die Beispielpakete (alcohol true/false); „Optional alcohol“ und fehlende Angabe', async () => {
  assert.equal(E.alkoholAusDb({ strAlcoholic: 'Alcoholic' }), true); assert.equal(E.alkoholAusDb({ strAlcoholic: 'Non alcoholic' }), false); assert.equal(E.alkoholAusDb({ strAlcoholic: 'Non_Alcoholic' }), false);
  assert.equal(E.alkoholAusDb({ strAlcoholic: 'Optional alcohol' }), true); assert.equal(E.alkoholAusDb({ strAlcoholic: null }), null); assert.equal(E.alkoholAusDb({}), null); assert.equal(E.alkoholAusDb({ strAlcoholic: 'etwas anderes' }), null);
  const m = E.getraenkAusDb(MARGARITA), a = E.getraenkAusDb(AFTERGLOW);
  assert.strictEqual(m.alcohol, true); assert.strictEqual(a.alcohol, false); assert.equal(hatAlkohol(m), true); assert.equal(hatAlkohol(a), false);
  assert.deepEqual(filterOhneAlkohol([m, a], true).map((r) => r.name), ['Afterglow'], 'der Schalter „Ohne Alkohol“ blendet die Margarita aus');
  for (const r of paket('getraenke-mit-alkohol-fuer-mixarium.json').concat(paket('getraenke-ohne-alkohol-start.json'))) assert.equal(typeof r.alcohol, typeof m.alcohol, 'so tragen es die Beispielpakete: ' + r.name);
  const wahlweise = drink({ idDrink: '12890', strDrink: 'Apple Cider Punch', strCategory: 'Punch / Party Drink', strAlcoholic: 'Optional alcohol', strGlass: 'Collins Glass', strInstructions: 'Combine all and serve chilled.', zutaten: [['Apple cider', '4 qt '], ['Brown sugar', '1 cup '], ['Rum', '1 fifth ']] });
  assert.strictEqual(E.getraenkAusDb(wahlweise).alcohol, true); assert.strictEqual((await altUebernehmen(wahlweise, 'de')).alcohol, false, 'die alte App nannte es alkoholfrei');
  const ohneAngabe = (zutat) => drink({ idDrink: '6', strDrink: 'Ohne Angabe', strInstructions: 'Stir well.', zutaten: [[zutat, '2 oz'], ['Orange juice', '4 oz']] });
  assert.strictEqual(E.getraenkAusDb(ohneAngabe('Vodka')).alcohol, true, 'keine Angabe: die Zutaten entscheiden');
  assert.strictEqual(E.getraenkAusDb(ohneAngabe('Ginger beer')).alcohol, false); assert.equal(E.getraenkAusDb(ohneAngabe('Ginger beer')).cat, '', 'und die Kategorie wird ohne Angabe nicht geraten');
  assert.equal(E.sicherOhneAlkohol(AFTERGLOW), true); assert.equal(E.sicherOhneAlkohol(MARGARITA), false); assert.equal(E.sicherOhneAlkohol(wahlweise), false); assert.equal(E.sicherOhneAlkohol(GEKUERZT), false, 'keine Angabe ist nicht sicher');
  assert.equal(E.sicherOhneAlkohol(drink({ idDrink: '7', strDrink: 'Falsch beschriftet', strAlcoholic: 'Non alcoholic', zutaten: [['Vodka', '2 oz']] })), false, 'alkoholfrei genannt, aber Wodka in den Zutaten');
});

test('Kategorie: liegt in der Liste der App oder ist leer – nichts wird geraten', () => {
  const ids = new Set(KATEGORIEN.map((c) => c.id));
  const dbKats = ['Ordinary Drink', 'Cocktail', 'Shake', 'Milk / Float / Shake', 'Other / Unknown', 'Other/Unknown', 'Cocoa', 'Shot', 'Coffee / Tea', 'Homemade Liqueur', 'Punch / Party Drink', 'Beer', 'Soft Drink', 'Soft Drink / Soda', 'Etwas Neues', '', null];
  const alks = ['Alcoholic', 'Non alcoholic', 'Optional alcohol', null];
  let gleich = 0; const anders = [];
  for (const k of dbKats) for (const a of alks) {
    const d = { strCategory: k, strAlcoholic: a }, neu = E.kategorieAusDb(d), alt = ALT._discoverCatFor(d);
    assert.ok(neu === '' || ids.has(neu), `${k} / ${a} → ${neu}`);
    if (neu === alt) gleich++; else anders.push(`${k}|${a}|${alt}→${neu}`);
  }
  assert.ok(gleich >= 40, 'gleich wie _discoverCatFor: ' + gleich);
  /* die benannten Abweichungen, vollständig: Bowlen statt Cocktail/Limonade · „Optional alcohol“ zählt als mit Alkohol · ohne Angabe leer */
  for (const z of anders) { const [k, a, wechsel] = z.split('|'); assert.ok((k.includes('Punch') && wechsel.endsWith('→bowle')) || (a === 'Optional alcohol' && wechsel === 'mock→ckt') || (a === 'null' && wechsel === 'mock→'), 'unbenannte Abweichung: ' + z); }
  assert.equal(anders.filter((z) => z.includes('Punch')).length, 4); assert.equal(anders.filter((z) => z.endsWith('|mock→ckt')).length, 10); assert.equal(anders.filter((z) => z.endsWith('|mock→')).length, 10); assert.equal(anders.length, 24);
  assert.equal(E.kategorieAusDb({ strCategory: 'Coffee / Tea', strAlcoholic: 'Alcoholic' }), 'tee'); assert.equal(E.kategorieAusDb({ strCategory: 'Shake', strAlcoholic: 'Non alcoholic' }), 'smooth');
  assert.equal(E.kategorieAusDb({ strCategory: 'Soft Drink', strAlcoholic: 'Non alcoholic' }), 'limo'); assert.equal(E.kategorieAusDb({ strCategory: 'Homemade Liqueur', strAlcoholic: 'Alcoholic' }), 'sirup');
  assert.equal(E.kategorieAusDb(GEKUERZT), '', 'gekürzter Datensatz: keine Kategorie');
  /* die Liste der App entscheidet: [{id,name}] wie scanKats() in neu/app.mjs, oder Kennungen */
  const meine = [{ id: 'mock', name: 'Mocktails' }, { id: 'eig_1789556014817', name: 'Sushi' }];
  assert.equal(E.getraenkAusDb(MARGARITA, { kategorien: meine }).cat, '', 'Cocktails gibt es in dieser Liste nicht → leer, nicht „Mocktails“');
  assert.equal(E.getraenkAusDb(AFTERGLOW, { kategorien: meine }).cat, 'mock'); assert.equal(E.kategorieAusDb(MARGARITA, ['ckt', 'mock']), 'ckt'); assert.equal(E.kategorieAusDb(MARGARITA, []), '');
  assert.equal(E.getraenkAusDb(MARGARITA, { kategorien: meine, kategorie: 'eig_1789556014817' }).cat, 'eig_1789556014817', 'die Wahl des Nutzers gilt, wenn die App sie kennt');
  assert.equal(E.getraenkAusDb(AFTERGLOW, { kategorien: meine, kategorie: 'gibtsnicht' }).cat, 'mock', 'eine unbekannte Wahl wird nicht übernommen');
  assert.equal(E.getraenkAusDb(MARGARITA, { kategorie: '' }).cat, '', "'' ist die ausdrückliche Wahl „ohne Kategorie“"); assert.equal(E.getraenkAusDb(MARGARITA, { kategorie: null }).cat, 'ckt', 'null und undefined heißen: keine Wahl'); assert.equal(E.getraenkAusDb(MARGARITA, {}).cat, 'ckt');
  const mitUnechten = [{ id: '__ohne' }, { id: 'all' }, { id: 'fld_7' }, { id: '' }, { id: 'mock' }];
  for (const unecht of ['__ohne', 'all', 'fld_7']) assert.equal(E.getraenkAusDb(AFTERGLOW, { kategorien: mitUnechten, kategorie: unecht }).cat, 'mock', '„Alle“, „Ohne Kategorie“ und Ordner sind keine Kategorie: ' + unecht);
  assert.equal(E.getraenkAusDb(MARGARITA, { kategorie: 'afckt' }).cat, 'afckt'); assert.strictEqual(E.getraenkAusDb(MARGARITA, { kategorie: 'afckt' }).alcohol, true, 'die Kategorie ändert das Alkohol-Kennzeichen nicht');
  for (const d of ALLE) for (const l of SPRACHEN) { const c = E.getraenkAusDb(d, { sprache: l }).cat; assert.ok(c === '' || ids.has(c)); }
});

test('Glas: die Kennung der App, wenn es das Glas dort gibt; sonst der Text der Datenbank', () => {
  const bekannt = { 'Highball glass': 'highball', 'Highball Glass': 'highball', 'Cocktail glass': 'martini', 'Martini Glass': 'martini', 'Old-fashioned glass': 'tumbler', 'Old-Fashioned Glass': 'tumbler', 'Whiskey Glass': 'tumbler', 'Shot glass': 'shot', 'Wine Glass': 'wine', 'White wine glass': 'wine', 'Coffee mug': 'mug', 'Irish coffee cup': 'mug', 'Copper Mug': 'mug' };
  for (const [g, id] of Object.entries(bekannt)) { assert.equal(E.glasAusDb({ strGlass: g }), id, g); assert.ok(istBekanntesGlas(id), 'keine Kennung der App: ' + id); }
  for (const g of ['Collins glass', 'Champagne flute', 'Whiskey sour glass', 'Punch bowl', 'Hurricane glass', 'Margarita/Coupette glass', 'Pint glass', 'Jar', 'Beer mug', 'Brandy snifter']) { assert.equal(E.glasAusDb({ strGlass: g }), g, g); assert.equal(istBekanntesGlas(g), false); }
  assert.equal(E.glasAusDb({ strGlass: '  Collins   glass ' }), 'Collins glass'); assert.equal(E.glasAusDb({ strGlass: null }), ''); assert.equal(E.glasAusDb({}), '');
  assert.equal(E.getraenkAusDb(AFTERGLOW).glass, 'highball'); assert.equal(E.getraenkAusDb(SOUR).glass, 'Whiskey sour glass');
});

test('dbId und schonDa: ein übernommener Drink wird beim zweiten Mal wiedergefunden', () => {
  const g = E.getraenkAusDb(MARGARITA, { jetzt: 1234 });
  assert.strictEqual(g.dbId, '11007'); assert.equal(g.dbSource, 'thecocktaildb'); assert.equal(g.source, 'https://www.thecocktaildb.com/drink/11007-Margarita'); assert.deepEqual([g.created, g.modified], [1234, 1234]);
  assert.strictEqual(E.getraenkAusDb({ ...MARGARITA, idDrink: 11007 }).dbId, '11007', 'die Nummer ist immer Text, wie in der alten App (String(d.idDrink))');
  const sammlung = [{ uid: 'a', name: 'Eigener Drink' }, { uid: 'b', id: 11007, name: 'trägt die Nummer nur als lokale id' }, { uid: 'c', ...g }, { uid: 'd', name: 'andere Quelle', dbId: '12560', dbSource: 'woanders' }];
  assert.equal(E.schonDa(sammlung, MARGARITA).uid, 'c'); assert.equal(E.schonDa(sammlung, '11007').uid, 'c'); assert.equal(E.schonDa(sammlung, 11007).uid, 'c');
  assert.equal(E.schonDa(sammlung, E.kurz(MARGARITA)).uid, 'c', 'auch mit einem Treffer aus kurz()'); assert.equal(E.schonDa(sammlung, g).uid, 'c', 'auch mit dem Getränk selbst');
  assert.equal(E.schonDa(sammlung, AFTERGLOW), undefined, 'dieselbe Nummer aus einer anderen Quelle zählt nicht'); assert.equal(E.schonDa(sammlung, SOUR), undefined);
  assert.equal(E.schonDa([], MARGARITA), undefined); assert.equal(E.schonDa(null, MARGARITA), undefined); assert.equal(E.schonDa(sammlung, null), undefined); assert.equal(E.schonDa(sammlung, {}), undefined);
  /* kein Doppel beim zweiten Übernehmen: so, wie die Oberfläche es tun wird */
  const buch = []; for (const d of [MARGARITA, AFTERGLOW, MARGARITA, MARGARITA]) if (!E.schonDa(buch, d)) buch.unshift(E.getraenkAusDb(d));
  assert.deepEqual(buch.map((r) => r.name), ['Afterglow', 'Margarita']);
  /* an echten Daten: das Beispielpaket trägt Drinks, die die alte App aus der Datenbank übernommen hat */
  const bsp = paket('getraenke-mit-alkohol-fuer-mixarium.json');
  assert.equal(E.schonDa(bsp, { idDrink: '17167' }).name, 'Himbeer-Cooler');   /* seit 26.11. die überarbeitete deutsche Fassung (Klaus' Rezeptbuch) */ assert.equal(E.schonDa(bsp, '178321').name, 'Amaretto Fizz'); assert.equal(E.schonDa(bsp, MARGARITA), undefined);
  assert.equal(E.quelleAdresse({ idDrink: '17207', strDrink: 'Piña Colada' }), 'https://www.thecocktaildb.com/drink/17207-Pina-Colada'); assert.equal(E.quelleAdresse({ idDrink: 'x', strDrink: 'Kein' }), '');
});

test('Form des Getränks: genau die Felder der Beispielpakete; die App muss nichts mehr trennen, kann rechnen und umrechnen', () => {
  const bsp = paket('getraenke-mit-alkohol-fuer-mixarium.json').concat(paket('getraenke-ohne-alkohol-start.json'));
  const bekannt = new Set(bsp.flatMap((r) => Object.keys(r)));
  for (const d of ALLE) for (const l of SPRACHEN) {
    const g = E.getraenkAusDb(d, { sprache: l, jetzt: 5 });
    assert.deepEqual(Object.keys(g).sort(), ['alcohol', 'cat', 'created', 'dbId', 'dbSource', 'flavors', 'glass', 'img', 'ings', 'modified', 'name', 'prepTime', 'servings', 'source', 'steps', 'tags']);
    for (const k of Object.keys(g)) assert.ok(bekannt.has(k), 'ein Feld, das kein Beispiel-Getränk trägt: ' + k);
    for (const s of g.steps) assert.deepEqual(Object.keys(s).sort(), ['id', 'txt']);
    assert.ok(g.ings.length && g.steps.length && g.steps.every((s) => s.txt.trim().length > 3) && g.ings.every((z) => z.name && z.note === '' && z.ck === false));
    const befund = {}, n = getraenkNormalisieren({ ...g, id: 1, uid: 'mx-probe' }, {}, befund);
    assert.equal(befund.zutatenGetrennt, undefined, `die Übernahme der App müsste noch trennen: ${d.strDrink} / ${l}`);
    assert.deepEqual(n.ings, g.ings); assert.deepEqual(n.steps, g.steps);
    for (const k of Object.keys(g)) assert.deepEqual(n[k], g[k], 'die App ändert das Feld beim Einsortieren: ' + k);
    assert.equal(n.uid, 'mx-probe'); assert.equal(n.servings, 1);
  }
  const g = E.getraenkAusDb(MARGARITA, { sprache: 'de' });
  assert.deepEqual(portionenSkalieren(g.ings, g.servings, 2).map((z) => [z.amt, z.unit]), [['3', 'oz'], ['1', 'oz'], ['2', 'oz'], ['', '']], 'zwei Portionen: die Einheit bleibt, der Bruch wird gerechnet');
  assert.deepEqual(volumenUmrechnen(g.ings[0].amt, g.ings[0].unit, 'ml'), { amt: '44', unit: 'ml', wert: 44 }); assert.deepEqual(volumenUmrechnen(g.ings[0].amt, g.ings[0].unit, 'cl'), { amt: '4.5', unit: 'cl', wert: 4.5 });
  for (const l of SPRACHEN) { const z = E.getraenkAusDb(MARGARITA, { sprache: l }).ings[0], o = E.getraenkAusDb(OLD_FASHIONED, { sprache: l }).ings[0];
    assert.equal(volumenUmrechnen(z.amt, z.unit, 'ml').amt, '44', 'oz bleibt rechenbar: ' + l); assert.equal(volumenUmrechnen(o.amt, o.unit, 'ml').amt, '45', 'cl bleibt rechenbar: ' + l); }
  assert.equal(volumenUmrechnen('1 1/2', 'унц.', 'ml'), null, 'so stand es in der alten App für Russisch – nicht umrechenbar');
});

test('getraenkAusDb lehnt ab, was kein vollständiger Drink ist – mit Klartext', () => {
  assert.throws(() => E.getraenkAusDb(GEKUERZT), /^Error: Zu diesem Drink fehlen Zutaten und Anleitung\. Bitte zuerst nachschlagen\.$/);
  assert.throws(() => E.getraenkAusDb(GEKUERZT, { sprache: 'en' }), /Please look it up first/);
  for (const d of [null, undefined, {}, { strDrink: 'Ohne Nummer', strInstructions: 'Stir.' }, { idDrink: '8', strInstructions: 'Stir.' }, { idDrink: 'abc', strDrink: 'x', strInstructions: 'Stir.' }, { idDrink: '8', strDrink: '   ', strInstructions: 'Stir.' }])
    assert.throws(() => E.getraenkAusDb(d), /Nummer oder Name fehlt/);
  assert.equal(E.getraenkAusDb({ idDrink: '8', strDrink: 'Nur Anleitung', strInstructions: 'Stir well.' }).ings.length, 0, 'eine Anleitung genügt');
  assert.equal(E.getraenkAusDb({ idDrink: '8', strDrink: 'Nur Zutaten', strIngredient1: 'Gin', strMeasure1: '2 oz' }).steps.length, 0, 'Zutaten genügen');
  const kopie = JSON.parse(JSON.stringify(MARGARITA)); E.getraenkAusDb(MARGARITA); E.kurz(MARGARITA); assert.deepEqual(MARGARITA, kopie, 'der Datensatz wird nicht verändert');
});

test('holeBild: eine eigene Kopie als data:-Adresse – oder leer, ohne Fehler', async () => {
  const bytes = new Uint8Array(700); bytes.set([0xff, 0xd8, 0xff, 0xe0]); for (let i = 4; i < bytes.length; i++) bytes[i] = (i * 37) % 256;
  const bild = (b, typ = 'image/jpeg', status = 200) => new Response(b, { status, headers: { 'content-type': typ } });
  const n = netz(() => bild(bytes));
  const adr = await E.holeBild(MARGARITA, { hol: n.hol });
  assert.ok(adr.startsWith('data:image/jpeg;base64,'));
  assert.deepEqual(new Uint8Array(Buffer.from(adr.split(',')[1], 'base64')), bytes, 'dieselben Bytes');
  assert.deepEqual(n.rufe.map((r) => r.adresse), [MARGARITA.strDrinkThumb], 'das ganze Bild, nicht die Vorschau'); assert.equal(n.rufe[0].optionen.credentials, 'omit'); assert.equal(n.rufe[0].optionen.referrerPolicy, 'no-referrer');
  assert.equal(E.getraenkAusDb(MARGARITA, { bild: adr }).img, adr, 'die Kopie steht im Getränk');
  const blob = await E.holeBild(MARGARITA, { hol: netz(() => bild(bytes)).hol, alsBlob: true });
  assert.ok(blob instanceof Blob && blob.type === 'image/jpeg' && blob.size === 700, 'zum Verkleinern: als Blob, wie bildAusDatei im Kern ihn nimmt');
  assert.deepEqual(new Uint8Array(await blob.arrayBuffer()), bytes); assert.equal(await E.holeBild(MARGARITA, { hol: async () => bild(bytes, 'image/jpeg', 500), alsBlob: true }), '');
  assert.equal(E.getraenkAusDb(MARGARITA, { bild: MARGARITA.strDrinkThumb }).img, '', 'eine fremde Adresse wird nicht als Bild abgelegt'); assert.equal(E.getraenkAusDb(MARGARITA, { bild: 'data:text/html,<script>' }).img, '');
  const png = new Uint8Array(600); png.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  assert.ok((await E.holeBild(MARGARITA, { hol: async () => bild(png, 'application/octet-stream') })).startsWith('data:image/png;base64,'), 'die Art kommt aus dem Inhalt, nicht aus der Kopfzeile');
  assert.equal(await E.holeBild(MARGARITA, { hol: async () => bild(bytes, 'image/jpeg', 404) }), '');
  assert.equal(await E.holeBild(MARGARITA, { hol: async () => { throw new TypeError('Failed to fetch'); } }), '', 'kein Netz oder vom Browser gesperrt: leer, kein Fehler');
  assert.equal(await E.holeBild(MARGARITA, { hol: async () => bild(new TextEncoder().encode('<html>' + 'x'.repeat(900) + '</html>'), 'image/jpeg') }), '', 'kein Bild, auch wenn die Kopfzeile es behauptet');
  assert.equal(await E.holeBild(MARGARITA, { hol: async () => bild(bytes.slice(0, 100)) }), '', 'zu klein');
  const fremd = netz(() => bild(bytes));
  for (const a of ['https://boese.example/x.jpg', 'https://thecocktaildb.com.boese.example/x.jpg', 'https://boesethecocktaildb.com/x.jpg', 'ftp://www.thecocktaildb.com/x.jpg', 'javascript:alert(1)', 'data:image/png;base64,AAAA', '', null])
    assert.equal(await E.holeBild({ idDrink: '9', strDrinkThumb: a }, { hol: fremd.hol }), '', String(a));
  assert.equal(await E.holeBild(GEKUERZT.strDrinkThumb.replace('https://www.thecocktaildb.com', 'https://boese.example'), { hol: fremd.hol }), '');
  assert.equal(fremd.rufe.length, 0, 'an eine fremde Adresse geht kein Abruf');
  const alt = netz(() => bild(bytes)); assert.ok((await E.holeBild({ idDrink: '9', strDrinkThumb: 'http://www.thecocktaildb.com/images/media/drink/alt.jpg' }, { hol: alt.hol })).startsWith('data:image/jpeg'));
  assert.equal(alt.rufe[0].adresse, 'https://www.thecocktaildb.com/images/media/drink/alt.jpg', 'http wird https');
});

test('wasGehtHinaus: eine kurze Zeile, Deutsch und Englisch', () => {
  const de = E.wasGehtHinaus('de'), en = E.wasGehtHinaus('en');
  assert.equal(de, 'Hinaus geht: der Suchtext an thecocktaildb.com – sonst nichts aus deiner Sammlung.'); assert.equal(en, 'Sent: the search text to thecocktaildb.com – nothing else from your collection.');
  assert.equal(E.wasGehtHinaus(), de); for (const l of ['es', 'fr', 'it', 'pt', 'ru', 'zh']) assert.equal(E.wasGehtHinaus(l), en, 'ohne Tabelle Englisch: ' + l);
  for (const t of [de, en]) assert.ok(!t.includes('\n') && t.length < 100 && t.includes('thecocktaildb.com'));
});

test('die Vorgabe für `hol` ist fetch – und kein Abruf dieser Datei hat das echte Netz erreicht', async () => {
  assert.equal(echtesNetz, 0, 'bis hierher ging jeder Abruf über ein gestelltes `hol`');
  await assert.rejects(E.suche('margarita'), /Keine Verbindung zu thecocktaildb\.com/);
  assert.equal(await E.holeBild(MARGARITA), '');
  assert.equal(echtesNetz, 2, 'ohne `hol` wird fetch gerufen (hier: der Ersatz dieser Datei)');
});
