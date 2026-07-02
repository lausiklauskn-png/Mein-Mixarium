// Headless-Smoke für den A1/A4-Rollout in den Cross-Knoten-Antwort-Pfad von
// Mein Mixarium (Rollout aus Sage Modul 22, 2026-07-02). Run:
//   node tests/smoke_rollout_a1a4.mjs
//
// Der op:"query"-Empfänger (sbkim/15_membran.js) beantwortet eingehende
// Bedeutungs-Fragen aus dem Mycel jetzt über den INKLUSIONS-Pfad seines
// Drinks-Korpus: A4 fächert die Frage über eine kleine getränke-eigene
// Synonym-Karte auf, A1 hebt den Vorfilter auf BM25+Vektor. Dieser Test lädt
// Mixariums AUSGELIEFERTES Modul 04 (byte-1:1 aus Sage) und beweist die exakte
// API-Kette, die `queryWithInclusion` verkettet:
//   expandQuerySimple(frage, {synonyms}) → queryLocalMulti(varianten, k,
//   {hybrid:true})  — CROSS-PHRASING-RETTUNG bei orthogonalem Cosinus.
// Der 0.80-Cosinus-Boden (PROVIDER_MIN_MATCH = Andock-Riegel Modul 05) bleibt
// unberührt; der Gewinn ist INKLUSION über den lexikalischen BM25-Pfad.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..");

globalThis.window = globalThis;

const DIM = 384;
// Deterministisches Fake-Embedding: Query = e0, alle Passagen = e1 → Cosinus 0,
// also unter dem 0.80-Boden. So kann NUR der lexikalische BM25-Pfad einen
// Treffer aufnehmen — genau der Punkt, den A1 (+ A4-Varianten) rettet.
function unit(i) { const v = new Float32Array(DIM); v[i] = 1; return v; }
globalThis.SbkimEmbedding = {
  embedQuery: async () => unit(0),
  embedPassage: async () => unit(1),
  embedPassageBatch: async (texts) => texts.map(() => unit(1)),
};

// Mixariums ausgeliefertes Modul 04 laden (kein Bundler, plain script).
const src = readFileSync(resolve(repoRoot, "sbkim/04_match.js"), "utf8");
new Function("global", "window", "globalThis", "console", src)(
  globalThis, globalThis, globalThis, console,
);
const M = globalThis.SbkimMatch;

// Spiegelbild der Synonym-Karte aus sbkim/15_membran.js (MX_QUERY_SYNONYMS).
// Wird hier dupliziert, damit der Test die getränke-eigene Wahl mitbeweist.
const MX_QUERY_SYNONYMS = {
  "cocktail": ["drink"], "drink": ["cocktail", "getränk"],
  "getränk": ["drink", "getraenk"], "getraenk": ["getränk"],
  "limo": ["limonade"], "limonade": ["limo"],
  "smoothie": ["shake"], "shake": ["smoothie"],
  "alkoholfrei": ["mocktail"], "mocktail": ["alkoholfrei"],
  "tee": ["tea"], "sirup": ["sirop"],
};

// Drinks-Korpus in der Form, die sbkim-init.js baut: {label, passageVec, text,
// anchorId}. Der gesuchte Drink trägt „limonade" NUR im text (nicht im Namen
// als Token „limo") — passageVec = e1 (orthogonal zum Query-Vektor).
const CORPUS = [
  { label: "Zitronen-Erfrischung", text: "zitronen-erfrischung, sauer, zitrone, wasser, limonade", passageVec: unit(1), anchorId: "mx-1" },
  { label: "Wespen-freier Tisch", text: "hausmittel gegen wespen am gedeckten tisch", passageVec: unit(1), anchorId: "mx-2" },
];

// Kern-Helfer-Nachbau aus 15_membran.js queryWithInclusion (A4 → A1 → Cosinus).
async function queryWithInclusion(match, text, k) {
  if (typeof match.queryLocalMulti === "function" &&
      typeof match.expandQuerySimple === "function") {
    try {
      const variants = match.expandQuerySimple(text, { synonyms: MX_QUERY_SYNONYMS });
      return await match.queryLocalMulti(variants, k, { corpus: CORPUS, hybrid: true });
    } catch (_e) { /* fail-soft weiter */ }
  }
  try { return await match.queryLocal(text, k, { corpus: CORPUS, hybrid: true }); }
  catch (_e) { /* fail-soft weiter */ }
  return await match.queryLocal(text, k, { corpus: CORPUS });
}

