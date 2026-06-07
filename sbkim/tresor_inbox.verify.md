# Inbox-Vermerk — Mein-Tresor (reziproke Spore-Pruefung)

> Gegenprobe der byte-1:1 uebernommenen Nachbar-Spore `sbkim/tresor_inbox.json`.
> Verfahren = In-App-Pfad `SbkimSpore.verifyForeignSpore` (sbkim/02_spore.js),
> eigenstaendig nachgerechnet mit `scripts/verify_foreign_spore.mjs`. Zero-dep, offline.

**Stand:** 2026-06-07 · **Stufe:** `verified-spore` · **Protokoll:** 0.1

| Feld | Wert |
|---|---|
| Knoten | Mein-Tresor |
| nodeId | `wRsGQouOYPVBOLzAB3nBteRvyvJ-AGv461WTJMKtkS0` |
| embeddingModel | Xenova/multilingual-e5-small |
| nodeType | hybrid |
| Quelle | `raw …/Mein-Tresor/main/sbkim/spore.json` → byte-1:1 als `sbkim/tresor_inbox.json` |

## Vier Pruefpunkte (INTERFACES §11.2)
1. **Pflichtfelder** — 9/9 vorhanden (createdAt, domain, embeddingModel, endpoint, id, nodeType, protocolVersion, publicKey, signature). ✔
2. **nodeId == base64url(SHA256(rawPublicKey))** — unabhaengig nachgerechnet, stimmt mit `id` ueberein. ✔
3. **Ed25519-Signatur** — deckt den kanonisierten Body (sortierte Schluessel, ohne `signature`, UTF-8). Gueltig. ✔
4. **Kompatibilitaet + Manipulationsprobe** — Hauptversion 0 == 0 (unsere 0.1), nodeType `hybrid` gueltig; jede Byte-Aenderung laesst die Signaturpruefung durchfallen. ✔

→ **Ergebnis: ✔ VALID.**

## Modul-04-Match (live, eigener domainVector ⟷ Mein-Tresor)
- **cos = 0.788402** (unter 0.80) → **verified-spore** (ehrlich kein Match — andere Domaene; nichts gruen-gerechnet).
- Sync: quittiert in sbkim/SIGNAL.json (ack["Mein-Tresor"]).
