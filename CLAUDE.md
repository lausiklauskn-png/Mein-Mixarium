# Projektregeln für Claude – Mein Mixarium

---

## ⚠️ PFLICHT-CHECKLISTE NACH JEDER ÄNDERUNG

Claude muss nach **jeder** Änderung an der QC-Datei folgende Punkte ausgeben und den Benutzer explizit darauf hinweisen:

```
✅ 1. QC-Datei geändert:   QC_Mixarium_*.html   ← erledigt
✅ 2. index.html:          Neu gebaut (cp QC → index.html) ← erledigt (Claude darf bauen)
```

**Claude darf eine Aufgabe NICHT als erledigt melden, ohne diese Checkliste anzuzeigen.**

---

## Projektübersicht

### Dieses Repo: `lausiklauskn-png/Mein-Mixarium`
- **App-Name:** Mein Mixarium
- **Aktuelle Version:** v1.0
- **Lokaler Pfad:** `/home/user/Mein-Mixarium/`

---

## Dateistruktur

| Datei | Bedeutung |
|---|---|
| `index.html` | **Produktionsdatei** – Kopie der QC-Datei – NICHT direkt bearbeiten |
| `QC_Mixarium_20_04_26.html` | **Quelldatei (v1.0)** – saubere, lesbare Version – hier werden Änderungen gemacht |
| `manifest.json` | PWA-Manifest |

### Build-Workflow (index.html neu bauen)
Nach Änderungen an der QC-Datei einfach kopieren:
```bash
cp QC_Mixarium_20_04_26.html index.html
```
Kein Build-Skript nötig — Mein Mixarium hat keinen _CR-Schutzblock.

---

## Übersetzungssystem
- `LANGS`-Objekt im JS (ab ca. Zeile 2324 in index.html)
- Funktion `T(k)` für alle UI-Texte
- 8 Sprachen: de, en, ru, zh, es, fr, it, pt
- Variable `CL` = aktuelle Sprache (aus localStorage `mxlang9m`)

---

## Workflow-Regeln

### Entwicklung
1. Änderungen **immer** in der QC-Datei (`QC_Mixarium_*.html`) vornehmen
2. Nach Änderungen: `cp QC_Mixarium_*.html index.html` ausführen → erzeugt neue `index.html`
3. Commit-Nachrichten auf **Deutsch**

### "Hochladen"-Befehl
Wenn der Benutzer **"Hochladen"** schreibt:
1. Alle lokalen Änderungen committen
2. Direkt auf `main` pushen: `git push origin main`
3. Bestätigung ausgeben – kein PR, kein Merge nötig

### Branch-Konvention
- Feature-Branches werden automatisch angelegt (Format: `claude/<beschreibung>-<id>`)
- Immer auf dem zugewiesenen Branch arbeiten (steht oben in der Session-Konfiguration)

---

## Icon-Aktualisierungen: Pflicht-Verifikation

Nach **jeder** Icon-Änderung vor dem Commit **datenbasiert** prüfen – nicht nur die `<link>`-Tags:

```python
# Alle alten Base64-PNGs aus der Referenzdatei extrahieren
import re
with open('alte_referenz.html', 'r') as f:
    alte_b64s = set(re.findall(r'data:image/png;base64,([A-Za-z0-9+/]+=*)', f.read()))

# Prüfen: Kein einziger alter PNG-Block darf noch in der neuen Datei vorkommen
with open('QC_Mixarium_*.html', 'r') as f:
    neue_datei = f.read()

verbleibend = [b for b in alte_b64s if b in neue_datei]
assert not verbleibend, f"Noch {len(verbleibend)} alte Icons!"
print("✅ Alle Icons vollständig ersetzt")
```

**Alle 4 Orte** wo Icons stecken können:
1. `<link rel="icon">` – Tab-Favicon
2. `<link rel="apple-touch-icon">` – iOS-Icon
3. `var mj={...icons:[...]}` – **PWA-Install-Dialog** ← wird oft vergessen!
4. `shortcuts[].icons` im Manifest + `<img src="data:...">` im Seiteninhalt

**Regel:** Erst alle Base64-Blobs inventarisieren, dann ersetzen, dann verifizieren.

---

## ⚠️ PFLICHT-REGEL: Dateien umbenennen (atomisch)

**Wenn eine Datei umbenannt wird, MÜSSEN alle Querverweise in EINEM einzigen Commit aktualisiert werden.**

