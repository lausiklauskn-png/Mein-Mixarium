# Übergabeprotokoll — Re-Migration auf Modul 17 Floating-Widget (Mein-Mixarium)

**Datum:** 2026-05-26
**Endknoten:** Mein-Mixarium
**Branch:** `claude/re-migration-widget-AB2RJ`
**Sitzungs-Rolle:** Endknoten-Re-Migration auf Modul 17 Floating-Widget
(Pipeline-Schritt 5d aus Sage-Protokol CLAUDE.md). Zweite der zwei
Endknoten-Sitzungen.
**Vorlage:** Sage-Protokol `docs/components/09_einbau_pwa.md § Schritt 12`
**Vorherige Sitzung (Mein-Rezeptbuch):** PR `lausiklauskn-png/Mein-Rezeptbuch#245`
gemerged 2026-05-26.

---

## Sage-Protokol-Quelle

| Artefakt | Sage-Protokol-Pfad | Übernommener Commit | Datum |
|---|---|---|---|
| Modul 17 (Widget) | `src/modules/17_floating_widget.js` | `b2cf42ca0708a2f3cc12d0f344a16d28539a765d` | 2026-05-25 |

Verifikation 2026-05-26 vor Übernahme: Sage-Protokol `main` HEAD lieferte
für `src/modules/17_floating_widget.js` SHA-256
`d878919d92f84d3cfc1da81755dd9c626de97d6bb2937641afdc9d30bd747951`,
identisch zu Commit `b2cf42c`. Keine zwischenzeitlichen Pflegen am Modul 17.

---

## Eingriffe

### A. Modul-Datei kopiert
- **Neu:** `sbkim/17_floating_widget.js` (63 338 B, 1694 Zeilen,
  SHA-256 wie oben)

### B. `index.html` + `QC_Mixarium_20_04_26.html` angepasst (byte-identisch)
- Vor `sbkim-init.js` neuer `<script src="sbkim/17_floating_widget.js" defer>`-
  Tag eingefügt (zwischen `01_storage.js` und `02_spore.js`).
- Kommentar-Block über den SBKIM-Script-Tags aktualisiert (Hinweis auf
  Karte 09 § Schritt 12 + Commit-Hash).
- Modul 15 + 16 Script-Tags + DOM-Elemente + CSS gibt es seit der
  Rückbau-Sitzung 2026-05-25 nicht mehr → kein Entfernen nötig.
- md5sum nach dem Eingriff: `c97962415e81003e0f3b43624a8b5c5f` (beide
  Dateien identisch — CLAUDE.md-Pflicht ✓).

### C. `sbkim/sbkim-init.js` angepasst
- Neuer `SbkimWidget.init({allowedOrigins, repoUrl})`-Aufruf
  **nach** `SbkimStorage.init({dbSuffix:"mixarium"})` und **vor**
  `SbkimAnastomose.init()` (Position „nach 01, vor 02" wie in der
  Rezeptbuch-Sitzung festgelegt).
- `allowedOrigins`: `["https://lausiklauskn-png.github.io"]`
- `repoUrl`: `https://github.com/lausiklauskn-png/Mein-Mixarium`
- Fail-soft via `if (window.SbkimWidget)`-Guard (analog zu den anderen
  optionalen Modulen).
- Rückbau-Kommentar zu Modul 15 + 16 aktualisiert: Render-Schicht ist
  jetzt angedockt, Backends 15+16 folgen separat.

### D. Service-Worker-Cache-Bust
- `app-sw.js`: `SW_VERSION` von `mixarium-sw-v26` auf `mixarium-sw-v27`
  hochgezählt — sonst sehen installierte PWAs offline die alte
  `index.html` (ohne Widget-Script-Tag) aus dem v26-Precache.
- `sbkim-sw-v26.js` bleibt; `importScripts` unverändert.

---

## Zwei bekannte Befunde aus dem Rezeptbuch-Sichttest

Werden ohne Fix übernommen — beides ist Sage-Protokol-Pflege, kein
Endknoten-Eingriff:

1. **Doppel-Tooltips auf den rechten Pille-Slots** (FREMD / SIEGEL):
   Browser-`title`-Tooltip plus Custom-Tooltip aus Modul 17 erscheinen
   beide. Fix wird in der nächsten Sage-Protokol-Modul-17-Pflege geplant.
2. **LEBT-Slot bleibt grau**, weil derzeit kein Modul `sbkim:alive`
   dispatcht. Modul 02 (Spore) müsste den Event feuern; das ist eine
   additive Sage-Protokol-Pflege an Modul 02, keine Endknoten-Anpassung.

---

## Was diese Sitzung NICHT tut

- **KEIN** Re-Bau der Backends Modul 15 (Membran) + Modul 16 (Siegel) —
  die sind seit Rückbau 2026-05-25 (PR #54) aus, das Widget läuft trotzdem
  als Vier-Slot-Live-Status-Dashboard.
- **KEIN** Sage-Protokol-Eingriff.
- **KEIN** `PROTOCOL_VERSION` / `DB_VERSION` / `BACKUP_FORMAT_VERSION`-Bump.
- **KEIN** Modul-Code-Eingriff (nur Modul-17-Datei-Kopie).
- **KEINE** Spore-Re-Sign (Spore `B7Fke9CYTR1BrC3xOXzEY5q9RuRH8xxHPUuqRHV3utA`
  bleibt unangetastet).

---

## Sichttest (Klaus, DeX-Chrome Galaxy Tab S6)

Pflicht-Checkliste nach Hard-Reload + `git pull`:

1. [ ] Pille bottom-right sichtbar mit vier Slots (LEBT/VERKEHR/FREMD/SIEGEL).
2. [ ] LEBT pulsiert grün (sobald Modul 02 `sbkim:alive` feuert — siehe
       bekannter Befund 2, aktuell grau).
3. [ ] SIEGEL erscheint nicht, weil Modul 16 ausgebaut ist — Widget zeigt
       drei Slots stattdessen.
4. [ ] Klick auf FREMD-Slot ohne Modul-15-Modal: Widget fällt auf eigene
       Modal-Variante zurück oder bleibt stumm.
5. [ ] Drag funktioniert; X-Knopf schließt; Minimize-Knopf schrumpft auf
       Restslot (LEBT-Fallback ohne SIEGEL).
6. [ ] `localStorage` persistiert Position + Sichtbarkeit + Minimize-Zustand.
7. [ ] Keine alten Navleisten-Lampen mehr (war seit Rückbau schon weg).
8. [ ] DevTools-Konsole: keine Errors; `SBKIM-Widget grün …` Selbstcheck-
       Zeile vorhanden.
