/*
 * Gegenprobe zu den Spore-Wächtern in `smoke_sbkim_beschreibung.mjs`.
 *
 * ⚠ EINE SPORE LÄSST SICH NICHT VON HAND VERBIEGEN. Jedes Feld steht UNTER der
 * Signatur — ein Eingriff bricht also immer zuerst den Signatur-Wächter, und
 * der Fall wäre „gefangen", ohne den gemeinten Wächter je erreicht zu haben.
 * Deshalb wird mit einem FRISCHEN Schlüsselpaar neu unterschrieben, das nur im
 * Arbeitsspeicher lebt: danach ist die Spore in sich tadellos, und genau ein
 * Wächter fällt um. Bauart übernommen aus kim-hub-company.
 *
 * ⚠ GEARBEITET WIRD AN EINER KOPIE. Ein abgebrochener Lauf soll nichts
 * Sabotiertes hinterlassen.
 *
 * Lauf: node tests/gegenprobe_spore.mjs
 */
import { readFileSync, writeFileSync, mkdtempSync, mkdirSync, rmSync, cpSync, unlinkSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { generateKeyPairSync, sign, createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";

const WURZEL = join(dirname(fileURLToPath(import.meta.url)), "..");
const PROBE = "tests/smoke_sbkim_beschreibung.mjs";
const MIT = ["sbkim/siegel-inhalt.js", "sbkim/sbkim-andock-wizard.js", "sbkim/sbkim-init.js"];
const SPORE = "sbkim/spore.json";

const canon = (v) => v === null ? null : Array.isArray(v) ? v.map(canon)
  : (typeof v === "object" ? Object.keys(v).sort().reduce((o, k) => (o[k] = canon(v[k]), o), {}) : v);
const b64u = (b) => Buffer.from(b).toString("base64")
  .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

/* `kennung`: "neu" → id = SHA256 des frischen Schlüssels (in sich stimmig)
              "alt" → id bleibt stehen (für den Fall, der GENAU das misst)
   `jwkExtra` wird NACH der Kennungs-Rechnung eingemischt — so steht ein
   Privatteil drin, ohne die Kennung zu verstellen. */
function neuSignieren(spore, { kennung = "neu", jwkExtra = null } = {}) {
  const { publicKey, privateKey } = generateKeyPairSync("ed25519");
  const jwk = publicKey.export({ format: "jwk" });
  jwk.key_ops = ["verify"]; jwk.ext = true;
  const roh = Buffer.from(String(jwk.x).replace(/-/g, "+").replace(/_/g, "/"), "base64");
  const frisch = b64u(createHash("sha256").update(roh).digest());
  const { signature, ...rest } = spore;
  const unsigned = { ...rest, publicKey: jwkExtra ? { ...jwk, ...jwkExtra } : jwk };
  if (kennung === "neu") unsigned.id = frisch;
  const sig = sign(null, Buffer.from(JSON.stringify(canon(unsigned)), "utf8"), privateKey);
  return { ...canon(unsigned), signature: b64u(sig) };
}

/* ⚠ WER EINE SPORE NEU UNTERSCHREIBT, BEWEGT IHRE KENNUNG MIT — und dann faellt
   der Kennungs-Waechter stellvertretend um, waehrend ueber den gemeinten nichts
   bewiesen ist. Vier Faelle ziehen deshalb den genagelten Wert in der KOPIE der
   Probe nach (`nagel: true`). Ein Fehler, zwei Dateien — das ist immer noch ein
   Fehler, und nur so trifft er allein. */
const FAELLE = [
  { was: "die Spore ist nicht mehr gueltig signiert",
    mach: (sp) => ({ ...sp, signature: b64u(Buffer.alloc(64)) }) },

  { was: "die Kennung passt nicht zum Schluessel",
    mach: (sp) => neuSignieren(sp, { kennung: "alt" }) },

  { was: "die Spore traegt einen PRIVATEN Schluesselteil",
    mach: (sp) => neuSignieren(sp, { jwkExtra: { d: "Zm9vYmFy" } }), nagel: true },

  { was: "key_ops erlaubt ploetzlich auch das Signieren",
    mach: (sp) => neuSignieren(sp, { jwkExtra: { key_ops: ["verify", "sign"] } }), nagel: true },

  { was: "der Vektor ist nicht mehr normiert",
    mach: (sp) => neuSignieren({ ...sp, domainVector: sp.domainVector.map((x) => x * 2) }), nagel: true },

  { was: "die Spore kuendigt einen FREMDEN Knoten an (frisch erzeugt, in sich tadellos)",
    mach: (sp) => neuSignieren(sp) },

  { was: "die Spore traegt einen anderen Text als die App",
    mach: (sp) => neuSignieren({ ...sp, domainDescription: "Ein ganz anderer Text." }), nagel: true },

  { was: "die Spore ist weg — das ist AUSDRUECKLICH in Ordnung",
    weg: true, sollFangen: false },
];


let gefangen = 0, durch = 0;
console.log("\nGEGENPROBE — Mixariums abgelegte Spore\n");

const kopie = mkdtempSync(join(tmpdir(), "mixarium-spore-gp-"));
try {
  mkdirSync(join(kopie, "sbkim"), { recursive: true });
  mkdirSync(join(kopie, "tests"), { recursive: true });
  for (const f of [...MIT, SPORE, PROBE]) cpSync(join(WURZEL, f), join(kopie, f));

  const laeuft = () => {
    try { execFileSync(process.execPath, [join(kopie, PROBE)], { cwd: kopie, stdio: "pipe" }); return true; }
    catch { return false; }
  };

  /* ⚠ OHNE DIESE ZEILE MISST KEIN EINZIGER FALL ETWAS. */
  if (!laeuft()) {
    console.log("⚠ ABBRUCH: die unversehrte Kopie ist schon ROT. Kein Fall misst etwas.\n");
    process.exit(2);
  }
  console.log("  ✓ unveraendert ist die Probe gruen\n");

  const rein = readFileSync(join(WURZEL, SPORE), "utf8");

  for (const f of FAELLE) {
    if (f.weg) unlinkSync(join(kopie, SPORE));
    else {
      const gebaut = f.mach(JSON.parse(rein));
      const neu = JSON.stringify(gebaut, null, 2);
      if (neu === rein) { console.log("  ⚠ OHNE WIRKUNG — misst nichts: " + f.was); durch++; continue; }
      writeFileSync(join(kopie, SPORE), neu, "utf8");
      if (f.nagel) {
        const q = readFileSync(join(kopie, PROBE), "utf8");
        const nachher = q.replace(/const KENNUNG = "[^"]+";/, `const KENNUNG = "${gebaut.id}";`);
        if (nachher === q) { console.log("  ⚠ NAGEL NICHT GEFUNDEN — misst nichts: " + f.was); durch++; continue; }
        writeFileSync(join(kopie, PROBE), nachher, "utf8");
      }
    }
    const gruen = laeuft();
    const soll = f.sollFangen === false ? gruen : !gruen;
    if (soll) { console.log("  ✓ " + (f.sollFangen === false ? "bleibt gruen: " : "gefangen: ") + f.was); gefangen++; }
    else { console.log("  ✗ NICHT WIE ERWARTET: " + f.was); durch++; }
    writeFileSync(join(kopie, SPORE), rein, "utf8");
    if (f.nagel) cpSync(join(WURZEL, PROBE), join(kopie, PROBE));   // Nagel zurueck
  }
} finally { rmSync(kopie, { recursive: true, force: true }); }

console.log(`\n— ${gefangen} wie erwartet, ${durch} nicht —\n`);
process.exit(durch > 0 ? 1 : 0);