let pass = 0, fail = 0;
function ok(cond, msg) {
  if (cond) { pass++; console.log("  ✓ " + msg); }
  else { fail++; console.log("  ✗ " + msg); }
}

console.log("Mixarium A1/A4-Rollout-Smoke — Cross-Knoten-Antwort-Inklusion\n");

// ---- Probe 0 — Modul-04-Fläche (Rollout-Voraussetzung) ----
console.log("Probe 0 — Modul 04 (byte-1:1 aus Sage) trägt A1/A4");
ok(typeof M.queryLocal === "function", "queryLocal vorhanden");
ok(typeof M.queryLocalMulti === "function", "queryLocalMulti vorhanden (A4)");
ok(typeof M.expandQuerySimple === "function", "expandQuerySimple vorhanden (A4)");
ok(typeof M.bm25Scores === "function", "bm25Scores vorhanden (A1)");
ok(M.PROVIDER_MIN_MATCH === 0.80, "PROVIDER_MIN_MATCH === 0.80 (Riegel unberührt)");

// ---- Probe 1 — A4 fächert „limo" → „limonade" auf ----
console.log("\nProbe 1 — A4 Synonym-Auffächerung");
const variants = M.expandQuerySimple("limo", { synonyms: MX_QUERY_SYNONYMS });
ok(variants.includes("limo"), "Original 'limo' bleibt Variante");
ok(variants.includes("limonade"), "Variante 'limonade' ergänzt");

// ---- Kontrolle — reiner Einzel-queryLocal (hybrid) findet nichts ----
console.log("\nKontrolle — Einzel-queryLocal('limo', hybrid) ohne A4");
const single = await M.queryLocal("limo", 5, { corpus: CORPUS, hybrid: true });
ok(single.length === 0, "kein Token 'limo' im text + Cosinus 0 → keine Rettung");

// ---- Probe 2 — voller A4+A1-Pfad rettet den Treffer (INKLUSION) ----
console.log("\nProbe 2 — queryWithInclusion (A4 → A1) rettet den Drink");
const rescued = await queryWithInclusion(M, "limo", 5);
ok(rescued.length >= 1, "mindestens ein Treffer über den BM25-Varianten-Pfad");
ok(rescued.some(r => r.label === "Zitronen-Erfrischung"),
   "der 'limonade'-Drink erscheint (Cross-Phrasing-Rettung)");
ok(!rescued.some(r => r.label === "Wespen-freier Tisch"),
   "der unverwandte Eintrag bleibt draußen (keine Rausch-Aufnahme)");

// ---- Probe 3 — fail-soft: unbekannte Frage wirft nicht, gibt leer ----
console.log("\nProbe 3 — fail-soft bei fremder Frage");
const none = await queryWithInclusion(M, "quantencomputer", 5);
ok(Array.isArray(none), "Ergebnis ist ein Array (kein Wurf)");
ok(none.length === 0, "kein Treffer (kein gemeinsames Token, Cosinus < 0.80)");

// ---- Probe 4 — text-lose Korpus-Items: BM25 fällt auf label zurück ----
console.log("\nProbe 4 — Bestands-Korpus ohne text-Feld bleibt gültig");
const legacyCorpus = [{ label: "Limonade Klassik", passageVec: unit(1), anchorId: "mx-3" }];
const legacy = await M.queryLocal("limonade", 5, { corpus: legacyCorpus, hybrid: true });
ok(legacy.some(r => r.label === "Limonade Klassik"),
   "ohne text trifft BM25 über das label (Rückwärts-Kompatibilität)");

console.log(`\n${fail === 0 ? "ALLE GRÜN" : "FEHLER"} — ${pass} ok, ${fail} fail`);
process.exit(fail === 0 ? 0 : 1);
