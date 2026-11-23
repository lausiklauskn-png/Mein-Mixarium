/* Probe: getraenke/einheiten.mjs rechnet wie die alte App.
   Die alten Funktionen kommen WÖRTLICH aus der QC-Datei (siehe _alt.mjs). */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { altLaden, altAnzahl, schlicht, zufall } from './_alt.mjs';
import * as E from '../../getraenke/einheiten.mjs';

const ALT = altLaden(['parseAmt', 'fmtNum', 'scaleAmt', '_IMP_UNITS', '_MET_UNITS', '_normUnit', '_unitKind', 'unitsMatchSystem', 'convertAmtUnitLocal', 'LANG_UNIT_SYSTEM']);

/* Die zwei benannten Abweichungen (siehe einheiten.mjs, `mengeLesen`). */
const istAbweichung = s => {
  const t = String(s).trim();
  return /^\d+\s+[¼½¾⅓⅔⅛⅜⅝⅞]$/.test(t) || /^\d*0[.,]\d+$/.test(t) || /^\d*0[.,]\d+[¼½¾⅓⅔⅛⅜⅝⅞]$/.test(t);
};

const FEST = ['', null, undefined, 0, '0', '1', '2', '4', '15', '250', '1,5', '1.5', '0,5', '0.25', '2,75', '3,333',
  '1/2', '3/4', '1/3', '2/3', '1 1/2', '2 3/4', '½', '¼', '¾', '⅓', '⅔', '⅛', '⅜', '⅝', '⅞', '1½', '2¼', '12¾',
  '2-3', '2 - 3', '25–30', '400-500', '1,5-2', '1.5–2.5', '8-10', 'etwas', 'nach Belieben', 'eine Handvoll', 'Prise',
  'Zur Deko', 'ca. 2', '~3', '2 cl', '4cl', ' 3 ', '1 Fresh', 'Garnish with', 'to fill', 'Top', '1e3', '-2', '.5', ',5', '5,', '1,2,3'];

function vieleMengen(n) {
  const z = zufall(20261123), out = [];
  const br = ['¼', '½', '¾', '⅓', '⅔', '⅛', '⅜', '⅝', '⅞'];
  for (let i = 0; i < n; i++) {
    const a = Math.floor(z() * 600), b = Math.floor(z() * 100), art = Math.floor(z() * 9);
    out.push([String(a), a + ',' + b, a + '.' + b, a + '/' + (1 + b % 9), (1 + a % 9) + ' ' + (1 + b % 7) + '/' + (2 + b % 7),
      a + br[b % 9], br[b % 9], a + '-' + (a + b), a + ',' + (b % 10) + '–' + (a + 1) + ',' + (b % 10)][art]);
  }
  return out;
}

test('mengeLesen liest wie parseAmt (feste Liste + 4000 erzeugte Mengen)', () => {
  let verglichen = 0;
  for (const s of FEST.concat(vieleMengen(4000))) {
    if (istAbweichung(s)) continue;
    assert.deepEqual(schlicht(E.mengeLesen(s)), schlicht(ALT.parseAmt(s)), 'Menge ' + JSON.stringify(s));
    verglichen++;
  }
  assert.ok(verglichen > 3000, 'zu wenig verglichen: ' + verglichen);
});

test('die GÜLTIGE parseAmt ist die spätere von zweien (Hochziehen)', () => {
  assert.equal(altAnzahl('parseAmt'), 2, 'in der QC-Datei stehen zwei Deklarationen');
  assert.equal(ALT.parseAmt(''), null, 'die spätere gibt null, die frühere gäbe 0');
});

test('benannte Abweichung 1: „10.5" ist 10,5 — die alte App las 1,5', () => {
  assert.equal(ALT.parseAmt('10.5'), 1.5); assert.equal(E.mengeLesen('10.5'), 10.5);
  assert.equal(ALT.parseAmt('20,5'), 2.5); assert.equal(E.mengeLesen('20,5'), 20.5);
  assert.equal(ALT.parseAmt('100.25'), 10.25); assert.equal(E.mengeLesen('100.25'), 100.25);
});
test('benannte Abweichung 2: „1 ½" ist 1,5 — die alte App las 1', () => {
  assert.equal(ALT.parseAmt('1 ½'), 1); assert.equal(E.mengeLesen('1 ½'), 1.5);
  assert.equal(E.mengeLesen('2 ¼'), 2.25);
});

