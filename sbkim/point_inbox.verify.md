# Inbox-Vermerk — SB-KIMTool-Point (reziproke Spore-Pruefung)

> Gegenprobe der byte-1:1 uebernommenen Nachbar-Spore `sbkim/point_inbox.json`.
> Verfahren = In-App-Pfad `SbkimSpore.verifyForeignSpore` (sbkim/02_spore.js),
> eigenstaendig nachgerechnet mit `scripts/verify_foreign_spore.mjs`. Zero-dep, offline.

**Stand:** 2026-06-07 · **Stufe:** `verified-match` · **Protokoll:** 0.1

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
- **cos = 0.802994** (≥ 0.80) → **verified-match**.
- Sync: ihr seq 21 quittiert (ack["SB-KIMTool-Point"]=21). OFFEN: Point fuehrt Mein-Mixarium noch nicht reziprok (nicht in Points peers/mailboxes/ack) — Bitte in AUSTAUSCH-SBKIMTool.md.
