# Übergabeprotokoll — Modul-18 Match-`embedQueryBatch`-Fix — Mein-Mixarium

**Datum:** 2026-05-28
**Endknoten:** Mein-Mixarium
**Branch:** `claude/mm-modul-18-einbau-VolZa`
**Sitzungs-Rolle:** Bau-Sitzung Modul-18-Einbau (Sub a Vorab) inkl.
Match-`embedQueryBatch`-Fix. Folge-Sync zu PR #61 (Modul-18-Einbau).

**Auslöser:** Der mit PR #61 eingebaute Modul-18-Stand (1448 Zeilen,
MD5 `5cda9e64…`) rief in Schritt 3 des Andock-Wizards
`matchMod.matchDimensions(ownCap, ownNeeds, foreignCap, foreignNeeds)`
direkt mit den **Text-Blobs (Strings)** auf. Modul 04 erwartet dort
vier `Float32Array(384)` → Wizard warf
`InvalidVectorError: queryVec muss Float32Array sein, war: String`.
Sage hat den Wurzel-Fix in **PR #199** auf `main` gemergt
(Modul 18 jetzt 1504 Zeilen): Schritt 3 embeddet die nicht-`null`
Text-Blobs zuerst über Modul 03 `embedQueryBatch` zu Vektoren und
ruft erst danach `matchDimensions` mit den Float32Arrays auf.

---

## Pflicht-Verifikation (vor dem Code)

| Prüfung | Ergebnis |
|---|---|
| Branch ahead of main | ❌ 0 Commits (PR #61 + #62 bereits gemergt) → Start sauber von `main` |
| Modul 18 im Repo (Vorstand) | ⚠️ 1448 Zeilen, MD5 `5cda9e64…` — **buggy** (String statt Float32Array) |
| Script-Tag `18_tool_pwa.js` | ✅ bereits vorhanden (PR #61), Zeile 12926 — nach Modul 16/17, vor `sbkim-init.js` |
| `SbkimToolPwa.init({…})`-Block | ✅ bereits vorhanden (PR #61), NACH `SbkimSiegel.init` |
| `build.py` vorhanden | ❌ keiner (CLAUDE.md: kein Build-Schritt) |
| QC vs index byte-identisch (vorher) | ✅ `f2dc4720b1994793d4fc21aaf9bad892` |

---

## Sage-Protokol-Quelle

| Artefakt | Sage-Protokol-Pfad | MD5 (neu) | Zeilen |
|---|---|---|---|
| Modul 18 (Tool-PWA) | `src/modules/18_tool_pwa.js` (main, inkl. PR #199) | `4ca699e5c3de455e69beb2d5d9ebae67` | 1504 |

`curl` von `raw.githubusercontent.com/.../main/src/modules/18_tool_pwa.js`
→ 1:1 nach `sbkim/18_tool_pwa.js` kopiert. MD5 nach Kopie identisch mit
Quelle verifiziert. Modul-Code **nicht verändert**.

Diff gegen den alten Stand betrifft ausschließlich den Schritt-3-Match-
Block (~Zeile 965–1052): Einführung von `embedQueryBatch`-Vorlauf,
Null-Safe-Mapping der vier Spalten, `handleMatchResult`/`handleMatchError`
und Wegfall des künstlichen Timeouts. Selbstcheck-Zeile + Konstanten
unangetastet.

---

## Der eine Eingriff dieser Sitzung

1. **`sbkim/18_tool_pwa.js`** — 1:1 ersetzt durch Sage-`main`-Stand
   (1504 Zeilen, inkl. PR #199 Match-`embedQueryBatch`-Fix).

Keine weiteren Code-Eingriffe nötig:
- Script-Tag `<script src="sbkim/18_tool_pwa.js"></script>` lag bereits
  korrekt (nach Modul 17, vor `sbkim-init.js`).
- `SbkimToolPwa.init({…})` lag bereits korrekt NACH `SbkimSiegel.init`.
  Die in `sbkim-init.js` hartcodierten Werte sind **byte-identisch** mit
  `sbkim/spore.json` (`domainKeywords`, `stammCategories`,
  `guestCategories`) verifiziert; `domain` = `mixarium`,
  `externalHubUrl` weggelassen → entspricht der Brief-Vorgabe
  (`ownSpore.* || []`) funktional 1:1. Daher unverändert gelassen
  (Mini-Eingriff, kein Risiko-Refactor).

Abhängigkeiten geprüft: Modul 18 nutzt `global.SbkimEmbedding`
(03 — `embedQueryBatch → Promise<Float32Array[]>`), `global.SbkimMatch`
(04 — `matchDimensions(Float32Array×4)`), `SbkimSpore` (02),
`SbkimAnastomose` (05) — alle als Script-Tags geladen.

---

## Eingehaltene Tabus

- Kein Eingriff in Modul-Code (18 ist 1:1 Sage-Kopie).
- Kein Eingriff in Module 15/16/17/Storage/Service-Worker.
- Kein `PROTOCOL_VERSION`/`DB_VERSION`/`BACKUP_FORMAT_VERSION`-Bump.
- Kein `ZERTIFIKAT_ASPEKTE`-Eintrag.
- Kein automatischer Andock-Trigger (Modul 18 nur geladen + bereit).
- Modul 18 kommt NACH `SbkimSiegel.init`.
- Domain korrekt „mixarium".
- `index.html` ↔ QC unangetastet, weiter byte-identisch.

---

## Sichttest für Klaus (offen)

1. Hard-Reload im Mixarium-Tab. Falls die alte (buggy) Datei noch aus
   dem Service-Worker-Cache kommt → SW-Cache abräumen, dann erneut.
2. Konsolen-Selbstcheck (Eruda):
   `MODUL 18 TOOL-PWA bereit, Sub (a) Vorab, Funktionen: init/openAndockTab/close/isOpen`
   sowie `SBKIM-ToolPwa grün — Modul 18 Andock-Wizard bereit.`
3. Bronze-SIEGEL-Klick → Bronze-Modal → `[Andocken]` → Wizard öffnet
   (kein Fallback).
4. Schritt 1 URL `https://lausiklauskn-png.github.io/Mein-Rezeptbuch/`
   → Schritt 2 Spore grün → Schritt 3 Match:
   - Erster Aufruf lädt Embedding-Modell (~30 MB, dauert).
   - Danach `Match: NN % über/unter Schwelle` + Drei-Bars.
   - **DARF NICHT** `queryVec muss Float32Array sein, war: String`
     werfen.

---

## Querverweise

- Vorsitzung: MM PR #61 (Modul-18-Einbau, 1448-Zeilen-Stand) +
  PR #62 (16_siegel.js-Drei-Pfad-Sync).
- Sage Match-Fix: PR #199 (Modul-18 Schritt-3 `embedQueryBatch`-Vorlauf).
- Modul 03 `embedQueryBatch` / Modul 04 `matchDimensions`-Kontrakt.
