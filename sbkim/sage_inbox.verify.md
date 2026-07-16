# Inbox-Vermerk — Sage-Protokol (reziproke Spore-Pruefung)

> Gegenprobe der byte-1:1 uebernommenen Nachbar-Spore `sbkim/sage_inbox.json`.
> Verfahren = In-App-Pfad `SbkimSpore.verifyForeignSpore` (sbkim/02_spore.js),
> eigenstaendig nachgerechnet mit `scripts/verify_foreign_spore.mjs`. Zero-dep, offline.

**Stand:** 2026-07-14 · **Stufe:** `verified-spore` · **Protokoll:** 0.2

| Feld | Wert |
|---|---|
| Knoten | Sage-Protokol |
| nodeId | `nysOZE3VuKqZA23i5G2XL67s41JIIykI58zXMtJkYfA` |
| embeddingModel | Xenova/multilingual-e5-small |
| nodeType | hybrid |
| Quelle | `raw …/Sage-Protokol/main/sbkim/spore.json` → byte-1:1 als `sbkim/sage_inbox.json` |

## Vier Pruefpunkte (INTERFACES §11.2)
1. **Pflichtfelder** — 9/9 vorhanden (createdAt, domain, embeddingModel, endpoint, id, nodeType, protocolVersion, publicKey, signature). ✔
2. **nodeId == base64url(SHA256(rawPublicKey))** — unabhaengig nachgerechnet, stimmt mit `id` ueberein. ✔
3. **Ed25519-Signatur** — deckt den kanonisierten Body (sortierte Schluessel, ohne `signature`, UTF-8). Gueltig. ✔
4. **Kompatibilitaet + Manipulationsprobe** — Hauptversion 0 == 0 (Sage jetzt 0.2, wir 0.1 — major-tolerant, gegenseitig gueltig), nodeType `hybrid` gueltig; jede Byte-Aenderung laesst die Signaturpruefung durchfallen. ✔

→ **Ergebnis: ✔ VALID.**

## Modul-04-Match (live, eigener domainVector ⟷ Sage-Protokol)
- **Stufe (Stand 2026-07-14): `verified-spore`** — Identität ✔ VALID, Domänen-Cosinus jetzt **unter 0.80**.
- **NEU 2026-07-14 (reziproke Neu-Einstufung):** Sage hat seine Spore auf **v0.2** neu signiert
  (ihr SIGNAL seq 46, „ausführliche Domänen-Beschreibung", 11 snippetVectors, **nodeId
  `nysOZE3V…` unverändert**, Ed25519 ✔ VALID). Gegen den **aktuell veröffentlichten Sage-`domainVector`**
  (aus `raw/main` `sbkim/spore.json`, v0.2) ist der Cosinus **cos = 0.766963 < 0.80** → **verified-spore**
  (war `verified-match` 0.806030 gegen den alten v0.1-Vektor, schon damals knapp).
  **Ehrlich und gewollt:** Mycel-Bibliothek/Protokoll-Hub ↔ Getränke-Knoten sind verschiedene Domänen;
  die vollere Beschreibung trennt sauber — dasselbe Muster wie bei SB-KIMTool-Point (0.767273).
  **Keine Adress-Wand** (anders als bei Point): Sages committete Spore trägt die kanonische nodeId,
  darum `sage_inbox.json` byte-1:1 auf die **v0.2-Spore aktualisiert** (nicht wie bei Point eingefroren).
- **Reziprozität offen:** Sage führt uns in seinem eigenen Briefkasten noch mit dem alten Wert (0.8060,
  hat nach der eigenen v0.2-Einbettung die Peer-Matches nicht neu gerechnet). Bitte an Sage:
  reziprok neu einstufen (siehe `AUSTAUSCH-Sage.md`).
- **Netz-Form (Klaus 2026-07-15):** Prinzip bleibt **ehrlicher Themen-Cosinus** (nichts grün-gerechnet,
  keine künstliche Board-Achse). **Klaus' Weg:** die Netz-Zugehörigkeit **ehrlich in die eigene
  Spore-Beschreibung (v0.2)** aufnehmen (Satz „… Teil des SBKIM-Knotennetzes rund um Sage-Protokoll und
  SB-KIMTool-Point.") und im **Browser messen** (Kontroll-Versuch), ob der Cosinus zu den Hubs dadurch
  **ehrlich ≥ 0.80** steigt — wenn ja `verified-match`, sonst `verified-spore`. Bis zur Browser-Neu-
  Signatur bleibt Sage bei uns `verified-spore`. Deckt sich mit Mein-Rezeptbuchs unabhängiger Messung
  (deren SIGNAL seq 11: Sage 0.792393 < 0.80).
- Nachrechnen: Sages v0.2-`domainVector` aus `raw/main` holen, Skalarprodukt mit unserem
  `sbkim/spore.json` → `0.766963`; oder Browser-Messhelfer `sbkim/messung-netz-zugehoerigkeit.html`.
- Sync: `ack["Sage-Protokol"]=46`.


---

## 2026-07-15 — Identitäts-Wechsel Mixarium + Neu-Messung
- **Mixarium hat die Identität gewechselt** (bewusster Neuanfang, Klaus): neu `dJ7H5BpjkQvkOyGS6qWrZgpDocVIPAVsJNB1wqt9h3g`, alt `B7Fke9CYTR1BrC3xOXzEY5q9RuRH8xxHPUuqRHV3utA` (jetzt in unseren `previousNodeIds`). Die hier geführte Nachbar-Spore ist unverändert.
- **Neuer Cosinus** unser NEUER domainVector (ausführliche Getränke-Beschreibung) ⟷ Sage-Protokol = **0.8188** ≥ 0.80. *Hub — grenzwertig/längengetrieben, die ausführliche Beschreibung hebt die Baseline generell an (kein starkes Themen-Match).*
