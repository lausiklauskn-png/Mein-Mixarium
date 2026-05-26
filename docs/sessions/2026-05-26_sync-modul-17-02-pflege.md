# Übergabeprotokoll — Sync Modul 17 + Modul 02 (Mein-Mixarium)

**Datum:** 2026-05-26
**Endknoten:** Mein-Mixarium
**Branch:** `claude/sync-modul-17-02-pflege-tooltips-heartbeat`
**Sitzungs-Rolle:** Mini-Pflege — Sync von Sage-Protokol Modul 17 + Modul 02
nach Sage-Protokol-Pflege-PR #173 (gemerged 2026-05-26, sha `99d017d`).

---

## Sage-Protokol-Quelle

| Artefakt | Sage-Protokol-Pfad | Übernommener Commit | Datum |
|---|---|---|---|
| Modul 17 (Widget) | `src/modules/17_floating_widget.js` | `99d017d7c4a84afc9843b9dc0cb11e010246d92b` | 2026-05-26 |
| Modul 02 (Spore) | `src/modules/02_spore.js` | `99d017d7c4a84afc9843b9dc0cb11e010246d92b` | 2026-05-26 |

Verifikation 2026-05-26: Sage-Protokol `main` HEAD = `99d017d7c4a84afc9843b9dc0cb11e010246d92b`.
- Neues Modul 17: SHA-256 `7d2e100affb7a3cc3559df13421af1f5355860f566cf8202236421c89eb04b1d`, 1778 Zeilen (vorher 1694, +84)
- Neues Modul 02: SHA-256 `5be1ae8e92807b8da802e4614374889fa6603c4a1ee510f96f4093fff65d15c0`, 1167 Zeilen (vorher 1124, +43)

---

## Behobene Befunde (aus Sage-Protokol-Pflege-PR #173)

1. **Doppel-Tooltips weg** — Modul 17 ersetzt `title`-Attribute auf den
   Slot-Buttons durch `aria-label`; Browser-`title`-Tooltip + Custom-
   Tooltip-Konflikt entfällt.
2. **Self-Heartbeat-Fallback** — Modul 02 feuert `sbkim:alive` jetzt
   auch ohne externe Trigger periodisch, damit der LEBT-Slot pulst.
3. **`dispatchAliveOnce` in `loadIdentity`** — bei aus-Cache geladener
   Identität wird `sbkim:alive` ebenfalls dispatched (nicht nur bei
   Neugenerierung). `dispatchAliveOnce`-Idempotenz schützt vor Doppel-
   Feuer.
4. **LEBT-Atmungs-Ring sichtbar** — `overflow:visible` + dickere
   Atmungs-Ring-Animation, kein Halbbogen-Clipping mehr.

---

## Eingriffe

- **`sbkim/17_floating_widget.js`** ersetzt durch `99d017d`-Stand.
- **`sbkim/02_spore.js`** ersetzt durch `99d017d`-Stand.
- **`index.html` + `QC_Mixarium_20_04_26.html`** byte-identisch (md5
  `9f11de14b5887fbf8a361f223319f204`): Kommentar-Block über den SBKIM-
  Script-Tags um den neuen Commit-Hash + die Pflege-Beschreibung
  erweitert.
- **`app-sw.js`:** `SW_VERSION` `mixarium-sw-v27` → `mixarium-sw-v28`
  (Cache-Bust, damit installierte PWAs die neuen `sbkim/`-Module
  bekommen, ohne dass `stale-while-revalidate` zuerst die alten Versionen
  ausliefert).

---

## Was diese Sitzung NICHT tut

- KEIN Sage-Protokol-Eingriff.
- KEIN Re-Bau der Backends Modul 15 + 16 (weiterhin ausgebaut seit PR #54).
- KEIN Modul-Code-Eingriff (nur 1:1-Kopie aus Sage-Protokol).
- KEIN `PROTOCOL_VERSION` / `DB_VERSION` / `BACKUP_FORMAT_VERSION`-Bump.

---

## Sichttest (Klaus, DeX-Chrome Galaxy Tab S6)

- [ ] Hard-Reload nach `git pull`.
- [ ] Pille bottom-right mit vier Slots; LEBT pulst grün mit sichtbarem
      Atmungs-Ring (kein Halbbogen).
- [ ] Longpress auf den rechten Slots → nur ein Tooltip.
- [ ] DevTools-Konsole sauber, keine Errors.
