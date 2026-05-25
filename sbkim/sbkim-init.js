// sbkim-init.js — Mixarium Klaus
// Auto-Init Karte 09 § Schritt 4 + 9 + 10 + 11.
// Sage-Page-Parität: LEBT + VERKEHR + FREMD-Lampen + Siegel-Badge in einer Pille.
// Spore-Generierung manuell via window.__sbkimErzeugeSpore() in DevTools-Konsole.

// Verkehr-Puls-Helper (Sage-Page index.html Z. 1470-1476). Force-Reflow
// per offsetWidth, damit die Animation auch bei wiederholten Aufrufen
// neu startet. Auf window für Endknoten-Code (Handshake, KI-Aufruf etc.).
window.__sbkimVerkehrPuls = function () {
  var t = document.getElementById("lamp-traffic");
  if (!t) return;
  t.classList.remove("traffic-pulse");
  void t.offsetWidth;
  t.classList.add("traffic-pulse");
};

(async function () {
  try {
    await SbkimStorage.init({ dbSuffix: "mixarium" });
    await SbkimAnastomose.init();
    console.info("SBKIM-Init grün — Storage, Spore, Match bereit.");
    window.__sbkimVerkehrPuls();

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

    // Modul 00 Doku-Fenster — 5-Klick-Geste auf die Versions-Pille.
    // Karte 09 § Schritt 9: Doku-Fenster scharf schalten nach Apoptose.
    if (window.SbkimDoku) {
      try {
        await SbkimDoku.init({ searchIconSelector: "#appVersion" });
        console.info("SBKIM-Doku grün — 5-Klick-Geste auf #appVersion (v9.5) aktiv.");
      } catch (err) {
        console.warn("SBKIM-Doku konnte nicht initialisiert werden:", err);
      }
    }
    window.__sbkimVerkehrPuls();

    if (window.SbkimMembrane) {
      await SbkimMembrane.init({
        lampSelector: "#lamp-fremd",
        allowedOrigins: ["https://lausiklauskn-png.github.io"],
      });
    }

    if (window.SbkimSiegel) {
      await SbkimSiegel.init({
        badgeSelector: ".lamps",
        repoUrl: "https://github.com/lausiklauskn-png/Mein-Mixarium",
      });
    }

    // LEBT-Lampe scharf schalten — Knoten lebt (Identität geladen, Storage offen,
    // Match-Schicht bereit). Sage-Page hat die .alive-Klasse statisch im Markup;
    // Endknoten setzt sie dynamisch erst nach erfolgreichem Init, damit die Lampe
    // ehrlich „lebt" signalisiert (nicht „Seite geladen, Init aber failed").
    var alive = document.getElementById("lamp-alive");
    if (alive) alive.classList.add("alive");
    window.__sbkimVerkehrPuls();

    console.info("SBKIM-Andock bereit. Spore erzeugen mit __sbkimErzeugeSpore() in der DevTools-Konsole.");
  } catch (e) {
    console.error("SBKIM-Init-Fehler:", e);
  }
})();

window.__sbkimErzeugeSpore = async function () {
  if (window.__sbkimVerkehrPuls) window.__sbkimVerkehrPuls();
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
  if (window.__sbkimVerkehrPuls) window.__sbkimVerkehrPuls();
  return spore;
};
