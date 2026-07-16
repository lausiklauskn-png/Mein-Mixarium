# Inbox-Vermerk — Mein-Rezeptbuch (reziproke Spore-Pruefung)

> Gegenprobe der byte-1:1 uebernommenen Nachbar-Spore `sbkim/rezeptbuch_inbox.json`.
> Verfahren = In-App-Pfad `SbkimSpore.verifyForeignSpore` (sbkim/02_spore.js),
> eigenstaendig nachgerechnet mit `scripts/verify_foreign_spore.mjs`. Zero-dep, offline.

**Stand:** 2026-06-07 · **Stufe:** `verified-match` · **Protokoll:** 0.1

| Feld | Wert |
|---|---|
| Knoten | Mein-Rezeptbuch |
| nodeId | `uOpUBezUVbOMsVd2C9BkHW80agnLx5tCx_nIRy2KkXg` |
| embeddingModel | Xenova/multilingual-e5-small |
| nodeType | hybrid |
| Quelle | `raw …/Mein-Rezeptbuch/main/sbkim/spore.json` → byte-1:1 als `sbkim/rezeptbuch_inbox.json` |

## Vier Pruefpunkte (INTERFACES §11.2)
1. **Pflichtfelder** — 9/9 vorhanden (createdAt, domain, embeddingModel, endpoint, id, nodeType, protocolVersion, publicKey, signature). ✔
2. **nodeId == base64url(SHA256(rawPublicKey))** — unabhaengig nachgerechnet, stimmt mit `id` ueberein. ✔
3. **Ed25519-Signatur** — deckt den kanonisierten Body (sortierte Schluessel, ohne `signature`, UTF-8). Gueltig. ✔
4. **Kompatibilitaet + Manipulationsprobe** — Hauptversion 0 == 0 (unsere 0.1), nodeType `hybrid` gueltig; jede Byte-Aenderung laesst die Signaturpruefung durchfallen. ✔

→ **Ergebnis: ✔ VALID.**

## Modul-04-Match (live, eigener domainVector ⟷ Mein-Rezeptbuch)
- **cos = 0.954426** (≥ 0.80) → **verified-match**.
- Sync: ihr seq 5 quittiert (ack["Mein-Rezeptbuch"]=5). Reziprok: Rezeptbuch fuehrt uns (mailbox✔ + ack=1). verified-match beidseitig (0.9544).


---

## 2026-07-15 — Identitäts-Wechsel Mixarium + Neu-Messung
- **Mixarium hat die Identität gewechselt** (bewusster Neuanfang, Klaus): neu `dJ7H5BpjkQvkOyGS6qWrZgpDocVIPAVsJNB1wqt9h3g`, alt `B7Fke9CYTR1BrC3xOXzEY5q9RuRH8xxHPUuqRHV3utA` (jetzt in unseren `previousNodeIds`). Die hier geführte Nachbar-Spore ist unverändert.
- **Neuer Cosinus** unser NEUER domainVector (ausführliche Getränke-Beschreibung) ⟷ Mein-Rezeptbuch = **0.8685** ≥ 0.80. (echter Verwandter; gegenüber dem alten Kurz-Text 0.9544 **gefallen** — Längeneffekt der langen Beschreibung.)
