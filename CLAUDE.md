# Projektregeln für Claude – Mein Mixarium

---

## ⚠️ PFLICHT-CHECKLISTE NACH JEDER ÄNDERUNG AN DER APP

Mein Mixarium hat **keinen** Build-Schritt. `index.html` und `QC_Mixarium_20_04_26.html` sind **byte-identisch** und müssen synchron gehalten werden.

Nach jeder Änderung am App-Code muss Claude diese Checkliste ausgeben:

```
✅ 1. QC-Datei geändert:   QC_Mixarium_*.html       ← erledigt
✅ 2. index.html:          1:1 Spiegel-Update        ← erledigt
✅ 3. md5sum-Vergleich:    QC und index identisch    ← verifiziert
```

**Claude darf eine Aufgabe NICHT als erledigt melden, ohne diese Checkliste anzuzeigen.**

Pflicht-Verifikation:
```bash
md5sum index.html QC_Mixarium_*.html
# Beide Hashes MÜSSEN identisch sein.
```

---

## Projektübersicht

### Repo: `lausiklauskn-png/Mein-Mixarium`
- **App-Name:** Mein Mixarium — persönliches Getränke-Labor (Mocktails, Smoothies, Cocktails, Limonaden, Tees, Sirupe)
- **Aktuelle Version:** v9.5
- **Lokaler Pfad:** `/home/user/Mein-Mixarium/`
- **Domäne:** Getränke (Trinkbares) — *nicht* Essen
- **Architektur:** Single-File-PWA, offline-first nach Erstinstallation

### Kein Schwesterprojekt
Mein Mixarium ist eigenständig. Es gibt **keine** funktional gespiegelte Sister-App. Frühere `mr-*.html`-Dateien im Repo stammen aus Muttis-Rezeptbuch und gehören nicht zur App — siehe „Fremdkörper" weiter unten.

---

## Dateistruktur

| Datei | Bedeutung |
|---|---|
| `QC_Mixarium_20_04_26.html` | **Quell- und Arbeitsdatei** (v9.5) — hier werden Änderungen primär vorgenommen |
| `index.html` | **Produktionsdatei** — *byte-identisches Spiegelbild* der QC-Datei. Kein `_CR`-Block, kein Build-Schritt. Bei jeder Änderung muss `index.html` synchron gehalten werden. |
| `manifest.json` | PWA-Manifest |
| `app-sw.js` | Service Worker (precached: `./`, `index.html`, `manifest.json`, `mixarium_icon.svg`, `mixarium_icon.png`) |
| `mixarium_icon.svg` / `mixarium_icon.png` | App-Icons |
| `gift.html`, `gift2.html`, `invite-v5.html` | Eigenständige Mein-Mixarium-Seiten (Geschenk / Einladung) |
| `impressum.html` | Impressum (eigenständig) |
| `mr-gift.html`, `mr-gift2.html`, `mr-invite-v5.html` | **Fremdkörper aus Muttis-Rezeptbuch** (Weiterleitung auf fremdes Repo). Aktuell nicht referenziert von der App. Nicht eigenmächtig löschen — Klärung mit User. |
| `Mein_Mixarium_*.pdf` | Marktanalyse / Kosten-Nutzen-Analyse |
| `scripts/check_i18n.js` | Übersetzungs-Konsistenz-Prüfung |
| `README.md`, `CLAUDE.md`, `RELEASE_POINT.txt` | Projekt-Doku |

### Kein Build-Skript
Es gibt **kein** `build.py`, **kein** `_cr_block.txt`, **kein** `extract_cr.py`. Anders als bei Muttis-Rezeptbuch hat Mein Mixarium keinen Schutz-Block — `index.html` ist 1:1 die QC-Datei.

---

## Externe Datenquellen

### TheCocktailDB (öffentliche REST-API)
```
https://www.thecocktaildb.com/api/json/v1/1/
```
- Genutzt im „Bekannte Drinks entdecken"-Panel (Funktion `discoverToggle()` in QC ab Zeile ~4904)
- Liefert: Stammdaten, Bilder, Zutaten, Anleitungen in 7 Sprachen (DE/ES/FR/IT/ZH/PT/RU)
- Übernommene Drinks bekommen `dbId: String(d.idDrink)` als Referenz
- **Internet erforderlich** (nur dann)

### Anthropic API
- Modell: `claude-haiku-4-5-20251001` (Labor-Generierung, KI-Scan)
- API-Key in `localStorage` unter `mxkey9m`
- Direct-Browser-Access: `anthropic-dangerous-direct-browser-access: true`
- **Internet erforderlich** für KI-Funktionen