test('Mengen: Dezimalkomma, Brüche, Spannen, leer', () => {
  assert.equal(E.mengeLesen('1,5'), 1.5);
  assert.equal(E.mengeLesen('1/2'), 0.5);
  assert.equal(E.mengeLesen('½'), 0.5);
  assert.equal(E.mengeLesen('1 1/2'), 1.5);
  assert.equal(E.mengeLesen('1½'), 1.5);
  assert.deepEqual(E.mengeLesen('2-3'), [2, 3]);
  assert.deepEqual(E.mengeLesen('25–30'), [25, 30]);
  assert.equal(E.mengeLesen(''), null);
  assert.equal(E.mengeLesen(undefined), null);
  assert.equal(E.mengeLesen('nach Belieben'), null);
});

test('zahlFormatieren schreibt wie fmtNum (Raster 0…60 in 1/48-Schritten und Zufall)', () => {
  const z = zufall(7);
  const werte = [null, [1, 2], [0.5, 1.5]];
  for (let i = 0; i <= 60 * 48; i++) werte.push(i / 48);
  for (let i = 0; i < 2000; i++) werte.push(z() * 900);
  for (const n of werte) assert.equal(E.zahlFormatieren(n), ALT.fmtNum(n), 'Zahl ' + JSON.stringify(n));
});

test('mengeSkalieren rechnet wie scaleAmt (Mengen × Faktoren)', () => {
  const faktoren = [1, 1.0005, 0.5, 2, 3, 1.5, 0.25, 4 / 3, 6 / 4, 10 / 4, 1 / 4, 7 / 2, 12];
  let n = 0;
  for (const s of FEST.concat(vieleMengen(600))) {
    if (istAbweichung(s)) continue;
    for (const f of faktoren) {
      const alt = ALT.scaleAmt(s, f), neu = E.mengeSkalieren(s, f);
      assert.equal(neu.menge, alt.scaled, `Menge ${JSON.stringify(s)} × ${f}`);
      assert.equal(neu.geaendert, alt.changed, `geändert? ${JSON.stringify(s)} × ${f}`);
      assert.equal(neu.original, alt.original);
      n++;
    }
  }
  assert.ok(n > 5000);
});

test('portionenSkalieren: 4 → 8 Portionen verdoppelt, Text bleibt, Eingabe bleibt unberührt', () => {
  const zut = [{ amt: '2', unit: 'cl', name: 'Limettensaft' }, { amt: '1/2', unit: '', name: 'Limette' }, { amt: 'nach Belieben', unit: '', name: 'Minze' }, { amt: '2-3', unit: 'Blätter', name: 'Basilikum' }];
  const vorher = JSON.stringify(zut);
  const neu = E.portionenSkalieren(zut, 4, 8);
  assert.deepEqual(neu.map(i => i.amt), ['4', '1', 'nach Belieben', '4-6']);
  assert.equal(neu[0].amtOriginal, '2');
  assert.equal(JSON.stringify(zut), vorher, 'die Eingabe wurde verändert');
  assert.deepEqual(E.portionenSkalieren(zut, 4, 4).map(i => i.amt), zut.map(i => i.amt));
  assert.deepEqual(E.portionenSkalieren(zut, undefined, 2).map(i => i.amt), ['1', '¼', 'nach Belieben', '1-1½'], 'fehlende Basis ist 4, wie alt');
});

