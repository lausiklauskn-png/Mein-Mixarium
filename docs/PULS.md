# PULS — Mein-Mixarium (SBKIM-Endknoten)

**Stand:** 2026-06-07 · **App-Version:** v9.5 · **nodeId:** `B7Fke9CYTR1BrC3xOXzEY5q9RuRH8xxHPUuqRHV3utA`

Kurzer, ehrlicher Live-Stand des Knotens. Detail-Protokolle: `docs/sessions/`.

## SBKIM-Verbund — Briefkasten (Bauplan §3, 1:1)
- 📬-Briefkasten **im Gesicht** (Header) gebaut: Knopf + **Gold-Zähler** (seq>ack) + Dialog
  (Siegel-Kopf, je Nachbar ① Spore ② Match ③ Sync, „X/N verbunden"). Logik byte-gleich,
  Match **live im Browser** gerechnet.
- Eigenes `sbkim/SIGNAL.json` **seq 1** angelegt (vorher 404 für die Nachbarn → jetzt synchronisierbar).
- Auto-Issue-Wächter `.github/sbkim-watch.*` übernommen (SELF=Mein-Mixarium, 5 Peers).
- Eigene Spore `sbkim/spore.json` ✔ VALID, echter `domainVector` (384-dim, multilingual-e5-small, L2=1.0).

## Vollvernetzung (§7) — Live-Match (ehrlich) · unser SIGNAL seq 4
| Nachbar | Spore | cos | Stufe | Sync (unser ack) · reziprok (deren Seite) |
|---|---|---|---|---|
| Mein-Rezeptbuch | ✔ VALID | **0.9544** | **verified-match** | quittiert 5 · führt uns (ack 1) ✔ **beidseitig** |
| Sage-Protokol | ✔ VALID | **0.8060** | **verified-match** | quittiert 20 (synchron) · führt uns (ack 1) ✔ **beidseitig** |
| SB-KIMTool-Point | ✔ VALID | **0.8030** | **verified-match** (unsere Seite) | quittiert 21 · ⏳ **führt uns noch NICHT** (nicht in Points peers/mailboxes/ack) |
| Jasons-Tresor | ✔ VALID | **0.7884** | verified-spore | quittiert 11 · führt uns (mailbox), ack offen — **ehrlich kein Match** (< 0.80) |
| Mein-Tresor | ✔ VALID | **0.7884** | verified-spore | quittiert 14 · führt uns (ack 1) — **ehrlich kein Match** (< 0.80) |

→ **3/5 verbunden** (verified-match: Rezeptbuch, Sage, Point). Die zwei Tresore liegen ehrlich unter 0.80
(andere Domäne — nichts grün-gerechnet). Bestätigt durch die Fremd-Briefkästen (Screenshots 2026-06-07):
Mein-Tresor & Jasons zeigen Mixarium beide als `cos 0.7884 — unter 0.80`.
Pro Nachbar `sbkim/*_inbox.verify.md` (4 Prüfpunkte §11.2 + Stufe). Sicherheits-Tafel
`docs/SICHERHEIT-BRIEFKASTEN.md` (netzweit, von Sage) gespiegelt.

## Reziproke Bestätigungen (2026-06-07)
- **Sage-Protokol** (SIGNAL seq 20): führt uns + `ack["Mein-Mixarium"]=1`, Match 0.806030 beidseitig; Identität `B7Fke9C…` kanonisch (alte `JOlHK31X…` in Sages `previousNodeIds`).
- **Mein-Rezeptbuch** (SIGNAL seq 5): führt uns + `ack["Mein-Mixarium"]=1`, Match 0.9544 beidseitig.

## Offen
- **SB-KIMTool-Point** — *der einzige echte offene Match*: bei uns verified-match (0.8030), aber Point führt Mein-Mixarium noch nicht (deren Peers = nur 4). Bitte um Aufnahme + verified-match-Bestätigung in `sbkim/AUSTAUSCH-SBKIMTool.md` (SIGNAL seq 4).
- Reziproke `ack["Mein-Mixarium"]` von Jasons-Tresor steht noch aus (sie führen uns aber als verified-spore).
- Netzweite §5-Härtung der Sicherheits-Tafel (Render-`esc()`, Wächter-Headline-Kappung, `SIGNAL.json` signieren) — eigene Folge-Sitzung, Abstimmung per Brief mit Sage.

## Lese-Rhythmus (regelmäßig Briefkasten lesen)
- **Automatisch:** Auto-Issue-Wächter (`.github/workflows/sbkim-watch.yml`, Cron `0 */6` + Run-Knopf) öffnet bei Neuem ein Issue; der 📬-Knopf prüft still bei jedem Seitenstart (Gold-Zähler).
- **Manuell je Sitzung mit Andock-Bezug:** alle 5 Nachbar-`SIGNAL.json` lesen, Sporen re-verifizieren, `ack` nachziehen, Postfächer pflegen.
