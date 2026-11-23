/* Probe: der Schalter „Ohne Alkohol" urteilt wie `alcAllowed` der alten App;
   der strengere Befund (Zutaten-Stichworte) ist getrennt und nennt seine Gründe. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { altLaden, QC } from './_alt.mjs';
import * as A from '../../getraenke/alkohol.mjs';

const ALT = altLaden(['getAlcFilter', 'alcAllowed'], 'var __ls={};var localStorage={getItem:function(k){return k in __ls?__ls[k]:null}};');
const setze = roh => ALT.__lauf(roh === undefined ? '__ls={}' : `__ls={mxNoAlc9:${JSON.stringify(roh)}}`);

const KATS = ['ckt', 'afckt', 'mock', 'smooth', 'limo', 'tee', 'bowle', 'sirup', 'knab', 'finger', '', ' ckt ', 'CKT', 'drk', 'fld_1', undefined, null, 5];
const FLAGS = [undefined, true, false, 1, 0, 'ja', '', null];
const GETRAENKE = [];
for (const cat of KATS) for (const alcohol of FLAGS) GETRAENKE.push({ name: 'x', cat, alcohol, ings: [{ name: 'weißer Rum' }] });

test('der Schalter liest mxNoAlc9 wie getAlcFilter', () => {
  for (const roh of [undefined, '1', '0', '', 'true', 'ja']) {
    setze(roh);
    assert.equal(A.schalterLesen(roh === undefined ? null : roh), ALT.getAlcFilter(), JSON.stringify(roh));
  }
  assert.equal(A.schalterSchreiben(true), '1'); assert.equal(A.schalterSchreiben(false), '0');
});

test('alcErlaubt urteilt wie alcAllowed — alle Kategorien × alle Feldwerte × Schalter an/aus', () => {
  let n = 0;
  for (const an of [true, false]) {
    setze(an ? '1' : '0');
    for (const r of GETRAENKE) { assert.equal(A.alcErlaubt(r, an), ALT.alcAllowed(r), `${JSON.stringify(r.cat)} / ${JSON.stringify(r.alcohol)} / Schalter ${an}`); n++; }
  }
  assert.equal(n, KATS.length * FLAGS.length * 2);
});

test('hat Alkohol: Kategorie Cocktails oder das Feld am Getränk — sonst nichts (wie alt)', () => {
  assert.equal(A.hatAlkohol({ cat: 'ckt' }), true);
  assert.equal(A.hatAlkohol({ cat: 'mock', alcohol: true }), true);
  assert.equal(A.hatAlkohol({ cat: 'mock', alcohol: false }), false);
  assert.equal(A.hatAlkohol({ cat: 'bowle', ings: [{ name: 'weißer Rum' }] }), false, 'die alte App schaut NICHT in die Zutaten');
  assert.equal(A.hatAlkohol(null), false);
});

test('die alte App kennt keine Zutaten-Erkennung (belegt am Quelltext)', () => {
  const a = QC.indexOf('function alcAllowed(r){'), e = QC.indexOf('\n}', a);
  const rumpf = QC.slice(a, e);
  assert.ok(a > 0 && !/ings|name|toLowerCase/.test(rumpf), 'alcAllowed liest Zutaten — dann gehört die Regel nach hatAlkohol');
});

test('filterOhneAlkohol: Schalter aus zeigt alles, Schalter an nimmt Cocktails und markierte heraus', () => {
  const l = [{ name: 'Mojito', cat: 'ckt' }, { name: 'Virgin Mojito', cat: 'afckt' }, { name: 'Bowle', cat: 'bowle', alcohol: true }, { name: 'Limo', cat: 'limo', alcohol: false }];
  assert.equal(A.filterOhneAlkohol(l, false).length, 4);
  assert.deepEqual(A.filterOhneAlkohol(l, true).map(r => r.name), ['Virgin Mojito', 'Limo']);
});

test('strenger Befund: Zutaten-Stichworte treffen als ganze Wörter und nennen den Grund', () => {
  const ja = { 'weißer Rum': 'rum', 'Rum': 'rum', '4 cl Gin': 'gin', 'Wodka (eiskalt)': 'wodka', 'Prosecco oder trockener Sekt': 'prosecco', 'Rotwein': 'rotwein', 'trockener Weißwein': 'weißwein',
    'Wein, rot': 'wein', 'White Rum': 'rum', 'Triple Sec': 'triple sec', 'Tequila blanco': 'tequila', 'Orangenlikör': 'likör', 'Kirschschnaps': 'schnaps', 'Weizenbier': 'bier', 'Likör 43': 'likör', 'Bier': 'bier', 'light beer': 'beer', 'Aperol': 'aperol', 'Cachaça': 'cachaça' };
  for (const [name, wort] of Object.entries(ja)) {
    const w = A.alkoholStichworte(name);
    assert.ok(w.includes(wort), `${name} → ${JSON.stringify(w)}`);
  }
  const b = A.alkoholBefund({ cat: 'bowle', ings: [{ name: 'Kokosmilch' }, { name: 'weißer Rum' }, { name: 'Prosecco oder trockener Sekt' }] });
  assert.equal(b.alkohol, true);
  assert.deepEqual([...b.gruende].sort(), ['zutat:prosecco', 'zutat:rum', 'zutat:sekt']);
  assert.deepEqual(A.alkoholBefund({ cat: ' ckt ', alcohol: true, alkohol: true, ings: [] }).gruende, ['kategorie:ckt', 'feld:alcohol', 'feld:alkohol']);
  assert.equal(A.alkoholBefund({ cat: 'eig_1', ings: [] }, { neu: [{ id: 'eig_1', alcohol: true }] }).alkohol, true);
  assert.equal(A.alkoholBefund({ cat: 'bowle', ings: [{ name: 'weißer Rum' }] }, { zutatenPruefen: false }).alkohol, false);
});

test('strenger Befund: keine Fehlgriffe bei Ginger, Schwein, Weintrauben, Aroma, alkoholfrei …', () => {
  const nein = ['Ginger Ale', 'Ginger Beer', 'Ingwer', 'Schweinefilet', 'Weintrauben', 'Weinessig', 'Rumaroma', 'Rum-Aroma', 'alkoholfreier Rum', 'alkoholfreier Sekt', 'Gin (alkoholfrei)',
    'Krumen', 'Trauben', 'Original', 'Weinstein-Backpulver', 'Malzbier', 'Root Beer', 'Bieressig', 'Blue Curaçao Sirup', 'non-alcoholic beer', 'Birne', 'Zucker', 'Insektenhotel', 'Zentrum',
    'Reis', 'Kokosmilch', 'Limettensaft', 'Eiswürfel', 'Minze', 'Portion Eis', 'Pilze', 'Beeren', 'Rumpsteak', 'Engine', 'Virgin Mojito'];
  for (const name of nein) assert.deepEqual(A.alkoholStichworte(name), [], name);
  assert.deepEqual(A.alkoholBefund({ cat: 'afckt', alcohol: false, ings: nein.map(name => ({ name })) }), { alkohol: false, gruende: [] });
  assert.deepEqual(A.alkoholBefund(null), { alkohol: false, gruende: [] });
});
