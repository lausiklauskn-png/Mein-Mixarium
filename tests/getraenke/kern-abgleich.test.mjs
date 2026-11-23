/* Kern ↔ Getränke-Schicht: hält der Küchen-Kern (ab 0.12) bei Getränken, was `getraenke/` verspricht?
   Gemessen an allen Mengen der Beispielpakete und an den Fällen, an denen die alte App falsch rechnete.
   Die Getränke-Schicht ist gegen die alte App geprüft (einheiten.test.mjs); hier ist sie der Maßstab. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import * as E from '../../getraenke/einheiten.mjs';
import { KATEGORIEN } from '../../getraenke/kategorien.mjs';
import { skaliere } from '../../kern/modell/mengen.mjs';
import { zahlAus, einkaufMit } from '../../kern/modell/einkauf.mjs';
import { kategorienMit, leereKategorien } from '../../kern/modell/kategorien.mjs';

const pakete = readdirSync('beispiele').filter((n) => n.endsWith('.json') && n !== 'KATALOG.json').map((n) => JSON.parse(readFileSync('beispiele/' + n, 'utf8')));
const getraenke = pakete.flatMap((p) => p.recipes || []);
const mengen = [...new Set(getraenke.flatMap((r) => (r.ings || []).map((z) => String(z.amt ?? ''))).concat(['10,5', '20.5', '1 ½', '1½', '2 ¼', '⅜', '1 1/2', '1/2', '2-3', '25–30', '1,5', 'nach Belieben', '']))];
const gross = (m) => (Array.isArray(m) ? Math.max(...m) : m);

test('Kern liest jede Menge der Beispiele wie die Getränke-Schicht', () => {
  assert.ok(getraenke.length >= 10, 'zu wenig Getränke: ' + getraenke.length);
  let n = 0;
  for (const s of mengen) { const g = E.mengeLesen(s); const k = zahlAus(s); assert.equal(k === null ? null : Math.round(k * 1000) / 1000, g === null ? null : Math.round(gross(g) * 1000) / 1000, 'Menge ' + JSON.stringify(s)); n++; }
  assert.ok(n > 20, 'zu wenig verglichen: ' + n);
});
test('Kern rechnet Portionen um wie die Getränke-Schicht (bis auf die Rundung)', () => {
  for (const s of mengen) for (const f of [0.5, 2, 3, 6]) {
    const g = E.mengeLesen(s); if (g === null) { assert.equal(skaliere(s, f), s, 'Text bleibt stehen: ' + s); continue; }
    const soll = gross(g) * f, ist = zahlAus(skaliere(s, f));
    assert.ok(Math.abs(ist - soll) <= Math.max(0.13, soll * 0.05), `${JSON.stringify(s)} × ${f}: Kern ${ist}, richtig ${soll}`);
  }
});
test('Kategorien des Kerns mit den Getränke-Kategorien: jedes Beispiel landet in einer festen Kategorie', () => {
  const K = kategorienMit(KATEGORIEN), liste = K.alleKategorien(getraenke, leereKategorien());
  assert.deepEqual(liste.filter((c) => c.art === 'fest').map((c) => c.id), KATEGORIEN.map((c) => c.id));
  assert.deepEqual(liste.filter((c) => c.art !== 'fest').map((c) => c.id), [], 'keine Kennung fremd');
  assert.ok(!liste.some((c) => c.id === 'vorsp'), 'keine Essens-Kategorie im Mixarium');
});
test('Einkauf des Kerns mit oz: Unzen und Zentiliter zählen zusammen', () => {
  const ek = einkaufMit({ einheiten: { oz: ['ml', 29.5735] } });
  const l = ek.einkaufsliste([{ rezept: { name: 'A', servings: 1, ings: [{ name: 'Limettensaft', amt: '2', unit: 'cl' }, { name: 'Limettensaft', amt: '1', unit: 'oz' }] }, portionen: 1 }]);
  assert.equal(l[0].menge, '50 ml');
});
