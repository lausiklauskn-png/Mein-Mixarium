# SBKIM Mein Mixarium — RULES

**Status:** MVP-Spezifikation · Mai 2026 · v0.1
**Geltungsbereich:** Mein Mixarium (Demo-Plattform) für das offene SBKIM-Protokoll
**Verbindlichkeit:** Diese Regeln definieren das Verhalten der 6 Agenten. Jede Implementierung MUSS die hier festgelegten Regeln einhalten oder ihre Abweichung explizit dokumentieren.

---

## Inhalt

1. Begriffsbestimmungen
2. Quellen-Klassifikation und Trust-Basislevel
3. Profil-Schema (Partei B)
4. Synthese-Regeln A1 (Curator)
5. Trust-Regeln A2 (Auditor)
6. Negativ-Signal-Regeln A3 (Devil's Advocate)
7. User-Profil-Regeln B1 (Interviewer)
8. Match-Regeln B2 (Matcher)
9. Critic-Regeln B3
10. Confidence-Skala
11. Ergänzungs-Inferenz
12. Domänen-Mapping (3 Dimensionen für Getränke)
13. Sprache und Mehrsprachigkeit
14. Was NICHT gemacht wird (Anti-Regeln)

---

## 1. Begriffsbestimmungen

| Begriff | Definition |
|---|---|
| **Partei A** | Der Mensch vor dem Gerät, der ein Getränk sucht. Liefert eine natürlichsprachliche Suchanfrage und ggf. Antworten auf Rückfragen. |
| **Partei B** | Das gesuchte Getränk. Existiert in der App **nicht aktiv** — wird durch ein **Stellvertreter-Profil** repräsentiert, das SBKIM aus mehreren Quellen synthetisiert. |
| **Stellvertreter-Profil** | JSON-Objekt mit `capabilities` und `bedarf` (was bietet das Getränk, welchen User-Kontext deckt es). Erzeugt von A1+A2, geprüft von A3. |
| **Externe Quelle** | Jede Information über ein Getränk, die NICHT vom aktuellen User stammt. Im MVP: TheCocktailDB-Stammdaten + LLM-Wissensextraktion. |
| **LLM-Wissen** | Wissen, das im Trainingsmaterial des Sprachmodells enthalten ist (Bartender-Foren, Wikipedia, Mixology-Bücher, öffentliche Reviews). Wird vom LLM komprimiert geliefert. |
| **Confidence** | Wahrscheinlichkeit `[0,1]`, mit der das LLM oder das System eine Aussage als zutreffend einschätzt. Quelle der Trust-Werte. |
| **Drink-Typ** | `bekannt` (LLM-Vorwissen vorhanden) / `halbbekannt` / `unbekannt` (z.B. User-Lab-Generierung). Bestimmt Profil-Tiefe und Demo-Verhalten. |

---

## 2. Quellen-Klassifikation und Trust-Basislevel

Jede Aussage zu einem Drink wird einer Quellenkategorie zugeordnet. Die Quelle bestimmt das **Vertrauens-Basislevel** (vor Konsistenz-/Widerspruchs-Adjustments).

| Quellenkategorie | Beispiel | Trust-Basislevel |
|---|---|---|
| **stammdaten** | TheCocktailDB-Eintrag (Name, Zutaten, Anleitung) | 0.85 |
| **llm_wissen_etabliert** | LLM-Antwort mit `confidence ≥ 0.8` | 0.70 |
| **llm_wissen_geläufig** | LLM-Antwort mit `0.5 ≤ confidence < 0.8` | 0.50 |
| **llm_wissen_unsicher** | LLM-Antwort mit `confidence < 0.5` | 0.25 |
| **user_eigen** | User-Bewertung im Lab (`labRatings`) | 0.60 |
| **user_eigen_gelobt** | User-Drink mit `labStatus: 'accepted'` | 0.65 |
| **synthetisch_demo** | Im MVP für Demo-Zwecke generierte Pseudo-Reviews — IMMER sichtbar markiert | 0.30 |

**Regel:** Trust-Basislevel sind **initial values, kalibrierungsbedürftig**. Sie sind keine Naturkonstanten.

---

## 3. Profil-Schema (Partei B)

Jedes Stellvertreter-Profil wird in IndexedDB unter dem Schlüssel `sbkim_profiles` mit folgendem Schema persistiert:

```js
{
  id: 'sbkim_<dbId|recipeId>',
  source_type: 'thecocktaildb' | 'lab_generated' | 'user_manual',
  source_id: '11000',                    // dbId oder lokale recipeId
  drink_type: 'bekannt' | 'halbbekannt' | 'unbekannt',
  built_at: 1717000000000,
  built_by: 'a1_curator_v1',

  // Stammdaten (von TheCocktailDB oder User)
  stammdaten: {
    name: 'Caipirinha',
    region: 'Brasilien',                 // soweit ermittelbar
    kategorie: 'ckt',
    glas: 'old-fashioned',
    alkoholisch: true,
    zutaten: ['Cachaça', 'Limette', 'Rohrzucker', 'crushed ice'],
    anleitung_de: '...',
  },

  // LLM-Wissens-Extrakt (Schwerpunkt SBKIM)
  llm_wissen: {
    herkunft:         { text, confidence },
    kontexte:         [ { text, confidence } ],   // Anlässe, Settings
    geschmacksprofil: [ { text, confidence } ],
    synergien:        [ { text, confidence } ],   // Speisen, Stimmungen
    kritikpunkte:     [ { text, confidence } ],   // → A3 Negativsignale
    unsicher:         [ { text } ]
  },

  // Vom Auditor (A2) erzeugt: 4-Felder-Tupel im SBKIM-Protokoll-Format
  capabilities_text: '...',              // Was BIETET dieses Getränk
  bedarf_text:       '...',              // Welchen User-Kontext DECKT es

  // Embeddings (im MVP nicht zwingend, optional für künftige Phasen)
  capabilities_embedding: null,
  bedarf_embedding: null,

  // Vom Advocate (A3)
  negative_signals: [ { text, confidence, source } ],

  // Score-relevante Felder
  demotion_count: 0,
  user_rating_avg: null,                 // 0..1, falls User bewertet hat
}
```

**Regel:** Felder dürfen nicht entfernt werden. Neue Felder bekommen ein Default `null` oder `[]`.

---

## 4. Synthese-Regeln A1 (Curator)

A1 ist der **einzige Agent, der externe Quellen anzapft**. Aufgaben:

1. **Stammdaten ziehen** aus TheCocktailDB (`lookup.php?i=<id>`) oder aus dem lokalen `R[]`-Eintrag bei Lab-Drinks.
2. **LLM-Wissen extrahieren** mit einem einzigen Claude-Call (Modell: `claude-haiku-4-5-20251001`, sonst Sonnet falls verfügbar). Prompt-Template siehe `PROMPT_TEMPLATES.md` § A1.
3. **Drink-Typ bestimmen:**
   - `bekannt`, wenn LLM `herkunft.confidence ≥ 0.7` UND mindestens 3 `kontexte` mit confidence ≥ 0.5
   - `unbekannt`, wenn LLM `herkunft.confidence < 0.3` ODER weniger als 1 `kontexte`
   - sonst `halbbekannt`
4. **Synthetisches Demo-Material (optional):** NUR wenn der User die Demo-Augmentation explizit aktiviert hat (`localStorage.mxsbkim_demoaug` = `'1'`). Pseudo-Reviews werden mit `source: 'synthetisch_demo'` gespeichert und im UI sichtbar als 🧪 markiert.

**Regel:** A1 läuft **lokal pro Drink, einmalig** beim Übernehmen aus Discover oder bei Lab-Save. Manuelles Re-Curating durch User-Knopf möglich. KEIN automatisches Re-Curating bei jeder Suche (Rate-Limit-Schutz, Latenz, Kosten).

---

## 5. Trust-Regeln A2 (Auditor)

A2 transformiert das `llm_wissen`-Objekt in `capabilities_text` und `bedarf_text` und gewichtet jedes Element nach Trust:

```
trust(aussage) = base(quellentyp) + bonus_konsistenz - malus_widerspruch

base: siehe § 2
bonus_konsistenz: +0.05 pro übereinstimmender weiterer Quelle (max +0.15)
malus_widerspruch: -0.10 pro widersprechender Quelle (max -0.25)
clamp: [0.05, 0.95]
```

### Synthese zu `capabilities_text`
Liefert in einem Satz oder kurzem Absatz, was das Getränk **bietet**. Nur Aussagen mit `trust ≥ 0.5` werden inkludiert. Beispiel:

> *„Cachaça-basierter Cocktail mit Limette und Rohrzucker, süß-säuerlich, alkoholisch, brasilianische Herkunft, kulturell mit Sommer und Erfrischung assoziiert."*

### Synthese zu `bedarf_text`
Welchen **User-Kontext deckt** das Getränk. Beispiel:

> *„Passt zu warmem Wetter, lebhaftem Setting, Limetten-Verfügbarkeit, mittlerer Mix-Erfahrung; weniger geeignet für formelle Anlässe oder Personen, die Süße meiden."*

**Regel:** A2 erzeugt **deutsche Texte** (App-Hauptsprache). Übersetzung in andere Sprachen erst on-demand bei Anzeige.

---

## 6. Negativ-Signal-Regeln A3 (Devil's Advocate)

A3 nimmt das `llm_wissen.kritikpunkte`-Array und überträgt es nach Filterung in `negative_signals`:

**Filter:**
- `confidence ≥ 0.4` → übernehmen
- Trivialitäten („enthält Alkohol" für alkoholische Drinks) werden verworfen
- Doppelte Aussagen (semantisch ähnlich) werden zusammengefasst

**Ergänzung:**
- A3 darf zusätzlich **explizit** nach Risiken/Einschränkungen fragen, falls das LLM keine geliefert hat (zweiter Mini-Call). Optional, im MVP nicht Pflicht.

**Regel:** Negative Signale werden **separat vom positiven Profil** gespeichert. Im Match werden sie als Penalty wirksam — siehe `B2 Matcher`.

---

## 7. User-Profil-Regeln B1 (Interviewer)

B1 erzeugt das User-Seiten-Pendant zu `capabilities_text` / `bedarf_text`:

```js
{
  user_capabilities: '...',  // Was kann/will der User mitbringen
                              //  (Erfahrungsstufe, vorhandene Zutaten, Equipment)
  user_bedarf: '...'         // Was sucht der User (Anlass, Stimmung, Geschmack)
}
```

### Wann B1 läuft
- Wenn die initiale Suchanfrage **kürzer als 6 Wörter** ist UND nicht explizit reine Namenssuche
- ODER wenn `B2`-Match `needsMoreContext = true` zurückgibt (Score-Differenz Top-1 zu Top-2 < 0.05)
- ODER wenn der User explizit „Verfeinern" anklickt

### Hard-Limits
- **Maximal 3 Rückfragen** pro Suche
- **Frage = max. 12 Wörter**, formuliert nach festem System-Prompt
- **Themen erlaubt:** Anlass, Süße, Stärke, Temperatur, Region, Setting, Stimmung, Zutaten-Verfügbarkeit
- **Themen verboten:** Marke, Preis, persönliche Daten

### Abbruch-Bedingungen
- 3 Iterationen erreicht → Abbruch
- User antwortet leer / „weiter" → Abbruch
- LLM-Antwort fehlt / Fehler → Abbruch mit aktueller Query-Verdichtung

**Regel:** Jede Rückfrage und Antwort wird im Telemetrie-Panel sichtbar protokolliert.

---

## 8. Match-Regeln B2 (Matcher)

B2 vergleicht User-Profil mit allen vorhandenen Drink-Profilen. Im MVP ohne Embeddings (textbasierter LLM-Match), Embedding-Variante optional in Phase 2.

### Match-Modi

**MVP-Modus (textbasiert, einfach):**
- Single LLM-Call mit allen 4 Feldern (User: caps+bedarf, Drink: caps+bedarf) UND Kontext
- LLM gibt strukturiertes JSON zurück (siehe SBKIM-Protokoll-Antwort: `gesamt`, `dimensionen`, `synergien`, `lücken`, `bruecke`)
- Top-N werden nach `gesamt` sortiert

**Optional Phase 2 (Embedding-Modus):**
- Lokale Embeddings via Transformers.js (`paraphrase-multilingual-MiniLM-L12-v2`)
- Cosine-Similarity über `capabilities_embedding`
- B3 ergänzt anschließend die qualitative Bewertung (synergien/lücken/bruecke)

### Score-Formel (für Sortierung)
```
final_score = α · base_match
            + β · user_rating_avg            // wenn vorhanden, sonst 0
            - γ · negative_penalty
            - δ · demotion / max_demotion

α = 0.65   β = 0.20   γ = 0.10   δ = 0.05
clamp(demotion, 0, max_demotion)            // demotion-Cap zwingend
```

`base_match` ∈ [0,1] kommt aus B2-LLM-Antwort (`gesamt / 100`).
`negative_penalty` = Anzahl `negative_signals` mit confidence ≥ 0.5, normiert auf [0,1] (max 5 Signale).

**Regel:** `final_score` muss **explizit clamped** werden auf [0,1], damit die Anzeige stabil ist.

---

## 9. Critic-Regeln B3

B3 erzeugt für jeden Top-N-Treffer eine **Kennenlern-Karte** mit:

```js
{
  drink_name, gesamt_match, dimensionen: { fachlich, prozess, skalierung },
  empfehlung: 'perfekte_übereinstimmung' | 'empfohlen' | 'bedingt' | 'nicht_geeignet',
  zusammenfassung: '<ein Satz>',
  synergien: [ '<satz>', ... ],
  luecken:    [ '<satz>', ... ],
  bruecke: '<was würde diesen Match perfekt machen>'
}
```

### Selbstkorrektur
B3 prüft Top-1 zusätzlich kritisch:
- Wenn Top-1 trotz hohem Score eine ungewöhnliche Wahl ist (z.B. Geschmacksprofil-Lücke groß) → Critic schlägt Top-2 vor und erklärt warum
- Demotion: Wenn B3 Top-1 ablehnt, wird `demotion_count++` für die laufende Session (nicht persistent)

**Regel:** B3 läuft nur über die Top-3 Treffer (Kosten-Begrenzung). Tieferplazierte Treffer bekommen nur Score, keine Kennenlern-Karte.

---

## 10. Confidence-Skala

Verbindliche Auslegung der LLM-`confidence`-Werte:

| Bereich | Bedeutung | Beispiel |
|---|---|---|
| 0.9–1.0 | Etabliertes Faktum | „Caipirinha stammt aus Brasilien" |
| 0.7–0.9 | Mehrfach belegt, geringe Streuung | „Caipirinha ist ein Sommerdrink" |
| 0.5–0.7 | Häufig erwähnt, einzelne Gegenstimmen | „Caipirinha ist süß" |
| 0.3–0.5 | Vereinzelt erwähnt, kontextabhängig | „Caipirinha wird oft mit Schweinefleisch serviert" |
| 0.0–0.3 | Spekulativ oder strittig | „Caipirinha ist gut für Verdauung" |

**Regel:** Das LLM wird im System-Prompt explizit auf diese Skala verpflichtet (siehe `PROMPT_TEMPLATES.md`).

---

## 11. Ergänzungs-Inferenz

Wenn das LLM zu einem **bekannten** Drink Aussagen liefert, die durch mehrfache Erwähnung in seinem Trainingsmaterial gestützt sind (`confidence ≥ 0.5`), darf SBKIM auch **implizite** Eigenschaften ableiten:

- Aus 5 Aussagen über „Sommer" → implizit „erfrischend" mit `confidence = 0.6`
- Aus „brasilianisch" + „Limette" → implizit „mit Säure-Süße-Kontrast" mit `confidence = 0.5`

**Regel:** Implizit abgeleitete Aussagen MÜSSEN mit `inferred: true` markiert werden. Confidence ist max. 60% des Maximalwerts der Quell-Aussagen.

Bei **unbekannten** Drinks (`drink_type === 'unbekannt'`) gilt: **keine Inferenz**, Profil bleibt ehrlich dünn. Das System zeigt im UI: *„Profil basiert nur auf Stammdaten — geringe Datenbasis."*

---

## 12. Domänen-Mapping (3 Dimensionen für Getränke)

Das offene SBKIM-Protokoll definiert drei orthogonale Match-Dimensionen. Für die Getränke-Domäne wird festgelegt:

| SBKIM-Dimension | Getränke-Mapping | Beispiel-Aspekte |
|---|---|---|
| `fachlich` | **Geschmacks-/Profil-Match** | Süße, Säure, Stärke, Aroma, Alkohol-Stärke |
| `prozess` | **Anlass-/Setting-Match** | Tageszeit, Anlass, Setting, Stimmung, soziale Situation |
| `skalierung` | **Aufwand-/Verfügbarkeit-Match** | Zutatenverfügbarkeit, Equipment, Erfahrungsstufe, Zubereitungszeit |

**Regel:** Diese Mapping-Tabelle ist Teil der Spec. Andere Domänen würden andere Mappings definieren — die Drei-Dimensionen-Struktur bleibt protokollkonform.

### Empfehlungs-Schwellen
| `gesamt` | Empfehlung |
|---|---|
| ≥ 85 | `perfekte_übereinstimmung` |
| 65–84 | `empfohlen` |
| 45–64 | `bedingt` |
| < 45 | `nicht_geeignet` |

---

## 13. Sprache und Mehrsprachigkeit

- **Profil-Aufbau (A1, A2, A3):** immer in Deutsch (App-Hauptsprache, robusteste LLM-Performance für Mein-Mixarium-Domäne)
- **Match (B2, B3):** in der **aktuellen User-Sprache** (`CL`)
- **Interview (B1):** in der **aktuellen User-Sprache**

**Regel:** Wechselt der User die Sprache, werden Profile NICHT neu gebaut — nur die Antwort-Texte (B2/B3) werden neu generiert.

---

## 14. Was NICHT gemacht wird (Anti-Regeln)

Diese Anti-Regeln verhindern bekannte SBKIM-Pathologien:

| Anti-Regel | Begründung |
|---|---|
| **Keine** unmarkierten synthetischen Reviews | Verhindert Rutsch in ethische Grauzone |
| **Keine** harten Trust-Konstanten ohne Disclaimer | § 2 markiert Werte als kalibrierungsbedürftig |
| **Kein** automatisches Re-Curating bei jeder Suche | Rate-Limits, Latenz, Kosten |
| **Keine** Daten-Übertragung an Dritte (außer TheCocktailDB Stammdaten-Lookup und Anthropic-API für LLM) | Offline-First-Versprechen, lokale Daten |
| **Kein** Differential Privacy oder Gossip im MVP | Erst nach Single-Device-Stabilität sinnvoll |
| **Keine** Behauptung „DSGVO-konform anonym" für DP — falls in Phase 2 doch eingeführt: nur „pseudonym" | Juristisch sauber |
| **Kein** Embedding-Modell > 50 MB im MVP | Mobile-Performance |
| **Kein** SBKIM-Pfad für Drinks ohne `dbId` UND ohne Lab-Daten | Verhindert leere Profile |

---

## Versionierung

| Version | Datum | Änderung |
|---|---|---|
| v0.1 | Mai 2026 | Erste Spezifikation |

**Erweiterung dieser Datei:** nur durch PR mit User-Approval. Jede Regel-Änderung MUSS ihre Auswirkung auf bestehende Profile dokumentieren (Migration nötig? Rückwärtskompatibel?).
