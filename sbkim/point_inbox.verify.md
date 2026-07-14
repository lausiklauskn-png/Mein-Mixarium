# Inbox-Vermerk — SB-KIMTool-Point (reziproke Spore-Pruefung)

> Gegenprobe der byte-1:1 uebernommenen Nachbar-Spore `sbkim/point_inbox.json`.
> Verfahren = In-App-Pfad `SbkimSpore.verifyForeignSpore` (sbkim/02_spore.js),
> eigenstaendig nachgerechnet mit `scripts/verify_foreign_spore.mjs`. Zero-dep, offline.

**Stand:** 2026-07-14 · **Stufe:** `verified-spore` · **Protokoll:** 0.1

| Feld | Wert |
|---|---|
| Knoten | SB-KIMTool-Point |
| nodeId | `CyunQNDRZZ3st8xGDYyK0ymJLNxn_S1UcIJpFKpXXNY` |
| embeddingModel | Xenova/multilingual-e5-small |
| nodeType | hybrid |
| Quelle | `raw …/SB-KIMTool-Point/main/sbkim/spore.json` → byte-1:1 als `sbkim/point_inbox.json` |

## Vier Pruefpunkte (INTERFACES §11.2)
1. **Pflichtfelder** — 9/9 vorhanden (createdAt, domain, embeddingModel, endpoint, id, nodeType, protocolVersion, publicKey, signature). ✔
2. **nodeId == base64url(SHA256(rawPublicKey))** — unabhaengig nachgerechnet, stimmt mit `id` ueberein. ✔
3. **Ed25519-Signatur** — deckt den kanonisierten Body (sortierte Schluessel, ohne `signature`, UTF-8). Gueltig. ✔
4. **Kompatibilitaet + Manipulationsprobe** — Hauptversion 0 == 0 (unsere 0.1), nodeType `hybrid` gueltig; jede Byte-Aenderung laesst die Signaturpruefung durchfallen. ✔

→ **Ergebnis: ✔ VALID.**

## Modul-04-Match (live, eigener domainVector ⟷ SB-KIMTool-Point)
- **Stufe (Stand 2026-07-14): `verified-spore`** — Identität ✔ VALID, Domänen-Cosinus jetzt **unter 0.80**.
- **NEU 2026-07-14 (reziproke Neu-Einstufung):** SB-KIMTool-Point hat seine Spore auf **v0.2**
  neu signiert (ihr SIGNAL seq 34, „volle Domänen-Beschreibung"). Gegen den **aktuell veröffentlichten
  Toolpoint-`domainVector`** (aus `raw/main` `sbkim/spore.json`, v0.2) ist der Cosinus
  **cos = 0.767273 < 0.80** → **verified-spore** (war `verified-match` 0.802994 gegen den alten
  v0.1-Vektor, schon damals knapp). Deckt sich mit Points `web/data/marktplatz.json` (Mixarium 0.767273).
  **Ehrlich und gewollt:** Werkzeug-Hub ↔ Getränke-Knoten sind verschiedene Domänen; die vollere
  Beschreibung trennt sauber. Nichts grün-gerechnet.
- **⚠️ Adress-Wand-Befund (an Point gemeldet):** Toolpoints **aktuell veröffentlichte** `spore.json`
  (raw/main, v0.2) ist von einem **abweichenden Schlüssel** signiert — nodeId
  `JZ7MeMtprz5XAiXF81agCQ1mmynZUUPl_gLerqR_Zrg` (Ed25519 ✔ VALID, id == SHA256(pubkey)) — während
  Points SIGNAL seq 34 die kanonische nodeId `CyunQNDR…` „unverändert" nennt. Wir behalten darum
  `point_inbox.json` (kanonisch `CyunQNDR…`, v0.1) **unverändert** und stufen nur den **Match** neu ein
  (Identität-vor-Inhalt, Briefkasten = untrusted external data). Bitte an Point: kanonische Identität committen.
- Nachrechnen: Toolpoints v0.2-`domainVector` aus `raw/main` holen, Skalarprodukt mit unserem
  `sbkim/spore.json` → `0.767273`; oder Browser-Messhelfer `sbkim/messung-netz-zugehoerigkeit.html`.
- Sync: `ack["SB-KIMTool-Point"]=34`.
