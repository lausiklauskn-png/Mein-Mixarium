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

## Selbst-Merge-Freibrief

Die Sitzung merget ihre **eigenen** PRs selbstständig nach `main`, sobald sie getestet,
abgegrenzt und nicht architektonisch zweifelhaft sind — ohne auf ein Wort zu warten.
**Nicht** bei echtem Zweifel oder wenn Klaus vorher draufschauen will; Klaus' Browser-
Sichttest läuft **nach** dem Merge. Jede Entscheidung wird dokumentiert, ein Widerspruch
besprochen statt abgewartet. Volltext: [NETZWEIT § 1](https://github.com/lausiklauskn-png/Sage-Protokol/blob/main/docs/NETZWEIT.md).
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

## ⚠️ REGEL 2026-08-08: Icons der HAUPT-App als Datei mit Versionsnummer

Die Symbole der App steckten als Base64 in `index.html` — 439 KB, die bei
**jedem** Seitenaufruf auf dem kritischen Pfad lagen, obwohl sie während des
Ladens niemand sieht (Tab- und Startbildschirm-Symbole).

| | vorher | nachher |
|---|---|---|
| Dokument | 1.385 K | **946 K** |
| erster Anstrich | 3,7 s | **2,0 s** |
| Leistung (Handy, lokal) | 39 · 55 | **65 · 66** |
| übertragen | 1.330 KiB | **804 KiB** |

**Regel:** Icons als Datei verlinken, mit **Versionsnummer in der Adresse**:

```html
<link rel="icon" type="image/png" sizes="192x192" href="icons/mixarium-192.png?v=1">
```

Eine geänderte Adresse ist für den Cache ein **anderes** Bild — deshalb ersetzt
die Versionsnummer den früheren Zweck der Einbettung (aggressives
Favicon-Caching) vollständig.

**Nach jeder Icon-Änderung `?v=` um eins hochzählen** — in `index.html`, in der
QC-Datei **und** in `app-sw.js`. Alle drei müssen dieselbe Adresse nennen.

**Pflicht dabei:** jedes verlinkte Icon gehört in `PRECACHE_FRISCH` in
`app-sw.js`, sonst fehlen die Symbole offline.

**Das gilt NICHT für die eigenständigen Seiten** — siehe die nächste Regel.

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

## ⚠ ZWEI WEGE ZUR SPORE — und sie rechnen den Vektor VERSCHIEDEN (2026-09-10)

Klaus hat das Siegel fotografiert: im Semantik-Feld stand ein **88-Zeichen-Zweizeiler**
(„Klaus Mixarium - Cocktails, Mocktails, Smoothies und mehr; Knabbereien als
Begleit-Plus."), während in `sbkim/siegel-inhalt.js` ein ausgearbeiteter Text von
über 1400 Zeichen lag. Der Mycel-Mitschnitt desselben Tages zeigt: **genau dieser
Zweizeiler stand im Raum.**

**Zwei Ursachen, beide behoben:**

1. **`sbkim/sbkim-init.js` trug einen ANDEREN Text** als das Siegel. Zwei Wege zur
   Spore, zwei Texte — also zwei verschiedene Vektoren für denselben Knoten, je
   nachdem, welchen Weg der Nutzer nimmt. Beide tragen jetzt denselben Text und
   dieselben Stichworte, und ein Wächter vergleicht sie wortgleich.
2. **Die gespeicherte Spore überschrieb den Vorschlag der App still.** Wer neu
   signierte, bekam den Zweizeiler zurück. Jetzt gewinnt der Vorschlag der App;
   der zuletzt signierte bleibt hinter einem Knopf erreichbar, und eine Zeile
   **nennt jedes Mal**, welcher der beiden im Feld steht.

### ⚠ ABER DER VEKTOR KOMMT HIER NICHT AUS DER BESCHREIBUNG

Das ist die Besonderheit dieser App, und wer sie nicht kennt, sucht am falschen
Ende:

| Weg | was eingebettet wird |
|---|---|
| **Siegel** (`reSignWithDescription`) | `embedPassage(beschreibung)` — der **Text** |
| **stille Erst-Anmeldung** (`sbkim-init.js`) | `embedContentVector(samples)` — die **Getränke-Namen**, wenn welche da sind; sonst `allText` aus Kategorien + Stichworten |

Gemessen an der Spore im Raum vom 2026-09-02: `embeddingSource: "content"`.
**Mixariums Zahl im Register stammt also aus den Drinks, nicht aus der
Selbstbeschreibung.** Das ist die Entscheidung vom 2026-06-28 („wenn echte
Drinks vorhanden sind, entscheidet der INHALT statt der Selbstbeschreibung") und
bleibt so — sie ist ehrlicher.

**Daraus folgt für die Praxis:** eine bessere Beschreibung wirkt hier **nur**,
wenn über das **Siegel** neu signiert wird. Wer nur die Datei ändert und darauf
wartet, dass die Zahl steigt, wartet vergeblich.

### ✅ Und es hat gewirkt — gemessen am 2026-09-10, 16:29

Klaus hat über das **Siegel** neu signiert. Der Mycel-Mitschnitt danach:

| | vorher | nachher |
|---|---|---|
| gegen Sage | 0.826040 | **0.883142** |
| Text im Raum | 88 Zeichen | **2141** |
| Kennung | `6U3aniLM3Rps…` | **dieselbe** — die Identität hat den Wechsel überlebt |
| Vektor-Grundlage | `embeddingSource: "content"` (Drinks) | die **Beschreibung** (14 Schnipsel, Siegel-Weg) |

⚠ **Das ist nicht nur ein besserer Text, es ist eine andere MESSGRUNDLAGE.**
Vorher rechnete die Zahl aus den Getränke-Namen, jetzt aus der
Selbstbeschreibung. Beide Wege sind gewollt (siehe oben) — wer die Zahlen über
die Zeit vergleicht, muss wissen, welcher gerade greift.

**Die Spore liegt seitdem unter `sbkim/spore.json`**, die alte als
`sbkim/spore-vorgaenger-2026-07-19.json` daneben. Geprüft, bevor sie abgelegt
wurde: VALID · `id == base64url(SHA256(rawPub))` · kein `d` · `key_ops` nur
`["verify"]` · L2 = 1 · byte-gleich mit der Spore im Raum · Text byte-gleich mit
dem Depot.

⚠ **DIE KENNUNG IST IN DER PROBE GENAGELT.** Ohne den Nagel fängt kein Wächter
eine erfundene Spore: wer ein frisches Schlüsselpaar erzeugt und damit
unterschreibt, bekommt eine, die in sich tadellos ist und nur einen **anderen**
Knoten ankündigt. Wer die Kennung wechselt, zieht sie **hier UND in
`Sage-Protokol/status.json`** nach — das ist der Preis, und er ist beabsichtigt.

⚠ **UND DIE GEGENPROBE MUSSTE NEU UNTERSCHREIBEN, statt zu verbiegen.** Jedes
Feld einer Spore steht **unter** der Signatur; ein Eingriff von Hand bricht also
immer zuerst den Signatur-Wächter, und der Fall wäre „gefangen", ohne den
gemeinten je erreicht zu haben. `tests/gegenprobe_spore.mjs` unterschreibt mit
einem frischen Paar, das nur im Arbeitsspeicher lebt. Vier Fälle ziehen dabei den
genagelten Wert in der **Kopie** der Probe nach — sonst fiele der
Kennungs-Wächter stellvertretend um.

### Warum das Protokoll in der Beschreibung steht

Gemessen an den vier Mycel-Mitschnitten vom 2026-09-10, in denen alle 21 Knoten
live nebeneinander standen: **Länge entscheidet nicht, der Inhalt tut es.**
Kim-Bell kommt mit **82** Zeichen auf 0.874864, weil es SBKIM, Mycel und Knoten
nennt; Muster Werbetechnik hat **421** Zeichen und kommt auf 0.793613, weil es
das Protokoll nicht erwähnt. Deshalb trägt die Beschreibung jetzt einen eigenen
Absatz dazu — und die Domäne (Getränke) bleibt vorn, wo sie hingehört.

**Geprüft von:** `node tests/smoke_sbkim_beschreibung.mjs` (15 Wächter) ·
`node tests/gegenprobe_sbkim_beschreibung.mjs` (10 Fälle, jeder von Hand
nachgestellt).

⚠ **Und der erste Wächter hing an einem LEERZEICHEN.** Er suchte
`domainKeywords: [` mit genau einem — in `sbkim-init.js` stehen dort zwei, weil
die Zeile mit ihren Nachbarn ausgerichtet ist. Er meldete eine Abweichung, die
keine war: ein Fehler im Wächter, der wie ein Fehler im Code aussah.

---

## 🏷️ KATEGORIEN SIND UMBENENNBAR — und fremde verschwinden nicht mehr (Klaus 2026-09-15)

Klaus hat ein Rezeptbuch-JSON ins Mixarium geladen und bekam einen Spaghetti
Bolognese unter **Knabbereien** zu sehen. Sein Satz dazu: *„Man kann auch
Essen mixen, nicht nur Getränke. Also Essen mixen nennt man Kochen."*

**Vier Sachen wurden gemessen, und nur eine davon war ein Fehler:**

| | Befund |
|---|---|
| Der Remap nach „Knabbereien" | **Absicht.** `OLD_FOOD` (sieben Essens-Kategorien) → `'knab'`, bei JEDEM Laden in `boot()`. Der Kommentar nannte den Grund: *„passt thematisch als Snack zum Drink, statt sie komplett zu verwerfen."* |
| „Ersetzen" beim Import | **hat ersetzt.** `R=imported`. Die 5 Cocktails und 4 Bowlen kamen aus derselben Datei mit — das Rezeptbuch führt die Getränke-Kategorien auch |
| **`drk` fiel still durch** | **der echte Fehler.** Weder in `CATS` noch in `OLD_FOOD`: die Rezepte lagen in `R`, wurden gespeichert und mitexportiert — und **nie gezeichnet**, auch nicht unter „Alle" |
| Umbenennen | **gab es nicht.** `const CATS=[…]`, keine Schreibstelle, keine Oberfläche — nur **Ordner** liessen sich benennen |

⚠ **DER BEFUND WAR SEIT JEHER BEKANNT — er ging nur an die Konsole.**
`renderCatNav` warnt mit *„N Orphan-Drink(s) — haben Namen aber keine bekannte
Kategorie"*. Die Auskunft war vollständig und richtig; sie stand nur an einem
Ort, an dem kein Nutzer nachsieht. **Eine Auskunft, die nur in der Konsole
steht, hat niemand.**

### Was seitdem gilt

- **`CATS_EIGEN` (`mxcats9m`) trägt eigene Namen und Symbole je Kategorie.**
  ⚠ **Gespeichert wird NUR die Beschriftung, nie die Kennung.** `c.id` bleibt
  `ckt`, auch wenn dort „Salate" steht — jedes Rezept zeigt über `r.cat` auf
  diese Kennung. Wer sie umbenennt, nimmt allen Rezepten ihr Zuhause.
- **`catsFremd()` / `catsAlle()`:** Kennungen, die in `R` vorkommen und die
  `CATS` nicht kennt, bekommen einen eigenen Reiter und sind umbenennbar wie
  jede andere. Sie tragen im Dialog die Marke „mitgebracht".
- **Ein eigener Name gilt in allen 8 Sprachen.** Klaus hat ihn selbst
  geschrieben; ihn zu übersetzen hiesse raten. Das steht im Dialog, sonst wäre
  es eine stille Entscheidung.

### ⚠ Der Remap ist WEG — Tafel-Evolutions-Klausel, ausdrücklich benannt

Die alte Begründung war richtig, **solange Mixarium keine eigenen Kategorien
zuliess**: zusammenfalten war besser als wegwerfen. Seit Kategorien umbenennbar
sind, ist er das Gegenteil — er zerstört genau die Information, aus der der
Nutzer seine eigene Kategorie machen will. **Blank-Karten alter
Essens-Kategorien fliegen weiter heraus:** eine leere Karte ist kein Inhalt und
spannte sonst einen Reiter auf, in dem nichts steht.

### ⚠ `catIco` GAB ES SCHON — und die spätere Deklaration gewinnt

Die neuen Helfer hiessen zuerst `catLbl`/`catIco` und nahmen ein **Objekt**.
`catIco(id)` gibt es seit jeher und nimmt eine **Kennung**. Funktions-
Deklarationen werden hochgezogen, die spätere gewinnt — jeder Aufruf landete in
der falschen, und die rief `startsWith` auf einem Objekt auf. Sie heissen jetzt
**`katBeschriftung(c)`** und **`katSymbol(c)`**, und die id-basierten Altbestände
(`catName`, `catIco`, `catCol`) hängen an derselben Quelle. **Gefunden hat es
der Browser, nicht das Nachdenken** — vor dem Ergänzen nachsehen, ob es den
Namen schon gibt.

### Die Emoji-Auswahl — einmal antippen, aussuchen (Klaus 2026-09-15)

Ein Tipp aufs Symbol-Feld im Umbenennen-Dialog öffnet ein Raster mit **107
Symbolen**. Es steht einmal im Dialog und wandert unter die bearbeitete Zeile;
dreizehn eigene Raster wären dreizehn Stellen, die auseinanderlaufen.

⚠ **Die Reiter-Leiste öffnet sie NICHT.** Ein Tipp auf eine Kategorie-Pille
wechselt die Kategorie — ein zweiter Zweck am selben Griff wäre eine Regel,
die niemand lernt.

⚠ **Tippen bleibt möglich.** Das Raster ist eine Abkürzung, kein Riegel. Wer
ein Symbol braucht, das fehlt, gibt es weiter von Hand ein.

#### ⚠ Sie war zuerst ein UMSCHALTER — und machte sich damit selbst wieder zu

Am Symbol-Feld hängen `onfocus` **und** `onclick`; ein Fingertipp löst beide
aus. Das erste öffnete, das zweite sah „schon offen" und schloss. Gemessen im
Browser: das Raster war nach einem Tipp zu, obwohl es an der richtigen Stelle
stand — der Wächter „steht direkt unter der Zeile" war grün, der Wächter
„öffnet es" rot. Sie öffnet jetzt nur; geschlossen wird an drei benannten
Stellen (nach der Wahl, Tipp daneben, Esc).

#### ⚠ Und danach flatterte sie — `scrollIntoView` war die Ursache

**Drei Läufe derselben Datei, zweimal offen, einmal zu.** Das Scrollen beim
Öffnen verschob die Liste unter dem Finger; zwischen `focus` und `click`
wanderte das Feld weg, der Klick landete auf einem anderen Element, und der
„Tipp daneben"-Riegel schloss sofort. **Kein Proben-Artefakt** — die Liste ist
scrollbar (`max-height: 46vh`), am Tablet schnappt dasselbe zu.

⚠ **Ein Verhaltens-Wächter allein hätte das durchgelassen** (zwei von drei
Läufen grün). Daneben steht deshalb ein Wächter auf die **Ursache**:
`katEmojiOeffnen` darf nicht scrollen. Der war beim ersten Bau prompt zu
Unrecht rot, weil der Erklärblock an derselben Stelle das Wort
`scrollIntoView` **nennt** — gemessen wird der Code ohne Kommentare.

### ⚠ Die Auswahl war „nicht vollkommen aufgeklappt" — 12 px statt 529 (Klaus 2026-09-15)

Klaus hat es an allen drei Apps gesehen: unter der angetippten Zeile stand nur
ein flacher Streifen. **Gemessen im Browser: 12 px hoch, bei 598 px Inhalt und
107 Knöpfen — nicht eine einzige Reihe.**

**Die Ursache ist eine Zeile CSS, und sie hat nichts mit dem Raster zu tun.**
`.kat-list` ist ein Flex-Container. Ein Flex-Kind mit `overflow-y:auto`
bekommt `min-height:auto` = **0** — es wird plattgedrückt, sobald die Liste
überläuft (gemessen: 773 px Inhalt in 529 px Fenster). Die Zeilen darüber
halten stand, weil ihre Eingabefelder eine Mindesthöhe haben; das Raster nicht.

⚠ **UND DER ALTE WÄCHTER WAR DABEI GRÜN.** Er hieß „steht DIREKT unter der
bearbeiteten Zeile" und fragte, **WO** das Raster hängt — nie, **WIE HOCH** es
ist. *Ein Wächter auf die Lage misst nicht die Sichtbarkeit.* Die Zusicherung
ist ersetzt, nicht stillschweigend getauscht (Tafel-Evolutions-Klausel).

### Was jetzt gilt

Das Raster steht **außerhalb** der scrollenden Liste und legt sich als
Überlagerung **genau über sie** — gemessen gegen die echte Lage der Liste,
nicht gegen einen geratenen Abstand. Die bearbeitete Zeile wird markiert, die
Kopfzeile nennt sie beim Namen, ein × schließt ohne Wahl.

| | vorher | nachher |
|---|---|---|
| Höhe des Rasters | **12 px** | **529 px** (Tablet hoch) · 368 · 421 |
| sichtbare Reihen | 0,3 | **13,2** · 9,2 · 10,5 |
| Liste beim Öffnen | — | **bewegt sich nicht** (529 → 529) |

### ⚠ Drei Anläufe, und die ersten zwei bewegten das Layout

Jeder wurde von einer Probe gefangen, keiner vom Nachdenken:

1. **Die Liste schrumpfen lassen** (46vh → 22vh), damit der Dialog nicht über
   den Schirm wächst. Dabei wandert die angetippte Zeile unter dem Finger weg,
   der folgende `click` landet auf einer **anderen** Zeile — **vier Wächter
   fielen um.** Das ist wortgleich derselbe Fehler wie `scrollIntoView` am
   selben Tag, nur mit einer anderen Ursache für dieselbe Bewegung.
   **Ein Auswahl-Feld darf das Layout nicht bewegen.**
2. **Die Überlagerung über den ganzen Dialog** — sie deckte „Speichern" mit ab.
   Ein Tipp dort war wirkungslos: ein toter Knopf, den man sieht. Sie deckt
   jetzt genau die Liste ab.
3. **`onfocus` öffnete mit.** `focus` feuert beim **Mausdruck**, das Raster
   erscheint also noch **während** des Fingertipps unter dem Finger — und das
   Loslassen landet auf einem Emoji-Knopf darin. Gemessen: der erste Tipp
   suchte ein zufälliges Symbol aus. Es hängt jetzt **nur am Klick**, und der
   feuert erst nach dem Loslassen.

⚠ **DER WÄCHTER MISST SEITDEM DIE BEWEGUNG, NICHT DIE FOLGE:** die angetippte
Zeile muss vor und nach dem Öffnen an derselben Stelle stehen. Ein
Verhaltens-Wächter allein war beim ersten Mal in zwei von drei Läufen grün.

⚠ **UND EIN NEUER WÄCHTER WAR SELBST BLIND.** „Mehrere ganze Reihen hoch"
maß `hoehe >= 3 * knopfhoehe` — legt man das Gitter auf `display:none`, ist
die **Knopfhöhe 0**, und `hoehe >= 0` ist immer wahr. *Ein Maßstab, der selbst
verschwinden kann, misst nichts.* Gefangen hat es die Gegenprobe.
### ⚠ Und die Gegenprobe lief zweier Läufe wegen ins Leere

Zwei Läufe **nebeneinander** teilten sich feste Ablagen unter `/tmp` — sie
haben einander die Quelldatei überschrieben. Gemessen: **15 Fälle „rot aus
falschem Grund"**, und es sah aus wie ein Fehler im Code. Die Ablagen liegen
jetzt **in der Wegwerf-Kopie**.

⚠ **Und ich habe den Rückgabewert einmal von `tail` abgelesen.** Der Aufruf
war `bash tests/gegenprobe_*.sh | tail -28`; gemeldet wurde `exit 0`, während
die Gegenprobe selbst `1` zurückgab. **`| tail` ist zum Lesen da, nicht zum
Urteilen** — dieselbe Falle wie netzweit aufgeschrieben, nur in noch einem
Kostüm. Die Zahl steht in der Schlusszeile, nicht im Rückgabewert der Pipe.

### ⚠ EINE KENNUNG IST KEIN NAME — und ein Rezept ohne Kategorie hatte kein Zuhause (Klaus 2026-09-16)

Zwei Befunde aus einem Durchgang, beide von derselben Sorte: **die Auskunft war
da, nur nicht dort, wo jemand hinsieht.**

**1 · `AFCKT, was ist das?`** Aus einem Import der Schwester-App kamen Kennungen
wie `afckt`, `mock`, `bowle`, `smooth` — und die Ordner-Liste zeigte sie **roh**
an. Der Reiter war da (das war die Reparatur vom Vortag), aber niemand weiß, was
`afckt` sein soll.

⚠ **UND DIE NAMEN LAGEN SCHON IN DER APP.** Die Spore kündigt seit jeher
*„Alkfr. Cocktails, Mocktails, Bowlen, Smoothies & Shakes"* als Gast-Kategorien
an (`guestCategories` in `sbkim/sbkim-init.js`) — eine Liste von **Namen ohne
Kennungen**. Sie half der Oberfläche deshalb nichts. *Zwei Listen derselben
Sache, und die eine kennt die andere nicht.*

**`KAT_FAMILIE`** ist jetzt das Wörterbuch: Kennung → Symbol + Name in 8
Sprachen, **aus den CATS-Blöcken der drei Apps abgeleitet, nicht abgetippt**.
18 Kennungen. Ein eigener Name (`CATS_EIGEN`) gewinnt weiterhin über alles.

⚠ **Eine unbekannte Kennung wird NICHT erfunden.** Steht sie nicht im
Wörterbuch, bleibt sie sichtbar wie sie ist und trägt die Marke `unbekannt`.
*Einen Namen zu raten wäre schlimmer als eine Kennung zu zeigen.*

**2 · Die Sushi, die nur die Suche fand.** Klaus: *„gebe ich oben im Suchfeld
Sushi ein, taucht plötzlich Sushi auf … Sushi taucht immer nicht auf."* Gemessen
im Code, nicht geraten:

| | Befund |
|---|---|
| `catsFremd()` | stieg bei **leerer** Kennung mit `continue` aus |
| die „Alle"-Ansicht | läuft über `catsAlle()` — zeichnete sie also auch nicht |
| der Reiter „Alle" | zählte `R.filter(r=>r.name&&!r.blank)`, also **alle** |

**Die Zahl versprach 52, gezeichnet wurden weniger.** Nicht der Import war
schuld — die Rezepte waren da, gespeichert und exportiert, nur ohne Zuhause.

⚠ **UND EIN ORDNER, DEN ES NICHT MEHR GIBT, IST AUCH KEIN ZUHAUSE.** Eine
Kennung `fld_…` wird übersprungen, weil Ordner ihren eigenen Weg haben — steht
der Ordner aber nicht mehr in `FD`, fällt das Rezept durch dieselbe Lücke.

Sie werden jetzt als **eigene Kategorie** geführt (`KAT_OHNE`, „Ohne
Kategorie"), nicht repariert: **welche Kategorie sie bekommen sollen,
entscheidet Klaus, nicht die App.** Der Reiter erscheint nur, wenn es ihn
braucht — ein Sammel-Reiter, der immer leer dasteht, wäre ein toter Knopf mit
Beschriftung.

### ⚠ Und die drei Apps standen dabei NICHT gleich da

Gemessen am 2026-09-16: **Mein Rezeptbuch trägt alle 18 Familien-Kennungen
selbst** (Essen *und* Getränke), Muttis Rezeptbuch nur die sieben
Essens-Kategorien. Klaus' `afckt`-Befund ist deshalb ein **Muttis**-Befund; in
Mein Rezeptbuch kommt aus dem Mixarium gar nichts als „fremd" an.

**Die Wächter sagen in jeder App, was DORT gilt** — in Mein Rezeptbuch steht als
benannte Grenze, dass das Wörterbuch hier nie feuert, und gemessen wird
stattdessen, dass die eigenen Kategorien die Familie abdecken. *Drei Apps
dieselbe Zusicherung behaupten zu lassen wäre in einer davon eine Lüge.*

### ⚠ ZWEI STELLEN ZÄHLTEN DIESELBE SACHE VERSCHIEDEN (Klaus 2026-09-16)

Klaus mit Bild: *„Sushi steht in den Ordnern mit null Rezepten, obwohl
mindestens sechs drin sind. Oben in der Kategorie-Leiste in dem oberen Bereich
bei Rezepte steht Sushi mit sechs."*

**Beide Zahlen waren richtig gerechnet — sie rechneten nur aus verschiedenen
Quellen:**

| | fragte | Sushi |
|---|---|---|
| Kategorie-Leiste (`renderCatNav`) | `katVonRezept(r)` | **6** |
| Ordner-Baum (`renderFolders`) | das **rohe** Feld `r.cat` | **0** |

⚠ **DAS IST DER PREIS EINER HALBEN UMSTELLUNG.** Am Vortag ist `katVonRezept`
an **drei** Anzeige-Stellen eingesetzt worden (Reiter-Zahl, „Alle", Einzel-
Kategorie) — der Ordner-Baum blieb absichtlich unangetastet, weil er „nur
anzeigt". *Eine Kennung, die an einer Stelle gedeutet und an der anderen roh
gelesen wird, ist zwei verschiedene Kennungen.* Dieselbe Lücke traf auch
**„Ohne Kategorie"**: der Reiter zählte zwei, der Ordner-Eintrag null.

⚠ **UND EINE ZEILE TIEFER DASSELBE NOCH EINMAL.** Die Ordner-Gruppe zählte
`r.folder===…`, die Ordner-Pille `r.folder ODER r.cat==='fld_…'`. Ein Rezept,
das nur über `r.cat` in einem Ordner liegt, fiel im Baum heraus. Zwei Zeilen
untereinander, zwei Wahrheiten.

**Umgestellt sind jetzt alle Zähl- und Zeichen-Stellen**, die eine Kategorie
meinen — Ordner-Baum, Ordner-Zähler im Reiter-Abzeichen, und in Mein Rezeptbuch
zusätzlich die Gruppen des KI-Buchs und die Lieblingsrezept-Auswahl.

⚠ **DER WÄCHTER MISST DIE ÜBEREINSTIMMUNG, NICHT EINE ZAHL.** „Der Ordner zeigt
6" wäre blind, sobald sich die Leiste bewegt. Gemessen wird Gruppe für Gruppe,
dass **beide Ansichten dieselbe Zahl nennen** — plus die Gegenrichtung, dass
überhaupt eine mitgebrachte Kategorie mit Inhalt dabei ist (sonst wären alle
Zahlen 0 und stimmten trivial überein).

⚠ **BENANNTE GRENZE (nur im Mixarium):** die Leiste zählt mit `alcAllowed`.
Steht der Alkohol-Filter an, zeigt sie mit **Absicht** weniger als der Ordner —
das ist keine Abweichung, sondern die Zusicherung dieses Filters. Die Probe
schaltet ihn deshalb vor der Messung ausdrücklich aus.

### Geprüft

```bash
node tests/smoke_kategorien.mjs        # 34 grün · 0 ROT (echter Browser)
bash tests/gegenprobe_kategorien.sh    # 16 gefangen · 0 durchgerutscht · 0 falsch · 0 tot
```

⚠ **Die Gegenprobe läuft in einer WEGWERF-KOPIE**, nicht im echten Baum — eine
liegengebliebene Sabotage sieht danach wie ein Baufehler aus.

⚠ **UND MEIN ERSTER GEGENPROBE-LAUF LOG ÜBER SICH SELBST.** Er prüfte die
Ausgangslage mit `grep -q "0 ROT"` — und **„10 ROT" enthält „0 ROT"**. Zwei
Fälle standen als „nicht gefangen" da, obwohl beide sauber zuschlugen.
Dieselbe Familie wie `.gitignore` statt `.git`: ein Name, der das Ende eines
anderen ist. Gemessen wird jetzt die ganze Schlusszeile.

### ⚠ Und eine ZAHL in `smoke_sbkim_beschreibung.mjs` war seit demselben Tag falsch

Der Wächter „die gespeicherte Spore überschreibt den Vorschlag NICHT mehr von
selbst" verlangte **genau ein** `ta.value =` im Lade-Pfad. Seit Stufe 5c
(2026-09-15) hängen an der Herkunfts-Zeile **zwei Knöpfe**, beide setzen
`ta.value` — auf **Klick**. Der Block enthielt damit drei Zuweisungen, und die
Probe wurde **ROT, ohne dass eine Zusicherung gefallen wäre.**

Gemessen wird jetzt die Zusicherung: der Lade-Pfad **ohne** die Klick-Handler
darf `ta.value` nicht unbedingt setzen. **Eine Zahl in einer Prüfung ist kein
Vertrag** — geschärft, nicht gelockert, und mit eigener Gegenprobe belegt.

---

## 🏷️ NACHGEZOGEN AUS MEIN REZEPTBUCH (2026-09-16)

Klaus: *„jetzt Muttis Rezeptbuch und Mixarium nachziehen."* Was dort an einem
Tag entstanden ist, steht seitdem auch hier. **Die Befunde sind dort gemacht
worden** — hier stehen nur die Stellen, an denen sich diese App unterscheidet.

### ⚠ Zuerst ein echter Fund IN DIESER APP: `badge()` stieg in Zeile zwei aus

Die gestrige, nie geprüfte Arbeit hat beim ersten Lauf einen **älteren**
Fehler ans Licht gebracht:

```js
// vorher: if(!b)return;b.style.display=f?'block':'none';b.textContent=f;
const f=MS.filter(…).length,b=document.getElementById('menuBadge');
if(b){b.style.display=f?'block':'none';b.textContent=f;}
```

**`menuBadge` gibt es in dieser App nicht** (gemessen: `null`) — also stieg
`badge()` in seiner zweiten Zeile aus, und das Ordner- wie das Rezept-Abzeichen
wurden **nie gesetzt**. Gemessen: `fldCats 0 + fldFolders 1 = 1`, angezeigt
wurde `"0"`. *Ein Ausstieg nimmt alles mit, was dahinter steht* — Kimhubs
Lehre vom `if (!$("#live")) return;`, an einer anderen Tür. Ein Platzhalter,
kein Ausstieg.

### ⚠ EIN ORDNER, DEN ES NICHT GIBT, IST KEIN ORDNER

Zeigt `r.folder` auf eine Kennung, die in `FD` nicht steht, fällt das Getränk
aus **jeder** Kategorie-Gruppe (die fragt `!r.folder`), und einen
Ordner-Eintrag gibt es auch nicht. Klaus nannte das in Mein Rezeptbuch *„ein
unsichtbarer Ordner"*.

`ordnerVonRezept(r)` ist das Gegenstück zu `katVonRezept` am **anderen Feld**.
Eingesetzt an den **drei** Stellen, die „liegt es in einem Ordner?" fragen —
Ordner-Baum, `imOrdner`-Zahl und `fldCats` in `badge()`.

⚠ **UND DAS ABZEICHEN WAR DABEI BLIND.** Der vorhandene Wächter misst
„Leiste = Baum" und fragt das Abzeichen bei einem **toten** Ordner gar nicht.
Gefangen hat es die Gegenprobe in Muttis Rezeptbuch; der Wächter steht hier
seitdem genauso.

### Der Schlüssel-Sammler — und was er HIER gefunden hat

`T(k)` gibt bei einem fehlenden Schlüssel den **Schlüssel** heraus, also immer
etwas Wahres; ein `T('x')||'Rückfall'` dahinter kann nie greifen. Der Sammler
liest jeden `T('…')`-Aufruf aus dem Quelltext und besteht darauf, dass er in
`LANGS.de` steht.

**Gemessen: 196 benutzte Schlüssel, alle vorhanden — hier war nichts offen.**
In Muttis Rezeptbuch fand derselbe Sammler beim ersten Lauf `hAddLbl`.
*Drei Apps dieselbe Zusicherung behaupten zu lassen wäre in einer davon eine
Lüge*, deshalb steht in jeder App die Zahl, die dort gemessen wurde.

### Eine Kennung kommt genau einmal vor · Kennung sichtbar

`catsAlle()` hängte `CATS` und `catsFremd()` aneinander, **ohne zu prüfen, ob
eine Kennung schon dabei war**. Zwei Einträge mit derselben Kennung sind für
die App **eine** Kategorie — ein Tipp markierte folgerichtig beide Pillen. Der
Riegel sitzt jetzt an der **Quelle**.

Der Umbenennen-Dialog zeigt neben jedem Namen die Kennung **mit ihrer
Zeichenzahl** (`"ckt" ·3`); ohne die Zahl sehen `"ckt"` und `"ckt "` gleich aus.

⚠ **UND DIE GEGENRICHTUNG DAZU WAR SELBST BLIND — eine Zahl statt einer
Liste.** Der Wächter „ohne Duplikat geht keine Kategorie verloren" verglich
`catsAlle().length` mit der Zahl der festen Kategorien. Das misst nichts: die
Liste trägt außer den festen auch die mitgebrachten und „Ohne Kategorie", ist
also groß genug, selbst wenn eine feste fehlt. Gemessen wird jetzt
**namentlich**, welche feste Kennung verschwunden ist. *Eine Zahl in einer
Prüfung ist kein Vertrag.*

⚠ **Und die zugehörige Sabotage traf zuerst die VORBEDINGUNG.** Sie faltete
alle Kategorien auf ihren ersten Buchstaben zusammen; die Probe starb damit
schon im ersten Abschnitt an einem fremden Reiter, und der Fall meldete sich
als „rot aus falschem Grund" — **rot war es beides Mal, nur trug die rote
Zeile den falschen Namen.** Weggenommen wird jetzt genau **eine** feste
Kategorie.

⚠ **UND BASH LIEST EIN SKRIPT STÜCKWEISE — die Gegenprobe-Datei darf während
ihres eigenen Laufs nicht angefasst werden.** Am 2026-09-16 habe ich einen
Fall repariert, während der Lauf noch lief; er quittierte mit
`line 192: n: command not found` und meldete danach Fälle als „rot aus
falschem Grund", die tadellos waren. **Die Wegwerf-Kopie schützt den Baum,
nicht das Skript:** `bash tests/gegenprobe_kategorien.sh` liest die Datei im
**echten** Depot, auch wenn der Lauf danach in die Kopie wechselt. Derselbe
Fehler wie „nicht am Arbeitsbaum arbeiten, während die Gegenprobe läuft", nur
an der einen Datei, die man dafür für sicher hält. Der Lauf war als Messung
wertlos und wurde verworfen statt gezählt.

### Kategorien löschen, zusammenlegen, neu anlegen

📂 **Ordner** → **✎ Kategorien umbenennen** → 🗑 bzw. **＋ Neue Kategorie**.
Löschen fragt **immer** nach dem Ziel; die Antworten sind **drei**:

| Wahl | was mit `r.cat` geschieht |
|---|---|
| eine andere Kategorie | trägt deren Kennung |
| **ausdrücklich ohne** (`''`) | leer — landet sichtbar unter „Ohne Kategorie" |
| **es war nichts zu verschieben** (`null`) | gar nichts, die Kategorie war leer |

⚠ **Speicher-Schlüssel nach dem Schema `mx<thema>9m`:** `mxcatsneu9m` und
`mxcatsaus9m`, passend zu `mxcats9m`.

⚠ **Eine feste Kategorie verschwindet über `CATS_AUS`, und nur solange sie
leer ist.** Kommt wieder ein Getränk hinein, ist der Reiter von selbst zurück.

### 🏷️ Kategorie zuordnen aus der Getränke-Zeile

Das **🏷️** steht links neben dem Papierkorb: alle Kategorien (die aktuelle mit
✓), darunter abgesetzt **„ohne Kategorie"** und **＋ Neue Kategorie**.
**Gesetzt wird NUR `r.cat`** — der Ordner bleibt stehen, ein
`fld_…`-Altbestand wird ersetzt.

⚠ **DAS AUSWAHL-FENSTER MACHTE SICH IN MEIN REZEPTBUCH SELBST WIEDER ZU.**
＋ Neue Kategorie tauscht den Inhalt; danach sucht der „Tipp daneben"-Riegel
den geklickten Knopf **darin**. Repariert wird die Ursache:

```js
if(!document.contains(e.target))return;   // gerade ersetzt ≠ Tipp nach draußen
```

⚠ **UND EINE PROBE, DIE SYNCHRON KLICKT, IST DAFÜR BLIND** — der Riegel hängt
an einem `setTimeout(…,0)`. **Ein Finger ist langsamer als ein Skript.**

⚠ **BENANNTE GRENZE (nur hier):** die Reiter-Leiste zählt mit `alcAllowed`.
Steht der Alkohol-Filter an, zeigt sie mit **Absicht** weniger als der Bestand
— die Probe schaltet ihn vor der Messung ausdrücklich aus, sonst verglichen
„Leiste" und „echt" zwei verschiedene Fragen.

### Geprüft

Zuletzt gemessen (2026-09-16, nach dem Nachziehen): **116 grün · 0 ROT**
(196 Schlüssel geprüft).

```bash
node tests/smoke_kategorien.mjs           # echter Browser
NUR_ANKER=1 bash tests/gegenprobe_kategorien.sh   # tote Anker in Sekunden
bash tests/gegenprobe_kategorien.sh       # Wegwerf-Kopie
```

⚠ **Anders als in den Rezeptbüchern liegt hier KEIN Bau-Schritt dazwischen** —
`index.html` ist das byte-identische Spiegelbild der QC-Datei.

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

---

## 🏷️ Gerätename · netzweite Regeln

Der Gerätename gehört **ins Verbinden-Panel**, hineingehängt vom app-eigenen Glue
— **nie** in eine byte-kopierte Panel-Datei. Jedes Feld trägt
`data-sbkim-geraetename`; der Name geht **nur** an Anzeige und Anmeldung, **nie** an
`generateOwnSpore`. Er ist ein Hinweis, kein Vertrauens-Beweis: immer mit der Kennung
zusammen anzeigen.

Diese und die übrigen netzweiten Regeln — Selbst-Merge-Freibrief, frisch von
`origin/main`, Ton, kein PII, Ehrlichkeit — stehen seit 2026-08-22 **einmal** in
**[`Sage-Protokol/docs/NETZWEIT.md`](https://github.com/lausiklauskn-png/Sage-Protokol/blob/main/docs/NETZWEIT.md)** statt wortgleich in bis zu
20 Repos. Verträge: **[`INTERFACES.md`](https://github.com/lausiklauskn-png/Sage-Protokol/blob/main/docs/INTERFACES.md)** · die Fallen beim
Abzweigen und Veröffentlichen: **[`LEHREN.md`](https://github.com/lausiklauskn-png/Sage-Protokol/blob/main/docs/LEHREN.md)** · alte Fassung dieser
Datei: [`docs/archiv/CLAUDE-2026-08-22.md`](docs/archiv/CLAUDE-2026-08-22.md).
