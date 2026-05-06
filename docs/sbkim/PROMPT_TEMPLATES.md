# SBKIM Mein Mixarium — PROMPT_TEMPLATES

**Status:** MVP-Spezifikation · Mai 2026 · v0.1
**Bezug:** `RULES.md` definiert das Verhalten, hier stehen die konkreten LLM-Prompts.
**Modell:** Standard `claude-haiku-4-5-20251001` (Mein Mixariums vorhandenes Modell). Bei verfügbarem `claude-sonnet-4-6` für B3 (Critic) optional Upgrade.

---

## Inhalt

1. Vorbemerkungen zur API
2. A1 — Curator (Profil-Wissens-Extraktion)
3. A1-Optional — Demo-Augmentation (synthetische Reviews)
4. A2 — Auditor (Capability/Need-Synthese)
5. A3 — Devil's Advocate (Tiefen-Kritik)
6. B1 — Interviewer (Rückfragen-Schleife)
7. B2 — Matcher (4-Felder-Match)
8. B3 — Critic (Kennenlern-Karte + Top-1-Kritik)
9. Allgemeine Robustheits-Regeln

---

## 1. Vorbemerkungen zur API

Alle Aufrufe gehen direkt aus dem Browser über die Mein-Mixarium-Anbindung:

```js
fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: {
    'x-api-key': localStorage.getItem('mxkey9m'),
    'anthropic-version': '2023-06-01',
    'content-type': 'application/json',
    'anthropic-dangerous-direct-browser-access': 'true'
  },
  body: JSON.stringify({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: <siehe je Prompt>,
    temperature: 0,                       // Determinismus
    system: '<siehe je Prompt>',
    messages: [{ role: 'user', content: '<siehe je Prompt>' }]
  })
})
```

**Allgemein-Regeln:**
- `temperature: 0` für alle MVP-Prompts (Reproduzierbarkeit)
- `max_tokens` sparsam, nicht überdimensionieren
- Output **immer** als JSON erzwingen (per Prompt + Parsing-Fallback)
- Bei Fehler: Stille Degradation, Profil als unvollständig markieren — kein Crash

---

## 2. A1 — Curator (Profil-Wissens-Extraktion)

**Zweck:** Strukturiertes öffentliches Wissen über einen bekannten Drink extrahieren, damit A2 daraus capabilities/bedarf bauen kann.

**Aufruf-Frequenz:** Einmal pro Drink, beim erstmaligen „Übernehmen" oder beim manuellen Re-Curating.

**Token-Budget:** `max_tokens: 1024`

### System-Prompt

```text
Du bist ein SBKIM-Curator für eine Getränke-App. Deine Aufgabe ist
das Extrahieren von öffentlich etabliertem Wissen über einen Drink
aus deinem Trainingsmaterial (Bartender-Foren, Mixology-Quellen,
Wikipedia, Reviews, Bar-Menüs). Du erfindest nichts.

Liefere ausschließlich gültiges JSON nach dem unten gegebenen Schema.
Keine Markdown-Codeblöcke, kein einleitender Text, kein Schlusstext —
nur das JSON-Objekt.

Confidence-Skala (verbindlich):
  0.9–1.0  Etabliertes Faktum
  0.7–0.9  Mehrfach belegt, geringe Streuung
  0.5–0.7  Häufig erwähnt, einzelne Gegenstimmen
  0.3–0.5  Vereinzelt, kontextabhängig
  0.0–0.3  Spekulativ oder strittig

Wenn du den Drink NICHT kennst, gib confidence-Werte unter 0.3 und
fülle das `unsicher`-Array. Erfinde KEIN Wissen, das du nicht hast.
```

### User-Message-Template

