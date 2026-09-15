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
import { readFileSync, existsSync } from "node:fs";
import { createPublicKey, verify, createHash } from "node:crypto";
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
/* ⚠ SEIT A18 (2026-09-14) LIEGT DER WIZARD-CODE IN EINER EIGENEN, NETZWEIT
   BYTE-GLEICHEN DATEI; `siegel-inhalt.js` traegt nur noch die Identitaet dieses
   Knotens. Die Waechter darunter messen den ABLAUF und sind deshalb MITGEZOGEN,
   nicht geloescht. Vertrag: Sage-Protokol/docs/INTERFACES.md 11.9. */
const wizard = lies("sbkim/sbkim-andock-wizard.js");
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
const iFeld = wizard.indexOf('ta.id = "sbkim-si-semantik-text"');
const iHerk = wizard.indexOf("var herkunft = document.createElement");
const vorbelegung = iFeld >= 0 && iHerk > iFeld ? wizard.slice(iFeld, iHerk) : "";
ok("das Feld zeigt den Vorschlag der APP",
  /ta\.value = c\.domainDescription\b/.test(vorbelegung));

const iLade = wizard.indexOf("getOwnSpore().then");
const iEnde = wizard.indexOf('ta.addEventListener("input"', iLade);
const ladePfad = iLade >= 0 && iEnde > iLade ? wizard.slice(iLade, iEnde) : "";
/* ⚠ HIER STAND EINE ZAHL, UND SIE IST AM 2026-09-15 FALSCH GEWORDEN.
   Der Wächter verlangte GENAU EIN `ta.value =` im Lade-Pfad. Das stimmte,
   solange dort nur eine Zuweisung stand. Seit Stufe 5c gewinnt der eigene
   Text des Nutzers, und dafür hängen an der Herkunfts-Zeile ZWEI Knöpfe —
   beide setzen `ta.value`, beide erst auf Klick. Der Block enthielt damit
   drei Zuweisungen, und die Probe wurde ROT, OHNE dass eine Zusicherung
   gefallen wäre. Dieselbe Familie wie „ein Wächter, der an einer Zeichenzahl
   hängt": eine Zahl in einer Prüfung ist kein Vertrag.
   Gemessen wird jetzt die ZUSICHERUNG: im Lade-Pfad selbst — also ohne die
   Klick-Handler — darf `ta.value` NICHT unbedingt gesetzt werden. */
