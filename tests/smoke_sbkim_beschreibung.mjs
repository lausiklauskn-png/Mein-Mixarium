/*
 * Probe: Mixariums Bedeutungs-Beschreibung — und wer im Semantik-Feld gewinnt.
 *
 * ── WARUM ES DIESE PROBE GIBT (Befund 2026-09-10) ───────────────────────────
 *
 * Der Mycel-Mitschnitt vom 2026-09-10 hat gezeigt, dass Mein Mixarium im Raum
 * mit **88 Zeichen** stand — „Klaus Mixarium - Cocktails, Mocktails, Smoothies
 * und mehr; Knabbereien als Begleit-Plus." —, während in `sbkim/siegel-inhalt.js`
 * ein ausgearbeiteter Text von über 1400 Zeichen lag. Klaus hat es im Siegel
 * fotografiert: im Feld stand der Zweizeiler.
 *
 * ZWEI Ursachen, und beide sind hier bewacht:
 *
 *   1. `sbkim/sbkim-init.js` (die stille Erst-Anmeldung) trug einen ANDEREN,
 *      viel kürzeren Text als das Siegel. Zwei Wege zur Spore, zwei Texte —
 *      also zwei verschiedene Vektoren für denselben Knoten, je nachdem, welchen
 *      Weg der Nutzer nimmt.
 *   2. Die gespeicherte Spore überschrieb den Vorschlag der App im Siegel-Feld
 *      STILL. Wer neu signierte, bekam den Zweizeiler zurück.
 *
 * ⚠ EINE ZAHL MISST UMFANG, KEINEN INHALT. In Kim Hub Company gingen 1851
 * Zeichen ohne Namen und ohne Zweck durch einen Längen-Wächter. Gemessen werden
 * die Sachen deshalb EINZELN, jede mit eigenem Namen in der roten Zeile — und
 * gemessen wird der BEGRIFF, nicht die Formulierung.
 *
 * ⚠ WARUM DAS PROTOKOLL DARIN VORKOMMEN MUSS: gemessen an den vier Mitschnitten
 * vom 2026-09-10 entscheidet nicht die Länge, sondern der Inhalt. Kim-Bell kommt
 * mit 82 Zeichen auf 0.874864, weil es SBKIM, Mycel und Knoten nennt; Muster
 * Werbetechnik hat 421 Zeichen und kommt auf 0.793613, weil es das Protokoll
 * nicht erwähnt.
 *
 * Lauf: node tests/smoke_sbkim_beschreibung.mjs
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const WURZEL = join(dirname(fileURLToPath(import.meta.url)), "..");
const lies = (p) => readFileSync(join(WURZEL, p), "utf8");

let gruen = 0, rot = 0;
const ok = (was, bedingung) => {
  if (bedingung) { gruen++; console.log(`  ✓ ${was}`); }
  else { rot++; console.log(`  ✗ ROT — ${was}`); }
};

console.log("\n── Mixariums Bedeutungs-Beschreibung ──\n");

const holText = (q) => {
  const m = q.match(/domainDescription: "((?:[^"\\]|\\.)*)"/);
  return m ? JSON.parse('"' + m[1] + '"') : "";
};
/* ⚠ NICHT AN EINEM LEERZEICHEN HÄNGEN. Die erste Fassung suchte
   `domainKeywords: [` mit genau EINEM Leerzeichen — und in `sbkim-init.js`
   stehen dort ZWEI, weil die Zeile mit ihren Nachbarn ausgerichtet ist. Der
   Wächter meldete „kein Treffer" und damit eine Abweichung, die keine war:
   ein Fehler im Wächter, der wie ein Fehler im Code aussah. */
const holKw = (q) => {
  const m = q.match(/domainKeywords:\s*(\[[^\]]*\])/);
  return m ? JSON.stringify(JSON.parse(m[1])) : "";
};

const siegel = lies("sbkim/siegel-inhalt.js");
const init = lies("sbkim/sbkim-init.js");
const text = holText(siegel);

