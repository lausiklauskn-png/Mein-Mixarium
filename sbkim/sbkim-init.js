// sbkim-init.js — Mixarium Klaus
// Auto-Init Karte 09 § Schritt 4 + 9 + 10 + 11.
// Spore-Generierung manuell via window.__sbkimErzeugeSpore() in DevTools-Konsole.

(async function () {
  try {
    await SbkimStorage.init({ dbSuffix: "mixarium" });

    // Modul 17 Floating-Widget — Endknoten-Standard-Render-Schicht
    // (Karte 09 § Schritt 12). Nach Storage (01) und VOR Spore (02), damit
    // die Proxy-Spans #lamp-fremd + #sbkim-siegel-badge im DOM sind. Sage-
    // Protokol-Quelle: Commit b2cf42ca0708a2f3cc12d0f344a16d28539a765d
    // (2026-05-25). Modul 15 + 16 reaktiviert 2026-05-26 (Phase 1, parallel
    // zu Mein-Rezeptbuch).
    if (window.SbkimWidget) {
      await SbkimWidget.init({
        allowedOrigins: ["https://lausiklauskn-png.github.io"],
        repoUrl:        "https://github.com/lausiklauskn-png/Mein-Mixarium",
      });
      console.info("SBKIM-Widget grün — Floating-Pille bottom-right aktiv.");
    }

    await SbkimMembrane.init({
      allowedOrigins: ["https://lausiklauskn-png.github.io"],
    });
    SbkimSiegel.init({
      badgeSelector: "#sbkim-siegel-badge",
      repoUrl: "https://github.com/lausiklauskn-png/Mein-Mixarium",
    });

    // Modul 18 Tool-PWA Sub (a) Vorab — Andock-Wizard, getriggert durch
    // Bronze-SIEGEL-Klick (Modul 16 Sub e Hook). Nur geladen + bereit,
    // kein automatischer Andock-Trigger. Werte aus sbkim/spore.json.
    if (window.SbkimToolPwa) {
      await SbkimToolPwa.init({
        endpoint:        "https://lausiklauskn-png.github.io/Mein-Mixarium/",
        domain:          "mixarium",
        domainKeywords:  ["Cocktail", "Drink", "Mocktail", "Limonade", "Smoothie", "Aperitif", "Sake"],
        stammCategories: ["Cocktails", "Mocktails", "Alkfr. Cocktails", "Smoothies & Shakes", "Limonaden", "Tees & Kaffees", "Bowlen", "Sirup & Basis"],
        guestCategories: ["Knabbereien", "Fingerfood"],
        repoUrl:         "https://github.com/lausiklauskn-png/Mein-Mixarium",
      });
      console.info("SBKIM-ToolPwa grün — Modul 18 Andock-Wizard bereit.");
    }

    // Query-über-Relais (Bau 2026-06-28): Korpus-Quelle für SbkimMatch.queryLocal,
    // damit Mixarium auf eine eingehende Frage übers Relais mit bedeutungs-
    // sortierten Treffern aus seinem AKTUELLEN Inhalt antwortet (die echten
    // Drinks aus window.R). Lazy: erst beim ersten queryLocal wird embeddet
    // (Modul 03, ~30 MB einmalig). Fail-soft: ohne Drinks/Embedding → leere
    // Liste (kein Throw). KEIN PII — nur Drink-Namen/Zutaten (öffentlicher Inhalt).
    if (window.SbkimMatch && typeof SbkimMatch.setLocalCorpus === "function") {
      SbkimMatch.setLocalCorpus(async function buildMixariumQueryCorpus() {
        try {
          if (!window.SbkimEmbedding) return [];
          await SbkimEmbedding.init();
          var R = Array.isArray(window.R) ? window.R : [];
          var drinks = R.filter(function (r) {
            return r && !r.blank && r.name && String(r.name).trim().length > 0;
          });
          if (drinks.length > 80) drinks = drinks.slice(0, 80); // Deckel gegen Embedding-Kosten
          var corpus = [];
          for (var i = 0; i < drinks.length; i++) {
            var r = drinks[i];
            var ingNames = Array.isArray(r.ings)
              ? r.ings.map(function (x) { return (x && (x.name || x.origName)) ? (x.name || x.origName) : ""; }).filter(Boolean)
              : [];
            var flavors = Array.isArray(r.flavors) ? r.flavors : [];
            // A4 Baustein 1 (2026-07-10): auch den ZUBEREITUNGS-Text mit
            // hineinnehmen. Sonst sind Zutaten, die nur im Schritt-Text stehen
            // (nicht in der Zutatenliste), für die Cross-Knoten-Suche unsichtbar
            // — genau so rutschte „Himbeer-Wodka" (Raspberry Cooler) als
            // „alkoholfrei" durch (Klaus' A2-Befund). Additiv, fail-soft.
            var stepsText = Array.isArray(r.steps)
              ? r.steps.map(function (s) {
                  return (s && (s.txt || s.t)) ? (s.txt || s.t) : (typeof s === "string" ? s : "");
                }).filter(Boolean).join(" ")
              : "";
            var parts = [String(r.name)].concat(flavors).concat(ingNames);
            if (r.glass) parts.push(String(r.glass));
            if (stepsText) parts.push(stepsText);
            var passage = parts.filter(Boolean).join(", ");
            var raw = await SbkimEmbedding.embedPassage(passage);
            var vec = (raw instanceof Float32Array) ? raw : new Float32Array(raw);
            corpus.push({
              label: String(r.name),
              passageVec: vec,
              // A1 (2026-07-02): roher Passage-Text für den BM25-Pfad im
              // Hybrid-queryLocal — so treffen eingehende Cross-Knoten-Fragen
              // auch Zutaten/Geschmack, nicht nur den Drink-Namen. Additiv.
              text: passage,
              anchorId: "https://lausiklauskn-png.github.io/Mein-Mixarium/",
            });
          }
          console.info("[MX-SBKIM] queryLocal-Korpus aus " + corpus.length + " Drinks gebaut (Frage→Antwort übers Relais).");
          return corpus;
        } catch (e) {
          console.warn("[MX-SBKIM] queryLocal-Korpus-Bau übersprungen (fail-soft):", e);
          return [];
        }
      });
    }

    await SbkimAnastomose.init();
    console.info("SBKIM-Init grün — Storage, Spore, Match bereit.");

    await SbkimApoptose.init();
    console.info("SBKIM-Apoptose grün — Vermächtnis-Empfang aktiv.");

    // Auto-Lauschen am Nostr-Relais (Stufe 2, 2026-06-27): Empfangsmodus MIT
    // Antwortrecht — der Knoten lauscht selbsttätig am Relais
    // wss://relay.family-projekt.de auf eingehende Handshakes und ANTWORTET nur;
    // er initiiert NIE von sich aus (kein Crawler). Fail-soft + nicht-blockierend:
    // ohne Relais-Client (Modul 05b, type=module) oder bei Netz-Fehler passiert
    // nichts. Kurz warten, bis das deferred 05b-Modul window.SbkimNostrRelay gesetzt hat.
    (async function () {
      for (var i = 0; i < 25 && !window.SbkimNostrRelay; i++) {
        await new Promise(function (r) { setTimeout(r, 80); });
      }
      if (window.SbkimAnastomose &&
          typeof SbkimAnastomose.listenNostr === "function" &&
          window.SbkimNostrRelay) {
        try {
          SbkimAnastomose.listenNostr()
            .then(function () {
              console.info("SBKIM Auto-Lauschen aktiv (Empfangsmodus mit Antwortrecht).");
              // Sichtbar im Floating-Widget (Modul 17): VERKEHR-Lampe ruhig grün.
              try { window.dispatchEvent(new CustomEvent("sbkim:nostr-listening", { detail: { active: true } })); } catch (e) {}
            })
            .catch(function (e) { console.warn("SBKIM Auto-Lauschen übersprungen:", e); });
        } catch (e) { console.warn("SBKIM Auto-Lauschen übersprungen:", e); }
      }
    })();

    if (window.SbkimHeterokaryose) {
      await SbkimHeterokaryose.init();
      console.info("SBKIM-Heterokaryose grün — Heterokaryose-Empfang aktiv.");
    }

    if (window.SbkimUiDemo) {
      await SbkimUiDemo.init();
      console.info("SBKIM-UiDemo grün — Outbox-API bereit.");
    }

    console.info("SBKIM-Andock bereit. Spore erzeugen mit __sbkimErzeugeSpore() in der DevTools-Konsole.");
  } catch (e) {
    console.error("SBKIM-Init-Fehler:", e);
  }
})();

