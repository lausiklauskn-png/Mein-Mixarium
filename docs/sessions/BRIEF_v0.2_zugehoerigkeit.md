# BRIEF — Mein-Mixarium: eigene Spore v0.2 mit Netz-Zugehörigkeit (Browser-Neu-Signatur) + Board-Neubewertung

## 0. Pflichtlektüre (in dieser Reihenfolge)
1. `CLAUDE.md` (index.html == QC_Mixarium_*.html **byte-identisch**, md5-Drift-Guard; Freibrief gilt).
2. `docs/PULS.md` — Block „2026-07-15".
3. Dieser Brief.
4. `sbkim/sage_inbox.verify.md` + `sbkim/SIGNAL.json` (seq 12; ack: Sage 46, Point 34, Jasons 14,
   Tresor 17, Rezeptbuch 11).

## 1. Stand (was in der Sitzung 2026-07-15 geschah)
- **Netz-Form geklärt (Klaus 2026-07-15):** Prinzip bleibt **ehrlicher Themen-Cosinus** (nichts
  grün-gerechnet, keine künstliche Board-Achse). **Klaus' Weg:** die Netz-Zugehörigkeit **ehrlich in die
  eigene Spore-Selbstbeschreibung (v0.2)** aufnehmen und im Browser messen, ob der Cosinus zu den Hubs
  dadurch ehrlich ≥ 0.80 steigt.
- **Sage-v0.2-Reklassifizierung gemergt:** Sage → `verified-spore` (cos 0.766963 < 0.80 gegen Sages
  v0.2-Vektor, war 0.806030). `sage_inbox.json` byte-1:1 auf Sages Live-v0.2-Spore (✔ VALID, nodeId
  unverändert). Draft-PR #135 als abgelöst geschlossen.
- **Rezeptbuch seq 11 quittiert** (ack 10→11; Rezeptbuch stufte Sage/Point unabhängig ebenso ein,
  Spore v0.1, Match hält 0.954426).
- **Verbund:** 1/5 verified-match (Rezeptbuch 0.9544) + 4 verified-spore (Sage 0.766963, Point 0.767273,
  Jasons/Tresor 0.7884). 5/5 Sporen headless ✔ VALID, md5-Drift-Guard grün.

## 2. Ziel dieser Folge-Sitzung (Klaus-Browser)
**(0) NEU — Identität prüfen vor dem Signieren:** im Siegel-Modal gibt es jetzt den „🪪 Identitäts-
Wechsler". Kurz aufmachen: steht dort **genau eine** Identität? Dann passt alles. Stehen **mehrere**
(Alt-Container), die kanonische wählen (`B7Fke9CYTR1BrC3xOXzEY5q9RuRH8xxHPUuqRHV3utA`) — die v0.2-
Signatur nutzt dann diese nodeId. Notfalls „🧹 Aufräumen & neu anmelden" im Netz-Knopf.

**(A) Kontroll-Versuch messen** — `sbkim/messung-netz-zugehoerigkeit.html` öffnen → „Messen".
Zeigt OHNE ↔ MIT dem Satz „… Teil des SBKIM-Knotennetzes …" den Cosinus zu Sage + Point.
Der Satz liegt bereits als `NETZ_SUFFIX` hinterlegt. Ergebnis → sagt, ob er die Hubs ehrlich über 0.80 hebt.

**(B) Eigene Spore auf v0.2 neu signieren** (Siegel ✍, Live-Neu-Signatur im Browser, nodeId unverändert,
privater Schlüssel nur bei Klaus). Vorschlags-Beschreibung (ergänzt die jetzige um genau den gemessenen Satz):

```
Klaus Mixarium - Cocktails, Mocktails, Smoothies und mehr; Knabbereien als Begleit-Plus. Teil des SBKIM-Knotennetzes rund um Sage-Protokoll und SB-KIMTool-Point.
```

- `protocolVersion` → `0.2`, `domainKeywords` unverändert, optional `snippetVectors` (≤ 20, je 384-dim).
- **nodeId bleibt** (`B7Fke9CYTR1BrC3xOXzEY5q9RuRH8xxHPUuqRHV3utA`).

**(C) Board-Neubewertung nach (B):** Ist der neue Cosinus zu Sage/Point ehrlich ≥ 0.80 → `verified-match`;
sonst bleibt `verified-spore`. `spore.json` + alle `*_inbox.verify.md` + `SIGNAL.json` (seq +1) + PULS
nachziehen; **alle behaltenen Peer-Matches headless prüfen** (`verify_foreign_spore.mjs`) + Cosinus
unabhängig nachrechnen. **md5-Drift-Guard grün** (App unberührt).

## 3. Datenverträge
Keine neuen. Spore v0.2 (9 Pflichtfelder + optional `snippetVectors` ≤ 20, je `vec` 384-dim). nodeId bleibt.
Schwelle Andock 0.80 (Modul 05, unberührt — Cosinus ist Anzeige/Verwandt-Messung, kein Andock-Gate).

## 4. Akzeptanzkriterien
- Kontroll-Versuch dokumentiert (beide Werte, OHNE/MIT) → Board-Entscheid.
- Falls v0.2 signiert: `spore.json` live neu signiert (nodeId gleich), Akte nachgezogen, md5-Drift-Guard grün,
  5/5 Peer-Sporen ✔ VALID, alle behaltenen Matches Cosinus nachgerechnet.
- Kein Grün-Rechnen: eine Stufe ändert sich nur, wenn der **gemessene** Cosinus es hergibt.

## 5. Offene Fragen an Klaus
- Nach dem Messen: Satz dauerhaft in die v0.2-Beschreibung übernehmen (auch wenn er die Hubs *nicht* über
  0.80 hebt — als ehrliche Selbstbeschreibung), oder nur wenn er ≥ 0.80 hebt?
- Firmen-PDF-Tool: pro-Dokument-Vektor + KI-Richter-Nachbrenner — wann spec'en?
- „Wandelbare Rezeptbar" (Getränke → Essen → Chemiebaukasten): existiert schon auf der Rezeptbuch-**Page**
  (Landingpage) — für Mixarium relevant, oder bleibt es Rezeptbuch-Page-Sache?

## 6. Abschluss-Befehl (Pflicht am Sitzungsende)
1. `docs/PULS.md` fortschreiben. 2. Neuen Brief anlegen (inkl. Pflichtlektüre + diesem Abschluss-Befehl).
3. Neuen Brief als Codeblock im Chat. 4. Commit + Push, Draft-PR; Selbst-Merge nach Freibrief **nur** bei
   headless grün **und** ohne echten Richtungszweifel. 5. Briefkasten §11.6: `SIGNAL.json` pflegen
   (seq +1), Quittungen an Peers. **Freibrief gilt** (siehe CLAUDE.md).