const ohneKlick = ladePfad.replace(/addEventListener\("click",\s*function\s*\(\)\s*\{[\s\S]*?\n\s*\}\);/g, "«klick»");
const zuwLade = (ohneKlick.match(/ta\.value\s*=/g) || []).length;
ok("… und die gespeicherte Spore überschreibt ihn NICHT mehr von selbst",
  ladePfad.length > 0
  && /if \(!abweichend\) return;/.test(ladePfad)
  && zuwLade === 1
  && /if \(hatEigenenText\(\)\) \{[\s\S]{0,120}ta\.value = eigener/.test(ohneKlick));
ok("… und die zwei Knöpfe setzen das Feld nur auf KLICK",
  (ladePfad.match(/ta\.value\s*=/g) || []).length - zuwLade === 2);
ok("eine Zeile NENNT, welcher Text im Feld steht",
  /id = "sbkim-si-semantik-herkunft"/.test(wizard) && /data-woher/.test(wizard));
ok("ein Knopf holt den zuletzt signierten Text zurück",
  /id = "sbkim-si-semantik-eigener-text"/.test(wizard) && /zurueck\.hidden = true;/.test(wizard));
/* Ein Element, das gebaut, aber nie eingehängt wird, ist von einem fehlenden
   nicht zu unterscheiden — ausser für den, der es nicht sieht. */
ok("… und beide hängen wirklich im Block",
  /wrap\.appendChild\(herkunft\)/.test(wizard) && /wrap\.appendChild\(zurueck\)/.test(wizard));

/* ── 4 · Die abgelegte Spore (seit 2026-09-10) ───────────────────────────────
   ⚠ „EINE DATEI, DIE AUSSIEHT WIE EINE IDENTITÄT, IST SCHLIMMER ALS KEINE."
   Bewacht wird deshalb die ZUSICHERUNG, nicht der Dateiname: liegt hier eine
   Spore, muss sie sich gegen ihren EIGENEN Schlüssel verifizieren, darf keinen
   privaten Teil tragen und muss DIESEN Knoten ankündigen. Liegt keine da, ist
   das in Ordnung — sie entsteht im Browser, und Sages Tafel sagt: die Spore im
   Netz ist nicht die Spore im Depot.

   ⚠ DIE KENNUNG IST GENAGELT. Ohne den Nagel fängt kein Wächter eine erfundene
   Spore: wer ein frisches Schlüsselpaar erzeugt und damit unterschreibt, bekommt
   eine, die in sich tadellos ist und nur einen ANDEREN Knoten ankündigt. Wer die
   Kennung wechselt, zieht sie hier UND in Sage-Protokol/status.json nach — das
   ist der Preis, und er ist beabsichtigt. */
const KENNUNG = "6U3aniLM3RpsmjPMV1nTYTPBaNP7C19Frvd5ZLCoaTQ";
const SPORE = join(WURZEL, "sbkim", "spore.json");

if (!existsSync(SPORE)) {
  console.log("  ⊘ keine abgelegte Spore — in Ordnung, sie entsteht im Browser");
} else {
  const sp = JSON.parse(readFileSync(SPORE, "utf8"));
  const jwk = sp.publicKey || {};
  const canon = (v) => v === null ? null : Array.isArray(v) ? v.map(canon)
    : (typeof v === "object" ? Object.keys(v).sort().reduce((o, k) => (o[k] = canon(v[k]), o), {}) : v);
  const b64u = (b) => Buffer.from(b).toString("base64")
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

  let gueltig = false;
  try {
    const { signature, ...unsigned } = sp;
    gueltig = verify(null, Buffer.from(JSON.stringify(canon(unsigned)), "utf8"),
      createPublicKey({ key: jwk, format: "jwk" }),
      Buffer.from(String(signature).replace(/-/g, "+").replace(/_/g, "/"), "base64"));
  } catch { /* bleibt false — gleich als rot gemeldet */ }
  ok("die abgelegte Spore verifiziert gegen ihren eigenen Schlüssel", gueltig);

  let idOk = false;
  try {
    const roh = Buffer.from(String(jwk.x).replace(/-/g, "+").replace(/_/g, "/"), "base64");
    idOk = b64u(createHash("sha256").update(roh).digest()) === sp.id;
  } catch { /* bleibt false */ }
  ok("… ihre Kennung ist base64url(SHA256(rawPub))", idOk);

  /* Der eine Fehler, den ein öffentliches Depot sich nicht leisten kann. */
  ok("… und sie trägt KEINEN privaten Schlüsselteil", !("d" in jwk));
  ok("… key_ops erlaubt nur 'verify'", JSON.stringify(jwk.key_ops || []) === '["verify"]');

  const l2 = Math.sqrt((sp.domainVector || []).reduce((a, x) => a + x * x, 0));
  ok(`… der Vektor ist 384-dim und normiert (L2 = ${l2.toFixed(6)})`,
    (sp.domainVector || []).length === 384 && Math.abs(l2 - 1) < 1e-6);

  ok("… sie kündigt DIESEN Knoten an (genagelte Kennung)", sp.id === KENNUNG);
  /* Eine Spore mit einem anderen Text als die App wäre eine zweite Wahrheit —
     dann misst das Register gegen etwas, das im Raum niemand ansagt. */
  ok("… und trägt denselben Text wie die App", sp.domainDescription === text);
}

console.log(`\n═══ ${gruen} grün · ${rot} ROT ═══\n`);
process.exit(rot > 0 ? 1 : 0);
