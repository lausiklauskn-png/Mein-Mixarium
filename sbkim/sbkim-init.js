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
      repoUrl: "https://github.com/lausiklauskn-png/Mein-Mixarium",
    });

    await SbkimAnastomose.init();
    console.info("SBKIM-Init grün — Storage, Spore, Match bereit.");

    await SbkimApoptose.init();
    console.info("SBKIM-Apoptose grün — Vermächtnis-Empfang aktiv.");

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

window.__sbkimErzeugeSpore = async function () {
  console.info("Lade Embedding-Modell (~30 MB einmalig, dann gecacht)...");
  await SbkimEmbedding.init();

  var stammCategories = ["Cocktails", "Mocktails", "Alkfr. Cocktails", "Smoothies & Shakes", "Limonaden", "Tees & Kaffees", "Bowlen", "Sirup & Basis"];
  var guestCategories = ["Knabbereien", "Fingerfood"];
  var domainKeywords = ["Cocktail", "Drink", "Mocktail", "Limonade", "Smoothie", "Aperitif", "Sake"];
  var allText = stammCategories.concat(guestCategories).concat(domainKeywords).join(", ");

  var vec = await SbkimEmbedding.embedPassage(allText);
  console.info("Domain-Vektor erzeugt: " + vec.length + " Floats");

  var spore = await SbkimSpore.generateOwnSpore({
    domain: "lausiklauskn-png.github.io",
    endpoint: "https://lausiklauskn-png.github.io/Mein-Mixarium/",
    nodeType: "hybrid",
    nodeName: "Mixarium Klaus",
    domainDescription: "Klaus Mixarium - Cocktails, Mocktails, Smoothies und mehr; Knabbereien als Begleit-Plus.",
    domainKeywords: domainKeywords,
    domainVector: Array.from(vec),
    stammCategories: stammCategories,
    guestCategories: guestCategories,
  });

  console.info("Spore erzeugt, nodeId =", spore.id);
  console.info("Signatur-Länge =", spore.signature.length);
  console.info("Spore-JSON in DevTools kopieren mit: copy(JSON.stringify(await SbkimSpore.getOwnSpore(), null, 2))");
  return spore;
};
