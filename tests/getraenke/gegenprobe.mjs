#!/usr/bin/env node
/* Gegenprobe zu tests/getraenke/*.test.mjs.

   Jeder Fall sabotiert EINE Zusicherung in getraenke/ und verlangt, dass die
   Proben rot werden — und zwar an der Zeile, die diese Zusicherung beim Namen
   nennt. Eine Probe, die ihre eigene Sabotage nicht fängt, misst nichts.

   ⚠ SIE LÄUFT IN EINER WEGWERF-KOPIE (Ordner aus GEGENPROBE_ORT, sonst das
     Temp-Verzeichnis des Systems), nie im echten Baum. Kopiert wird nur, was
     die Proben brauchen: getraenke/, tests/getraenke/, die QC-Datei, die
     Vorschau, package.json.
   ⚠ SIE URTEILT AN DER ERSTEN ROTEN ZEILE, nicht an „rot ja/nein": ein Fall,
     der eine FREMDE Zusicherung umwirft, hat seine eigene nicht gemessen.
   ⚠ DER ANKER MUSS GENAU EINMAL VORKOMMEN und die Datei wirklich ändern;
     sonst ist er tot und wird als tot gezählt, nicht als gefangen.
   ⚠ DIESE DATEI WÄHREND IHRES LAUFS NICHT ANFASSEN.

   Aufruf:  node tests/getraenke/gegenprobe.mjs            (alle Fälle)
            NUR_ANKER=1 node tests/getraenke/gegenprobe.mjs (nur Anker prüfen)
            NUR_FALL=Store node tests/getraenke/gegenprobe.mjs
   Rückgabewert 0 nur bei: 0 durchgerutscht, 0 falscher Grund, 0 tote Anker. */