// ── Modul 23 Rendezvous — öffentlicher Floating-Knopf „🌐 Mit dem Netz
// verbinden" (Klaus' Festlegung 2026-06-28: sofort öffentlich, eigener kleiner
// Floating-Knopf). BEWUSST UNABHÄNGIG von der Andock-Init-Kette gemountet — der
// Knopf soll IMMER sichtbar sein, auch wenn die Kette oben (Storage/Spore/
// Anastomose) mal stolpert. Das geteilte UI-Modul (SbkimRendezvousUI, byte-1:1
// aus Sage) mountet den Knopf; die Mechanik liegt in Modul 23 (SbkimRendezvous),
// das Relais/Anastomose/Spore erst zur Klick-Zeit lazy auflöst. nodeName =
// "Mein Mixarium"; createIdentity reicht den bestehenden Identitäts-Erzeuger
// durch (erzeugt die lebende Spore, falls im aktuellen Browser noch keine da
// ist). Verfassungstreu: nutzer-ausgelöst, init mountet nur den Knopf.
(function () {
  function mountRendezvousUI() {
    // Modus A (Identitäts-Hygiene, Skill „saubere-netz-anmeldung"): eigene
    // Schublade `sbkim_mixarium` + stabile Identität sanft/idempotent/lokal
    // sicherstellen (KEIN Auto-Anmelden, Empfangsmodus). dbSuffix ins Modul 23,
    // damit auch Modus B (🧹 Aufräumen) NUR den geteilten Alt-Topf `sbkim`
    // löscht und die eigene Schublade behält.
    if (window.SbkimRendezvous && typeof window.SbkimRendezvous.init === "function") {
      try {
        window.SbkimRendezvous.init({
          nodeName: "Mein Mixarium",
          dbSuffix: "mixarium",
          createIdentity: function () { return window.__sbkimErzeugeSpore(); },
          ensureIdentity: true,
        });
      } catch (e) { console.warn("SBKIM-Rendezvous (Modus A) übersprungen:", e); }
    }
    if (!window.SbkimRendezvousUI) return;
    try {
      window.SbkimRendezvousUI.init({
        nodeName: "Mein Mixarium",
        dbSuffix: "mixarium",
        createIdentity: function () { return window.__sbkimErzeugeSpore(); },
      });
      console.info("SBKIM-Rendezvous-UI grün — öffentlicher 🌐-Knopf gemountet (Modus A aktiv).");
    } catch (e) { console.warn("SBKIM-Rendezvous-UI übersprungen:", e); }
  }
  if (document.readyState !== "loading") mountRendezvousUI();
  else document.addEventListener("DOMContentLoaded", mountRendezvousUI);
})();