const EINHEITEN_PROBE = ['', null, 'ml', 'ML', 'cl', 'l', 'L', 'dl', 'g', 'kg', 'mg', 'EL', 'TL', 'el.', 'oz', 'OZ', 'fl oz', 'fl. oz.', 'floz', 'cup', 'cups', 'tbsp', 'Tbsp.', 'tablespoon', 'tablespoons',
  'tsp', 'teaspoon', 'teaspoons', 'lb', 'lbs', 'pound', 'pounds', 'quart', 'quarts', 'pint', 'pints', 'gallon', 'gallons', 'Stück', 'Spritzer', 'dash', 'Prise', 'Scheiben', 'Blätter', 'Zweig', 'Barlöffel', ' ml ', 'Liter', 'Tasse'];

test('einheitArt urteilt wie _unitKind; die Listen sind dieselben', () => {
  const map = { none: 'keine', imperial: 'us', metric: 'metrisch', other: 'andere' };
  for (const u of EINHEITEN_PROBE) {
    assert.equal(E.einheitArt(u), map[ALT._unitKind(u)], 'Einheit ' + JSON.stringify(u));
    assert.equal(E.einheitNormalisieren(u), ALT._normUnit(u));
  }
  for (const u of ALT._IMP_UNITS) assert.equal(E.einheitArt(u), 'us', u);
  for (const u of ALT._MET_UNITS) assert.equal(E.einheitArt(u), 'metrisch', u);
});

test('umrechnenInSystem rechnet wie convertAmtUnitLocal (Einheiten × Mengen × Systeme)', () => {
  const mengen = ['1', '2', '4', '0.5', '1,5', '2.25', '15', '29', '30', '60', '99', '100', '199', '200', '250', '500', '750', '1000', '0', '-1', '', 'abc', '1/2', '2-3', '½', 3, 0.75];
  const z = zufall(99); for (let i = 0; i < 300; i++) mengen.push(String(Math.round(z() * 20000) / 10));
  let n = 0, treffer = 0;
  for (const u of EINHEITEN_PROBE) for (const m of mengen) for (const [alt, neu] of [['metric', 'metrisch'], ['imperial', 'us']]) {
    const a = schlicht(ALT.convertAmtUnitLocal(m, u, alt)), b = E.umrechnenInSystem(m, u, neu);
    assert.deepEqual(b, a, `${JSON.stringify(m)} ${JSON.stringify(u)} → ${neu}`);
    assert.deepEqual(E.umrechnenInSystem(m, u, alt), a, 'der alte Systemname wird auch verstanden');
    n++; if (a) treffer++;
  }
  assert.ok(n > 20000 && treffer > 3000, `verglichen ${n}, davon umgerechnet ${treffer}`);
});

test('passtZumSystem urteilt wie unitsMatchSystem', () => {
  const faelle = [null, {}, { ings: [] }, { ings: [{ unit: 'ml' }, { unit: 'Stück' }] }, { ings: [{ unit: 'oz' }] }, { ings: [{ unit: 'ml' }, { unit: 'oz' }] }, { ings: [{ unit: '' }, { unit: 'Spritzer' }] }, { ings: [{ unit: 'EL' }, { unit: 'tsp' }] }];
  for (const r of faelle) for (const [alt, neu] of [['metric', 'metrisch'], ['imperial', 'us']])
    assert.equal(E.passtZumSystem(r, neu), ALT.unitsMatchSystem(r, alt), JSON.stringify(r) + ' ' + neu);
});