import { cpSync, mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync, readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const WURZEL = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const ort = process.env.GEGENPROBE_ORT || tmpdir();
mkdirSync(ort, { recursive: true });
const TMP = mkdtempSync(join(ort, 'gegenprobe-getraenke-'));
const K = join(TMP, 'kopie');
const qc = readdirSync(WURZEL).filter(n => /^QC_Mixarium_.*\.html$/.test(n)).sort()[0];
for (const p of ['getraenke', join('tests', 'getraenke'), qc, join('docs', 'vorschau', 'mixarium-neu.html'), 'package.json'])
  cpSync(join(WURZEL, p), join(K, p), { recursive: true });

function lauf() {
  const e = spawnSync(process.execPath, ['--test', '--test-reporter=tap', 'tests/getraenke/*.test.mjs'], { cwd: K, encoding: 'utf8' });
  const aus = (e.stdout || '') + (e.stderr || '');
  const rot = aus.split('\n').filter(z => /^not ok \d+ - /.test(z)).map(z => z.replace(/^not ok \d+ - /, ''));
  const gruen = aus.split('\n').filter(z => /^ok \d+ - /.test(z)).length;
  return { rc: e.status, rot, gruen };
}

/* [Name, Datei, Anker, Ersatz, erwartete rote Zeile] */
const FAELLE = [
  ['Dezimalkomma wird nicht mehr gelesen', 'einheiten.mjs', "s = s.replace(',', '.');                                   // deutsches", "/* weg */                                                  // deutsches", /mengeLesen liest wie parseAmt/],
  ['Brüche „1/2" werden nicht mehr gelesen', 'einheiten.mjs', "if (bruch) return parseInt(bruch[1], 10) / parseInt(bruch[2], 10);", "if (bruch) return parseInt(bruch[1], 10);", /mengeLesen liest wie parseAmt/],
  ['Spannen verlieren die obere Grenze', 'einheiten.mjs', "if (spanne) return [parseFloat(spanne[1].replace(',', '.')), parseFloat(spanne[2].replace(',', '.'))];", "if (spanne) return parseFloat(spanne[1].replace(',', '.'));", /mengeLesen liest wie parseAmt/],
  ['„10.5" wird wieder wie in der alten App zu 1,5', 'einheiten.mjs', "const bruch = s.match(", "const altFehler = s.match(/^(\\d+\\.?\\d*)(0\\.\\d+)$/); if (altFehler) return parseFloat(altFehler[1]) + parseFloat(altFehler[2]);\n  const bruch = s.match(", /benannte Abweichung 1/],
  ['schöne Brüche greifen zu weit', 'einheiten.mjs', "Math.abs(rest - v) < 0.04", "Math.abs(rest - v) < 0.09", /zahlFormatieren schreibt wie fmtNum/],
  ['Skalieren rundet anders als die alte App', 'einheiten.mjs', "if (n >= 10) return Math.round(n).toString();", "if (n >= 10) return n.toFixed(1);", /zahlFormatieren schreibt wie fmtNum/],
  ['Unze ist 30 statt 29,5735 ml', 'einheiten.mjs', "return { amt: String(Math.round(n * 29.5735)), unit: 'ml' };", "return { amt: String(Math.round(n * 30)), unit: 'ml' };", /umrechnenInSystem rechnet wie convertAmtUnitLocal/],
  ['ab 200 ml wird nicht mehr in cup gerechnet', 'einheiten.mjs', "if (n >= 200) return { amt: String(Math.round(n / 236.588 * 4) / 4), unit: 'cup' };", "", /umrechnenInSystem rechnet wie convertAmtUnitLocal/],
  ['Liberia und Myanmar gelten als metrisch', 'einheiten.mjs', "new Set(['US', 'LR', 'MM'])", "new Set(['US'])", /Standard-System aus der Locale/],
  ['cl → ml rechnet mit dem falschen Faktor', 'einheiten.mjs', "{ kennung: 'cl', art: 'volumen', ml: 10,", "{ kennung: 'cl', art: 'volumen', ml: 100,", /Umrechnung ml ↔ cl ↔ oz/],
  ['eine Menge wird zu 0 umgerechnet', 'einheiten.mjs', "  const w = _rund(ml, z);\n  if (!(w > 0)) return null;", "  const w = _rund(ml, z);", /erfindet keine Null/],
  ['Löffel werden als Volumen umgerechnet', 'einheiten.mjs', "if (!e || e.art !== 'volumen') return null;", "if (!e) return null; if (e.art !== 'volumen') e.ml = 15;", /lässt stehen, was kein Flüssigkeitsmaß ist/],
  ['„1 Fresh" wird in Menge und Einheit zerlegt', 'einheiten.mjs', "  if (!einheitKennung(m[2])) return null;\n", "", /Menge und Einheit trennen/],
  ['Glas-Name weicht von der alten App ab', 'glaeser.mjs', "ru: 'Хайбол'", "ru: 'Хайбол!'", /Gläser: Kennungen, Reihenfolge/],
  ['einem Glas fehlt eine der acht Sprachen', 'glaeser.mjs', "es: 'Vaso bajo', ", "", /Gläser: alle acht Sprachen/],
  ['eine leere Kennung wird nach Knabbereien geraten', 'kategorien.mjs', "  if (!id) return KAT_OHNE;", "  if (!id) return 'knab';", /katVonRezept und ordnerVonRezept deuten wie die alte App/],
  ['ein toter Ordner gilt als Zuhause', 'kategorien.mjs', "return _hatOrdner(ordner, id.slice(4)) ? id : KAT_OHNE;", "return id;", /katVonRezept und ordnerVonRezept deuten wie die alte App/],
  ['r.folder auf einen toten Ordner gilt als Ordner', 'kategorien.mjs', "  return _hatOrdner(ordner, f) ? f : '';", "  return f;", /katVonRezept und ordnerVonRezept deuten wie die alte App/],
  ['der Sammel-Reiter steht immer da', 'kategorien.mjs', "  if (ohne > 0) {", "  if (true) {", /Reiter erscheint nur, wenn es ihn braucht/],
  ['eine unbekannte Kennung bekommt einen erfundenen Namen', 'kategorien.mjs', "else out.push({ id, ico: '📦', de: id,", "else out.push({ id, ico: '📦', de: 'Sonstiges',", /eine fremde Kennung bleibt sichtbar/],
  ['fremde Kennungen bekommen keinen Reiter', 'kategorien.mjs', "KATEGORIEN.concat(neu).concat(katsFremd(getraenke, ordner, { sprache: l.sprache, ohneName: l.ohneName }))", "KATEGORIEN.concat(neu)", /Reiter erscheint nur, wenn es ihn braucht|eine fremde Kennung bleibt sichtbar/],
  ['der eigene Name gewinnt nicht mehr', 'kategorien.mjs', "  if (e && e.name) return e.name;\n", "", /ein eigener Name gewinnt/],
  ['eine Kennung kommt zweimal heraus', 'kategorien.mjs', "if (aus.has(id) || gesehen.has(id)) return;", "if (aus.has(id)) return;", /eine Kennung kommt genau einmal heraus/],
  ['eine feste Kategorie fehlt', 'kategorien.mjs', "  { id: 'sirup', symbol: 'kat-sirup',", "  { id: 'sirup2', symbol: 'kat-sirup',", /die zehn festen Kategorien/],
  ['Cocktails tragen kein Alkohol-Merkmal', 'kategorien.mjs', "col: '#c04030', alcohol: true }", "col: '#c04030' }", /alcErlaubt urteilt wie alcAllowed|die zehn festen Kategorien|nur Cocktails tragen alcohol:true/],
  ['auch volle Kategorien werden ausgeblendet', 'kategorien.mjs', ".map(String).filter(id => katAnzahl(id, getraenke, ordner) === 0));", ".map(String));", /ausgeblendet wird nur, was leer ist/],
  ['das Feld alcohol zählt nicht mehr', 'alkohol.mjs', "  if (r.alcohol) return true;\n", "", /alcErlaubt urteilt wie alcAllowed/],
  ['der Schalter wirkt verkehrt herum', 'alkohol.mjs', "  if (!ohneAlkohol) return true;", "  if (ohneAlkohol) return true;", /alcErlaubt urteilt wie alcAllowed/],
  ['der Schalter schaut in die Zutaten (anders als alt)', 'alkohol.mjs', "  if (r.alcohol) return true;\n  return false;", "  if (r.alcohol) return true;\n  return alkoholBefund(r).alkohol;", /alcErlaubt urteilt wie alcAllowed/],
  ['Stichworte treffen mitten im Wort', 'alkohol.mjs', "(MIT_VORSILBE.has(w) ? '' : _B)", "''", /keine Fehlgriffe/],
  ['„alkoholfrei" entlastet nicht mehr', 'alkohol.mjs', "  if (ENTLASTUNG.some(e => t.includes(e))) return [];\n", "", /keine Fehlgriffe/],
  ['eine Zeichnung weicht von der Vorschau ab', 'geraete.mjs', '<path class="f" d="M20 28h24l-3 28H23z"/>', '<path class="f" d="M20 28h24l-3 29H23z"/>', /Zeichen für Zeichen/],
  ['„schütteln" findet den Shaker nicht', 'geraete.mjs', "A + 'schüttel', ", "", /geraeteFuerSchritt: deutsche und englische/],
  ['„Eis" trifft in „Reis" und „Preis"', 'geraete.mjs', "A + 'eis(?![\\\\p{L}])'", "'eis'", /keine Fehlgriffe, leerer Text/],
  ['die Quelle samt Schlüsseln wandert ins Ergebnis', 'uebernahme.mjs', "    sicherungen,\n    befund,", "    sicherungen, quelle: ls,\n    befund,", /API-Schlüssel werden NICHT übernommen/],
  ['Schlüssel werden nicht mehr als nicht-übernommen genannt', 'uebernahme.mjs', "    if (_istGeheim(k)) befund.nichtUebernommen.push(k);", "    if (false) befund.nichtUebernommen.push(k);", /API-Schlüssel werden NICHT übernommen/],
  ['Getränke ohne uid bleiben ohne', 'uebernahme.mjs', "  if (!r.uid) {\n    r.uid = ", "  if (false) {\n    r.uid = ", /jedes Getränk trägt eine uid/],
  ['Zutaten werden nicht getrennt', 'uebernahme.mjs', "    const t = zutatTrennen(z);", "    const t = { ...z };", /Zutaten kommen getrennt/],
  ['die Bilder aus mix9m_imgs fehlen', 'uebernahme.mjs', "if (r && !r.img && bilder[r.id]) { r.img = bilder[r.id]; mitBild++; }", "", /Übernahme aus der alten App: Getränke/],
  ['die IndexedDB wird nie genommen', 'uebernahme.mjs', "if (Array.isArray(idbR) && (!Array.isArray(lsR) || zahl(idbR) > zahl(lsR)))", "if (false)", /localStorage leer → IndexedDB/],
  ['die Quelle wird beim Lesen verändert', 'uebernahme.mjs', "  const r = kopie(alt) || {};\n  const b = befund || {};", "  const r = alt || {};\n  const b = befund || {};", /die Pflichtfelder der alten App|Übernahme aus der alten App: Getränke|alte Sicherung ohne uid \(version 9\)/],
  ['gleiche uid kommt doppelt herein', 'uebernahme.mjs', "      const mein = nachUid.get(roh.uid);", "      const mein = null;", /kategorien-Block|zusammenführen ohne Dubletten/],
  ['der Namens-Rückfall fehlt', 'uebernahme.mjs', "    } else if (namen.has(", "    } else if (false && namen.has(", /zusammenführen ohne Dubletten/],
  ['frisch vergebene Kennungen zählen als Beweis', 'uebernahme.mjs', "    if (roh.uid && !roh.uidFrisch) {", "    if (roh.uid) {", /zweimal eingespielt/],
  ['die mitgebrachte uid wird ersetzt', 'uebernahme.mjs', "delete n.uidFrisch; n.id = maxId + i + 1; return n; });", "delete n.uidFrisch; n.uid = uid(); n.id = maxId + i + 1; return n; });", /kategorien-Block/],
  ['die kürzere Herkunfts-Kette gewinnt', 'uebernahme.mjs', "  return y.length > x.length ? y : x;", "  return x;", /zusammenführen ohne Dubletten|Herkunft: Station anhängen/],
  ['vorhandene Ordner werden überschrieben', 'uebernahme.mjs', "f && f.id != null && !habe.has(String(f.id)) && (habe.add(String(f.id)), true)", "f && f.id != null", /zusammenführen ohne Dubletten/],
  ['der kategorien-Block wird überlesen', 'uebernahme.mjs', "    k.neu.push(n); e.neueKategorien.push(n);", "", /kategorien-Block/],
  ['der kategorien-Block überschreibt feste Kategorien', 'uebernahme.mjs', "    if (habe.has(id)) continue;\n    habe.add(id);", "    habe.add(id);", /kategorien-Block/],
  ['Beispiele tragen keine Marke', 'uebernahme.mjs', "{ r.beispiel = name; r.beispielPruef = inhaltsPruefwert(r); }", "{ r.beispielPruef = inhaltsPruefwert(r); }", /Beispiele tragen uid und die Marke/],
  ['veränderte Beispiele gelten als unverändert', 'uebernahme.mjs', "(r.beispielPruef && r.beispielPruef === inhaltsPruefwert(r) ? unveraendert : veraendert)", "(r.beispiel ? unveraendert : veraendert)", /ein verändertes Beispiel wird getrennt gemeldet/],
  ['eigene Getränke gelten als Beispiel', 'uebernahme.mjs', "    if (!r || !r.beispiel) continue;", "    if (!r) continue;", /Beispiele löschen: ein Klick/],
  ['Beispiele löschen entfernt nichts', 'uebernahme.mjs', "    if (weg.has(r)) { entfernt.push({ uid: r.uid, name: r.name, paket: r.beispiel }); return false; }", "    if (weg.has(r)) { entfernt.push({ uid: r.uid, name: r.name, paket: r.beispiel }); return true; }", /Beispiele löschen: ein Klick/],
  ['ein verändertes Beispiel behält seine Marke', 'uebernahme.mjs', "      r.beispielWar = r.beispiel; delete r.beispiel; delete r.beispielPruef;", "", /ein verändertes Beispiel wird getrennt gemeldet/],
  ['auf- und zuklappen zählt als Änderung', 'uebernahme.mjs', "    x.name || '', (typeof x.cat", "    !!x.shut, x.name || '', (typeof x.cat", /ein verändertes Beispiel wird getrennt gemeldet/],
  ['Sammlung leeren lässt die Ordner stehen', 'uebernahme.mjs', "  const leer = leereSammlung(s);", "  const leer = { ...leereSammlung(s), ordner: _liste(s.ordner) };", /Sammlung leeren und neu aufbauen/],
  ['Sammlung leeren wirft die Einstellungen weg', 'uebernahme.mjs', "einstellungen: v.einstellungen ? kopie(v.einstellungen) : { ohneAlkohol: false, sprache: null },", "einstellungen: { ohneAlkohol: false, sprache: null },", /Sammlung leeren und neu aufbauen/],
  ['Store-Ausgabe behält Getränke mit Alkohol', 'uebernahme.mjs', "      return !b.alkohol;\n    });\n    if (Array.isArray(p.kategorien))", "      return true;\n    });\n    if (Array.isArray(p.kategorien))", /Store-Ausgabe enthält kein Getränk mit Alkohol/],
  ['Store-Ausgabe behält Kategorien mit alcohol:true', 'uebernahme.mjs', "if (a) entfernteKategorien.push(c.id); return !a; });", "if (a) entfernteKategorien.push(c.id); return true; });", /Store-Ausgabe enthält kein Getränk mit Alkohol/],
  ['Store-Ausgabe schaut nicht in die Zutaten', 'uebernahme.mjs', "      const b = alkoholBefund(r, { ...(optionen || {}), neu });\n      if (b.alkohol) entfernt.push", "      const b = alkoholBefund(r, { neu, zutatenPruefen: false });\n      if (b.alkohol) entfernt.push", /Store-Ausgabe enthält kein Getränk mit Alkohol/],
  ['Voll-Ausgabe filtert wie Store', 'uebernahme.mjs', "  if (ausgabe === 'store') {", "  if (true) {", /Voll-Ausgabe enthält alles/],
];

const nur = process.env.NUR_FALL, nurAnker = process.env.NUR_ANKER === '1';
let gefangen = 0, durch = 0, falsch = 0, tot = 0;
try {
  const start = lauf();
  if (start.rc !== 0 || start.rot.length || start.gruen === 0) { console.log(`✗ ABBRUCH: die Proben sind schon OHNE Eingriff rot (rc ${start.rc}, rot ${start.rot.length}) — kein Fall würde etwas messen.`); process.exit(2); }
  console.log(`Ausgangslage grün (${start.gruen} Proben).\n`);
  for (const [name, datei, anker, ersatz, trifft] of FAELLE) {
    if (nur && !name.includes(nur)) continue;
    const pfad = join(K, 'getraenke', datei);
    const vorher = readFileSync(pfad, 'utf8');
    const n = vorher.split(anker).length - 1;
    const neu = n === 1 ? vorher.replace(anker, () => ersatz) : vorher;
    if (n !== 1 || neu === vorher) { console.log(`⊘ TOTER ANKER (${n === 0 ? 'fehlt' : n > 1 ? n + '-fach' : 'ohne Wirkung'}): ${name}`); tot++; continue; }
    if (nurAnker) { console.log(`· Anker lebt: ${name}`); continue; }
    writeFileSync(pfad, neu);
    const e = lauf();
    writeFileSync(pfad, vorher);
    if (!e.rot.length) { console.log(`✗ NICHT GEFANGEN: ${name}${e.rc !== 0 ? ' (Lauf brach ab, rc ' + e.rc + ')' : ''}`); durch++; }
    else if (trifft.test(e.rot[0])) { console.log(`✓ gefangen: ${name}`); gefangen++; }
    else { console.log(`⚠ ROT AUS FALSCHEM GRUND: ${name}\n      ${e.rot[0]}`); falsch++; }
  }
  if (!nurAnker) {
    const ende = lauf();
    if (ende.rc !== 0 || ende.rot.length) { console.log('✗ Die Kopie ist nach dem Zurückstellen nicht wieder grün — die Messung ist wertlos.'); process.exit(2); }
  }
} finally { rmSync(TMP, { recursive: true, force: true }); }
console.log(`\n${gefangen} gefangen · ${durch} durchgerutscht · ${falsch} aus falschem Grund · ${tot} tote Anker`);
process.exit(durch || falsch || tot ? 1 : 0);
