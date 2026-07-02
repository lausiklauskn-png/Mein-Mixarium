// Headless-Smoke für den window.R-Fix (Folge-Bau 2026-07-02, Schritt 1+3).
// Run: node tests/smoke_windowr.mjs
//
// Mixariums Korpus-Provider buildMixariumQueryCorpus (sbkim-init.js) liest
// window.R + trägt seit PR #89 ein text-Feld. Er lief aber LEER, weil window.R
// nie gesetzt war (top-level `let R` hängt nicht am window). Dieser Fix
// exponiert R als LIVE-Getter. Der Test beweist das Kern-Muster: window.R
// liefert nach einem R=[]-Reassignment das AKTUELLE R (nicht stale).
//
// HINWEIS (ehrlich): die echte Live-Fütterung (window.R mit echten Drinks +
// Embedding) prüft Klaus im Browser; node --check deckt die Datei syntaktisch ab.

globalThis.window = globalThis;
let pass = 0, fail = 0;
function ok(cond, msg) { if (cond) { pass++; console.log("  ✓ " + msg); } else { fail++; console.log("  ✗ " + msg); } }

console.log("Mixarium window.R Live-Getter-Smoke\n");

console.log("Probe 1 — window.R Live-Getter (überlebt R=[]-Reassignment)");
(function appScopeSimulation() {
  let R = [];
  // Exakt das ausgelieferte Muster aus index.html/QC:
  try { Object.defineProperty(window, "R", { get: function () { return R; }, configurable: true }); } catch (e) {}
  ok(Array.isArray(window.R) && window.R.length === 0, "window.R anfangs leeres Array");
  R = [{ name: "Mojito", blank: false }, { name: "Limonade", blank: false }];
  ok(window.R.length === 2 && window.R[1].name === "Limonade", "window.R spiegelt NEUES R (nicht stale)");
  R = [];
  ok(window.R.length === 0, "window.R folgt dem Zurücksetzen");
})();

console.log("\nProbe 2 — Drink-Korpus-Form (Spiegel von buildMixariumQueryCorpus, text-Feld für A1)");
const DIM = 384;
const embedStub = { init: async () => {}, embedPassage: async (t) => { const v = new Float32Array(DIM); v[0] = t.length % 5; return v; } };
async function buildCorpus(arr, emb) {
  try {
    if (!emb) return [];
    await emb.init();
    var R = Array.isArray(arr) ? arr : [];
    var drinks = R.filter(function (r) { return r && !r.blank && r.name && String(r.name).trim().length > 0; });
    if (drinks.length > 80) drinks = drinks.slice(0, 80);
    var corpus = [];
    for (var i = 0; i < drinks.length; i++) {
      var r = drinks[i];
      var ingNames = Array.isArray(r.ings) ? r.ings.map(function (x) { return (x && (x.name || x.origName)) ? (x.name || x.origName) : ""; }).filter(Boolean) : [];
      var flavors = Array.isArray(r.flavors) ? r.flavors : [];
      var parts = [String(r.name)].concat(flavors).concat(ingNames);
      if (r.glass) parts.push(String(r.glass));
      var passage = parts.filter(Boolean).join(", ");
      var raw = await emb.embedPassage(passage);
      corpus.push({ label: String(r.name), passageVec: (raw instanceof Float32Array ? raw : new Float32Array(raw)), text: passage, anchorId: "https://lausiklauskn-png.github.io/Mein-Mixarium/" });
    }
    return corpus;
  } catch (e) { return []; }
}
const drinks = [{ name: "Zitronen-Limonade", flavors: ["sauer"], ings: [{ name: "Zitrone" }], glass: "Highball", blank: false }, { name: "", blank: false }];
const corpus = await buildCorpus(drinks, embedStub);
ok(corpus.length === 1, "leerer Name rausgefiltert");
ok(corpus[0].text.includes("Zitrone") && corpus[0].text.includes("sauer"), "text trägt Zutaten+Geschmack (A1/BM25)");
ok(corpus[0].passageVec instanceof Float32Array, "passageVec ist Float32Array");
ok((await buildCorpus([], embedStub)).length === 0 && (await buildCorpus(drinks, null)).length === 0, "fail-soft (leer / kein Embedding)");

console.log(`\n${fail === 0 ? "ALLE GRÜN" : "FEHLER"} — ${pass} ok, ${fail} fail`);
process.exit(fail === 0 ? 0 : 1);