### Offline-Verhalten
Aus dem Manual (Zitat aus Code, `hlpOfflineSub`):
> *Die App speichert sich beim ersten Öffnen automatisch auf deinem Gerät – danach läuft sie vollständig ohne Internet. Wenn du Browserdaten löschst, wird dieser Speicher ebenfalls gelöscht. Danach einfach einmal online gehen – die App lädt sich neu.*

Die App selbst läuft offline. KI-Features (Scan, Labor, Übersetzung, geplante SBKIM-Funktionen) brauchen Internet — das ist Teil des Designs, kein Konflikt.

---

## LocalStorage-Konvention

| Key | Inhalt |
|---|---|
| `mxkey9m` | Anthropic API-Key |
| `mxlang9m` | Aktuelle Sprache (`CL`) |
| `mxms9m` | Menüplan-Daten |
| `mxfd9m` | Ordner-Struktur |
| `mxtheme9m` | Theme |

**Regel:** Neue Persistenz-Keys folgen dem Schema `mx<thema>9m`.

---

## Übersetzungssystem
- `LANGS`-Objekt im JS (1 Definition, 8 Sprachblöcke)
- Funktion `T(k)` (in QC bei Zeile ~4145): `function T(k){return(LANGS[CL]||LANGS.de)[k]||k;}`
- **8 Sprachen:** de, en, ru, zh, es, fr, it, pt
- Aktuelle Sprache: `CL` (geladen aus `localStorage.mxlang9m`)
- Konsistenz-Check: `node scripts/check_i18n.js`

---

## Workflow-Regeln

### Entwicklung
1. Änderungen primär in `QC_Mixarium_*.html` vornehmen
2. Direkt danach `index.html` synchron halten (`cp QC_Mixarium_20_04_26.html index.html` oder identische Bearbeitung)
3. md5sum vergleichen — beide Dateien MÜSSEN identisch sein
4. Commit-Nachrichten auf **Deutsch**

### Selbst-Merge-Freibrief (Klaus 2026-06-28, netzweit für ALLE Repos)
Klaus' stehende Anweisung: die Sitzung merget ihre **eigenen** PRs **selbstständig** nach
`main`, sobald sie getestet (Smoke/md5-Drift-Guard grün, bei reinen Doku-/byte-Kopie-
Änderungen Drift-Guard grün), abgegrenzt und nicht architektonisch zweifelhaft sind —
**ohne auf „X mergen" zu warten** (Draft-PR → ready → squash-merge). **NICHT** automatisch
mergen bei echtem Zweifel (Richtungsentscheid, schwer umkehrbar, mehrere gleich gute Wege)
ODER wenn Klaus ausdrücklich vorher draufschauen will. Klaus' Browser-Sichttest am Tablet
bleibt davon unberührt (er läuft auf der live-deployten Seite nach dem Merge). Niemals auf
einen anderen als den vorgegebenen Branch pushen.

### „Hochladen"-Befehl
Wenn der Benutzer **„Hochladen"** schreibt:
1. Alle lokalen Änderungen committen (deutsche Nachricht)
2. Auf aktuellen Feature-Branch pushen: `git push -u origin <branch>`
3. PR (Draft) erstellen via `mcp__github__create_pull_request` → nach `main`
4. PR-URL mitteilen — **und nach dem Selbst-Merge-Freibrief direkt mergen, wenn sinnvoll**

### Pflicht-Prüfung bei „Hochladen" oder „Mergen"
**Immer** alle offenen PRs und Branches prüfen:

| Schritt | Primär (MCP) | Fallback (git) |
|---|---|---|
| Offene PRs prüfen | `mcp__github__list_pull_requests` (state: open) | — |
| Alle Branches prüfen | `mcp__github__list_branches` | `git fetch --all` |
| Branches ahead of main | — | `git log origin/main..origin/<branch> --oneline` |

**Wenn MCP-Tools nicht verfügbar:**
- Explizit melden: *„GitHub-PRs können gerade nicht geprüft werden (MCP nicht verfügbar)"*
- git-Fallback verwenden, alle Remote-Branches auf ungemergede Commits prüfen
- NIEMALS „nichts offen" sagen ohne zu prüfen, was tatsächlich geprüft wurde

### Branch-Konvention
- Feature-Branches automatisch angelegt: `claude/<beschreibung>-<id>`
- Immer auf dem zugewiesenen Branch arbeiten (steht in der Session-Konfiguration)

---

## Eigenständige HTML-Seiten

Die folgenden Dateien sind **eigenständige HTML-Seiten** — direkt bearbeiten + committen:

| Datei | Typ |
|---|---|
| `gift.html` | Geschenk-Landing-Seite |
| `gift2.html` | Geschenk-Variante |
| `invite-v5.html` | Einladungs-Seite |
| `impressum.html` | Impressum |

