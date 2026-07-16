# PULS — Mein-Mixarium (SBKIM-Endknoten)

**Stand:** 2026-07-15 · **App-Version:** v9.5 · **nodeId:** `dJ7H5BpjkQvkOyGS6qWrZgpDocVIPAVsJNB1wqt9h3g`
(vorher `B7Fke9CYTR1BrC3xOXzEY5q9RuRH8xxHPUuqRHV3utA` — Identitäts-Wechsel 2026-07-15, siehe unten)

Kurzer, ehrlicher Live-Stand des Knotens. Detail-Protokolle: `docs/sessions/`.

## 2026-07-15 (Folge 3) — Bewusster Identitäts-Neuanfang + ausführliche Beschreibung
- **Klaus-Entscheid:** alte Identität `B7Fke9C…` **nicht** retten (alles Testversionen; sie lag ohnehin
  nicht mehr im genutzten Browser — getrennter DeX/Tablet-Speicher). Stattdessen **frisch angefangen**:
  im Browser eine neue Identität + Spore erzeugt (mit der neuen ausführlichen Beschreibung) und übernommen.
- **Neue Identität:** `spore.json` = frische Spore `dJ7H5BpjkQvkOyGS6qWrZgpDocVIPAVsJNB1wqt9h3g`
  (Ed25519 **✔ VALID**, headless geprüft). `SIGNAL.json` seq → **13**, `nodeId` neu, alte in
  `previousNodeIds`, Headline bittet die Nachbarn, Mixarium unter der **neuen** nodeId zu führen.
- **Neues Board (ehrlich gemessen gegen die geführten Nachbar-Sporen):**

  | Nachbar | alt (Kurz-Text) | **neu (ausführlich)** | Stufe |
  |---|---|---|---|
  | Mein-Rezeptbuch | 0.9544 | **0.8681** | verified-match |
  | Sage-Protokol | 0.7670 | **0.8188** | verified-match |
  | Jasons-Tresor | 0.7884 | **0.8174** | verified-match* |
  | Mein-Tresor | 0.7884 | **0.8174** | verified-match* |
  | SB-KIMTool-Point | 0.7673 | **0.8084** | verified-match* |

- **⚠️ Ehrliche Einordnung (kein Grün-Rechnen, aber wichtig):** die **ausführliche** Beschreibung hebt die
  Cosinus-**Baseline** generell an — lange, gut ausformulierte Absätze ähneln sich in der Einbettung quer
  über Themen. Darum liegen jetzt **auch die themenfremden JSON-Tresore** (Jasons/Mein-Tresor) und der Hub
  (Point) knapp über 0.80 — das ist **kein starkes Themen-Match**, nur ehrlich gemessen (`*` = grenzwertig,
  längengetrieben). Der echte Verwandte (Rezeptbuch) ist sogar **gefallen** (0.9544 → 0.8681). Die
  Beschreibung trennt also **schlechter** als der Kurz-Text.
- **Offene Folge-Option (Klaus entscheidet):** eine **kürzere, getränke-spitze** Beschreibung, die
  Rezeptbuch/Getränke hoch hält und die JSON-Tresore ehrlich darunter lässt → bessere Trennschärfe.
  Dann re-signiert Klaus im Browser (gleiche nodeId `dJ7H5BpjkQ…`, neuer Vektor).
- **Verifikation:** `spore.json` ✔ VALID, 5 Nachbar-Cosinus unabhängig nachgerechnet, `SIGNAL.json`
  valides JSON. `*_inbox.verify.md` + `AUSTAUSCH-*` auf die neue Identität nachgezogen.

## 2026-07-15 (Folge 2) — Siegel-Andock-Wizard 1:1 aus dem Sage-Kanon (ersetzt losen Patch)
- **Klaus-Befund (Screenshots):** Mixariums Siegel war **kein** 1:1 des Sage-Kanons — der 🔑-Knopf
  öffnete **Modul 18** (Fremd-Andock URL→Spore→Match→Handshake) **statt** des eigenen-Identität-Wizards,
  das Fenster lag **hinter** dem Siegel, und der Wechsler saß lose auf der Seite. Ehrlicher Prüf-Befund:
  es gab **gar keine** fertige 1:1-kopierbare Wizard-Datei — Sages voller Wizard lebt nur inline, Kim-Bells
  Extraktion fehlt der Wechsler.