```text
Drink-Name: "{name}"
Stammdaten:
  Kategorie: {kategorie}
  Glas: {glas}
  Alkoholisch: {alkoholisch}
  Zutaten: {zutaten_komma_separiert}
  Kurzanleitung: {anleitung_kurz_falls_vorhanden}

Liefere JSON nach diesem Schema:
{
  "drink_name": "<wie übergeben>",
  "kenne_ich_drink": true | false,
  "herkunft":         { "text": "...", "confidence": 0.0–1.0 },
  "kontexte":         [ { "text": "...", "confidence": 0.0–1.0 } ],
  "geschmacksprofil": [ { "text": "...", "confidence": 0.0–1.0 } ],
  "synergien":        [ { "text": "...", "confidence": 0.0–1.0 } ],
  "kritikpunkte":     [ { "text": "...", "confidence": 0.0–1.0 } ],
  "unsicher":         [ { "text": "..." } ]
}

Erläuterungen zu den Feldern:
- herkunft: Region/Land/Tradition, in einem Satz.
- kontexte: Anlässe, Tageszeiten, Settings, soziale Situationen
  (max. 6 Einträge, kurze Sätze).
- geschmacksprofil: organoleptische Kerneigenschaften
  (Süße, Säure, Bitterkeit, Stärke, Textur — max. 6 Einträge).
- synergien: Speisen, Stimmungen, andere Drinks, Saisons
  (max. 5 Einträge).
- kritikpunkte: bekannte Schwächen, Einschränkungen, ungeeignete
  Kontexte (max. 5 Einträge).
- unsicher: alles, wo dein Wissen lückenhaft ist (Texte ohne
  confidence).

Antworte NUR mit dem JSON-Objekt.
```

### Beispiel-Output (Caipirinha)

```json
{
  "drink_name": "Caipirinha",
  "kenne_ich_drink": true,
  "herkunft": {
    "text": "Brasilianischer Nationalcocktail, ursprünglich aus dem Bundesstaat São Paulo.",
    "confidence": 0.95
  },
  "kontexte": [
    { "text": "Sommerliche Hitze, draußen, Tageszeit nachmittags bis abends", "confidence": 0.88 },
    { "text": "Strand- oder Pool-Setting, Latin-American Restaurants",         "confidence": 0.82 },
    { "text": "Karneval, Fußball-WM, geselliges Beisammensein",                "confidence": 0.78 },
    { "text": "Vor dem Essen oder zu leichten Tapas",                          "confidence": 0.55 }
  ],
  "geschmacksprofil": [
    { "text": "Säure-süß ausbalanciert mit Limetten-Säure und Rohrzucker", "confidence": 0.92 },
    { "text": "Mittlere Alkohol-Wirkung durch Cachaça",                    "confidence": 0.90 },
    { "text": "Frisch durch crushed ice, leicht herb-grasig durch Cachaça","confidence": 0.85 },
    { "text": "Kann zu süß werden bei zu viel Zucker",                    "confidence": 0.70 }
  ],
  "synergien": [
    { "text": "Brasilianische Küche, Feijoada, Picanha",       "confidence": 0.78 },
    { "text": "Ceviche und säuerliche Tapas",                  "confidence": 0.65 },
    { "text": "Lebhafte, laute Settings (Strandbar, Festival)","confidence": 0.82 }
  ],
  "kritikpunkte": [
    { "text": "Schnell zu süß, wenn Bartender Rohrzucker nicht abmisst",    "confidence": 0.75 },
    { "text": "Cachaça-Qualität schwankt stark — günstige Sorten harsch",   "confidence": 0.72 },
    { "text": "Nicht für formale Anlässe oder gehobene Ess-Settings",       "confidence": 0.60 },
    { "text": "Nicht alkoholfrei zu replizieren ohne Geschmacksverfälschung","confidence": 0.55 }
  ],
  "unsicher": []
}
```

### Beispiel-Output (Lab-Drink, unbekannt)

