/*
 * Gegenprobe zu `smoke_sbkim_beschreibung.mjs`.
 *
 * Jeder Fall baut GENAU EINEN Fehler ein, und jeder MUSS die Probe umwerfen.
 * Ein Wächter ohne Gegenprobe ist nur ein grüner Haken — und dieser hier
 * bewacht die Stelle, an der Mixarium mit 88 Zeichen im Raum stand.
 *
 * ⚠ GEARBEITET WIRD AN EINER KOPIE. Die echten Dateien werden nie angefasst:
 * ein abgebrochener Lauf soll nichts Sabotiertes hinterlassen. In PWA Toolpoint
 * ist genau das am 2026-09-09 passiert — eine liegengebliebene Sabotage sah
 * danach aus wie ein kaputtes Depot.
 *
 * Lauf: node tests/gegenprobe_sbkim_beschreibung.mjs
 */
import { readFileSync, writeFileSync, mkdtempSync, mkdirSync, rmSync, cpSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";

const WURZEL = join(dirname(fileURLToPath(import.meta.url)), "..");
const PROBE = "tests/smoke_sbkim_beschreibung.mjs";
const SIEGEL = "sbkim/siegel-inhalt.js";
/* ⚠ VIERTE DATEI SEIT A18 (2026-09-14): der Wizard-Code. Vier Faelle unten
   zielen dorthin. Wer sie nicht mitzieht, bekommt einen TOTEN ANKER — der Fall
   meldet sich als „nicht gefangen", obwohl der Waechter tadellos ist. */
const WIZARD = "sbkim/sbkim-andock-wizard.js";
const INIT = "sbkim/sbkim-init.js";

const FAELLE = [
  { was: "die Beschreibung faellt auf den 88-Zeichen-Zweizeiler zurueck",
    datei: SIEGEL, regex: /domainDescription: "(?:[^"\\]|\\.)*"/,
    ersatz: 'domainDescription: "Klaus Mixarium - Cocktails, Mocktails, Smoothies und mehr; Knabbereien als Begleit-Plus."' },

  { was: "die Beschreibung nennt das SBKIM-Protokoll nicht mehr",
    alt: "SBKIM-PROTOKOLL: Mein Mixarium ist zugleich ein eigener Endknoten im SBKIM-Mycel",
    neu: "AUSSERDEM: Mein Mixarium ist zugleich ein Teil eines Verbunds", datei: SIEGEL },

  { was: "die Beschreibung nennt Sage-Protokol nicht mehr als Herkunft",
    alt: "aus dem Sage-Protokol", neu: "aus der Spezifikation", datei: SIEGEL },

  { was: "die Beschreibung nennt den eigenen Namen nicht mehr",
    alt: "Mein Mixarium ist ein pers", neu: "Diese App ist ein pers", datei: SIEGEL },

  /* ⚠ DER FALL, DER MIXARIUM IN DEN RAUM GESTELLT HAT. Zwei Wege zur Spore,
     zwei Texte — und der kuerzere gewann. */
  { was: "die stille Erst-Anmeldung traegt wieder einen ANDEREN Text",
    datei: INIT, regex: /domainDescription: "(?:[^"\\]|\\.)*"/,
    ersatz: 'domainDescription: "Klaus Mixarium - Cocktails, Mocktails, Smoothies und mehr; Knabbereien als Begleit-Plus."' },

  { was: "die stille Erst-Anmeldung traegt wieder ANDERE Stichworte",
    datei: INIT, regex: /domainKeywords:(\s*)\[[^\]]*\]/,
    ersatz: 'domainKeywords:  ["Cocktail", "Drink", "Mocktail"]' },

  { was: "das Feld zeigt nicht mehr den Vorschlag der App",
    alt: "    ta.value = c.domainDescription || \"\";\n",
    neu: "", datei: WIZARD },

  { was: "die gespeicherte Spore ueberschreibt den Vorschlag wieder von selbst",
    alt: "          if (!abweichend) return;",
    neu: "          ta.value = eigener; autoGrow(ta);\n          if (!abweichend) return;", datei: WIZARD },

  { was: "die Zeile sagt nicht mehr, WELCHER Text im Feld steht",
    alt: 'herkunft.id = "sbkim-si-semantik-herkunft";',
    neu: 'herkunft.id = "sbkim-si-hinweis";', datei: WIZARD },

  { was: "der Rueckhol-Knopf wird gebaut, aber nie eingehaengt",
    alt: "wrap.appendChild(herkunft); wrap.appendChild(zurueck);",
    neu: "wrap.appendChild(herkunft);", datei: WIZARD },
];

let gefangen = 0, durch = 0;
console.log("\nGEGENPROBE — Mixariums Bedeutungs-Beschreibung\n");

const kopie = mkdtempSync(join(tmpdir(), "mixarium-gp-"));
try {
  mkdirSync(join(kopie, "sbkim"), { recursive: true });
  mkdirSync(join(kopie, "tests"), { recursive: true });
  for (const f of [SIEGEL, WIZARD, INIT, PROBE]) cpSync(join(WURZEL, f), join(kopie, f));

  const laeuft = () => {
    try { execFileSync(process.execPath, [join(kopie, PROBE)], { cwd: kopie, stdio: "pipe" }); return true; }
    catch { return false; }
  };

  /* ⚠ OHNE DIESE ZEILE MISST KEIN EINZIGER FALL ETWAS. Bei roter Ausgangslage
     gaebe jede Sabotage sich selbst recht. */
  if (!laeuft()) {
    console.log("⚠ ABBRUCH: die unversehrte Kopie ist schon ROT. Kein Fall misst etwas.\n");
    process.exit(2);
  }
  console.log("  ✓ unveraendert ist die Probe gruen\n");

  const roh = {};
  for (const f of [SIEGEL, WIZARD, INIT]) roh[f] = readFileSync(join(WURZEL, f), "utf8");

  for (const f of FAELLE) {
    const basis = roh[f.datei];
    let neu;
    if (f.regex) {
      if (!f.regex.test(basis)) { console.log("  ⚠ ANKER NICHT GEFUNDEN — misst nichts: " + f.was); durch++; continue; }
      neu = basis.replace(f.regex, f.ersatz);
    } else {
      if (!basis.includes(f.alt)) { console.log("  ⚠ ANKER NICHT GEFUNDEN — misst nichts: " + f.was); durch++; continue; }
      neu = basis.replace(f.alt, f.neu);
    }
    if (neu === basis) { console.log("  ⚠ OHNE WIRKUNG — misst nichts: " + f.was); durch++; continue; }
    writeFileSync(join(kopie, f.datei), neu, "utf8");
    if (laeuft()) { console.log("  ✗ NICHT GEFANGEN: " + f.was); durch++; }
    else { console.log("  ✓ gefangen: " + f.was); gefangen++; }
    writeFileSync(join(kopie, f.datei), basis, "utf8");   // sonst reicht ein Fall in den naechsten
  }
} finally { rmSync(kopie, { recursive: true, force: true }); }

console.log(`\n— ${gefangen} gefangen, ${durch} durchgerutscht —\n`);
process.exit(durch > 0 ? 1 : 0);