window.__sbkimErzeugeSpore = async function () {
  console.info("Lade Embedding-Modell (~30 MB einmalig, dann gecacht)...");
  await SbkimEmbedding.init();

  var stammCategories = ["Cocktails", "Mocktails", "Alkfr. Cocktails", "Smoothies & Shakes", "Limonaden", "Tees & Kaffees", "Bowlen", "Sirup & Basis"];
  var guestCategories = ["Knabbereien", "Fingerfood"];
  var domainKeywords = ["Cocktail", "Drink", "Mocktail", "Limonade", "Smoothie", "Aperitif", "Sake"];
  var allText = stammCategories.concat(guestCategories).concat(domainKeywords).join(", ");

  // Inhalts-treuer domainVector (2026-06-28): wenn echte Drinks vorhanden sind,
  // entscheidet der INHALT (Drink-Name + Kategorie) statt der Selbstbeschreibung.
  // sampleContent liefert NUR unkritische Labels (Getränke-Namen/Kategorien) —
  // kein PII. Fail-soft: kein Inhalt / Fehler → Beschreibungs-Vektor.
  function sampleContent() {
    var out = [];
    try {
      var arr = (typeof window !== "undefined" && Array.isArray(window.R)) ? window.R : [];
      for (var i = 0; i < arr.length && out.length < 32; i++) {
        var r = arr[i];
        if (!r || r.blank) continue;
        var name = (typeof r.name === "string") ? r.name.trim() : "";
        var cat = (typeof r.cat === "string") ? r.cat.trim() : "";
        var t = (cat + " " + name).trim();
        if (t.length) out.push(t);
      }
    } catch (e) { /* fail-soft */ }
    return out;
  }

  var vec = null;
  var source = "description";
  var samples = sampleContent();
  if (samples.length && typeof SbkimEmbedding.embedContentVector === "function") {
    try {
      var res = await SbkimEmbedding.embedContentVector(samples);
      if (res && res.vector) { vec = res.vector; source = "content"; }
      console.info("Inhalts-Vektor aus " + samples.length + " Drinks erzeugt.");
    } catch (e) { console.warn("embedContentVector — Fallback auf Beschreibung:", e); }
  }
  if (!vec) {
    vec = await SbkimEmbedding.embedPassage(allText);
    source = "description";
    console.info("Beschreibungs-Vektor erzeugt (kein/leerer Inhalt).");
  }
  console.info("Domain-Vektor erzeugt: " + vec.length + " Floats, Quelle: " + source);

  var spore = await SbkimSpore.generateOwnSpore({
    domain: "lausiklauskn-png.github.io",
    endpoint: "https://lausiklauskn-png.github.io/Mein-Mixarium/",
    nodeType: "hybrid",
    nodeName: "Mixarium Klaus",
    domainDescription: "Klaus Mixarium - Cocktails, Mocktails, Smoothies und mehr; Knabbereien als Begleit-Plus.",
    domainKeywords: domainKeywords,
    domainVector: Array.from(vec),
    embeddingSource: source,
    embeddingVersion: 1,
    stammCategories: stammCategories,
    guestCategories: guestCategories,
  });

  console.info("Spore erzeugt, nodeId =", spore.id);
  console.info("Signatur-Länge =", spore.signature.length);
  console.info("Spore-JSON in DevTools kopieren mit: copy(JSON.stringify(await SbkimSpore.getOwnSpore(), null, 2))");
  return spore;
};