```json
{
  "drink_name": "Holunder-Salbei-Sprizz",
  "kenne_ich_drink": false,
  "herkunft": { "text": "Unbekannt; vermutlich kreative Eigenkreation.", "confidence": 0.10 },
  "kontexte": [],
  "geschmacksprofil": [],
  "synergien": [],
  "kritikpunkte": [],
  "unsicher": [
    { "text": "Konkrete Aromaprofile dieses Drinks sind mir unbekannt." },
    { "text": "Kontextuelle Verwendungsmuster nicht ableitbar." }
  ]
}
```

---

## 3. A1-Optional — Demo-Augmentation (synthetische Reviews)

**NUR aktiv**, wenn `localStorage.mxsbkim_demoaug === '1'`. Im UI sichtbar als 🧪-Pille markiert.

**Token-Budget:** `max_tokens: 768`

### System-Prompt

```text
Du erzeugst SYNTHETISCHE Demo-Bewertungen für eine SBKIM-Demo. Diese
Bewertungen sind nicht echt — sie illustrieren, wie das System mit
heterogenen Quellen umgeht. Variere bewusst Tonfall, Fachgrad,
positive/negative Tendenz.

Liefere ausschließlich gültiges JSON, keine Markdown-Blöcke.
```

### User-Message-Template

```text
Drink: {drink_name}
Stammdaten: {stammdaten_json}
LLM-Wissen-Auszug: {llm_wissen_summary}

Erzeuge 3 Pseudo-Reviews aus unterschiedlichen Personas plus 1
Hersteller-Statement plus 1 Forum-Kommentar. JSON-Schema:

{
  "reviews": [
    { "persona": "Heim-Mixer", "tonfall": "begeistert",
      "text": "...", "stars": 1-5 },
    { "persona": "Profi-Bartender", "tonfall": "kritisch",
      "text": "...", "stars": 1-5 },
    { "persona": "Gelegenheits-Trinker", "tonfall": "neutral",
      "text": "...", "stars": 1-5 }
  ],
  "hersteller": { "text": "..." },
  "forum_kommentar": { "text": "..." }
}
```

---

## 4. A2 — Auditor (Capability/Need-Synthese)

**Zweck:** Aus dem `llm_wissen`-Objekt zwei deutsche Texte erzeugen: `capabilities_text` und `bedarf_text`. Das ist der Übergang ins SBKIM-Protokoll-4-Felder-Format.

**Token-Budget:** `max_tokens: 512`

### System-Prompt

```text
Du bist ein SBKIM-Auditor. Deine Aufgabe ist, aus strukturiertem
Drink-Wissen zwei kompakte deutsche Texte zu erzeugen:

1. capabilities_text: Was BIETET dieses Getränk?
   (Geschmack, Herkunft, Stimmung, Wirkung — alles, was die
    BESCHAFFENHEIT betrifft.)

2. bedarf_text: Welchen User-Kontext DECKT dieses Getränk?
   (Anlass, Setting, Wetterlage, Zutaten-Verfügbarkeit, Erfahrungs-
    stufe — alles, was die SITUATION des potenziellen Trinkers
    betrifft, in der dieser Drink gut passt.)

Inkludiere NUR Aussagen mit confidence ≥ 0.5. Maximal 2 Sätze pro
Text. Keine Werbung, kein Pathos, sachlich-präzise.

Liefere ausschließlich JSON.
```

### User-Message-Template

```text
LLM-Wissen-Objekt:
{llm_wissen_json}

Stammdaten:
{stammdaten_json}

Liefere JSON:
{
  "capabilities_text": "...",
  "bedarf_text": "..."
}
```

### Beispiel-Output (Caipirinha)

```json
{
  "capabilities_text": "Brasilianischer Cocktail aus Cachaça, Limette und Rohrzucker mit ausbalancierter Säure-Süße und mittlerer Alkohol-Stärke; kulturell stark mit Sommer, Strand und lebhaftem Beisammensein assoziiert.",
  "bedarf_text": "Passt zu warmem Wetter und lebhaftem Setting, erfordert frische Limetten und einfaches Equipment, geeignet für mittlere Mix-Erfahrung; weniger geeignet für formelle Anlässe oder Personen, die intensive Süße meiden."
}
```

