/* Probe: die Gerätschafts-Zeichnungen stehen wörtlich aus der Vorschau hier,
   und `geraeteFuerSchritt` erkennt sie am Schritt-Text (de/en). */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { WURZEL } from './_alt.mjs';
import * as G from '../../getraenke/geraete.mjs';

const vorschau = readFileSync(join(WURZEL, 'docs', 'vorschau', 'mixarium-neu.html'), 'utf8');
const a = vorschau.indexOf('const GERAET={'), e = vorschau.indexOf('\n};', a);
const VORBILD = new Function(vorschau.slice(a, e + 3) + ';return GERAET;')();

test('die Zeichnungen sind Zeichen für Zeichen die der Vorschau', () => {
  assert.deepEqual(Object.keys(G.GERAETE), Object.keys(VORBILD));
  for (const [k, [[de, en], pfade]] of Object.entries(VORBILD)) {
    assert.equal(G.GERAETE[k].pfade, pfade, k);
    assert.equal(G.GERAETE[k].de, de, k); assert.equal(G.GERAETE[k].en, en, k);
  }
});
test('verlangt sind: Stößel, Barlöffel, Shaker, Barsieb, Mixer, Messbecher, Reibe, Presse, Messer, Topf, Krug, Eis', () => {
  for (const k of ['stoessel', 'barloeffel', 'shaker', 'sieb', 'mixer', 'jigger', 'reibe', 'presse', 'messer', 'topf', 'krug', 'eis']) {
    assert.ok(G.GERAETE[k], k);
    assert.ok(G.GERAETE[k].pfade.includes('class="f"'), k + ': Zweitfläche fehlt');
    assert.equal(G.geraetSvg(k), `<svg class="geraet" viewBox="0 0 64 64" aria-hidden="true">${VORBILD[k][1]}</svg>`);
  }
  assert.equal(G.geraetSvg('gibtsnicht'), '');
  assert.equal(G.geraetName('sieb', 'de'), 'Barsieb'); assert.equal(G.geraetName('sieb', 'en'), 'Strainer');
  assert.equal(G.geraetName('sieb', 'fr'), 'Strainer', 'andere Sprachen fallen auf Englisch');
});

const FAELLE = [
  ['Minze und Limette im Glas andrücken', ['stoessel', 'glas']],
  ['Mit Eis kräftig schütteln', ['shaker', 'eis']],
  ['Durch ein Barsieb abseihen', ['sieb']],
  ['Alles im Standmixer fein pürieren', ['mixer']],
  ['Kurz mixen', ['mixer']],
  ['Ingwer fein reiben', ['reibe']],
  ['Zitrone auspressen', ['presse']],
  ['Gurke in Scheiben schneiden', ['messer']],
  ['Mango würfeln', ['messer']],
  ['Wasser mit Zucker aufkochen', ['topf']],
  ['Den Sirup erhitzen und 5 Minuten köcheln', ['topf']],
  ['Vorsichtig umrühren', ['barloeffel']],
  ['4 cl mit dem Messbecher abmessen', ['jigger']],
  ['In einen Krug füllen', ['krug']],
  ['Mit Eiswürfeln auffüllen', ['eis']],
  ['Muddle the mint with sugar', ['stoessel']],
  ['Shake well with ice', ['shaker', 'eis']],
  ['Strain into a chilled glass', ['sieb', 'glas']],
  ['Blend until smooth', ['mixer']],
  ['Grate fresh ginger', ['reibe']],
  ['Squeeze the lime', ['presse']],
  ['Slice the cucumber', ['messer']],
  ['Bring to a boil, then simmer', ['topf']],
  ['Stir gently', ['barloeffel']],
  ['Pour into a pitcher', ['krug']],
];
test('geraeteFuerSchritt: deutsche und englische Stichworte', () => {
  for (const [text, soll] of FAELLE) assert.deepEqual(G.geraeteFuerSchritt(text), soll, text);
  assert.deepEqual(G.geraeteFuerSchritt('MIT EIS SCHÜTTELN'), ['shaker', 'eis'], 'Großschreibung');
});
test('geraeteFuerSchritt: keine Fehlgriffe, leerer Text, feste Reihenfolge, jede Kennung einmal', () => {
  for (const t of ['', '   ', null, undefined, 'Reis zum Preis servieren', 'Den Remix genießen', 'Mit Minze garnieren und servieren', 'Kreise ziehen', 'Sofort servieren', 'Potato chips dazu']) assert.deepEqual(G.geraeteFuerSchritt(t), [], String(t));
  const alles = G.geraeteFuerSchritt('Eis ins Glas, Eis in den Shaker, schütteln, abseihen, umrühren und nochmal schütteln');
  assert.deepEqual(alles, ['shaker', 'sieb', 'barloeffel', 'glas', 'eis']);
  for (const k of alles) assert.ok(G.GERAETE[k]);
});
test('geraeteFuerGetraenk: über alle Schritte, ohne Wiederholung, von Hand Ergänztes vorn', () => {
  const r = { geraete: ['krug', 'gibtsnicht'], steps: [{ id: 0, txt: 'Minze andrücken' }, { id: 1, txt: 'Mit Eis schütteln' }, 'Abseihen und mit Eis servieren'] };
  assert.deepEqual(G.geraeteFuerGetraenk(r), ['krug', 'stoessel', 'shaker', 'eis', 'sieb']);
  assert.deepEqual(G.geraeteFuerGetraenk({}), []);
  assert.deepEqual(G.geraeteFuerGetraenk(null), []);
});
