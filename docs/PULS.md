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

## Vollvernetzung (§7) — Live-Match (ehrlich) · unser SIGNAL seq 3
| Nachbar | Spore | cos | Stufe | Sync (ack) · reziprok |
|---|---|---|---|---|
| Mein-Rezeptbuch | ✔ VALID | **0.9544** | verified-match | quittiert 2 · führt uns (ack 1) ✔ |
| Sage-Protokol | ✔ VALID | **0.8060** | verified-match | quittiert 20 · führt uns (ack 1) ✔ |
| SB-KIMTool-Point | ✔ VALID | **0.8030** | verified-match | quittiert 20 |
| Jasons-Tresor | ✔ VALID | **0.7884** | verified-spore (unter 0.80) | quittiert 10 |
| Mein-Tresor | ✔ VALID | **0.7884** | verified-spore (unter 0.80) | quittiert 13 |

→ **3/5 verbunden** (verified-match). Andere Domäne als die Tresore — nichts grün-gerechnet.
Pro Nachbar `sbkim/*_inbox.verify.md` (4 Prüfpunkte §11.2 + Stufe). Sicherheits-Tafel
`docs/SICHERHEIT-BRIEFKASTEN.md` (netzweit, von Sage) gespiegelt.

## Reziproke Bestätigungen (2026-06-07)
- **Sage-Protokol** (SIGNAL seq 20): führt uns + `ack["Mein-Mixarium"]=1`, Match 0.806030 beidseitig; Identität `B7Fke9C…` kanonisch (alte `JOlHK31X…` in Sages `previousNodeIds`).
- **Mein-Rezeptbuch** (SIGNAL seq 2, vorher 404): führt uns + `ack["Mein-Mixarium"]=1`, Match 0.9544 beidseitig.

## Offen
- Reziproke `ack["Mein-Mixarium"]` von SB-KIMTool-Point / Jasons-Tresor / Mein-Tresor (lesen unser SIGNAL).
- Netzweite §5-Härtung der Sicherheits-Tafel (Render-`esc()`, Wächter-Headline-Kappung, `SIGNAL.json` signieren) — eigene Folge-Sitzung, Abstimmung per Brief mit Sage.