**Pflicht-Checkliste nach Änderungen:**
```
✅ Datei direkt geändert
✅ Alle internen Links auf Korrektheit geprüft (keine fremden URLs)
✅ Icons inline als Base64 (keine externen Datei-Referenzen)
```

### Fremdkörper im Repo (nicht von Mein Mixarium genutzt)
Die `mr-*.html`-Dateien (`mr-gift.html`, `mr-gift2.html`, `mr-invite-v5.html`) stammen aus Muttis-Rezeptbuch und enthalten Weiterleitungen auf `lausiklauskn-png.github.io/Muttis-Rezeptbuch/...`. Sie werden von Mein Mixarium nirgends verlinkt.

**Regel:** Nicht eigenmächtig löschen. Bei Bedarf erst mit User klären, dann atomar entfernen.

---

## ⚠️ REGEL: Icons in eigenständigen Seiten müssen inline sein

Externe Icon-Referenzen (`href="icons/icon-book-blue.svg"`) sind **verboten** — wenn die Icon-Datei umbenannt oder verschoben wird, bricht das Icon lautlos. Pflicht: alle Icons in `gift.html`, `gift2.html`, `invite-v5.html`, `impressum.html` als **inline Base64 data-URI**.

```html
<!-- FALSCH -->
<link rel="icon" href="icons/something.svg">

<!-- RICHTIG -->
<link rel="icon" type="image/svg+xml" href="data:image/svg+xml;base64,...">
```

**Verifizieren:**
```bash
grep -n 'rel="icon"' gift.html gift2.html invite-v5.html impressum.html
# Jede Zeile muss "data:" enthalten
```

---

## ⚠️ REGEL: Icon-Änderungen erfordern einen einzigen vollständigen Durchgang

Erfahrung: Icon in einer Seite geändert → ein Commit → danach Nachbesserung nötig, weil andere Seiten vergessen wurden.

**Vor dem ersten Icon-Commit** alle Stellen inventarisieren:
```bash
grep -rn 'rel="icon"\|rel="apple-touch-icon"\|icons:\[' \
  index.html QC_Mixarium_*.html gift.html gift2.html invite-v5.html \
  impressum.html manifest.json app-sw.js
```

**Alle Stellen in EINEM Commit** aktualisieren — kein „andere Seiten später".

**Vier Orte, wo Icons stecken können:**
1. `<link rel="icon">` — Tab-Favicon
2. `<link rel="apple-touch-icon">` — iOS-Icon
3. PWA-Install-Dialog (im JS, suchen nach `icons:[`)
4. `manifest.json` + `<img src="data:...">` im Seiteninhalt

---

## ⚠️ PFLICHT-REGEL: Dateien umbenennen (atomisch)

Wenn eine Datei umbenannt wird, MÜSSEN alle Querverweise in EINEM Commit aktualisiert werden. Zwischen zwei Commits deployt GitHub Pages Zwischenzustände → 404-Fenster.

**Pflicht-Checkliste:**
1. Vor dem Umbenennen: `grep -rn "alter-name" --include="*.html" --include="*.js" --include="*.json" .`
2. In EINEM Commit:
   - `git mv alter.html neuer.html`
   - alle `href=`, `src=`, `location.replace(`, `window.open(` aktualisieren
   - `manifest.json`, `app-sw.js` prüfen
   - absolute GitHub-Pages-URLs ersetzen
3. Nach dem Commit: `grep -rn "alter-name" ...` muss leer sein

---

## Häufige Aufgaben

### Neue Funktion hinzufügen
1. In `QC_Mixarium_*.html` implementieren
2. `index.html` synchron halten (siehe Workflow-Regeln)
3. md5sum verifizieren — beide Dateien identisch
4. Hochladen

### Sprache hinzufügen
- Im `LANGS`-Objekt neuen Sprachblock ergänzen (DE als Master)
- `CL`-Variable und `T(k)`-Funktion funktionieren automatisch
- Neue Sprache zum Sprach-Picker im UI hinzufügen
- `node scripts/check_i18n.js` für Konsistenz-Check

### Swipe / Touch / Drag & Drop
- Swipe-Handler: IIFE im Bereich `// ── SWIPE-NAVIGATION ──` (vor `boot()`)
- Touch-Drag: `setupTouchDrag()`, `setupWkTouchDrag()`
- Drag-Selektoren: `.drag-hdl`, `.ing-drag-hdl`, `.fld-drag-hdl`, `.wk-drag-hdl`

---

## Menüleiste (Bottom Nav)

### navTo() — Schritt-zurück-Verhalten
**Alle Nav-Buttons** rufen `navTo(n)` statt `showSc(n)` auf.