test('Umrechnung ml ↔ cl ↔ oz', () => {
  assert.deepEqual(E.volumenUmrechnen('4', 'cl', 'ml'), { amt: '40', unit: 'ml', wert: 40 });
  assert.deepEqual(E.volumenUmrechnen('40', 'ml', 'cl'), { amt: '4', unit: 'cl', wert: 4 });
  assert.deepEqual(E.volumenUmrechnen('2', 'oz', 'cl'), { amt: '6', unit: 'cl', wert: 6 });
  assert.deepEqual(E.volumenUmrechnen('2', 'oz', 'ml'), { amt: '59', unit: 'ml', wert: 59 });
  assert.deepEqual(E.volumenUmrechnen('6', 'cl', 'oz'), { amt: '2', unit: 'oz', wert: 2 });
  assert.deepEqual(E.volumenUmrechnen('45', 'ml', 'oz'), { amt: '1½', unit: 'oz', wert: 1.5 });
  assert.equal(E.volumenUmrechnen('1,5', 'cl', 'ml').amt, '15');
  assert.equal(E.volumenUmrechnen('25', 'ml', 'cl', { dezimal: ',' }).amt, '2,5');
  assert.equal(E.volumenUmrechnen('1', 'l', 'cl').amt, '100');
  assert.equal(E.volumenUmrechnen('1 1/2', 'fl oz', 'ml').amt, '44');
  assert.equal(E.volumenUmrechnen('2-3', 'cl', 'ml').amt, '20-30', 'Spannen werden mitgerechnet');
  assert.equal(E.volumenUmrechnen('½', 'oz', 'cl').amt, '1.5');
  /* oz → ml stimmt mit der alten Tabelle überein */
  for (const m of ['1', '2', '0.5', '1.5', '3', '8']) assert.equal(E.volumenUmrechnen(m, 'oz', 'ml').amt, ALT.convertAmtUnitLocal(m, 'oz', 'metric').amt, m + ' oz');
});
test('Umrechnung lässt stehen, was kein Flüssigkeitsmaß ist, und erfindet keine Null', () => {
  for (const [m, u] of [['2', 'EL'], ['1', 'TL'], ['3', 'Spritzer'], ['1', 'Prise'], ['2', 'Stück'], ['100', 'g'], ['2', ''], ['2', 'Schlückchen'], ['nach Belieben', 'ml'], ['', 'ml']])
    assert.equal(E.volumenUmrechnen(m, u, 'oz'), null, m + ' ' + u);
  assert.equal(E.volumenUmrechnen('4', 'cl', 'cl'), null, 'schon in der Ziel-Einheit');
  assert.equal(E.volumenUmrechnen('4', 'cl', 'g'), null, 'kein Volumen-Ziel');
  assert.equal(E.volumenUmrechnen('1', 'ml', 'oz'), null, '1 ml wären 0 oz — bleibt stehen');
  assert.deepEqual(E.zutatUmstellen({ amt: '2', unit: 'EL', name: 'Zucker', note: 'x' }, 'oz'), { amt: '2', unit: 'EL', name: 'Zucker', note: 'x' });
  assert.deepEqual(E.zutatUmstellen({ amt: '4', unit: 'cl', name: 'Saft' }, 'oz'), { amt: '1¼', unit: 'oz', name: 'Saft' });
});
test('hin und zurück bleibt in der Rundung (cl → oz → cl)', () => {
  for (const cl of [2, 3, 4, 6, 12]) {
    const oz = E.volumenUmrechnen(String(cl), 'cl', 'oz');
    const zurueck = E.volumenUmrechnen(String(oz.wert), 'oz', 'cl');
    assert.ok(Math.abs(zurueck.wert - cl) <= 0.5, `${cl} cl → ${oz.amt} oz → ${zurueck.amt} cl`);
  }
});

test('Einheiten normalisieren: Schreibweisen → Kennung, Unbekanntes bleibt unbekannt', () => {
  const soll = { ml: 'ml', 'ML': 'ml', cl: 'cl', L: 'l', Liter: 'l', dl: 'dl', oz: 'oz', 'fl oz': 'oz', 'fl. oz.': 'oz', cup: 'cup', Tasse: 'cup', tbsp: 'el', EL: 'el', Esslöffel: 'el', tsp: 'tl', TL: 'tl',
    'Barlöffel': 'bl', 'bar spoon': 'bl', Spritzer: 'spritzer', dash: 'spritzer', Dashes: 'spritzer', Prise: 'prise', pinch: 'prise', 'Stück': 'stueck', Stk: 'stueck', Scheiben: 'scheibe', slice: 'scheibe',
    'Blätter': 'blatt', leaves: 'blatt', Zweig: 'zweig', sprig: 'zweig', g: 'g', kg: 'kg' };
  for (const [u, k] of Object.entries(soll)) assert.equal(E.einheitKennung(u), k, u);
  for (const u of ['', null, 'Schlückchen', 'kleine', 'cm']) assert.equal(E.einheitKennung(u), null, String(u));
  const namen = E.EINHEITEN.flatMap(e => e.namen);
  assert.equal(new Set(namen).size, namen.length, 'eine Schreibweise gehört zu genau einer Einheit');
});

