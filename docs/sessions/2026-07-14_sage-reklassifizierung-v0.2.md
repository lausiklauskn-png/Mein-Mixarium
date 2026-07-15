# BRIEF — Mein-Mixarium: Sage-Reklassifizierung (v0.2), Netz-Form-Entscheid, eigene v0.2-Spore

## 0. Pflichtlektüre (in dieser Reihenfolge)
1. `CLAUDE.md` (index.html == QC_Mixarium_*.html **byte-identisch**, md5-Drift-Guard).
2. `docs/PULS.md` — Block „2026-07-14 (Folge)".
3. Dieser Brief.
4. `sbkim/sage_inbox.verify.md` + `sbkim/SIGNAL.json` (seq 12, ack: Sage 46, Point 34, Jasons 14, Tresor 17, Rezeptbuch 10).

## 1. Stand (was in dieser Sitzung geschah)
- **§11.6-Briefkasten-Runde:** 5 Nachbar-`SIGNAL.json` gelesen, 5/5 Sporen headless **✔ VALID**.
  ack: **Sage 43→46, Jasons 11→14, Tresor 14→17, Rezeptbuch 5→10** (Point 34 synchron). Jasons/Tresor/
  Rezeptbuch nur eigene Bauten (Nostr/Modul 23/Impressum), Sporen unverändert (v0.1).
- **Sage reziprok neu eingestuft → `verified-spore`:** Sage v0.2 (SIGNAL seq 46, nodeId `nysOZE3V…`
  unverändert, VALID, 11 snippetVectors). Cosinus unser `domainVector` ⟷ Sages **v0.2**-Vektor =
  **0.766963 < 0.80** (war 0.806030/verified-match gegen v0.1). Gleiches Muster wie Point (0.767273).
  Keine Adress-Wand → `sage_inbox.json` byte-1:1 auf v0.2 aktualisiert. `verify.md` + `AUSTAUSCH-Sage.md`
  (reziproke Bitte) + `SIGNAL.json` seq 12 + PULS nachgezogen.
- **Messhelfer-Honesty-Fix:** `sbkim/messung-netz-zugehoerigkeit.html` — Selbsttest-Text sagte fälschlich
  „Sage 0.806030", `VEC_SAGE` rechnete aber 0.766963 → korrigiert (beide < 0.80).
- **Draft-PR #135** (bewusst **kein** Selbst-Merge — Hub-Reklassifizierung + offene Netz-Form-Frage,
  Klaus schaut vorher drauf). md5-Drift-Guard grün, Smoke 8/14/7 grün.
- **Verbund jetzt: 1/5 verified-match** (nur Rezeptbuch 0.9544) + 4 verified-spore (Sage 0.766963,
  Point 0.767273, Jasons/Tresor 0.7884).

## 2. Ziel der Folge-Sitzung (alles Klaus-Browser oder Klaus-Entscheid)
(a) **Netz-Form-Entscheid** umsetzen (siehe §5): reine Themen-Cosinus-Wahrheit belassen (Sage/Point
    ehrlich verified-spore) **oder** eine **Zugehörigkeits-Achse** für den Hub einführen (Konzept-Bau).
    Danach ggf. PR #135 mergen (oder anpassen).
(b) **Kontroll-Versuch** im Browser messen: `sbkim/messung-netz-zugehoerigkeit.html` → „Messen".
    Selbst-Test jetzt: ohne Zusatz ≈ Toolpoint 0.767273 / Sage 0.766963 (beide < 0.80). Ergebnis → Klaus.
(c) **Eigene Spore auf v0.2** (Live-Neu-Signatur im Browser, Siegel ✍, nodeId unverändert, privater
    Schlüssel nur bei Klaus). Vor Commit alle behaltenen Peer-Matches headless prüfen (`verify_foreign_spore.mjs`).

## 3. Datenverträge
Keine neuen. Spore v0.2 (9 Pflichtfelder + optional `snippetVectors` ≤20, je `vec` 384-dim). nodeId bleibt.
Schwelle Andock 0.80 (Modul 05, unberührt — snippetVectors/Cosinus sind reine Anzeige/Verwandt-Messung).