### Warum diese Regel existiert
Zwischen zwei Commits deployt GitHub Pages die Zwischenzustände. Wenn Datei A auf `mixarium-invite-v1.html` verlinkt und diese Datei dann in einem separaten Commit umbenannt wird, entsteht ein Deployment-Fenster mit 404-Fehlern – selbst wenn beide Commits nur Minuten auseinanderliegen.

### Pflicht-Checkliste bei jeder Umbenennung

**Vor dem Umbenennen** – alle Stellen finden, die auf die Datei verweisen:
```bash
grep -rn "alter-dateiname" --include="*.html" --include="*.js" --include="*.json" .
```

**In EINEM einzigen Commit** alles zusammen ändern:
1. Datei umbenennen (`git mv alter-name.html neuer-name.html`)
2. Alle `href="alter-name.html"` → `href="neuer-name.html"`
3. Alle `src="alter-name.html"` → `src="neuer-name.html"`
4. Alle `location.replace('...alter-name.html'...)` → neuer Name
5. Alle `window.open('...alter-name.html'...)` → neuer Name
6. Alle absoluten GitHub-Pages-URLs mit altem Namen → neue URLs
7. Alle Referenzen in `app-manifest.json`, `sw.js`, `app-sw.js`

**Verifizieren vor dem Commit:**
```bash
grep -rn "alter-dateiname" --include="*.html" --include="*.js" --include="*.json" .
# Ergebnis muss leer sein!
```

**Regel:** Niemals eine Datei umbenennen und die Referenzaktualisierung auf einen späteren Commit verschieben.

---

## ⚠️ REGEL: Übernahme von anderen Projekten – Pflicht-URL-Prüfung

Wenn Code von anderen Projekten übernommen wird, müssen alle fremden Namen und URLs **vollständig** ersetzt werden — sonst entstehen unsichtbare Zeitbomben.

**Nach jeder Übernahme diesen grep ausführen:**
```bash
grep -rn "rezeptbuch\|Rezeptbuch\|muttis\|Muttis\|mr-gift\|mr-invite" \
  --include="*.html" --include="*.js" --include="*.json" .
# Ergebnis muss leer sein!
```

**Regel:** Nie annehmen, dass "der Code schon passt" – immer mit grep verifizieren.

---

## ⚠️ REGEL: Eigenständige Seiten werden DIREKT bearbeitet

Die folgenden Dateien sind **eigenständige HTML-Seiten** – sie werden DIREKT bearbeitet (kein Build-Schritt):

| Datei | Typ |
|-------|-----|
| `impressum.html` | direkt bearbeiten + committen |

**Pflicht-Checkliste nach Änderungen an eigenständigen Seiten:**
```
✅ Datei direkt geändert
✅ Alle internen Links auf Korrektheit geprüft (keine fremden URLs)
✅ Icons inline als Base64 (keine externen Dateireferenzen)
```

---

## ⚠️ REGEL: Icons in eigenständigen Seiten müssen inline sein

Externe Icon-Referenzen (`href="icons/icon-book-blue.svg"`) in eigenständigen HTML-Seiten sind **verboten**. Wenn die Icon-Datei umbenannt oder verschoben wird, bricht das Icon lautlos.

**Pflicht:** Alle Icons in gift.html, gift2.html, invite-v5.html und USP-Seiten müssen als **inline Base64 data-URI** eingebettet sein:

```html
<!-- FALSCH – externe Referenz: -->
<link rel="icon" href="icons/icon-book-blue.svg">

<!-- RICHTIG – inline Base64: -->
<link rel="icon" type="image/svg+xml" href="data:image/svg+xml;base64,...">
```

**Verifizieren:**
```bash
grep -n 'rel="icon"' impressum.html
# Jede Zeile muss "data:" enthalten – kein "href="icons/" erlaubt
```

---

## ⚠️ REGEL: Icon-Änderungen erfordern einen einzigen vollständigen Durchgang

Fehler aus der Praxis: Icon in gift.html geändert → ein Commit → danach Nachbesserung nötig (`ac02360 Icon-Fix`), weil die anderen Seiten vergessen wurden.

**Vor dem ersten Icon-Commit** alle betroffenen Stellen inventarisieren:
```bash
grep -rn 'rel="icon"\|rel="apple-touch-icon"\|icons:\[' \
  impressum.html manifest.json
```

**Alle diese Stellen in EINEM Commit** aktualisieren – kein "ich mache die anderen Seiten später".