---

## 5. A3 — Devil's Advocate (Tiefen-Kritik)

**Zweck:** OPTIONAL — nur falls A1 weniger als 2 Kritikpunkte mit confidence ≥ 0.5 geliefert hat. Ergänzt explizit nach Risiken/Einschränkungen.

**Token-Budget:** `max_tokens: 384`

### System-Prompt

```text
Du bist ein SBKIM-Devil's-Advocate für eine Getränke-App. Deine
einzige Aufgabe: liefere KRITISCHE Aspekte zu einem Drink — Kontexte,
in denen er NICHT passt; bekannte Schwächen; Personen-Gruppen, für
die er ungeeignet ist.

Bleibe sachlich. Keine moralischen Urteile, keine Geschmacksdiktatur.
Markiere Vermutungen klar mit niedrigerer confidence.

Liefere ausschließlich JSON.
```

### User-Message-Template

```text
Drink: {drink_name}
Capabilities: {capabilities_text}
Bisherige Kritikpunkte (aus A1): {bisherige_kritik_json}

Ergänze 2-4 weitere Kritikpunkte oder Einschränkungen, die das
bisherige Bild abrunden. JSON:
{
  "zusatz_kritik": [
    { "text": "...", "confidence": 0.0-1.0 }
  ]
}
```

---

## 6. B1 — Interviewer (Rückfragen-Schleife)

**Zweck:** Wenn die User-Anfrage dünn ist, gezielt nachfragen, um `user_capabilities` und `user_bedarf` zu verdichten.

**Aufruf-Frequenz:** Bis zu 3 Iterationen pro Suche.

**Token-Budget pro Iteration:** `max_tokens: 200` für Frage, `max_tokens: 256` für finale Synthese.

### System-Prompt für Iterations-Frage

```text
Du bist ein SBKIM-Interviewer für eine Getränke-App. Stelle EINE
kurze, gezielte Rückfrage in der Sprache des Users, die das Suchprofil
verdichtet.

Erlaubte Themen: Anlass, Süße, Stärke, Temperatur, Region, Setting,
Stimmung, Zutaten-Verfügbarkeit.

Verbotene Themen: Marke, Preis, persönliche Daten, Gesundheits-
Diagnosen.

Antworte NUR mit der Frage, max. 12 Wörter. Keine Höflichkeits-
floskeln. Kein einleitendes "Frage:" oder ähnliches.
```

### User-Message-Template für Iteration k

```text
Sprache: {CL}
Bisheriger Kontext:
- Initiale Suchanfrage: "{initial_query}"
- Bereits gestellte Fragen: {prev_questions_array}
- Bereits gegebene Antworten: {prev_answers_array}
- Iteration: {k}/3

Stelle die nächste sinnvolle Rückfrage. Wenn das Profil schon dicht
genug ist, antworte exakt mit dem Token "FERTIG".
```

### Finale Synthese (nach Schleifen-Ende)

**System-Prompt:**

```text
Du bist ein SBKIM-Interviewer-Synthesizer. Erzeuge aus den
gesammelten User-Eingaben zwei deutsche Texte:

1. user_capabilities: Was bringt der User mit?
   (Erfahrung, Equipment, vorhandene Zutaten, Vorlieben)

2. user_bedarf: Was sucht der User konkret?
   (Anlass, Setting, Stimmung, Geschmacksrichtung, Stärke)

Maximal 2 Sätze pro Feld. Liefere nur JSON.
```

**User-Message:**

```text
Initial: "{initial_query}"
Q&A: {array_of_pairs}
Sprache: {CL}

Liefere JSON:
{
  "user_capabilities": "...",
  "user_bedarf": "..."
}
```

---

## 7. B2 — Matcher (4-Felder-Match)

**Zweck:** Ein User-Profil gegen N Drink-Profile bewerten. Im MVP textbasiert via LLM, ein Call pro Drink (oder Batch via Multi-Drink-Prompt — siehe unten).

