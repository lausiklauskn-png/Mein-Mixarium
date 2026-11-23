import test from 'node:test';
import assert from 'node:assert/strict';
import { altLaden, schlicht, zufall } from './_alt.mjs';
import * as LAB from '../../getraenke/labor.mjs';

const ALT = altLaden(['_labCalcScore', '_labApplyStatusLogic', 'labAddLog'], `
  const LAB_WEIGHTS={taste:0.40,practicality:0.25,originality:0.20,description:0.15};
  let __solo=false; function labSoloActive(){return __solo;} function sv(){} function labRenderPool(){} function labRenderRemoved(){} function toast(){} function h(x){return x;}
  async function labRevise(){} `);

test('Gewichtung und Punkte: wie die alte App, auf 2000 zufälligen Bewertungsreihen', () => {
  assert.deepEqual(schlicht(LAB.LAB_WEIGHTS), schlicht(ALT.__lauf('LAB_WEIGHTS')));
  const z = zufall(7);
  for (let i = 0; i < 2000; i++) {
    const n = Math.floor(z() * 7), rs = Array.from({ length: n }, () => ({ taste: 1 + Math.floor(z() * 5), practicality: 1 + Math.floor(z() * 5), originality: 1 + Math.floor(z() * 5), description: 1 + Math.floor(z() * 5) }));
    assert.equal(LAB.punkte(rs), ALT._labCalcScore(rs));
  }
});

test('Status-Kette: Schritt für Schritt wie die alte App (3000 Verläufe, mit und ohne Einzelpersonen-Modus, Favorit, Überarbeitung)', async () => {
  const z = zufall(11); let verglichen = 0; const gesehen = new Set();
  for (let lauf = 0; lauf < 3000; lauf++) {
    const solo = z() < 0.5; ALT.__lauf('__solo=' + solo);
    const neu = { labStatus: 'experimentell', labRatings: [], labScore: 0, labGen: true, labFavorite: z() < 0.2 };
    const alt = JSON.parse(JSON.stringify(neu));
    let t = 1000;
    for (let s = 0; s < 12; s++) {
      t += 10;
      // eine Überarbeitung, die angenommen wird, wenn sie fällig war (wie in der App: Entwurf → Annehmen)
      if (neu.labRevisionPending && z() < 0.7) {
        for (const r of [neu, alt]) { r.labRevisionPending = false; r.labStatus = 'revised'; r.labRevisionTs = t; r.labRevision = (r.labRevision || 0) + 1; }
        t += 1;
      }
      const g = z() < 0.5 ? 1 + Math.floor(z() * 2) : 3 + Math.floor(z() * 3);
      const w = { taste: g, practicality: g, originality: Math.max(1, g - 1), description: g };
      LAB.bewerten(neu, w, '', { solo, jetzt: t });
      alt.labRatings.push({ ts: t, ...w }); alt.labScore = ALT._labCalcScore(alt.labRatings);
      await ALT._labApplyStatusLogic(alt, '');
      for (const k of ['labStatus', 'labGen', 'labRevisionPending']) assert.equal(neu[k], alt[k], `Lauf ${lauf}, Schritt ${s}, ${k}`);
      gesehen.add(neu.labStatus); verglichen++;
    }
  }
  assert.ok(verglichen > 30000);
  assert.deepEqual([...gesehen].sort(), ['accepted', 'inReview', 'removed', 'revised', 'warning'], 'der Vergleich hat jeden Zustand nach einer Bewertung erreicht');
});

test('Status-Kette: alle sechs Zustände werden erreicht (sonst misst der Vergleich nichts)', () => {
  const r = { labStatus: 'experimentell', labRatings: [], labGen: true }, gut = { taste: 5, practicality: 5, originality: 5, description: 5 }, schlecht = { taste: 1, practicality: 1, originality: 1, description: 1 };
  LAB.bewerten(r, schlecht, '', { jetzt: 1 }); assert.equal(r.labStatus, 'inReview');
  LAB.bewerten(r, schlecht, '', { jetzt: 2 }); LAB.bewerten(r, schlecht, '', { jetzt: 3 }); assert.equal(r.labStatus, 'warning');
  LAB.bewerten(r, schlecht, '', { jetzt: 4 }); assert.deepEqual(LAB.bewerten(r, schlecht, 'zu sauer', { jetzt: 5 }), { ueberarbeiten: true }); assert.equal(r.labRevisionPending, true);
  LAB.ueberarbeitungBereit(r, { titel: 'Neu', zutaten: [{ menge: '2 cl', name: 'Sirup' }], schritte: ['Rühren.'] }, 6); assert.equal(r.labRevisionPending, false);
  LAB.ueberarbeitungAnnehmen(r, 7); assert.equal(r.labStatus, 'revised'); assert.equal(r.name, 'Neu'); assert.deepEqual([r.ings[0].amt, r.ings[0].unit], ['2', 'cl']);
  for (const t of [8, 9, 10]) LAB.bewerten(r, schlecht, '', { jetzt: t }); assert.equal(r.labStatus, 'removed'); assert.equal(r.labGen, false);
  LAB.wiederherstellen(r, 11); assert.equal(r.labStatus, 'inReview');
  const g = { labStatus: 'experimentell', labRatings: [], labGen: true }; LAB.bewerten(g, gut, '', { solo: true }); assert.equal(g.labStatus, 'accepted', 'Einzelpersonen-Modus: eine gute Bewertung genügt');
  const g3 = { labStatus: 'experimentell', labRatings: [], labGen: true }; LAB.bewerten(g3, gut); assert.equal(g3.labStatus, 'inReview', 'Standard: drei Bewertungen nötig'); LAB.bewerten(g3, gut); LAB.bewerten(g3, gut); assert.equal(g3.labStatus, 'accepted');
});