## 4. Akzeptanzkriterien
- Netz-Form-Entscheid dokumentiert + Board konsistent (PULS + SIGNAL + `*_inbox.verify.md`).
- Kontroll-Versuch dokumentiert (beide Werte) → Klaus-Entscheid, ob der Zusatzsatz rein soll.
- Falls eigene v0.2: `spore.json` live neu signiert, Akte nachgezogen, **md5-Drift-Guard grün**, 5/5 VALID.
- Alle behaltenen Matches ≥ 0.80 headless verifiziert.

## 5. Offene Fragen an Klaus (WICHTIG)
- **Netz-Form:** Hub Sage über **Zugehörigkeits-Achse** verbunden lassen (unabhängig vom Thema) —
  oder ehrlich beim Themen-Cosinus bleiben (dann Sage/Point = verified-spore, wie jetzt)?
- Zusatz „Teil des Netzes" dauerhaft in die eigene Beschreibung (je nach Kontroll-Versuch)?
- Firmen-PDF-Tool: pro-Dokument-Vektor + KI-Richter-Nachbrenner — wann spec'en?

## 6. Abschluss-Befehl (Pflicht am Sitzungsende)
1. `docs/PULS.md` fortschreiben. 2. Neuen Brief anlegen (inkl. Pflichtlektüre + diesem Abschluss-Befehl).
3. Neuen Brief als Codeblock im Chat. 4. Commit + Push, Draft-PR; Selbst-Merge nach Freibrief **nur** bei
   headless grün **und** ohne echten Richtungszweifel. 5. Briefkasten §11.6: `SIGNAL.json` pflegen
   (seq +1), Quittungen an Peers. **Freibrief gilt** (siehe CLAUDE.md).

## 7. ERLEDIGT (Folge-Sitzung 2026-07-15)
- **§5 Netz-Form — geklärt (Klaus 2026-07-15 via `AskUserQuestion` + Nachfrage):** Prinzip bleibt
  **ehrlicher Themen-Cosinus** (nichts grün-gerechnet, keine künstliche Board-Achse). **Klaus' Weg**
  (auf Nachfrage „Ein Teil des SBKIM Knotennetzes"): die Netz-Zugehörigkeit **ehrlich in die eigene
  Spore-Selbstbeschreibung (v0.2)** aufnehmen — Satz „… Teil des SBKIM-Knotennetzes rund um
  Sage-Protokoll und SB-KIMTool-Point." — und im **Browser messen** (Kontroll-Versuch), ob der Cosinus
  zu den Hubs dadurch **ehrlich ≥ 0.80** steigt (dann `verified-match`, sonst `verified-spore`). Das ist
  **kein** Grün-Rechnen: der Satz ist eine wahre Aussage (gültige Spore + Andock = echte Mitgliedschaft),
  der Cosinus wird *danach* ehrlich gemessen. Mein-Rezeptbuch maß am selben Tag unabhängig dasselbe
  Grund-Ergebnis (SIGNAL seq 11: Sage 0.792393, Point 0.796054 — beide < 0.80 gegen ihre jetzige Spore).
- **§2(a) umgesetzt:** die Sage-v0.2-Reklassifizierung (vorher Draft-PR #135, Branch
  `claude/mixarium-point-v0.2-3m1mcy`) wurde auf den Sitzungs-Branch `claude/sage-reclassification-v0.2-lcbp44`
  gebracht, um den Entscheid + die neue Rezeptbuch-seq-11-Quittung ergänzt, und gemergt. Draft-PR #135
  wird als **abgelöst** geschlossen (Inhalt vollständig in diesem PR).
- **Neu quittiert:** Mein-Rezeptbuch **seq 11** (spiegelt unsere Reklassifizierung, führt uns bei ack 11)
  → `ack["Mein-Rezeptbuch"]` **10→11**. Spore unverändert v0.1, Match hält **0.954426**.
- **Verifiziert (headless, echt):** `sage_inbox.json` byte-1:1 mit Sages Live-`raw/main`-v0.2-Spore,
  5/5 Nachbar-Sporen ✔ VALID, Cosinus unabhängig nachgerechnet (Sage 0.766963, Rezeptbuch 0.954426),
  md5-Drift-Guard (index==QC) grün.
- **§2(b)+(c) bleiben Klaus-Browser** (Kontroll-Versuch jetzt nur informativ; eigene v0.2-Live-Signatur
  braucht den privaten Schlüssel). **§5 Firmen-PDF-Tool** = eigene Spec-Sitzung, wenn Klaus es aufruft.
