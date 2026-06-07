# Stand — Siegel-Neugestaltung (2026-06-07)

Übernahme der Sage-/Rezeptbuch-Siegel-Neugestaltung 1:1 nach Mein Mixarium.
Keine neue Krypto, kein PII, Lampen/Widget-Slots (LEBT/VERKEHR/FREMD/SIEGEL)
unangetastet. Modul 16 bleibt reines Render-Modul.

## Was geändert wurde

**A) Modul 16 (`sbkim/16_siegel.js`)** — durch Sages neue Version ersetzt:
- Modul-18-Pfad raus: `BRONZE_HINWEIS_HTML_FALLBACK`, `[data-siegel-andock-btn]`
  und die `SbkimToolPwa`-Logik im Bronze-Block entfernt.
- Bronze-Block ist jetzt reiner Hinweis-Text und verweist auf den
  „🔑 Eigene Identität & Spore erzeugen / verwalten →"-Knopf.
- Neuer `ZERTIFIKAT_ASPEKTE`-Eintrag „Semantische Selbst-Beschreibung im
  Siegel" (2026-06-07). Aspekt 4 heißt netzweit jetzt „Mycel-Aktivität".

**A2) Andock-Einstieg (Host, `sbkim/sbkim-init.js`)** — wie Sage host-seitig
injiziert: `injectIdentityLinkIntoSiegel` + `watchForSiegelModal`
(MutationObserver auf `#sbkim-siegel-modal`). Der 🔑-Knopf öffnet den
Modul-18-Andock-Wizard (`SbkimToolPwa.openAndockTab()`, In-Page-Modal, kein
neuer Tab); fail-soft, wenn Modul 18 fehlt. Modul 18 bleibt geladen, ist aber
nicht mehr der Bronze-Andock-Trigger.

**B) Semantik-Beschreibungs-Textfeld (Host)** — auto-wachsendes `<textarea>`
direkt unter dem 🔑-Knopf. Voller Pfad beim „Beschreibung übernehmen →
Vektor & Spore neu signieren":
`SbkimSpore.getOrCreateIdentity()` (gleiche nodeId) → `SbkimEmbedding.init()`
(Fortschritt via `sbkim:embedding-progress`) →
`SbkimEmbedding.embedPassage(BESCHREIBUNG)` →
`SbkimSpore.generateOwnSpore({ …Mixarium-CONFIG, domainDescription, domainVector })`
→ `spore.json` herunterladen + Erfolgsmeldung (nodeId, L2). Der Beschreibungs-
text IST der Embedding-Eingang (vorher: feste Kategorie-Stichworte). Vorbefüllt
aus `SbkimSpore.getOwnSpore().domainDescription`, sonst Mixarium-Default.
`domain` bleibt `lausiklauskn-png.github.io` (wie in der heutigen Spore). Die
DevTools-Funktion `__sbkimErzeugeSpore()` bleibt als Fallback.

**C) Vertrauens-/Schutz-Block (Host)** — „🛡 Was bedeutet dieses Siegel — und
wie bist du geschützt?" mit zwei beruhigenden Sätzen + Knopf „Ausführlich
erklärt → …", der das Overlay (D) öffnet. Kein neuer Tab.

**D) Erklär-Seite (`sicherheit.html`, Repo-Root)** — Mycel-Erklärung wortgleich
aus Sage, Skin auf Mixarium-Look (Gold/Teal), Beispiele drink-näher, Links auf
Mein-Mixarium. Wird aus C als In-Page-Overlay geöffnet (`<iframe
src="sicherheit.html">`, ✕ / Backdrop / Esc schließen, z-index 100001 über dem
Siegel-Modal). Der „zurück"-Link blendet sich aus, wenn die Seite im iframe
läuft (`window.self !== window.top`).

## Verifikation
- `node --check` grün für `16_siegel.js` und `sbkim-init.js`.
- DOM-Rauchtest (Shim): 🔑-Knopf + Schutz-Block + Semantik-Block werden ins
  Siegel-Modal injiziert; 🔑 ruft `openAndockTab()`; Schutz-Link öffnet das
  iframe-Overlay; Textarea wird aus der Spore vorbefüllt.
- `index.html` ⟷ `QC_Mixarium_20_04_26.html` byte-identisch (unangetastet —
  die SBKIM-Module sind externe Skripte).
- **Echter Browser-Sichttest (Embedding-Download + tatsächliches Re-Signieren):
  ungeprüft, wartet auf Klaus** (Galaxy Tab S6).