---

## Häufige Aufgaben

### Neue Funktion hinzufügen
1. In `QC_Mixarium_*.html` implementieren
2. `cp QC_Mixarium_*.html index.html` ausführen
3. Hochladen

### Swipe / Touch / Drag & Drop
- Swipe-Handler: IIFE ab `// ── SWIPE-NAVIGATION ──` (kurz vor `boot()`)
- Touch-Drag: `setupTouchDrag()` und `setupWkTouchDrag()`
- Drag-Selektoren: `.drag-hdl`, `.ing-drag-hdl`, `.fld-drag-hdl`, `.wk-drag-hdl`

### Sprache hinzufügen
- Im `LANGS`-Objekt neuen Sprachblock ergänzen
- `CL`-Variable und `T(k)`-Funktion funktionieren automatisch

---

## Menüleiste (Bottom Nav) – Aktuelle Implementierung

### Schriftgrößen (Stand nach PR #3)
| Element | CSS-Klasse | Wert |
|---|---|---|
| Nav-Icon | `.bn-ico` | `font-size:1.15rem` |
| Nav-Label (Basis) | `.bn-lbl` | `font-size:.65rem` |
| Nav-Label (Typografie-Override) | `.bn-lbl` (Ende `<style>`) | `font-size:var(--text-sm)` = 13px |

### navTo() – Schritt-zurück-Verhalten
**Alle Nav-Buttons** rufen `navTo(n)` statt `showSc(n)` auf.

`navTo(n)` schließt zuerst offene fov-Overlays (Import, Export, API-Key, Sprache, Hilfe, Manual), **bevor** zum Ziel-Tab navigiert wird. Ist ein Overlay offen → wird nur geschlossen (ein Schritt zurück). Ist keins offen → normaler `showSc(n)`-Aufruf.

```javascript
// navTo() steht direkt nach showSc() in der QC-Datei
function navTo(n){ ... }
```

**Regel:** Neue Nav-Buttons immer mit `navTo()` statt `showSc()` anlegen.

---

## Mein-Menü-Overlay (`.mv-*`) – Design-Parität mit Import-Overlay (`.fov-*`)

Das `#mv`-Overlay (Mein Menü / Wochenplan) soll **optisch identisch** mit dem `#importOv`-Overlay sein.

### Aktuelle CSS-Werte (Stand nach PR #3)
| Element | `.mv-*` | entspricht `.fov-*` |
|---|---|---|
| Header | `.mv-hdr` | `.fov-hdr` – `cursor:pointer`, klickbar zum Schließen |
| Zurück-Pfeil | `.mv-back` | `color:rgba(255,255,255,.56)` |
| Titel | `.mv-title` | `font-size:.98rem; color:#fff` |
| Druck-Button | `.mv-print-btn` | Icon-Stil: `font-size:1.15rem; color:rgba(255,255,255,.72)` |
| Tab-Leiste | `.mv-tabs` | `.fov-tabs` |
| Tab-Schrift | `.mvtab` | `font-size:.72rem; padding:9px 4px; color:rgba(255,255,255,.80)` |
| Tab aktiv | `.mvtab.on` | `color:#fff; border-bottom-color:var(--gold)` |

### Spektral-Theme
`.mv-hdr` und `.mv-tabs` haben denselben Regenbogen-Verlauf wie `.fov-hdr`/`.fov-tabs`.

**Regel:** Bei Änderungen an `.fov-hdr`/`.fovtab` immer prüfen ob `.mv-hdr`/`.mvtab` ebenfalls angepasst werden müssen.

---

## CSS-Debugging Regeln

### Neue CSS-Einheiten vermeiden
- Kein `svh`, `dvh`, `svw`, `dvw` — nicht universell unterstützt
- Stattdessen: `vh`, `vw`, `px`
- Ungültige CSS-Werte werden still ignoriert (kein Fehler im Browser!)

### CSS greift nicht → Eskalationsreihenfolge
1. `!important` hinzufügen
2. Spezifität erhöhen (ID statt Klasse)
3. JavaScript: `element.style.setProperty('height', wert, 'important')`
→ Nicht mehrere CSS-Varianten stapeln bevor Benutzer bestätigt hat

### Commits: Erst bestätigen lassen
Eine Variante pushen → auf Feedback warten → nächste. Nicht mehrere Fixes in Folge ohne Rückmeldung.
