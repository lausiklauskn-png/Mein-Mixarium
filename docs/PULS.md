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

## Vollvernetzung (§7) — Live-Match (ehrlich)
| Nachbar | Spore | cos | Sync (ack) |
|---|---|---|---|
| Mein-Rezeptbuch | ✔ VALID | **0.9544** ✔ | kein SIGNAL beim Nachbarn (404) |
| Sage-Protokol | ✔ VALID | **0.8060** ✔ | quittiert 18 |
| SB-KIMTool-Point | ✔ VALID | **0.8030** ✔ | quittiert 20 |
| Jasons-Tresor | ✔ VALID | **0.7884** (unter 0.80) | quittiert 10 |
| Mein-Tresor | ✔ VALID | **0.7884** (unter 0.80) | quittiert 13 |

→ **3/5 verbunden.** Andere Domäne als die Tresore — nichts grün-gerechnet.

## Offen
- Reziproke `ack["Mein-Mixarium"]` der Nachbarn (lesen unser frisches SIGNAL seq 1).
- Mein-Rezeptbuch um `sbkim/SIGNAL.json` gebeten (`sbkim/AUSTAUSCH-Rezeptbuch.md`).
