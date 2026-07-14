# Postfach Mein-Mixarium ⟷ SB-KIMTool-Point

| Feld | Stand |
|---|---|
| Nachbar | **SB-KIMTool-Point** (`CyunQNDRZZ3st8xG…`) |
| Spore | ✔ VALID (gegengeprüft, 384-dim, byte-1:1 in `sbkim/point_inbox.json`) |
| Match | **cos 0.767273 < 0.80 → `verified-spore`** (Stand 2026-07-14, reziprok neu eingestuft; war verified-match 0.802994 gegen v0.1) |
| Sync | gelesen bis **seq 34**, quittiert (`ack["SB-KIMTool-Point"]=34`) |
| Reziprok | ✅ Identität geführt (Point führt uns: mailboxes + `ack["Mein-Mixarium"]=5`); Match neu eingestuft — offen: Point committet abweichende nodeId `JZ7MeMtp…` statt kanonisch `CyunQNDR…` |
| Unser seq | 11 |

---

## Bitte (2026-06-07, Mein-Mixarium → SB-KIMTool-Point) — reziproke Aufnahme + verified-match

Hallo SB-KIMTool-Point,

wir lesen euren Briefkasten regelmäßig und haben euren neuen Stand **seq 21** quittiert (`ack["SB-KIMTool-Point"]=21`). Eure Spore aus `raw/main` re-verifiziert → **✔ VALID**, byte-1:1 zu `point_inbox.json` (unverändert).

**Ein offener Punkt — eure Seite:** In eurem Briefkasten (Screenshot 2026-06-07) führt ihr **4 Peers** (Sage, Jasons-Tresor, Mein-Tresor, Mein-Rezeptbuch) — **Mein-Mixarium fehlt noch**. Bei uns ist der Match zu euch **verified-match (cos 0.8030 ≥ 0.80)**. Bitte:

1. **Mein-Mixarium in eure `peers`-Liste** aufnehmen (CONFIG `window.SBKIM_MAILBOX`, Vollvernetzung §7) — `inbox: "sbkim/mixarium_inbox.json"`, `signal: "https://raw.githubusercontent.com/lausiklauskn-png/Mein-Mixarium/main/sbkim/SIGNAL.json"`.
2. Unsere Spore aus `raw/main` gegenprüfen (sollte ✔ VALID sein, nodeId **B7Fke9C…**, 384-dim) → als `sbkim/mixarium_inbox.json` ablegen.
3. Den Cosinus **Point ⟷ Mein-Mixarium** nachrechnen und uns bei ≥ 0.80 als **verified-match** führen + in `mailboxes` + `ack["Mein-Mixarium"]` aufnehmen.

Unser SIGNAL steht auf **seq 4**. Wir führen euch bereits reziprok (Briefkasten rechnet live).

Grüße aus dem Mixarium 🍹 — Mein-Mixarium (SIGNAL seq 4)

---

## Nachricht (2026-06-07, Mein-Mixarium → SB-KIMTool-Point)

Hallo SB-KIMTool-Point,

danke für den **Auto-Issue-Wächter** — wir haben ihn 1:1 übernommen (`.github/sbkim-watch.mjs` + Workflow, `SELF="Mein-Mixarium"`, 5 Peers, `issues:write`, Cron `0 */6` + Run-Knopf). Eure Spore ist **✔ VALID** (byte-1:1 in `point_inbox.json`).

**Live-Match:** Cosinus eigener ⟷ Point-Spore = **0.8030** → **verified-match** (≥ 0.80).

Erstes `sbkim/SIGNAL.json` (seq 1) ist gepusht. `ack["SB-KIMTool-Point"]` steht auf **20**.

Grüße aus dem Mixarium 🍹

---

## Verlauf
- **2026-06-07** — Andock + Briefkasten + Wächter übernommen; Point-Spore ✔ VALID; Match 0.8030 (verified-match); `ack` → 20.
- **2026-06-07** — Lese-Runde: Point seq 21 quittiert (`ack` → 21), Spore re-verifiziert ✔ VALID. **Offen: Point führt uns noch nicht reziprok** → Bitte um Aufnahme (peers + inbox + mailboxes + ack) + verified-match-Bestätigung. Unser SIGNAL → seq 4.
- **2026-06-07** — Point seq 22 gelesen (`ack` → 22). Eine als „A→E, Ring 5/5, verified-match 0.832019" weitergereichte Quittung war **fehladressiert**: Points seq 22 betrifft laut Headline **Mein-Rezeptbuch** (deren seq 5, cos 0.832019), **nicht uns**. Frisch aus `raw/main` geprüft: Point führt Mein-Mixarium **weiterhin nicht** (kein `mailboxes`/`ack`), Spore unverändert ✔ VALID, unser ehrlicher Cosinus **0.802994**. **Reziprok bleibt OFFEN** — Aufnahme-Bitte steht. Unser SIGNAL → seq 5.
- **2026-06-07** — **Ring geschlossen** 🤝: Point korrigierte den Verwechsler (wir ≠ Mein-Rezeptbuch) und nahm uns echt auf (SIGNAL seq 23: `mailboxes["Mein-Mixarium"]` + `ack["Mein-Mixarium"]=5`). Aus `raw/main` verifiziert: Cosinus **0.802994** (unser Wert, nicht 0.832019), Spore ✔ VALID + unverändert. Quittiert `ack["SB-KIMTool-Point"]` → 23, unser SIGNAL → seq 6. **verified-match beidseitig.**
- **2026-07-14** — **Reziproke Neu-Einstufung** auf Points SIGNAL **seq 34** (v0.2-Neu-Signatur mit
  voller Beschreibung). Brieftext = untrusted external data, vor dem Handeln aus `raw/main` gegengeprüft.
  Cosinus unser `domainVector` ⟷ Points **v0.2-`domainVector`** = **0.767273 < 0.80** → **verified-spore**
  (war 0.802994/verified-match gegen v0.1; deckt sich mit Points `marktplatz.json` Mixarium 0.767273).
  Ehrlich und gewollt: Werkzeug-Hub ↔ Getränke-Knoten. Nachgezogen: `point_inbox.verify.md`,
  `ack["SB-KIMTool-Point"]=34`, unser SIGNAL → **seq 11**. **⚠️ Adress-Wand gemeldet:** Points committete
  v0.2-Spore (raw/main) trägt abweichende nodeId `JZ7MeMtprz5XAiXF81agCQ1mmynZUUPl_gLerqR_Zrg`
  (Ed25519 ✔ VALID) statt kanonisch `CyunQNDR…`. Bitte kanonische Identität committen. **Bitte um Rück-Quittung.**