- **Gebaut (Klaus-Entscheid „zuerst in Sage, dann 1:1 kopieren"):** kanonische
  `Sage-Protokol/assets/siegel-inhalt.js` (voller Wizard, **5 Bausteine**, natives `<dialog>` → Top-Layer
  **vor** dem Siegel) — PR Sage #655 **gemergt**. Diese Datei **1:1 nach Mixarium** kopiert
  (`sbkim/siegel-inhalt.js`, nur `WIZ`-Config angepasst), in `index.html`+QC geladen.
- **Alte, abweichende Host-Injektion in `sbkim/sbkim-init.js` entfernt** (die 🔑→Modul-18-Fehlverdrahtung
  + mein loser Identitäts-Wechsler-Patch aus Folge 1 — **abgelöst**, nicht mehr doppelt injiziert). Modul 18
  bleibt geladen, ist aber nicht mehr an den 🔑 verdrahtet (Sage hat auch keinen ⛨ Fremd-Andock; falls
  gewünscht, später separat über Modul 18).
- **Ergebnis:** der 🔑-Knopf öffnet jetzt den **richtigen** Wizard (Identität erzeugen · Spore signieren+⬇ ·
  Backup · Wiederherstellen · **Identitäts-Wechsler**) als Fenster **vor** dem Siegel — wie in Sage.
- **Verifikation:** `node --check` grün (sbkim-init.js/siegel-inhalt.js/app-sw.js), **nur EIN** 🔑-Injektor
  (keine Doppel-Injektion), Smoke 7/7+14/14+8/8 grün, md5-Drift-Guard (index==QC) grün. `app-sw.js`
  v66→**v67** (Cache-Bust). **Browser-Sichttest wartet auf Klaus** (DOM-only).
- **Rand-Befund (offen):** `sbkim/02_spore.js` Byte-Drift gegen Sage-Kanon (API vorhanden) — eigene
  Re-Sync-Pflege. Sage-Page-Adoption der Datei + Kim-Bell/Point angleichen = eigene Folge-Sitzungen.

## 2026-07-15 (Folge) — Identitäts-Wechsler (Baustein 5) nachgerüstet (ABGELÖST durch Folge 2 — loser Patch)
- **Auslöser (Klaus):** vor der v0.2-Neu-Signatur die zwei Sage-Bauanleitungen (Siegel + „mit dem
  Knotennetz verbinden") geprüft, weil die alte Falle „Spuren-/Mehrfach-Sporen aus alten Containern"
  wieder droht. Ist-Prüfung: Mixarium hat schon **E1 eigene Schublade** `sbkim_mixarium`, **Modus A**
  idempotent (`getOrCreateIdentity` — kein Doppel-Anlegen), **Modus B** „🧹 Aufräumen & neu anmelden"
  (Modul 23), „🌐 Mit dem Netz verbinden"/„👥 Wer ist im Raum?", und den **✍ Neu-Signatur-Pfad**
  (gleiche nodeId + Ladebalken). **Die eine Lücke:** der **Identitäts-Wechsler (Baustein 5)** fehlte —
  genau der Baustein, der bei SB-KIMTool-Point zu Doppel-Identitäten führte.
- **Gebaut (host-seitig in `sbkim/sbkim-init.js`, Kanon-Mirror aus `Sage-Protokol/index.html`
  `refreshAndockIdentities`/`andockSwitchIdentity`):** ein „🪪 Identitäts-Wechsler"-Block im Siegel-Modal
  (`buildIdentitySwitcherBlock` + `refreshMxIdentities` + `mxSwitchIdentity`), rein über die öffentliche
  Modul-02-API (`listIdentities`/`getActiveIdentityKey`/`setActiveIdentity`), fail-soft, idempotent
  (`data-mx-identity-switcher`). Zeigt **alle** Identitäten der eigenen Schublade + die aktive, lässt die
  kanonische wählen; **löscht nichts**. So sieht Klaus vor dem v0.2-Signieren, ob Alt-Identitäten
  herumliegen, und wählt die richtige nodeId.
- **Kern-Module unangetastet** (02/16/18 nicht editiert — nur host-seitige Injektion, wie schon beim
  ✍-Block). `index.html`/QC **unberührt** (SBKIM liegt in `sbkim/*.js`) → md5-Drift-Guard grün.
  `app-sw.js` SW-Version **v65 → v66** (Cache-Bust, damit die neue `sbkim-init.js` nach Hard-Reload ankommt).
- **Verifikation:** `node --check` grün (sbkim-init.js + app-sw.js), Smoke 7/7 + 14/14 + 8/8 grün,
  md5-Drift-Guard grün. **Browser-Sichttest des Wechslers wartet auf Klaus** (DOM-only, headless nicht prüfbar).
- **Rand-Befund (Folge-Pflege, nicht in dieser Sitzung):** `sbkim/02_spore.js` zeigt Byte-Drift gegen den
  Sage-Kanon `src/modules/02_spore.js` — die genutzte API-Fläche ist vorhanden; eine byte-1:1-Re-Sync
  gegen Sage sollte separat geprüft werden.

## 2026-07-15 — Netz-Form geklärt (ehrlicher Themen-Cosinus + Zugehörigkeit in die Spore) + Sage-v0.2 gemergt
- **NETZ-FORM (Klaus 2026-07-15, `AskUserQuestion`):** Das **Prinzip** bleibt **ehrlicher Themen-Cosinus**
  — nichts per Dekret grün-gerechnet, **keine** künstliche Board-Achse. **Klaus' Weg** (Nachfrage-Antwort):
  die Netz-Zugehörigkeit **ehrlich in die eigene Spore-Selbstbeschreibung (v0.2)** aufnehmen — Satz
  **„… Teil des SBKIM-Knotennetzes rund um Sage-Protokoll und SB-KIMTool-Point."** — und im **Browser
  messen** (Kontroll-Versuch), ob der Cosinus zu den Hubs dadurch **ehrlich ≥ 0.80** steigt. Wenn ja →
  `verified-match` (weil die Beschreibung die Zugehörigkeit dann wirklich trägt); wenn nein → bleibt
  `verified-spore`. **Das ist kein Grün-Rechnen** — der Satz beschreibt eine wahre Tatsache (gültige Spore
  + Andock = echte Netz-Mitgliedschaft), und der Cosinus wird *danach* ehrlich gemessen. Bis zur
  **Browser-Neu-Signatur** (privater Schlüssel nur bei Klaus) bleibt die Board-Stufe `verified-spore`.
- **Kontroll-Versuch ist genau dieser Test:** `sbkim/messung-netz-zugehoerigkeit.html` hat den Satz bereits
  als `NETZ_SUFFIX` hinterlegt und misst OHNE ↔ MIT Zusatz gegen Sage- und Point-Vektor. Klaus öffnet die
  Seite → „Messen" → Ergebnis entscheidet, ob der Satz dauerhaft in die v0.2-Spore kommt.
- Aktueller Stand (bis Browser-Lauf): Sage + Point bleiben `verified-spore` (Cosinus gegen unsere jetzige
  v0.1-Spore: Sage 0.766963, Point 0.767273 < 0.80). Deckt sich mit Mein-Rezeptbuchs **unabhängiger**
  Messung (deren SIGNAL seq 11: Sage 0.792393, Point 0.796054 — beide < 0.80). Die Sage-v0.2-Reklassifizierung
  (vorher Draft-PR #135) landet jetzt auf `main`.
- **Rezeptbuch seq 11 quittiert:** Mein-Rezeptbuch hat seq 11 gepostet (spiegelt unsere Sage/Point-
  Reklassifizierung, Spore unverändert v0.1, Match hält 0.9544) und führt uns reziprok bei **ack 11**.
  Wir quittieren gegen: `ack["Mein-Rezeptbuch"]` **10→11**.
- **Briefkasten-Runde (§11.6):** alle 5 Nachbar-`SIGNAL.json` aus `raw/main` gelesen + Sporen headless
  re-verifiziert (`scripts/verify_foreign_spore.mjs`, alle **✔ VALID**). Quittiert:
  `ack` **Sage 43→46, Jasons 11→14, Tresor 14→17, Rezeptbuch 5→11** (Point 34 synchron). Jasons/Tresor
  nur eigene Bauten (Nostr Stufe 2, Modul 23, Impressum) — Sporen **unverändert** (v0.1).
- **⚠️ Sage ist auf v0.2 unter 0.80 gefallen (neuer Befund):** Sage hat seine Live-Spore am 2026-07-14
  im Browser auf **v0.2** neu signiert (ihr SIGNAL seq 46, ausführliche Beschreibung, 11 snippetVectors,
  **nodeId `nysOZE3V…` unverändert**, Ed25519 ✔ VALID). Cosinus unser `domainVector` ⟷ Sages **neuer
  v0.2-Vektor** = **0.766963 < 0.80** (war 0.806030/verified-match gegen v0.1) → **`verified-spore`** —
  **dasselbe Muster wie bei SB-KIMTool-Point** (Mycel-Hub ≠ Getränke, ehrlich, nichts grün-gerechnet).
  Zweifach bestätigt: eigener Live-Fetch **und** der im Messhelfer hinterlegte `VEC_SAGE` (war bereits
  der v0.2-Vektor). **Keine Adress-Wand** (kanonische nodeId) → `sage_inbox.json` byte-1:1 auf v0.2
  aktualisiert; `sage_inbox.verify.md` + `AUSTAUSCH-Sage.md` (reziproke Bitte) nachgezogen.
- **Messhelfer-Honesty-Fix:** `messung-netz-zugehoerigkeit.html` Selbsttest-Text sagte fälschlich
  „Sage 0.806030", der hinterlegte `VEC_SAGE` rechnete aber **0.766963** → Text korrigiert (beide,
  Toolpoint 0.767273 + Sage 0.766963, jetzt ehrlich **unter 0.80**), damit Klaus' Kontroll-Versuch nicht
  irritiert.
- Verbund jetzt **1/5 verified-match** (nur Rezeptbuch 0.9544) + **4 verified-spore** (Sage 0.766963,
  Point 0.767273, Jasons/Tresor 0.7884). md5-Drift-Guard (index==QC) grün, Smoke-Tests grün, 5/5 Sporen
  ✔ VALID (Cosinus unabhängig nachgerechnet: Sage 0.766963, Rezeptbuch 0.954426). `SIGNAL.json` seq → **12**.
- **Nächster Schritt = Klaus' Browser (2 Klicks, in dieser Reihenfolge):**
  1. **Kontroll-Versuch messen** — `sbkim/messung-netz-zugehoerigkeit.html` öffnen → „Messen". Zeigt
     OHNE ↔ MIT dem Satz „… Teil des SBKIM-Knotennetzes …" den Cosinus zu Sage + Point. Ergebnis sagt,
     ob der Satz die Hubs ehrlich über 0.80 hebt.
  2. **v0.2 der eigenen Spore neu signieren** — mit dem Satz in der Beschreibung (Vorschlagstext siehe
     `docs/sessions/BRIEF_v0.2_zugehoerigkeit.md`), Live-Neu-Signatur im Browser (Siegel ✍, nodeId
     unverändert, privater Schlüssel nur bei Klaus). Danach Board-Stufe zu Sage/Point neu bewerten.
  Bis dahin bleibt die Board-Stufe `verified-spore` (unsere Live-Spore ist noch v0.1).

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
| Sage-Protokol | ✔ VALID | **0.766963** | verified-spore | quittiert **46** · NEU 2026-07-14: Sage v0.2, cos < 0.80 → verified-spore (war 0.8060) — Mycel-Hub ≠ Getränke; Sage führt uns noch mit 0.8060 (reziprok offen) |
| SB-KIMTool-Point | ✔ VALID | **0.767273** | verified-spore | quittiert **34** · NEU 2026-07-14: Point v0.2, cos < 0.80 → verified-spore (war 0.8030) — Werkzeug-Hub ≠ Getränke |
| Jasons-Tresor | ✔ VALID | **0.7884** | verified-spore | quittiert 11 · führt uns (mailbox), ack offen — **ehrlich kein Match** (< 0.80) |
| Mein-Tresor | ✔ VALID | **0.7884** | verified-spore | quittiert 14 · führt uns (ack 1) — **ehrlich kein Match** (< 0.80) |

→ **1/5 verbunden** (verified-match: nur Rezeptbuch — Stand 2026-07-14 Folge). **Sage** (0.766963) und
**SB-KIMTool-Point** (0.767273) sind nach ihrer jeweiligen v0.2-Neu-Signatur unter **0.80** gefallen →
beide `verified-spore` (Identität ✔ VALID). Die zwei Tresore liegen ehrlich unter 0.80
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
