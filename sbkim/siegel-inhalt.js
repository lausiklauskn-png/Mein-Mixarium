/*
 * Siegel-Inhalt — DIE IDENTITÄT DIESES KNOTENS, und sonst nichts.
 *
 * ⚠ HIER STEHT KEIN KANON. Der Andock-Wizard, alle Anzeigetexte und alle
 * Prüfungen liegen seit A18 (2026-09-14) in EINER netzweit byte-gleichen
 * Datei — `sbkim/sbkim-andock-wizard.js`, Kanon `Sage-Protokol/src/modules/16b_andock_wizard.js`.
 * Diese Datei trägt nur noch, was in jedem Knoten ANDERS sein muss.
 *
 * Warum die Trennung: gemessen über die 20 Kopien im Netz standen am 2026-09-14
 * ZWÖLF verschiedene Code-Fassungen desselben Werkzeugs. Jede Verbesserung
 * kostete Handarbeit mal zwanzig und unterblieb deshalb meistens.
 *
 * ⚠ UND DIESE DATEI WIRD NIE VERTEILT. Sie trägt die BEDEUTUNG des Knotens; ein
 * Überschreiben gäbe dieser App den Namen und den Vektor einer fremden — der
 * Schaden vom 2026-08-16 in Alis Moderaum.
 *
 * Vertrag: Sage-Protokol/docs/INTERFACES.md §11.9.
 */
(function () {
  "use strict";
  window.SBKIM_SIEGEL_WIZ = {
    domain: "lausiklauskn-png.github.io",
    endpoint: "https://lausiklauskn-png.github.io/Mein-Mixarium/",
    nodeType: "hybrid",
    nodeName: "Mixarium Klaus",
    domainDescription: "Mein Mixarium ist ein persönliches Getränke-Labor als offline-fähige App (PWA) — eine digitale Werkstatt und Sammlung rund um alles Trinkbare. Der Schwerpunkt liegt ausschließlich auf Getränken: alkoholische und alkoholfreie Cocktails, Mocktails, Smoothies und Shakes, Limonaden und Erfrischungsgetränke, Tees und Kaffees, Bowlen und Punsche sowie selbstgemachte Sirupe und Basis-Zutaten. Eigene Rezepte lassen sich anlegen, sammeln, in Ordnern und Kategorien sortieren, bewerten und mehrsprachig führen. Über die Anbindung an eine öffentliche Cocktail-Datenbank kann man bekannte Drinks entdecken und übernehmen; ein KI-gestütztes Labor erzeugt auf Wunsch neue, experimentelle Getränke-Rezepte samt Zutaten, Zubereitungsschritten, Glastyp, Alkohol-Angabe und Geschmacksprofil, die man verkosten, bewerten und ins eigene Buch aufnehmen oder verwerfen kann. Ein Wochen- und Menüplan hilft, Drinks für Anlässe und Gäste zusammenzustellen. Als kleine Begleitung zu den Getränken gibt es zusätzlich Knabbereien und Fingerfood — Essen ist aber ausdrücklich nicht das Thema. Gedacht ist die App für Hobby-Mixologen, Gastgeber und alle, die gern neue Drinks ausprobieren, mischen, dokumentieren und offline griffbereit haben. Im Kern ist Mein Mixarium ein Organisations- und Kategorisierungs-Werkzeug — sammeln, ordnen, benennen, bewerten und wiederfinden — hier ausgeprägt für das Thema Getränke; dasselbe Grundgerüst trägt auch verwandte Apps (z. B. Rezept- und Verwahr-Werkzeuge). SBKIM-PROTOKOLL: Mein Mixarium ist zugleich ein eigener Endknoten im SBKIM-Mycel — dem server-losen Netz aus dem Sage-Protokol, in dem kleine Web-Apps einander nach BEDEUTUNG finden statt nach Stichwörtern. Es trägt eine eigene signierte Spore und meldet sich im gemeinsamen Rendezvous-Raum an; der private Schlüssel bleibt im Browser, es gibt keinen zentralen Vermittler und kein Konto. Semantisches Bidirektionales KI-Matching heißt, dass beide Seiten dasselbe Verfahren benutzen — der Suchende und der Gefundene rechnen ihre Bedeutung mit demselben Modell, und der Vergleich läuft im Browser. Wer im Mycel steht, wird von den anderen Knoten von selbst gefunden.",
    domainKeywords: ["Cocktail", "Drink", "Mocktail", "Limonade", "Smoothie", "Aperitif", "Sake", "SBKIM", "SBKIM-Protokoll", "Mycel", "Knoten", "Endknoten", "Sage-Protokol", "Spore", "Rendezvous", "semantisches Matching", "Bedeutung statt Stichwort", "server-los", "offline", "PWA", "Getränke-Labor", "Rezepte"],
    stammCategories: ["Cocktails", "Mocktails", "Alkfr. Cocktails", "Smoothies & Shakes", "Limonaden", "Tees & Kaffees", "Bowlen", "Sirup & Basis"],
    guestCategories: ["Knabbereien", "Fingerfood"],
    backupPrefix: "mein-mixarium-backup",   // Dateiname-Präfix des verschlüsselten Backups
    /* ⚠ DER INHALT ENTSCHEIDET ÜBER DEN VEKTOR, wenn welcher da ist.
       Die Stichprobe selbst lebt in sbkim/sbkim-init.js — hier steht nur der
       Verweis, SPÄT aufgelöst: sbkim-init.js wird vor dieser Datei geladen,
       ein direkter Zugriff liefe also ins Leere. Zwei Fassungen derselben
       Stichprobe ergäben zwei verschiedene Vektoren für denselben Knoten. */
    sampleContent: function () {
      var f = window.SBKIM_SAMPLE_CONTENT;
      return (typeof f === "function") ? f() : [];
    },
  };
})();
