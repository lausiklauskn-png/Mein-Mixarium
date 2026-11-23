import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { GETRAENKE_WARENGRUPPEN as GR, GETRAENKE_EINKAUF_EINHEITEN } from '../../getraenke/warengruppen.mjs';
import { einkaufMit } from '../../kern/modell/einkauf.mjs';

const ek = einkaufMit({ gruppen: GR, einheiten: GETRAENKE_EINKAUF_EINHEITEN });
const zutaten = readdirSync('beispiele').filter((n) => n.endsWith('.json') && n !== 'KATALOG.json').flatMap((n) => JSON.parse(readFileSync('beispiele/' + n, 'utf8')).recipes || []).flatMap((r) => (r.ings || []).map((z) => z.name));

test('Getränke-Warengruppen: Kern-Format, 8 Sprachen, letzte Gruppe ist der Auffang des Kerns', () => {
  for (const g of GR) for (const s of ['de', 'en', 'ru', 'zh', 'es', 'fr', 'it', 'pt']) assert.ok(g[s], g.id + ' ' + s);
  assert.equal(GR.at(-1).id, 'sonstiges'); assert.equal(new Set(GR.map((g) => g.id)).size, GR.length);
  for (const g of GR) for (const w of g.worte) assert.equal(w, w.toLowerCase(), 'der Kern vergleicht klein: ' + w);
});
test('Getränke-Warengruppen: typische Zutaten landen richtig', () => {
  const soll = { Limettensaft: 'saft', Zitronensaft: 'saft', 'Grenadine-Sirup': 'saft', Mineralwasser: 'wasser', 'Ginger Ale': 'wasser', Zitronenlimonade: 'wasser', 'Weißer Rum': 'spirituosen', Gin: 'spirituosen', Rotwein: 'spirituosen', Amaretto: 'spirituosen', Eiswürfel: 'kuehl', Sahne: 'kuehl', Minze: 'obst', Limette: 'obst', Gurke: 'obst', Zucker: 'sonstiges', Rohrzucker: 'sonstiges' };
  for (const [n, g] of Object.entries(soll)) assert.equal(ek.warengruppe(n), g, n);
});
test('Getränke-Warengruppen: höchstens ein Viertel der Beispiel-Zutaten landet im Vorrat', () => {
  assert.ok(zutaten.length > 50, 'zu wenig Zutaten: ' + zutaten.length);
  const vorrat = zutaten.filter((n) => ek.warengruppe(n) === 'sonstiges');
  assert.ok(vorrat.length <= zutaten.length / 4, vorrat.length + ' von ' + zutaten.length + ': ' + [...new Set(vorrat)].join(', '));
});
test('Getränke-Einkauf: oz und cl zählen zusammen, ein Barlöffel bleibt eigene Einheit', () => {
  const l = ek.einkaufsliste([{ rezept: { name: 'A', servings: 1, ings: [{ name: 'Limettensaft', amt: '2', unit: 'cl' }, { name: 'Limettensaft', amt: '1', unit: 'oz' }, { name: 'Zucker', amt: '1', unit: 'Barlöffel' }] }, portionen: 2 }]);
  assert.equal(l.find((x) => x.name === 'Limettensaft').menge, '99 ml'); assert.equal(l.find((x) => x.name === 'Zucker').menge, '2 Barlöffel');
});
