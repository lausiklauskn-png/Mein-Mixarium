/* Probe: die sechs Sprach-Tabellen der neuen PWA (neu/sprachen/<code>.mjs) passen zum Code.
   Schlüssel ist der DEUTSCHE Text, wie er bei L() bzw. text() ankommt; das Werkzeug tools/sprach-schluessel.mjs sammelt ihn.
   Gemessen werden die Tabellen und der Leser – nicht, ob die App die Tabellen lädt (das verdrahtet neu/app.mjs). */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { sammle, pruefe, CODES, tabellenPfad, entmaskiere } from '../../tools/sprach-schluessel.mjs';
import { tabelle, tabelleVon, text, fuelle, ladeTabelle, SPRACHEN } from '../../kern/oberflaeche/sprache.mjs';
import * as LAB from '../../getraenke/labor.mjs';
import { GERAETE } from '../../getraenke/geraete.mjs';

const S = sammle(), SOLL = Object.keys(S.schluessel);
/* Eine kaputte Tabelle darf die Probe nicht ohne Namen umwerfen: der Fehler wird gemerkt und in der Zusicherung genannt. */
const TAB = {}, LADEFEHLER = {};
for (const c of CODES) TAB[c] = existsSync(tabellenPfad(c)) ? await import(pathToFileURL(tabellenPfad(c)).href).then((m) => m.default, (e) => { LADEFEHLER[c] = e.message; return null; }) : null;
const platz = (t) => (String(t).match(/\{\d\}/g) || []).sort().join(' ');

/* Der deutsche Text darf nur dort unverändert stehen, wo die Sprache das Wort genauso schreibt. */
const GLEICH_ERLAUBT = {
  Web: ['es', 'fr', 'it', 'pt'],   // Lehnwort, überall „Web“
  Foto: ['es', 'it', 'pt'],        // „foto“ heißt dort so
  Original: ['es', 'fr', 'pt'],    // dort gleich geschrieben
  Shaker: ['fr', 'it', 'pt'],      // so sagen die Barleute dort
};
/* Bleibt stehen, wie es ist: Eigennamen, Formate, Einheiten. */
const FEST = ['Anthropic', 'Claude', 'Mistral', 'OpenAI', 'Pollinations', 'thecocktaildb.com', 'PDF', 'OCR', 'HTTP', '100 %', ' cl '];

test('das Werkzeug findet die Texte der App: viele Schlüssel, jeder mit englischem Text, keine Stelle bleibt unerklärt', () => {
  assert.ok(SOLL.length > 300, `nur ${SOLL.length} Schlüssel – der Leser findet die Aufrufe nicht`);
  for (const k of SOLL) assert.ok(typeof S.schluessel[k] === 'string' && S.schluessel[k] !== '', `kein englischer Text zu ${JSON.stringify(k)}`);
  assert.deepEqual(S.unerklaert, [], 'L() bekommt Texte aus einer Liste, die das Werkzeug nicht kennt (LISTEN oder KERN_AUFRUFE ergänzen)');
  assert.deepEqual(S.unklar, [], 'ein Aufruf mit festem deutschem Text, dessen englischer Text nicht lesbar ist');
});

test('jeder Text ist tabellenfähig: kein L(`… ${x} …`) und kein deutscher Text mit zwei englischen Fassungen', () => {
  assert.deepEqual(S.vorlagen.map((x) => `${x.datei}:${x.zeile} ${x.text}`), [], 'eine Vorlage mit ${…} kann keine Tabelle treffen – dafür fuelle(L(\'… {0} …\', \'… {0} …\'), x)');
  assert.deepEqual(S.zwei.map((x) => `${x.de}: ${x.en.join(' / ')}`), [], 'ein Schlüssel hat nur eine Übersetzung – Zahl-Sätze als \'1 …\' und \'{0} …\' schreiben');
});

test('was das Labor zur Laufzeit an L() gibt, steht unter den Schlüsseln (Status, Bewertungs-Maße, Geschmäcker)', () => {
  const laufzeit = [...Object.values(LAB.LAB_STATUS), ...LAB.DIMENSIONEN, ...LAB.GESCHMAECKER];
  assert.ok(laufzeit.length >= 16);
  for (const x of laufzeit) assert.equal(S.schluessel[x.de], x.en, `fehlt oder anders: ${x.de}`);
});

test('vorbereitet und so benannt: die Gerätschaften der Bar stehen in den Tabellen, auch wenn geraetName() sie noch nicht über text() holt', () => {
  assert.deepEqual(S.vorbereitet.map((x) => [x.de, x.en]), Object.values(GERAETE).map((g) => [g.de, g.en]));
  for (const g of Object.values(GERAETE)) assert.equal(S.schluessel[g.de], g.en, g.de);
});

