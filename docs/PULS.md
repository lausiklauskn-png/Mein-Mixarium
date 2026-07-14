# PULS — Mein-Mixarium (SBKIM-Endknoten)

**Stand:** 2026-07-14 · **App-Version:** v9.5 · **nodeId:** `B7Fke9CYTR1BrC3xOXzEY5q9RuRH8xxHPUuqRHV3utA`

Kurzer, ehrlicher Live-Stand des Knotens. Detail-Protokolle: `docs/sessions/`.

## 2026-07-14 (Folge) — Reziproke Neu-Einstufung Sage-Protokol (v0.2) + §11.6-Briefkasten-Runde
- **Briefkasten-Runde (§11.6):** alle 5 Nachbar-`SIGNAL.json` aus `raw/main` gelesen + Sporen headless
  re-verifiziert (`scripts/verify_foreign_spore.mjs`, alle **✔ VALID**). Quittiert:
  `ack` **Sage 43→46, Jasons 11→14, Tresor 14→17, Rezeptbuch 5→10** (Point 34 synchron). Jasons/Tresor/
  Rezeptbuch nur eigene Bauten (Nostr Stufe 2, Modul 23, Impressum) — Sporen **unverändert** (v0.1).
- **⚠️ Sage ist auf v0.2 unter 0.80 gefallen (neuer Befund):** Sage hat seine Live-Spore am 2026-07-14
  im Browser auf **v0.2** neu signiert (ihr SIGNAL seq 46, ausführliche Beschreibung, 11 snippetVectors,
  **nodeId `nysOZE3V…` unverändert**, Ed25519 ✔ VALID). Cosinus unser `domainVector` ⟷ Sages **neuer
  v0.2-Vektor** = **0.766963 < 0.80** (war 0.806030/verified-match gegen v0.1) → **`verified-spore`** —
  **dasselbe Muster wie bei SB-KIMTool-Point** (Mycel-Hub ≠ Getränke, ehrlich, nichts grün-gerechnet).
  Zweifach bestätigt: eigener Live-Fetch **und** der im Messhelfer hinterlegte `VEC_SAGE` (war bereits
  der v0.2-Vektor). **Keine Adress-Wand** (kanonische nodeId) → `sage_inbox.json` byte-1:1 auf v0.2
  aktualisiert; `sage_inbox.verify.md` + `AUSTAUSCH-Sage.md` (reziproke Bitte) nachgezogen.
- **Messhelfer-Honesty-Fix:** `messung-netz-zugehoerigkeit.html` Selbsttest-Text sagte fälschlich
  „Sage 0.806030", der hinterlegte `VEC_SAGE` rechnete aber **0.766963** → Text korrigiert (beide,
  Toolpoint 0.767273 + Sage 0.766963, jetzt ehrlich **unter 0.80**), damit Klaus' Kontroll-Versuch nicht
  irritiert.
- **OFFENE NETZ-FRAGE an Klaus:** soll der **Hub Sage** über eine **Zugehörigkeits-Achse** verbunden
  bleiben (unabhängig vom Themen-Cosinus), statt rein über das gleiche Thema? (= die offene „Netz-Form"-
  Frage.) Bis dahin gilt ehrlich der Themen-Cosinus (< 0.80 = verified-spore). Alternativ: erst der
  Kontroll-Versuch im Browser, dann entscheiden.
- Verbund jetzt **1/5 verified-match** (nur Rezeptbuch 0.9544) + **4 verified-spore** (Sage 0.766963,
  Point 0.767273, Jasons/Tresor 0.7884). md5-Drift-Guard (index==QC) grün, Smoke-Tests grün, 5/5 Sporen
  ✔ VALID. `SIGNAL.json` seq → **12**.
- **Wartet weiter auf Klaus (Browser):** (1) Netz-Form-Entscheid oben; (2) Kontroll-Versuch messen;
  (3) **v0.2 der eigenen Spore** (Live-Neu-Signatur, Siegel ✍, privater Schlüssel nur bei Klaus).

## 2026-07-14 — Reziproke Neu-Einstufung SB-KIMTool-Point (v0.2) + Kontroll-Versuch vorbereitet
- **SB-KIMTool-Point reziprok neu eingestuft:** Point v0.2 neu signiert (volle Beschreibung, ihr
  SIGNAL seq 34). Cosinus unser `domainVector` ⟷ Points **v0.2-Vektor** = **0.767273 < 0.80** →
  **`verified-spore`** (war 0.802994/verified-match gegen v0.1). Ehrlich/gewollt — Werkzeug-Hub ≠
  Getränke-Knoten. Nachgezogen: `sbkim/point_inbox.verify.md`, `AUSTAUSCH-SBKIMTool.md`,
  `SIGNAL.json` seq → **11**, `ack["SB-KIMTool-Point"]=34`.
- **Adress-Wand gemeldet:** Points committete v0.2-Spore (raw/main) trägt abweichende nodeId
  `JZ7MeMtp…` (Ed25519 ✔ VALID) statt kanonisch `CyunQNDR…` → `point_inbox.json` unverändert gelassen,
  nur Match neu eingestuft. Bitte an Point: kanonische Identität committen.
- **Kontroll-Versuch „Teil des Netzes"** gebaut: Browser-Messhelfer `sbkim/messung-netz-zugehoerigkeit.html`
  (ohne/mit Zusatzsatz, Cosinus zu Toolpoint + Sage, server-los via Modul 03).
