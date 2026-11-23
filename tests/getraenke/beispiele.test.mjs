// Die mitgelieferten Beispiele müssen wenigstens fehlerfrei sein (Klaus 23.11.2026).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import * as G from '../../getraenke/index.mjs';
import { pruefePaket } from '../../kern/pruefung/paket.mjs';
const lies = (f) => JSON.parse(readFileSync(new URL('../../beispiele/' + f, import.meta.url), 'utf8'));
const katalog = lies('KATALOG.json');
const KATS = new Set(G.KATEGORIEN.map((c) => c.id));
const ENGLISCH = /\b(juice|wine|with|glass|pour|together|garnish|lime|milk|peel|fresh|sprig|cubes|soda water|to fill|until|untill|add|mix)\b/i;
const SIEZEN = /\b(Geben Sie|Füllen Sie|Fügen Sie|Rühren Sie|Gießen Sie)\b|^Füge\b/;
for (const p of katalog.pakete) {
  if (!existsSync(new URL('../../beispiele/' + p.datei, import.meta.url))) continue;
  const g = lies(p.datei).recipes;
  test(`${p.id}: Anzahl stimmt mit dem Katalog`, () => assert.equal(g.length, p.anzahl));
  test(`${p.id}: jedes Getränk hat Kennung, bekannte Kategorie, Portionen, Zutaten und Schritte`, () => {
    for (const r of g) {
      assert.ok(r.uid && r.name, 'uid/name: ' + r.name);
      assert.ok(KATS.has(r.cat), `Kategorie ${r.cat}: ${r.name}`);
      assert.ok(Number(r.servings) >= 1, 'Portionen: ' + r.name);
      assert.ok(r.ings.length >= 3, 'Zutaten: ' + r.name);
      assert.ok(r.steps.length >= 2, 'Schritte: ' + r.name);
      for (const z of r.ings) { assert.ok(String(z.name).trim(), 'leere Zutat: ' + r.name); assert.ok(z.amt === '' || G.mengeLesen(z.amt) !== null || (/^[a-zäöüß ]+$/i.test(z.amt) && !ENGLISCH.test(z.amt)), `Menge „${z.amt}“ weder Zahl noch deutscher Text: ${r.name}`); }
    }
  });
  test(`${p.id}: kein Englisch, kein Siezen, keine rohen Glas-Angaben`, () => {
    for (const r of g) {
      for (const t of r.ings.map((z) => z.name).concat(r.steps.map((s) => s.txt))) { assert.ok(!ENGLISCH.test(t), `englisch: ${r.name}: ${t}`); assert.ok(!SIEZEN.test(t), `Anrede: ${r.name}: ${t}`); }
      assert.ok(!/\bglass\b|^jar$/i.test(String(r.glass || '')), `Glas roh: ${r.name}: ${r.glass}`);
    }
  });
  test(`${p.id}: jede Zutat mit Menge kommt in einem Schritt vor oder das Getränk nennt „alle Zutaten“`, () => {
    for (const r of g) {
      const text = r.steps.map((s) => s.txt).join(' ').toLowerCase();
      if (/alle (zutaten|liköre)/.test(text)) continue;
      const sw = text.split(/[^\p{L}]+/u).filter((x) => x.length >= 3);
      for (const z of r.ings) {
        const w = String(z.name).toLowerCase().split(/[^\p{L}]+/u).filter((x) => x.length >= 3);
        // zusammengesetzte Wörter zählen in beiden Richtungen: „Gurkenscheiben“ ↔ „Salatgurke“, „Rum“ ↔ „weißer Rum“
        const ok = w.some((x) => text.includes(x.slice(0, 5)) || sw.some((y) => y.length >= 4 && x.includes(y.slice(0, 5))));
        assert.ok(ok, `Zutat „${z.name}“ kommt in keinem Schritt vor: ${r.name}`);
      }
    }
  });
  test(`${p.id}: auch die Paket-Prüfung des Küchen-Kerns findet nichts`, () => { const b = pruefePaket(g, { kategorien: KATS, minZutaten: 3, minSchritte: 2 }); assert.deepEqual(b, []); });
  test(`${p.id}: Alkohol-Kennzeichen passt zum Paket`, () => {
    for (const r of g) {
      if (p.alkohol) assert.ok(G.hatAlkohol(r), 'ohne Kennzeichen: ' + r.name);
      else { assert.ok(!G.hatAlkohol(r), 'Kennzeichen im alkoholfreien Paket: ' + r.name); assert.equal(G.storeVerstoesse({ recipes: [r] }).length, 0, 'Alkohol-Zutat: ' + r.name); }
    }
  });
}