/* ── 1 · Zwei Wege zur Spore, EIN Text ───────────────────────────────────── */
/* Das ist der Befund, der Mixarium mit 88 Zeichen in den Raum gestellt hat. */
ok(`beide Wege zur Spore tragen denselben Text (${text.length} Zeichen)`,
  text.length > 0 && text === holText(init));
ok("… und dieselben Stichworte", holKw(siegel).length > 0 && holKw(siegel) === holKw(init));

/* ── 2 · Was drinstehen MUSS — einzeln, nicht als Länge ──────────────────── */
ok("die Beschreibung trägt Substanz", text.length > 1200);
ok("… nennt den eigenen Namen", /Mein Mixarium/.test(text));
ok("… nennt die Domäne (Getränke), nicht nur die Technik",
  /(Getränke|Cocktail|Drink)/.test(text));
ok("… nennt das SBKIM-Protokoll und das Mycel",
  /SBKIM/.test(text) && /Mycel/.test(text));
ok("… nennt Sage-Protokol als Herkunft der Spezifikation", /Sage-Protokol/.test(text));
ok("… sagt, dass diese App SELBST ein Knoten ist",
  /(Endknoten|eigener Knoten|Knoten im)/.test(text));
ok("… und NICHT mehr der 88-Zeichen-Zweizeiler",
  !/^Klaus Mixarium - Cocktails/.test(text.trim()));
ok("die Stichworte nennen SBKIM, Mycel und Knoten",
  /SBKIM/.test(holKw(siegel)) && /Mycel/.test(holKw(siegel)) && /Knoten/.test(holKw(siegel)));

/* ── 3 · Wer im Feld gewinnt ─────────────────────────────────────────────── */
/* ⚠ GEMESSEN WIRD DER BLOCK, NICHT DIE DATEI. `ta.value = WIZ.domainDescription`
   steht ZWEIMAL — als Vorbelegung und im Rückhol-Knopf. Ein Wächter, der frei
   in der Datei sucht, findet die zweite Stelle und bleibt grün, wenn die erste
   fehlt. Genau so ist es in Kim Hub Company durchgerutscht. */
const iFeld = siegel.indexOf('ta.id = "sbkim-si-semantik-text"');
const iHerk = siegel.indexOf("var herkunft = document.createElement");
const vorbelegung = iFeld >= 0 && iHerk > iFeld ? siegel.slice(iFeld, iHerk) : "";
ok("das Feld zeigt den Vorschlag der APP",
  /ta\.value = WIZ\.domainDescription;/.test(vorbelegung));

const iLade = siegel.indexOf("getOwnSpore().then");
const iEnde = siegel.indexOf('ta.addEventListener("input"', iLade);
const ladePfad = iLade >= 0 && iEnde > iLade ? siegel.slice(iLade, iEnde) : "";
ok("… und die gespeicherte Spore überschreibt ihn NICHT mehr von selbst",
  ladePfad.length > 0 && (ladePfad.match(/ta\.value\s*=/g) || []).length === 1
  && /if \(!abweichend\) return;/.test(ladePfad));
ok("eine Zeile NENNT, welcher Text im Feld steht",
  /id = "sbkim-si-semantik-herkunft"/.test(siegel) && /data-woher/.test(siegel));
ok("ein Knopf holt den zuletzt signierten Text zurück",
  /id = "sbkim-si-semantik-eigener-text"/.test(siegel) && /zurueck\.hidden = true;/.test(siegel));
/* Ein Element, das gebaut, aber nie eingehängt wird, ist von einem fehlenden
   nicht zu unterscheiden — ausser für den, der es nicht sieht. */
ok("… und beide hängen wirklich im Block",
  /wrap\.appendChild\(herkunft\)/.test(siegel) && /wrap\.appendChild\(zurueck\)/.test(siegel));

console.log(`\n═══ ${gruen} grün · ${rot} ROT ═══\n`);
process.exit(rot > 0 ? 1 : 0);