for (const c of CODES) {
  test(`${c}: die Tabelle ist ein gültiges ES-Modul mit „export default { … }“ aus lauter Texten`, () => {
    const t = TAB[c];
    assert.ok(t && typeof t === 'object' && !Array.isArray(t), `neu/sprachen/${c}.mjs ${LADEFEHLER[c] ? 'lässt sich nicht laden: ' + LADEFEHLER[c] : 'fehlt oder hat kein „export default“'}`);
    for (const [k, v] of Object.entries(t)) assert.equal(typeof v, 'string', `kein Text bei ${JSON.stringify(k)}`);
  });
  test(`${c}: die Tabelle hat genau die Schlüssel des Werkzeugs`, () => {
    const da = Object.keys(TAB[c] || {});
    assert.deepEqual(SOLL.filter((k) => !da.includes(k)), [], 'es fehlen Schlüssel (node tools/sprach-schluessel.mjs --fehlt ' + c + ')');
    assert.deepEqual(da.filter((k) => !SOLL.includes(k)), [], 'überzählige Schlüssel: diesen Text gibt es im Code nicht mehr');
  });
  test(`${c}: kein leerer Wert`, () => {
    assert.deepEqual(Object.entries(TAB[c] || {}).filter(([, v]) => !String(v).trim()).map(([k]) => k), []);
  });
  test(`${c}: dieselben Platzhalter {0}, {1} … wie der Schlüssel`, () => {
    assert.deepEqual(Object.entries(TAB[c] || {}).filter(([k, v]) => platz(k) !== platz(v)).map(([k, v]) => `${k} → ${v}`), []);
    assert.ok(Object.keys(TAB[c] || {}).some((k) => platz(k)), 'kein Schlüssel mit Platzhalter – dann misst diese Probe nichts');
  });
  test(`${c}: „…“, „·“, Eigennamen und Einheiten bleiben stehen; Leerzeichen am Ende auch`, () => {
    const aus = [];
    for (const [k, v] of Object.entries(TAB[c] || {})) {
      if (/…\s*$/.test(k) !== /…\s*$/.test(v)) aus.push(`„…“ am Ende: ${k} → ${v}`);
      if ((k.match(/·/g) || []).length !== (v.match(/·/g) || []).length) aus.push(`„·“: ${k} → ${v}`);
      for (const f of FEST) if (k.includes(f) && !v.includes(f.trim())) aus.push(`${f.trim()} fehlt: ${k} → ${v}`);
      if (/\s$/.test(k) && !/\s$/.test(v) && !/[：]$/.test(v)) aus.push(`Leerzeichen am Ende fehlt: ${k} → ${JSON.stringify(v)}`);   // „：“ trägt im Chinesischen keinen Abstand
    }
    assert.deepEqual(aus, []);
  });
  test(`${c}: kein Wert ist der unveränderte deutsche Text (außer den benannten Ausnahmen)`, () => {
    const gleich = Object.entries(TAB[c] || {}).filter(([k, v]) => k === v && !(GLEICH_ERLAUBT[k] || []).includes(c)).map(([k]) => k);
    assert.deepEqual(gleich, []);
  });
  test(`${c}: nach tabelle() liefert text() den Eintrag, ohne Eintrag Englisch`, () => {
    assert.ok(TAB[c], 'ohne Tabelle gibt es nichts zu messen');
    tabelle(c, TAB[c]);
    let anders = 0;
    for (const k of SOLL) { assert.equal(text(c, k, S.schluessel[k]), TAB[c][k], k); if (TAB[c][k] !== S.schluessel[k] && TAB[c][k] !== k) anders++; }
    assert.ok(anders > SOLL.length * 0.9, `nur ${anders} von ${SOLL.length} Texten sind weder Deutsch noch Englisch`);
    assert.equal(text(c, 'Diesen Text gibt es in keiner Tabelle', 'No table has this text'), 'No table has this text');
    assert.equal(text('de', SOLL[0], S.schluessel[SOLL[0]]), SOLL[0]);
    assert.equal(text('en', SOLL[0], S.schluessel[SOLL[0]]), S.schluessel[SOLL[0]]);
    const mitPlatz = SOLL.find((k) => /\{0\}/.test(k));
    assert.ok(fuelle(text(c, mitPlatz, S.schluessel[mitPlatz]), 'Probe-7').includes('Probe-7'), 'fuelle() setzt in den übersetzten Text ein');
  });
}

test('ladeTabelle() lädt eine Tabelle als Modul nach; die sechs Codes sind Sprachen des Kerns', async () => {
  for (const c of CODES) assert.ok(SPRACHEN.some(([k]) => k === c), c);
  assert.equal(await ladeTabelle('it', [pathToFileURL(tabellenPfad('it')).href + '?frisch']), true);
  assert.equal(tabelleVon('it')['Speichern'], TAB.it['Speichern']);
  assert.equal(await ladeTabelle('it', ['file:///gibt/es/nicht.mjs']), false);
});

