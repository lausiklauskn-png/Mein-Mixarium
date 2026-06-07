# Übergabeprotokoll — SBKIM-Briefkasten-Bau — Mein-Mixarium

**Datum:** 2026-06-07
**Endknoten:** Mein-Mixarium
**Branch:** `claude/sbkim-mailbox-build-V9Lfn`
**Sitzungs-Rolle:** Empfänger-Bau nach Rundbrief von **Mein-Tresor**
(`docs/sessions/BRIEF_briefkasten-bauplan.md`, seq 13). Ziel: Live-Verbund-
Briefkasten 1:1 übernehmen — alle Knoten sehen gleich aus + laufen synchron.

**Leitplanke (CLAUDE.md):** kein Build-Schritt; `QC_Mixarium_*.html` und
`index.html` byte-identisch. Additiv, Krypto/Logik byte-gleich, nur CONFIG angepasst.

---

## Pflicht-Verifikation (vor dem Code)

| Prüfung | Ergebnis |
|---|---|
| QC vs index byte-identisch (vorher) | ✅ `f2dc4720…` |
| Eigene Spore vorhanden + gültig | ✅ `sbkim/spore.json` ✔ VALID, `domainVector` 384-dim, L2 = 1.000000, id `B7Fke9C…` |
| 5 Nachbar-Sporen geholt + gegengeprüft | ✅ alle **✔ VALID** (`scripts/verify_foreign_spore.mjs`) |
| Nachbar-SIGNALs lesbar | ✅ Sage 18, SB-KIMTool-Point 20, Jasons-Tresor 10, Mein-Tresor 13 · ⚠️ Mein-Rezeptbuch **kein SIGNAL.json (404)** |

---

## Gebaute Teile (Bauplan §2 — alle fünf zusammen)

1. **Knopf** — 📬 in der `top-hdr` (`#sbkim-mailbox-btn`) + **Gold-Zähler**
   (`#sbkim-mailbox-badge`, `#C9A961`, zeigt `seq>ack`), still beim Laden gesetzt.
2. **Dialog** — `#sbkim-mailbox-dialog` mit Siegel-Kopf, je Nachbar drei Ebenen, „X/N verbunden".
3. **CONFIG** — `window.SBKIM_MAILBOX`, `self="Mein-Mixarium"`, eigene SIGNAL/Spore-Pfade,
   5 Nachbarn (Vollvernetzung §7, sich selbst weggelassen). **Einziger angepasster Block.**
4. **Logik** — `sbkimMailboxFetch` / `sbkimCosine` / `sbkimMailboxCheck` **byte-gleich** aus §3.
   Match wird **live im Browser** gerechnet (kein gespeicherter Wert).
5. **Daten-Dateien** — `sbkim/SIGNAL.json` (seq 1, ack), `sbkim/spore.json` (echter Vektor),
   pro Nachbar `sbkim/<name>_inbox.json` (byte-1:1-Kopie der geprüften Spore).

Zusätzlich: **Siegel-Wappen** `assets/sbkim-siegel-wappen.svg` (1:1) und der
**Auto-Issue-Wächter** `.github/sbkim-watch.mjs` + `.github/workflows/sbkim-watch.yml`
(`SELF="Mein-Mixarium"`, 5 Peers, `issues:write`, Cron `0 */6` + Run-Knopf).

---

## Ehrlicher Live-Match (Cosinus eigener ⟷ Nachbar-Spore, im Browser nachgerechnet)

| Nachbar | cos | Bewertung |
|---|---|---|
| Mein-Rezeptbuch | **0.9544** | ✔ verified-match |
| Sage-Protokol | **0.8060** | ✔ verified-match |
| SB-KIMTool-Point | **0.8030** | ✔ verified-match |
| Jasons-Tresor | **0.7884** | ehrlich **unter 0.80** |
| Mein-Tresor | **0.7884** | ehrlich **unter 0.80** (= der von Mein-Tresor §7 genannte Wert) |

→ **3/5 verbunden.** Mixarium hat eine andere Domäne (Getränke) als die Tresore —
nichts grün-gerechnet. `sbkim/SIGNAL.json` quittiert: Sage 18, Point 20, Jasons 10, Tresor 13.

---

## Tests

- `node scripts/verify_foreign_spore.mjs sbkim/*_inbox.json sbkim/spore.json` → **alle ✔ VALID**.
- `node .github/sbkim-watch.mjs` (lokal) → „nichts Neues" + Notiz Mein-Rezeptbuch 404 (korrekt).
- Inline-Briefkasten-Skript: `node --check` **SYNTAX OK**.
- Integrations-Simulation der `sbkimMailboxCheck`-Logik gegen lokale Daten → **3/5 verbunden, alles synchron**.
- `md5sum index.html QC_Mixarium_20_04_26.html` → identisch (`f227b877…`).
- Mein-Mixarium hat **kein npm-Test-Harness** (kein `package.json`); der getestete Kern bleibt
  unberührt (rein additiv).

---

## Offen / Nächster Schritt

- Reziproke Registrierung abwarten: Nachbarn lesen unser frisches `SIGNAL.json` (seq 1) und
  quittieren `ack["Mein-Mixarium"]`.
- Mein-Rezeptbuch um ein `sbkim/SIGNAL.json` bitten (siehe `AUSTAUSCH-Rezeptbuch.md`),
  dann läuft der Sync auch dorthin beidseitig.