`navTo(n)` schließt zuerst offene `fov`-Overlays (Import, Export, API-Key, Sprache, Hilfe, Manual), **bevor** zum Ziel-Tab navigiert wird. Ist ein Overlay offen → wird nur geschlossen (ein Schritt zurück). Ist keins offen → normaler `showSc(n)`-Aufruf.

```javascript
// QC-Datei: showSc() ist bei Zeile ~4667, navTo() direkt danach (~4686)
function navTo(n){ ... }
```

**Regel:** Neue Nav-Buttons immer mit `navTo()` statt `showSc()` anlegen.

---

## Mein-Menü-Overlay (`.mv-*`) — Design-Parität mit Import-Overlay (`.fov-*`)

Das `#mv`-Overlay (Mein Menü / Wochenplan) soll **optisch identisch** mit dem `#importOv`-Overlay sein. CSS-Klassen `.mv-*` spiegeln `.fov-*` (Header, Tabs, Spektral-Verlauf).

**Regel:** Bei Änderungen an `.fov-hdr` / `.fovtab` immer prüfen, ob `.mv-hdr` / `.mvtab` ebenfalls anzupassen ist.

---

## Labor-Funktion

### Lab-Generierung (`labGenerate()`)
- Eingabe: Kategorie (`LAB_CAT`), Geschmacks-Tags (`LAB_TASTES`), optionale Zutaten
- Modell: `claude-haiku-4-5-20251001`
- Antwort-Schema: JSON mit `titel/beschreibung/zutaten/schritte/tags/glastyp/alkohol/portionen/zubereitungszeit_min/schwierigkeit`
- Speicherung: `R[]`-Array mit `labGen: true`, `labStatus: 'experimentell'`
- Bewertung: 4 Dimensionen (taste/practicality/originality/description), gewichtet nach `LAB_WEIGHTS`

### Lab-Pool-Workflow
- `experimentell` → User-Bewertung → `accepted` (ins Buch) oder `removed`
- Schon nach 1 Bewertung kann der Status wechseln

---

## SBKIM — Geplante Erweiterung (Stand: Mai 2026)

**SBKIM** (Semantisches Bidirektionales KI-Matching) wird als MVP-Erweiterung in Mein Mixarium aufgebaut. Mein Mixarium ist die **Demo-Plattform** für das offene SBKIM-Protokoll.

### Architektur (geplant, 6 Agenten)
- **Korpus / Partei B (passiv):** TheCocktailDB-Discover (existiert bereits)
- **A1 Curator:** Stammdaten + öffentliches Wissen via Claude (LLM als Komprimierer externer Quellen)
- **A2 Auditor:** Trust-Werte aus `confidence`-Feldern der LLM-Antworten
- **A3 Devil's Advocate:** Negativ-Signale (Kritikpunkte, Einschränkungen)
- **B1 Interviewer:** Lückenfüllung auf User-Seite (Partei A) durch max. 3 Rückfragen
- **B2 Matcher:** Cosine-Similarity + α/β/γ-Score
- **B3 Critic:** Kennenlern-Karten (synergien, lücken, brücke)

### Spezifikations-Artefakte (geplant unter `docs/sbkim/`)
- `RULES.md` — Regeln zur Quellen-Aggregation, Trust-Vergabe, Capability/Need-Synthese
- `PROMPT_TEMPLATES.md` — LLM-Prompts für A1, B1, B3 (mit Beispielen)
- `DEMO_CASES.md` — vorbereitete Demo-Suchanfragen mit dokumentierten Erwartungen

### Konzept-Quellen
- `SBKIM_Paper_Mein_Mixarium.pdf` — Konzeptpapier (Mai 2026)
- Allgemeines SBKIM-Protokoll-Paper (offene Spezifikation, gemeinfrei, Mai 2026)
- Multi-Agent-Erweiterungs-Dokument `SBKIM_AGENTS.md` (extern verfasst, Inhalte zur Übernahme)

### Wichtige SBKIM-Regeln
- **LLM-Wissen** über bekannte Drinks ist legitime externe Quelle (Claude komprimiert öffentlich publiziertes Wissen aus Bartender-Foren, Mixology-Quellen, Wikipedia etc.)
- **Synthetische Reviews** werden NICHT als „echte Bewertungen" verkleidet — Quelle ist immer transparent (LLM-Wissen vs. User-eigene Bewertung)
- **Trust-Werte** stammen aus `confidence`-Antworten der LLM, nicht aus willkürlichen Konstanten
- **Differential Privacy & Gossip** sind nicht Teil des MVP — erst spätere Phase, wenn Single-Device-Stabilität nachgewiesen ist