test('pruefe() meldet einen fehlenden und einen überzähligen Schlüssel beim Namen', async () => {
  /* Kopie der Lage in einem Wegwerf-Ordner: App mit zwei Texten, Tabelle mit einem davon und einem fremden. */
  const d = mkdtempSync(join(tmpdir(), 'mx-sprachen-'));
  try {
    mkdirSync(join(d, 'neu', 'sprachen'), { recursive: true }); mkdirSync(join(d, 'getraenke'));
    writeFileSync(join(d, 'neu', 'app.mjs'), "import { text as spText } from '../kern/oberflaeche/sprache.mjs';\nconst L = (de, en) => spText(sprache(), de, en);\nconst a = L('Speichern', 'Save') + L('Neu hier', 'New here');\n");
    for (const c of CODES) writeFileSync(join(d, 'neu', 'sprachen', c + '.mjs'), "export default { 'Speichern': 'x', 'Gibt es nicht mehr': 'y' };\n");
    const r = await pruefe(d);
    for (const c of CODES) { assert.deepEqual(r.sprachen[c].fehlt, ['Neu hier']); assert.deepEqual(r.sprachen[c].zuviel, ['Gibt es nicht mehr']); }
  } finally { rmSync(d, { recursive: true, force: true }); }
});

test('der Leser: \'…\', "…", Backticks, maskierte Zeichen, über Zeilen, in ${…}; Kommentare, Regex und fremde Aufrufe zählen nicht', () => {
  const d = mkdtempSync(join(tmpdir(), 'mx-leser-'));
  try {
    mkdirSync(join(d, 'neu')); mkdirSync(join(d, 'getraenke'));
    writeFileSync(join(d, 'neu', 'app.mjs'), [
      "import { text as spText, fuelle } from '../kern/oberflaeche/sprache.mjs';",
      "const esc = (t) => String(t).replace(/[&<>\"']/g, (c) => c);   // Regex mit Anführungszeichen",
      'const L = (de, en) => spText(sprache(), de, en);   /* L(\'Im Kommentar\', \'In a comment\') zählt nicht */',
      "const NAV = [['start', ['Getränke', 'Drinks'], 'drinks'], ['mehr', [\"Einstellungen\", 'Settings'], 'settings']];",
      "const a = L('Einfach', 'Simple'), b = L(\"Doppelt\", \"Double\"), c = L(`Rück`, `Back`);",
      "const d = L('Wie geht\\'s „dir“?', 'How are \\u0079ou?'), e = L('Über\\",
      "Zeile', 'Across line');",
      "const f = L(",
      "  'Zwei Zeilen',",
      "  'Two lines'",
      ');',
      "const g = `<p title=\"${L('In der Vorlage', 'In the template')}\">${x ? `<b>${L('Tief drin', 'Deep inside')}</b>` : ''}</p>`;",
      "const h = L(`${n} Getränke`, `${n} drinks`), i = L('Teil ' + 'zwei', 'Part ' + 'two');",
      "const j = NAV.map(([v, n]) => L(...n)), k = URL.createObjectURL(blob), m = obj.L('Fremd', 'Foreign');",
      "const n2 = fuelle(L('{0} Dateien', '{0} files'), 3), o = L(neu.de, neu.en);",
    ].join('\n'));
    writeFileSync(join(d, 'getraenke', 'x.mjs'), [
      "import { text } from '../kern/oberflaeche/sprache.mjs';",
      "export const STATUS = { a: { de: 'Nur zwei', en: 'Only two' } };",
      "export const KAT = [{ id: 'k', de: 'Alle', en: 'All', fr: 'Tous' }];",
      "export function f(s) { return text(s, 'Aus der Schicht', 'From the layer') + ant.text() + text(s,",
      "  'Mehrzeilig in der Schicht', 'Multi-line in the layer'); }",
    ].join('\n'));
    const r = sammle(d);
    assert.deepEqual(r.schluessel, {
      Einfach: 'Simple', Doppelt: 'Double', 'Rück': 'Back', "Wie geht's „dir“?": 'How are you?', 'ÜberZeile': 'Across line', 'Zwei Zeilen': 'Two lines',
      'In der Vorlage': 'In the template', 'Tief drin': 'Deep inside', 'Teil zwei': 'Part two', '{0} Dateien': '{0} files',
      'Getränke': 'Drinks', Einstellungen: 'Settings', 'Aus der Schicht': 'From the layer', 'Mehrzeilig in der Schicht': 'Multi-line in the layer',
    });
    assert.deepEqual(r.vorlagen.map((x) => `${x.datei}:${x.zeile} ${x.text}`), ['neu/app.mjs:13 `${n} Getränke`'], 'eine Vorlage mit ${…} kann keine Tabelle treffen – sie wird gemeldet');
    assert.deepEqual(r.unerklaert.map((x) => x.aufruf), ['neu.de, neu.en'], 'eine Liste, die das Werkzeug nicht kennt, wird gemeldet');
    assert.deepEqual(r.nurDeEn.map((x) => `${x.name}: ${x.de}`), ['STATUS: Nur zwei'], '{ de, en } ohne text() wird als Auskunft gemeldet, nicht als Schlüssel');
    assert.deepEqual(r.eigeneSprachen.map((x) => x.name), ['KAT'], 'Felder je Sprache brauchen keine Tabelle');
  } finally { rmSync(d, { recursive: true, force: true }); }
  assert.equal(entmaskiere("a\\'b\\n\\u00e4\\x41\\\\"), "a'b\nä" + 'A\\');
});