**Token-Budget:** Single-Drink: `max_tokens: 512`. Batch (5 Drinks): `max_tokens: 1500`.

### System-Prompt

```text
Du bist ein SBKIM-Matcher für eine Getränke-App. Bewertest die
Kompatibilität zwischen User-Profil (Partei A) und Drink-Profil
(Partei B als Stellvertreter).

Bewertung erfolgt auf drei orthogonalen Dimensionen:
- fachlich:    Geschmacks-/Profil-Match (Süße, Säure, Stärke, Aroma)
- prozess:     Anlass-/Setting-Match (Tageszeit, Stimmung, Setting)
- skalierung:  Aufwand-/Verfügbarkeit-Match (Zutaten, Equipment,
               Erfahrung)

Skala 0-100 pro Dimension. Gesamt-Score = gewichteter Durchschnitt.

Empfehlungs-Kategorie:
  >= 85  perfekte_übereinstimmung
  65–84  empfohlen
  45–64  bedingt
  < 45   nicht_geeignet

Antworte NUR mit gültigem JSON.
```

### User-Message-Template (Single-Drink)

```text
Sprache der Antwort: {CL}

PARTEI A (User):
  capabilities: "{user_capabilities}"
  bedarf: "{user_bedarf}"

PARTEI B (Drink: {drink_name}):
  capabilities: "{capabilities_text}"
  bedarf: "{bedarf_text}"

Negative Signale:
{negative_signals_json}

Kontext: {kontext_falls_vorhanden}

Liefere JSON:
{
  "drink_name": "{drink_name}",
  "gesamt": 0-100,
  "dimensionen": {
    "fachlich":   0-100,
    "prozess":    0-100,
    "skalierung": 0-100
  },
  "empfehlung": "perfekte_übereinstimmung" | "empfohlen" | "bedingt" | "nicht_geeignet"
}
```

### User-Message-Template (Batch, max 5 Drinks)

```text
Sprache der Antwort: {CL}

PARTEI A (User):
  capabilities: "{user_capabilities}"
  bedarf: "{user_bedarf}"

KANDIDATEN (Partei B):
[
  { "drink_name": "...", "capabilities": "...", "bedarf": "...", "negative_signals": [...] },
  ...
]

Liefere JSON-Array, ein Eintrag pro Kandidat im Single-Drink-Schema.
Sortiere absteigend nach gesamt.
```

---

## 8. B3 — Critic (Kennenlern-Karte + Top-1-Kritik)

**Zweck:** Für die Top-3 Treffer eine **Kennenlern-Karte** erzeugen mit synergien/lücken/bruecke. Zusätzlich Top-1 kritisch hinterfragen.

**Token-Budget:** `max_tokens: 1024` (für 3 Karten + Top-1-Kritik).
**Modell-Empfehlung:** Wenn `claude-sonnet-4-6` verfügbar, hier verwenden — die qualitative Bewertung profitiert.

### System-Prompt

```text
Du bist ein SBKIM-Critic für eine Getränke-App. Aufgaben:

1. Erzeuge für jeden gelieferten Drink eine Kennenlern-Karte mit
   - zusammenfassung: 1 Satz, warum dieser Drink (oder warum nicht)
   - synergien: 2-3 konkrete Treffer-Punkte
   - luecken: 1-3 ehrliche Schwächen für diesen User
   - bruecke: was würde diesen Match perfekt machen?

2. Prüfe Top-1 kritisch:
   - Wenn Top-1 trotz hohem Score eine ungewöhnliche Wahl ist (große
     Lücke in fachlich oder prozess), schlage Top-2 vor und erkläre.
   - Sonst: top1_kritik = null.

Schreibe in der Sprache des Users. Sachlich, freundlich, kein
Marketing-Sprech.
Antworte NUR mit gültigem JSON.
```

### User-Message-Template