test('Standard-System aus der Locale: US, Liberia, Myanmar → us; sonst metrisch', () => {
  const us = ['en-US', 'en_US', 'es-US', 'en-LR', 'my', 'my-MM', 'en-Latn-US', 'en', 'EN-us', 'de-DE-u-ms-ussystem'];
  const met = ['de', 'de-DE', 'en-GB', 'en-AU', 'en-CA', 'pt', 'pt-BR', 'fr-FR', 'zh', 'zh-Hans-CN', 'ru-RU', 'es-419', 'es', 'it', '', null, undefined, 'en-US-u-ms-metric', 'my-TH'];
  for (const l of us) assert.equal(E.systemVonLocale(l), 'us', String(l));
  for (const l of met) assert.equal(E.systemVonLocale(l), 'metrisch', String(l));
  assert.equal(E.standardVolumenEinheit('us'), 'oz');
  assert.equal(E.standardVolumenEinheit('metrisch'), 'ml');
  /* benannter Unterschied: die alte App stellte `pt` auf imperial */
  assert.equal(ALT.LANG_UNIT_SYSTEM.pt, 'imperial');
});

test('Menge und Einheit trennen — nur wenn der ganze Rest eine bekannte Einheit ist', () => {
  assert.deepEqual(E.mengeUndEinheitTrennen('4 cl'), { amt: '4', unit: 'cl' });
  assert.deepEqual(E.mengeUndEinheitTrennen('4cl'), { amt: '4', unit: 'cl' });
  assert.deepEqual(E.mengeUndEinheitTrennen('1 1/2 oz'), { amt: '1 1/2', unit: 'oz' });
  assert.deepEqual(E.mengeUndEinheitTrennen('1,5 TL'), { amt: '1,5', unit: 'TL' });
  assert.deepEqual(E.mengeUndEinheitTrennen('2-3 Blätter'), { amt: '2-3', unit: 'Blätter' });
  assert.deepEqual(E.mengeUndEinheitTrennen('½ oz'), { amt: '½', unit: 'oz' });
  for (const s of ['1 Fresh', 'Garnish with', 'eine Handvoll', 'to fill', '4', '', 'cl', '2 große']) assert.equal(E.mengeUndEinheitTrennen(s), null, s);
  const z = { id: 3, amt: '4 cl', unit: '', name: 'Rum', ck: true, note: 'braun', extra: 1 };
  assert.deepEqual(E.zutatTrennen(z), { id: 3, amt: '4', unit: 'cl', name: 'Rum', ck: true, note: 'braun', extra: 1, amtRoh: '4 cl' });
  assert.equal(z.amt, '4 cl', 'die Eingabe bleibt unberührt');
  assert.deepEqual(E.zutatTrennen({ amt: '2', unit: 'cl', name: 'Gin' }), { amt: '2', unit: 'cl', name: 'Gin' });
  assert.deepEqual(E.zutatTrennen({ amt: '1 Fresh', unit: '', name: 'Mint' }), { amt: '1 Fresh', unit: '', name: 'Mint' });
  assert.deepEqual(E.zutatTrennen('4 cl Limettensaft'), { amt: '4', unit: 'cl', name: 'Limettensaft' });
  assert.deepEqual(E.zutatTrennen('1 1/2 fl oz White Rum'), { amt: '1 1/2', unit: 'fl oz', name: 'White Rum' });
  assert.deepEqual(E.zutatTrennen('2 Limetten'), { amt: '2', unit: '', name: 'Limetten' });
  assert.deepEqual(E.zutatTrennen('Eiswürfel'), { amt: '', unit: '', name: 'Eiswürfel' });
});
