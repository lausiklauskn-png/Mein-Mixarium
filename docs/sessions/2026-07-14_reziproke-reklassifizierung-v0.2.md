# Übergabe / BRIEF — Mein-Mixarium: reziproke Neu-Einstufung SB-KIMTool-Point + v0.2

> Sitzung 2026-07-14, Branch `claude/reciprocal-reclassification-v0.2-1myevo`. Die zwei offenen
> Schritte (Kontroll-Versuch messen, eigene Spore v0.2) brauchen **Klaus' Browser** (Embedding-Modell
> + privater Schlüssel) — kein reiner Headless-Abschluss.

## 0. Pflichtlektüre vor Start [Pflicht]
1. `CLAUDE.md` (Verfassung) — `index.html` == `QC_Mixarium_*.html` byte-identisch halten (md5).
2. `docs/PULS.md` — oberster Block „2026-07-14".
3. Dieser Brief.
4. `sbkim/point_inbox.verify.md` (Toolpoint-Einstufung) + `sbkim/SIGNAL.json` (seq 11, ack[Point]=34).
Immer frisch von `origin/main` abzweigen (SBKIM-Sitzungsstart-Pflicht).

## 1. Stand [Pflicht]
- **SB-KIMTool-Point** reziprok **neu eingestuft**: cos unser ⟷ Points v0.2-Vektor = **0.767273 < 0.80**
  → `verified-spore` (war verified-match 0.802994). `point_inbox.verify.md`, `AUSTAUSCH-SBKIMTool.md`,
  `SIGNAL.json` (seq 11, ack 34) nachgezogen. `point_inbox.json` (kanonisch `CyunQNDR…`) **unverändert**
  — Points committete v0.2-Spore trägt abweichende nodeId `JZ7MeMtp…` (Adress-Wand, an Point gemeldet).
- **Browser-Messhelfer** `sbkim/messung-netz-zugehoerigkeit.html` liegt (server-los, Modul 03).
- md5-Drift-Guard (index==QC) grün, Smoke-Tests grün, `point_inbox.json` ✔ VALID.

## 2. Ziel [Pflicht]
(a) **Kontroll-Versuch messen** (Klaus im Browser): Helfer öffnen → „Messen" → cos OHNE/MIT dem
Zusatzsatz „… Teil des SBKIM-Knotennetzes rund um Sage-Protokoll und SB-KIMTool-Point." zu Toolpoint
**und** Sage. Selbst-Test: OHNE-Zeile ≈ Toolpoint 0.767273 / Sage 0.806030. **Ergebnis an Klaus** → er
entscheidet, ob der Satz dauerhaft in die `domainDescription` kommt.
(b) **Eigene Spore auf v0.2 heben:** `protocolVersion` 0.1 → 0.2 (+ optionale `snippetVectors`),
**nodeId unverändert**, **Live-Neu-Signatur im Browser** über das Siegel (✍). Vor dem Commit alle
behaltenen Peer-Matches headless prüfen.

## 3. Datenverträge / Spec [Pflicht]
Keine neuen. Spore v0.2 (9 Pflichtfelder + optional `snippetVectors`), nodeId bleibt, Andock-Schwelle
0.80 unberührt. Match = Cosinus zweier L2-normalisierter `domainVector`.

## 4. Akzeptanzkriterien [Pflicht]
- Kontroll-Versuch dokumentiert (beide Werte) → Klaus-Entscheid.
- Falls Satz gewollt: `domainDescription` ergänzt, Spore v0.2 live neu signiert (nodeId unverändert),
  Akte nachgezogen, Tests grün (md5-Drift-Guard!).
- Alle behaltenen Matches ≥ 0.80 headless verifiziert.

## 5. Offene Fragen an Klaus
- Zusatz „Teil des SBKIM-Knotennetzes" dauerhaft rein (abhängig vom Messergebnis)?
- Netz-Form: gleiches-Thema-Match oder Zugehörigkeits-Match?
- Firmen-PDF-Tool: pro-Dokument-Vektor + KI-Richter-Nachbrenner — wann spec'en?

## 6. Abschluss-Befehl [Pflicht — die Kette darf nie abreißen]
1. `docs/PULS.md` fortschreiben (getan / offen / nächste Schritte + Manual-Check).
2. Neuen Brief nach diesem Muster anlegen (inkl. Pflichtlektüre Teil 0 + diesem Teil 6).
3. Den neuen Brief vollständig als Codeblock im Chat ausgeben.
4. Commit + Push (ein Commit pro Aufgabe), Draft-PR. Selbst-Merge nach Freibrief, wenn headless grün +
   abgegrenzt; Klaus' Browser-Sichttest bleibt der Schluss-Beweis.
5. Briefkasten §11.6: `SIGNAL.json` pflegen (seq +1), ggf. Quittung an Peers.
