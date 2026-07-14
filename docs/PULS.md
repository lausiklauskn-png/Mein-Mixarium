# PULS — Mein-Mixarium (SBKIM-Endknoten)

**Stand:** 2026-07-14 · **App-Version:** v9.5 · **nodeId:** `B7Fke9CYTR1BrC3xOXzEY5q9RuRH8xxHPUuqRHV3utA`

Kurzer, ehrlicher Live-Stand des Knotens. Detail-Protokolle: `docs/sessions/`.

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
| Sage-Protokol | ✔ VALID | **0.8060** | **verified-match** | quittiert 20 (synchron) · führt uns (ack 1) ✔ **beidseitig** |
| SB-KIMTool-Point | ✔ VALID | **0.767273** | verified-spore | quittiert **34** · NEU 2026-07-14: Point v0.2, cos < 0.80 → verified-spore (war 0.8030) — Werkzeug-Hub ≠ Getränke |
| Jasons-Tresor | ✔ VALID | **0.7884** | verified-spore | quittiert 11 · führt uns (mailbox), ack offen — **ehrlich kein Match** (< 0.80) |
| Mein-Tresor | ✔ VALID | **0.7884** | verified-spore | quittiert 14 · führt uns (ack 1) — **ehrlich kein Match** (< 0.80) |

→ **2/5 verbunden** (verified-match: Rezeptbuch, Sage — Stand 2026-07-14). **SB-KIMTool-Point** ist nach
seiner v0.2-Neu-Signatur auf **0.767273 < 0.80** gefallen → jetzt `verified-spore` (Identität ✔ VALID).
Die zwei Tresore liegen ehrlich unter 0.80
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