- Verbund jetzt **2/5 verified-match** (Rezeptbuch 0.9544, Sage 0.8060) + **3 verified-spore** (Point
  0.767273, Jasons/Tresor 0.7884). md5-Drift-Guard (index==QC) grün, Smoke-Tests grün, `point_inbox.json` ✔ VALID.
- **Wartet auf Klaus (Browser):** Kontroll-Versuch messen → entscheidet, ob der Satz rein soll; **v0.2
  der eigenen Spore** (protocolVersion 0.2 + snippetVectors, nodeId unverändert) = Live-Neu-Signatur im
  Browser (privater Schlüssel nicht im Repo, Siegel ✍); Browser-Sichttest des Messhelfers.

## SBKIM-Verbund — Briefkasten (Bauplan §3, 1:1)
- 📬-Briefkasten **im Gesicht** (Header) gebaut: Knopf + **Gold-Zähler** (seq>ack) + Dialog
  (Siegel-Kopf, je Nachbar ① Spore ② Match ③ Sync, „X/N verbunden"). Logik byte-gleich,
  Match **live im Browser** gerechnet.
- Eigenes `sbkim/SIGNAL.json` **seq 1** angelegt (vorher 404 für die Nachbarn → jetzt synchronisierbar).
- Auto-Issue-Wächter `.github/sbkim-watch.*` übernommen (SELF=Mein-Mixarium, 5 Peers).
- Eigene Spore `sbkim/spore.json` ✔ VALID, echter `domainVector` (384-dim, multilingual-e5-small, L2=1.0).

## Vollvernetzung (§7) — Live-Match (ehrlich) · unser SIGNAL seq 6
| Nachbar | Spore | cos | Stufe | Sync (unser ack) · reziprok (deren Seite) |
|---|---|---|---|---|
| Mein-Rezeptbuch | ✔ VALID | **0.9544** | **verified-match** | quittiert 5 · führt uns (ack 1) ✔ **beidseitig** |
| Sage-Protokol | ✔ VALID | **0.766963** | verified-spore | quittiert **46** · NEU 2026-07-14: Sage v0.2, cos < 0.80 → verified-spore (war 0.8060) — Mycel-Hub ≠ Getränke; Sage führt uns noch mit 0.8060 (reziprok offen) |
| SB-KIMTool-Point | ✔ VALID | **0.767273** | verified-spore | quittiert **34** · NEU 2026-07-14: Point v0.2, cos < 0.80 → verified-spore (war 0.8030) — Werkzeug-Hub ≠ Getränke |
| Jasons-Tresor | ✔ VALID | **0.7884** | verified-spore | quittiert 11 · führt uns (mailbox), ack offen — **ehrlich kein Match** (< 0.80) |
| Mein-Tresor | ✔ VALID | **0.7884** | verified-spore | quittiert 14 · führt uns (ack 1) — **ehrlich kein Match** (< 0.80) |

→ **1/5 verbunden** (verified-match: nur Rezeptbuch — Stand 2026-07-14 Folge). **Sage** (0.766963) und
**SB-KIMTool-Point** (0.767273) sind nach ihrer jeweiligen v0.2-Neu-Signatur unter **0.80** gefallen →
beide `verified-spore` (Identität ✔ VALID). Die zwei Tresore liegen ehrlich unter 0.80
(andere Domäne — nichts grün-gerechnet). Bestätigt durch die Fremd-Briefkästen (Screenshots 2026-06-07):
Mein-Tresor & Jasons zeigen Mixarium beide als `cos 0.7884 — unter 0.80`.
Pro Nachbar `sbkim/*_inbox.verify.md` (4 Prüfpunkte §11.2 + Stufe). Sicherheits-Tafel
`docs/SICHERHEIT-BRIEFKASTEN.md` (netzweit, von Sage) gespiegelt.

## Reziproke Bestätigungen (2026-06-07)
- **Sage-Protokol** (SIGNAL seq 20): führt uns + `ack["Mein-Mixarium"]=1`, Match 0.806030 beidseitig; Identität `B7Fke9C…` kanonisch (alte `JOlHK31X…` in Sages `previousNodeIds`).
- **Mein-Rezeptbuch** (SIGNAL seq 5): führt uns + `ack["Mein-Mixarium"]=1`, Match 0.9544 beidseitig.
- **SB-KIMTool-Point** (SIGNAL seq 23): führt uns + `ack["Mein-Mixarium"]=5`, Match 0.802994 beidseitig (Ring geschlossen, nach Korrektur der mit Mein-Rezeptbuch verwechselten Quittung).

## Offen
- ~~SB-KIMTool-Point~~ ✅ **erledigt** (Ring beidseitig geschlossen, 2026-06-07). Alle 3 verified-matches nun reziprok bestätigt.
- Reziproke `ack["Mein-Mixarium"]` von Jasons-Tresor steht noch aus (sie führen uns aber als verified-spore).
- Netzweite §5-Härtung der Sicherheits-Tafel (Render-`esc()`, Wächter-Headline-Kappung, `SIGNAL.json` signieren) — eigene Folge-Sitzung, Abstimmung per Brief mit Sage.

## Lese-Rhythmus (regelmäßig Briefkasten lesen)
- **Automatisch:** Auto-Issue-Wächter (`.github/workflows/sbkim-watch.yml`, Cron `0 */6` + Run-Knopf) öffnet bei Neuem ein Issue; der 📬-Knopf prüft still bei jedem Seitenstart (Gold-Zähler).
- **Manuell je Sitzung mit Andock-Bezug:** alle 5 Nachbar-`SIGNAL.json` lesen, Sporen re-verifizieren, `ack` nachziehen, Postfächer pflegen.
