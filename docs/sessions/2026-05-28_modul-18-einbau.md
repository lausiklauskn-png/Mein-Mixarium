# Übergabeprotokoll — Modul-18-Einbau (Sub a Vorab) — Mein-Mixarium

**Datum:** 2026-05-28
**Endknoten:** Mein-Mixarium
**Branch:** `claude/mm-modul-18-einbau-Jxe39`
**Sitzungs-Rolle:** Bau-Sitzung Modul-18-Einbau (Sub a Vorab),
Pipeline-Phase A Schritt 5h.1-Folge. Schwester-Bau zu
Mein-Rezeptbuch PR #252 (gemergt 2026-05-28 14:49).

**Auslöser:** Modul 16 Sub (e) Bronze-Modal-`[Andocken]`-Knopf zeigte
in MM bislang den Fallback-Text „Modul 18 noch nicht verfügbar". Mit
Modul 18 im Repo schaltet der Klick produktiv auf den Andock-Wizard.

---

## Pflicht-Verifikation (vor dem Code)

| Prüfung | Ergebnis |
|---|---|
| Module 15/16/17 vorhanden | ✅ alle drei in `sbkim/` |
| `build.py` vorhanden | ❌ keiner (CLAUDE.md bestätigt: kein Build-Schritt) → HTML direkt + `index.html` 1:1 |
| QC vs index byte-identisch (vorher) | ✅ `27dc4af3…` |
| `16_siegel.js` Drei-Pfad-Stand (`threw=true`) | ⚠️ **NEIN** — noch Zwei-Pfad → Sync-Folgesitzung nötig (siehe unten) |

---

## Sage-Protokol-Quelle

| Artefakt | Sage-Protokol-Pfad | MD5 | Zeilen |
|---|---|---|---|
| Modul 18 (Tool-PWA) | `src/modules/18_tool_pwa.js` (main) | `5cda9e644d38842acff17ffab85dec1f` | 1448 |

1:1 nach `sbkim/18_tool_pwa.js` kopiert. MD5 nach Kopie identisch
verifiziert. Modul-Code **nicht verändert** (Selbstcheck-Zeile +
Konstanten unangetastet). Vorab-Sicherheits-Sichtung: kein `eval`/
`Function`/`document.cookie`, keine externen URLs außer
`lausiklauskn-png`, kein Zugriff auf App-localStorage-Keys.

Brief: `Sage-Protokol/docs/sessions/BRIEF_BAU_MR_MODUL_18.md`
(für MR geschrieben, analog auf MM angewandt — domain/endpoint/
repoUrl + spore.json-Werte angepasst).

---

## Drei Eingriffe

1. **`sbkim/18_tool_pwa.js`** — neue Datei (1:1 Sage-main-Kopie).
2. **HTML-Andocker (QC + index.html):** `<script src="sbkim/18_tool_pwa.js"></script>`
   nach `16_siegel.js`, vor `sbkim-init.js`. QC + index synchron,
   md5 = `f2dc4720b1994793d4fc21aaf9bad892`.
3. **`sbkim/sbkim-init.js`:** `await SbkimToolPwa.init({…})` NACH
   `SbkimSiegel.init`. Werte (MM-Domain):
   - `endpoint` = `https://lausiklauskn-png.github.io/Mein-Mixarium/`
   - `domain` = `mixarium`
   - `repoUrl` = `https://github.com/lausiklauskn-png/Mein-Mixarium`
   - `domainKeywords` / `stammCategories` / `guestCategories` aus
     `sbkim/spore.json` hartcodiert (Cocktails/Drinks-Domain).
   - `externalHubUrl` weggelassen (Default `null`).

Andocker-Reihenfolge unverändert:
`SbkimWidget → SbkimMembrane → SbkimSiegel → Modul 18 NEU`.

---

## Eingehaltene Tabus

- Kein Eingriff in Modul-Code (18 ist 1:1 Sage-Kopie).
- Kein `PROTOCOL_VERSION`/`DB_VERSION`/`BACKUP_FORMAT_VERSION`-Bump.
- Kein `ZERTIFIKAT_ASPEKTE`-Eintrag.
- Kein Eingriff in Module 15/16/17/Storage/Service-Worker.
- Kein automatischer Andock-Trigger (Modul 18 nur geladen + bereit).
- Domain korrekt „mixarium" (nicht „rezeptbuch").

---

## Sichttest für Klaus (offen)

1. Hard-Reload im Mixarium-Tab (Cache leeren).
2. Konsolen-Selbstcheck (Eruda):
   `MODUL 18 TOOL-PWA bereit, Sub (a) Vorab, Funktionen: init/openAndockTab/close/isOpen`
   sowie `SBKIM-ToolPwa grün — Modul 18 Andock-Wizard bereit.`
3. Bronze-SIEGEL-Klick im Floating-Widget → Modul-16-Bronze-Modal →
   `[Andocken]` → Modul-18-Andock-Wizard öffnet (statt Fallback-Text),
   Stepper-Schritt 1 (URL-Eingabe leer).
4. Optional Cross-Knoten: URL `https://lausiklauskn-png.github.io/Mein-Rezeptbuch/`
   eingeben → Weiter → Spore-Fetch sollte live durchgehen.

---

## Offener Folgeauftrag — `16_siegel.js`-Sync

MM's `sbkim/16_siegel.js` ist noch der **Zwei-Pfad-Stand** (kein
`threw=true`-Branch). Sage PR #198 (Drei-Pfad-Wurzel-Fix, gemergt
2026-05-28) ist noch nicht übernommen. Ohne diesen Sync tritt der
Doppel-Modal-Bug (MR 2026-05-28 16:52) auch in MM auf.

→ **Nach Merge dieses PRs** eine eigene Sync-Sitzung
„Sync 16_siegel.js auf Sage-PR #198" anstoßen (Muster: MR PR #253).

---

## Querverweise

- MR-Schwester-Bau: Mein-Rezeptbuch PR #252 (Modul-18-Einbau,
  gemergt 2026-05-28 14:49) + PR #253 (16_siegel.js-Drei-Pfad-Sync).
- Sage Modul 18 Spec/Bau: PR #190 + #193 + #194 (Sichttest-Nachzug).
- Sage Modul 16 Drei-Pfad: PR #198 (Wurzel-Fix, gemergt 2026-05-28).