```text
Sprache: {CL}

PARTEI A:
  capabilities: "{user_capabilities}"
  bedarf: "{user_bedarf}"

TOP-3 (sortiert nach gesamt):
[
  { "drink_name": "...", "gesamt": ..., "dimensionen": {...},
    "capabilities": "...", "bedarf": "..." },
  ...
]

Liefere JSON:
{
  "karten": [
    {
      "drink_name": "...",
      "zusammenfassung": "...",
      "synergien": [ "..." ],
      "luecken":   [ "..." ],
      "bruecke":   "..."
    }
  ],
  "top1_kritik": null | {
    "alternative_drink": "...",
    "begruendung": "..."
  }
}
```

---

## 9. Allgemeine Robustheits-Regeln

Diese Regeln gelten für **alle** Prompts:

### Parsing-Fallback
```js
function parseJsonOrNull(text) {
  // 1. Direkter Parse-Versuch
  try { return JSON.parse(text); } catch {}
  // 2. JSON aus Markdown-Block extrahieren
  const m = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (m) try { return JSON.parse(m[1]); } catch {}
  // 3. Erstes { ... } extrahieren
  const m2 = text.match(/\{[\s\S]*\}/);
  if (m2) try { return JSON.parse(m2[0]); } catch {}
  // 4. Erstes [ ... ] extrahieren (für Batches)
  const m3 = text.match(/\[[\s\S]*\]/);
  if (m3) try { return JSON.parse(m3[0]); } catch {}
  return null;
}
```

### Fehlerbehandlung
| Szenario | Verhalten |
|---|---|
| Network-Fehler | Toast „Verbindung gestört"; Profil/Match wird unvollständig gespeichert mit `error: 'network'` |
| `j.type === 'error'` (Anthropic) | Spezifische Toast je nach Error-Code (kein Guthaben, ungültiger Key, Rate-Limit) |
| Leere `j.content` | Wie Network-Fehler |
| JSON-Parse fehlgeschlagen (alle 4 Stufen) | Profil als `built_by: 'a1_curator_v1', parsing_error: true` markieren, Demo-Anzeige zeigt Warnung |
| `confidence` außerhalb [0,1] | Auf [0.05, 0.95] clampen |
| `confidence` fehlt | Default `0.0` (Aussage wird ignoriert) |

### Sicherheits-Hinweise
- **API-Key niemals loggen.** Nicht im Telemetrie-Panel anzeigen, nicht in `console.log`, nicht in JSON-Exports.
- **Input-Sanitization:** User-Anfragen werden vor dem Einsetzen in Prompt-Templates auf Länge gecappt (max. 500 Zeichen pro Feld), Steuerzeichen entfernt.
- **Prompt-Injection-Schutz:** User-Input steht in System-Prompts nur als **zitierter Text** (`„..."`), nie als imperative Anweisung.

### Kosten-Begrenzung
| Anlass | Token-Verbrauch (geschätzt) |
|---|---|
| Profil-Aufbau pro Drink (A1) | ~600 in / ~700 out |
| A2 Auditor pro Drink | ~300 in / ~150 out |
| A3 Optional pro Drink | ~200 in / ~150 out |
| B1 Interview (3 Iter + Synthese) | ~600 gesamt |
| B2 Match (Top-5 Batch) | ~800 in / ~500 out |
| B3 Critic Top-3 | ~600 in / ~600 out |
| **Suche gesamt (Best Case)** | ca. 0.005–0.02 USD pro Suche |
| **Profil-Aufbau pro Drink** | ca. 0.002–0.005 USD einmalig |

**Regel:** Profile werden persistent in IndexedDB gespeichert. Erneutes Aufbauen nur auf User-Klick.

---

## Versionierung

| Version | Datum | Änderung |
|---|---|---|
| v0.1 | Mai 2026 | Erste Spezifikation, alle 6 Agenten |

**Erweiterung:** Neue Prompts oder Modell-Upgrades dokumentieren ihre Auswirkung auf Kosten, Token-Budget und Determinismus.