test('Favorit-Schutz: kein manuelles Entfernen, kein Rauswurf nach der Überarbeitung', () => {
  const r = { labStatus: 'revised', labRatings: [], labGen: true, labRevisionTs: 0 }; LAB.favorit(r);
  assert.equal(LAB.entfernen(r), false); assert.equal(r.labStatus, 'revised');
  for (let i = 1; i <= 4; i++) LAB.bewerten(r, { taste: 1, practicality: 1, originality: 1, description: 1 }, '', { jetzt: i });
  assert.equal(r.labStatus, 'revised', 'geschützt: bleibt'); LAB.favorit(r); assert.equal(LAB.entfernen(r), true); assert.equal(r.labStatus, 'removed');
  assert.ok(r.labLog.some((l) => /Favorit-Schutz aktiviert/.test(l.detail)) && r.labLog.some((l) => /manuell entfernt/.test(l.detail)), 'jede Änderung steht im Protokoll');
});

test('Antwort lesen: JSON aus Text, Ablehnung, abgeschnitten, unvollständig', () => {
  const gut = '{"titel":"Basil Smash light","beschreibung":"frisch","portionen":1,"zubereitungszeit_min":5,"glastyp":"tumbler","alkohol":false,"zutaten":[{"menge":"2 cl","name":"Limettensaft"},{"menge":"etwas","name":"Basilikum"}],"schritte":["Basilikum andrücken.","Mit Eis shaken."],"tags":["frisch"]}';
  const e = LAB.antwortLesen({ stop_reason: 'end_turn', content: [{ type: 'text', text: 'Hier: ' + gut + ' Prost!' }] });
  assert.equal(e.titel, 'Basil Smash light');
  const d = LAB.getraenkAusEntwurf(e, { cat: 'mock', jetzt: 5 });
  assert.deepEqual(d.ings.map((z) => [z.amt, z.unit, z.name]), [['2', 'cl', 'Limettensaft'], ['etwas', '', 'Basilikum']], 'Menge getrennt, wo eine Einheit erkannt wird; sonst bleibt der Text');
  assert.equal(d.labStatus, 'experimentell'); assert.equal(d.labGen, true); assert.equal(d.servings, 1); assert.equal(d.notes, 'frisch');
  assert.throws(() => LAB.antwortLesen({ stop_reason: 'refusal', content: [] }), /abgelehnt/);
  assert.throws(() => LAB.antwortLesen({ stop_reason: 'max_tokens', content: [{ type: 'text', text: '{"titel":"x"' }] }), /abgeschnitten/);
  assert.throws(() => LAB.antwortLesen('Leider weiß ich nichts.'), /kein Rezept/);
  assert.throws(() => LAB.antwortLesen('{"titel":"X","zutaten":[],"schritte":["a"]}'), /unvollständig/);
  assert.throws(() => LAB.antwortLesen('{"titel": X}'), /kein gültiges Rezept/);
});

test('Aufträge: Kategorie, Geschmack, Zutaten, alkoholfrei, Sprache, Feedback', () => {
  const a = LAB.auftragErfinden({ kategorie: 'Mocktails', geschmack: ['frisch', 'herb'], zutaten: 'Gurke', ohneAlkohol: true, sprache: 'en' });
  assert.ok(a.includes('Mocktails-Rezept') && a.includes('frisch, herb') && a.includes('Gurke') && a.includes('alkoholfrei') && a.includes('English') && a.includes('"zutaten"'));
  assert.ok(LAB.auftragErfinden({ kategorie: 'Cocktails' }).includes('keine Präferenz'));
  const r = { name: 'Alt', ings: [{ amt: '2', unit: 'cl', name: 'Gin' }], steps: [{ txt: 'Rühren.' }], labScore: 1.8, labFeedback: ['zu bitter'] };
  const u = LAB.auftragUeberarbeiten(r, { kategorie: 'Cocktails' });
  assert.ok(u.includes('"Alt"') && u.includes('2 cl Gin') && u.includes('1. Rühren.') && u.includes('1.8/5') && u.includes('zu bitter'));
  assert.equal(LAB.LAB_MODELL, 'claude-haiku-5-5');
});
