# SBKIM Mein Mixarium — DEMO_CASES

**Status:** MVP-Spezifikation · Mai 2026 · v0.1
**Zweck:** Dieses Dokument definiert die Demo-Fälle, die als **Akzeptanztest** für das MVP dienen. Wenn alle hier beschriebenen Fälle das spezifizierte Verhalten zeigen, gilt SBKIM-MVP als „lauffähig demonstriert".

**Bezug:**
- `RULES.md` — Verhaltensregeln
- `PROMPT_TEMPLATES.md` — konkrete LLM-Prompts

---

## Inhalt

1. Aufbau eines Demo-Falls
2. Demo-Set: 5 Fälle
   - DC1: Bekannter Drink, klare Anfrage → präziser Match
   - DC2: Bekannter Drink mit Kritikpunkten → A3 sichtbar
   - DC3: Dünne Anfrage → B1-Interview erzwungen
   - DC4: Lab-Drink (unbekannt) → ehrlich dünnes Profil
   - DC5: Cross-Region-Entdeckung → kulturelle Querverbindung
3. Telemetrie-Anforderungen
4. Akzeptanz-Kriterien
5. Anti-Demo-Fälle (was NICHT passieren darf)

---

## 1. Aufbau eines Demo-Falls

Jeder Demo-Fall hat folgende Struktur:

| Feld | Bedeutung |
|---|---|
| **ID** | DC1–DC5 |
| **Titel** | Kurzbeschreibung |
| **These** | Welche der 5 SBKIM-Thesen wird hier beweisen (T1–T5, siehe vorige Analyse) |
| **Vorbereitung** | Welche Drinks müssen im Profil-Pool sein, welche Settings |
| **User-Eingabe** | Exakte Suchanfrage (deutsch) |
| **Erwartetes Verhalten** | Was das System sichtbar tun muss |
| **Akzeptanzkriterium** | Wann der Fall als bestanden gilt |
| **Negativ-Erwartung** | Was NICHT passieren darf |
| **Demo-Skript** | Schritt-für-Schritt-Anleitung für den Vortrag |

---

## 2. Demo-Set

---

### DC1 — Bekannter Drink, klare Anfrage → präziser Match

**These:** T1 (Bidirektionale Profile schlagen unidirektionales Retrieval)

**Vorbereitung:**
- Caipirinha (TheCocktailDB-ID `11000`) ist im Profil-Pool, A1-Profil-Aufbau abgeschlossen
- Mojito, Daiquiri, Tequila Sunrise, Aperol Spritz ebenfalls im Pool
- Sprache: Deutsch
- Side-by-side-Modus aktiv (klassische Volltextsuche neben SBKIM)

**User-Eingabe:**
```
Etwas Erfrischendes für einen heißen Sommerabend mit Freunden, leicht süß
```

**Erwartetes Verhalten:**
1. B2-Matcher liefert Top-3 mit deutlichen Scores
2. Caipirinha auf Position 1 oder 2, gesamt ≥ 75
3. Aperol Spritz auf Position 1 oder 2 (alternative Kandidaten-Logik OK)
4. B3-Critic erzeugt Kennenlern-Karte mit Synergien wie *„passt zu Sommer-Setting"*, Lücken wie *„etwas süßer als gewünscht"*
5. Volltextsuche mit derselben Anfrage findet **keinen** dieser Treffer (weil „erfrischend" und „Sommerabend" keine Stichwörter im Rezept sind)

**Akzeptanzkriterium:**
- ✅ Mindestens ein kulturell zur Anfrage passender Drink ist in den Top-3
- ✅ Volltextsuche-Ergebnisse sind sichtbar **schwächer** (keine semantische Treffer-Logik)
- ✅ Kennenlern-Karte zeigt mindestens 2 Synergien und 1 Lücke

**Negativ-Erwartung:**
- ❌ Score ist nicht sichtbar
- ❌ Kein Kennenlern-Text, nur eine Liste
- ❌ Caipirinha rangiert hinter Drinks ohne kulturelle Sommer-Assoziation

**Demo-Skript:**
1. Suchfeld öffnen, Anfrage eintippen
2. Auf „Suchen" klicken
3. Telemetrie zeigt: A1 (cached) → B2 → B3
4. Top-3 mit Karten erscheinen
5. Side-by-side-Tab umschalten → klassische Volltext-Trefferliste sichtbar leer/schwach
6. Auf Caipirinha-Karte klicken → Profil-Inspektor öffnet sich → A1-Wissen + A2-capabilities sichtbar

---

### DC2 — Bekannter Drink mit Kritikpunkten → A3 sichtbar

**These:** T1 + T2 (Profile + Trust-Modell, mit ehrlicher Negativ-Darstellung)

**Vorbereitung:**
- Long Island Iced Tea ist im Profil-Pool, A1-Profil-Aufbau abgeschlossen
- A3-Devil's-Advocate hat mindestens 2 Negativ-Signale extrahiert (z.B. *„extrem hoher Alkoholgehalt"*, *„Gefahr der Überdosierung"*)
- Sprache: Deutsch

**User-Eingabe:**
```
Etwas Starkes für eine kleine Runde, möglichst nicht zu süß
```

**Erwartetes Verhalten:**
1. Long Island Iced Tea ist Top-1 oder Top-2 (passt zu „stark")
2. Kennenlern-Karte zeigt explizit **Lücken**: *„sehr süß durch Sour Mix"*, *„extrem starker Alkohol-Gehalt — kann überfordern"*
3. Bruecke-Feld: *„Mit weniger Sour Mix und ohne Cola wird der Drink trockener"*
4. B3-Critic prüft Top-1 — wenn der Süße-Konflikt zu groß ist, schlägt er Alternative vor (z.B. Negroni oder Boulevardier)

**Akzeptanzkriterium:**
- ✅ Negative Signale werden in der Kennenlern-Karte explizit benannt
- ✅ Profil-Inspektor zeigt `negative_signals`-Array mit confidence-Werten
- ✅ B3-Top-1-Kritik wird sichtbar, wenn Lücken-Schwere > Schwelle

**Negativ-Erwartung:**
- ❌ Drinks werden geschönt dargestellt
- ❌ A3-Befunde verschwinden silent ohne UI-Sichtbarkeit

**Demo-Skript:**
1. Anfrage eintippen, suchen
2. Top-3 Karten — Long Island Iced Tea als Treffer mit kritischer Karte
3. Auf 🛡️-Symbol klicken → A3-Negativsignale ausklappen
4. Hinweis-Banner: *„Critic schlägt Alternative vor: Negroni"*

---

### DC3 — Dünne Anfrage → B1-Interview erzwungen

**These:** T3 (Iterative Query-Expansion verbessert Trefferqualität)

**Vorbereitung:**
- Mindestens 10 Drink-Profile im Pool, breit gestreut nach fachlich/prozess/skalierung
- Sprache: Deutsch
- Telemetrie-Panel sichtbar

**User-Eingabe:**
```
Was Süßes
```

**Erwartetes Verhalten:**
1. B1 erkennt: Anfrage < 6 Wörter, startet Interview
2. Frage 1 (typisch): *„Soll der Drink alkoholisch sein?"*
3. User antwortet: *„nein"*
4. Frage 2: *„Wie warm soll der Drink sein — kalt, lauwarm oder heiß?"*
5. User antwortet: *„kalt"*
6. Frage 3: *„Trinkst du allein oder in Gesellschaft?"*
7. User antwortet: *„allein"*
8. B1-Synthese erzeugt `user_capabilities` (z.B. *„Single-Konsum, alkoholfrei, kalt"*) und `user_bedarf`
9. B2 + B3 laufen → Top-3 Smoothies/Mocktails sichtbar

**Akzeptanzkriterium:**
- ✅ Genau 3 Iterationen werden durchgeführt (Hard-Limit)
- ✅ Jede Frage ist max. 12 Wörter (siehe `RULES.md` § 7)
- ✅ Side-by-side-Vergleich: ohne Interview vs. nach Interview — sichtbarer Score-Unterschied
- ✅ Telemetrie-Panel zeigt alle Q&A-Paare

**Negativ-Erwartung:**
- ❌ Mehr als 3 Rückfragen
- ❌ Frage zu Marke/Preis/persönlichen Daten
- ❌ User wird in Endlos-Schleife geführt

**Demo-Skript:**
1. Suchfeld: „Was Süßes" eintippen
2. Modal mit 3 Rückfragen erscheint nacheinander
3. User antwortet
4. Top-3 erscheinen mit Score
5. Tab „Ohne Interview" zeigt deutlich schwächere Top-3 (gleiche Anfrage, nur Volltextsuche)
6. Telemetrie zeigt: B1-Token-Verbrauch < 600

---

### DC4 — Lab-Drink (unbekannt) → ehrlich dünnes Profil

**These:** T1 (mit ehrlicher Degradation bei dünner Datenbasis)

**Vorbereitung:**
- User hat im Labor einen Drink namens „Holunder-Salbei-Sprizz" generiert (KI-Vorschlag, hypothetische Eigenkreation)
- A1 wurde aufgerufen, hat `kenne_ich_drink: false` zurückgegeben
- `drink_type = 'unbekannt'` im Profil
- Profile-Inspektor sichtbar

**User-Eingabe:**
```
Suche etwas Leichtes mit Kräuter-Note für einen Sommernachmittag
```

**Erwartetes Verhalten:**
1. Holunder-Salbei-Sprizz erscheint in den Top-5, aber **mit niedrigerem Score** als bekannte Drinks mit ähnlichem Profil
2. Kennenlern-Karte zeigt explizit: *„Profil basiert nur auf Stammdaten — geringe Datenbasis"*
3. Profil-Inspektor zeigt: A1-Wissen weitgehend leer, `unsicher`-Array gefüllt
4. Kein A3-Negativsignal (da kein LLM-Wissen)

**Akzeptanzkriterium:**
- ✅ System sagt **ehrlich**, dass die Datenbasis dünn ist
- ✅ Lab-Drink wird **nicht** durch Inferenz aufgebläht
- ✅ Bekannte Drinks rangieren bei gleicher Passung höher (Trust-bonus)

**Negativ-Erwartung:**
- ❌ System tut so, als ob es den Drink kennt
- ❌ A1 erfindet `kontexte` für unbekannte Drinks
- ❌ Score-Boost für „originelle" Eigenkreation, der nicht durch Daten gedeckt ist

**Demo-Skript:**
1. Lab → Rezept erfinden („Holunder-Salbei-Sprizz")
2. Speichern → SBKIM-Profil-Aufbau läuft → A1 meldet `kenne_ich_drink: false`
3. Suchfeld: passende Anfrage
4. Top-5 erscheinen — Lab-Drink Position 4 oder 5, mit *„ℹ️ geringe Datenbasis"*-Pille
5. Profil-Inspektor öffnen → leeres `kontexte`, gefülltes `unsicher`

---

### DC5 — Cross-Region-Entdeckung → kulturelle Querverbindung

**These:** T1 + T4 (Bidirektionale Profile + PWA-Tragfähigkeit, mit semantischer Querverbindung jenseits Stichwort-Filter)

**Vorbereitung:**
- Profil-Pool enthält brasilianische, mexikanische, vietnamesische, US-amerikanische und mediterrane Drinks
- Cross-Region-Modus aktiv (Filter „alle Regionen")
- Sprache: Deutsch

**User-Eingabe:**
```
Etwas mit Säure-Süße-Kontrast und Frische, gerne mit Kräutern
```

**Erwartetes Verhalten:**
1. SBKIM matched über Regionen hinweg auf das **Geschmacksprofil**, nicht auf Region
2. Top-3 enthält Drinks aus **mindestens 2 verschiedenen Regionen** (z.B. Caipirinha aus Brasilien + Tom Collins mit Minze + Vietnamesisches Lemongras-Limetten-Mocktail)
3. Kennenlern-Karten machen die kulturelle Querverbindung sichtbar (*„Säure-Süße-Kontrast in unterschiedlichen Traditionen"*)
4. Wenn Region-Filter aktiviert: Top-3 reduziert auf eine Region, sichtbarer Verlust an Vielfalt

**Akzeptanzkriterium:**
- ✅ Cross-Region findet semantische Verwandtschaft, die Stichwort-Filter nicht findet
- ✅ Mindestens 2 Regionen in Top-3 vertreten
- ✅ Toggle „nur eigene Region" reduziert Vielfalt sichtbar

**Negativ-Erwartung:**
- ❌ Top-3 alle aus derselben Region trotz Cross-Region-Modus
- ❌ Region-Filter macht keinen Unterschied im Ergebnis

**Demo-Skript:**
1. Filter „alle Regionen" aktivieren
2. Anfrage eintippen, suchen
3. Top-3 zeigt internationale Auswahl
4. Region-Toggle auf „nur Brasilien" → Top-3 reduziert sich, Vielfalt verschwindet
5. Anschauungs-Beispiel für „semantisches Matching schlägt geographische Filter"

---

## 3. Telemetrie-Anforderungen

Jeder Demo-Fall MUSS im Telemetrie-Panel sichtbar machen:

| Metrik | Beschreibung |
|---|---|
| Aktive Agenten | Liste mit Reihenfolge und Status (running/done/skipped) |
| Latenz pro Agent | in ms |
| Token-Verbrauch pro Agent | in/out separat |
| Kosten-Schätzung | summiert in USD |
| Profile-Cache-Trefferquote | wie viele A1-Profile aus Cache vs. neu gebaut |
| Score-Komponenten | α·base + β·rating − γ·neg − δ·dem aufgeschlüsselt |

---

## 4. Akzeptanz-Kriterien (gesamt-MVP)

Das MVP gilt als **demonstrationsbereit**, wenn:

- ✅ Alle 5 Demo-Fälle (DC1–DC5) zeigen das spezifizierte Verhalten in mindestens 9 von 10 Durchläufen
- ✅ Telemetrie-Panel zeigt alle Pflichtmetriken
- ✅ Kennenlern-Karten erscheinen für mindestens Top-3 in jedem Fall
- ✅ Side-by-side-Vergleich (klassisch vs. SBKIM) ist in DC1, DC3, DC5 sichtbar funktional
- ✅ Profile werden nach erstem A1-Aufbau persistent — keine Wiederholung bei zweiter Suche
- ✅ Bei Verlust des Internets werden vorhandene Profile weiterhin funktional gematched (nur die KI-Funktionen sind dann pausiert, App selbst läuft)
- ✅ Kosten pro Suche < 0.05 USD
- ✅ Latenz pro Suche < 8 Sekunden im Best Case (cached profiles)

---

## 5. Anti-Demo-Fälle (was NICHT passieren darf)

Diese Verhaltensweisen sind **fail conditions** für den MVP:

| Anti-Pattern | Warum problematisch |
|---|---|
| System „kennt" einen Lab-Drink, ohne ihn wirklich zu kennen | Lügt über Datenbasis → SBKIM-Trust-Modell ist hohl |
| KI-generierte Pseudo-Reviews werden als „echte Bewertungen" angezeigt | Ethisch grenzwertig |
| API-Key erscheint im Telemetrie-Panel oder Logs | Sicherheit |
| Suche schlägt fehl, wenn kein Internet → ganze App unbenutzbar | Verstößt gegen Offline-First-Versprechen der App selbst |
| Mehr als 3 B1-Rückfragen | Verstößt gegen Hard-Limit, frustriert User |
| Endlos-Schleife in Critic-Demotion | Score-Stabilität nicht gewährleistet |
| Demo-Fall liefert sichtbar unterschiedliches Verhalten in zwei Durchläufen mit identischem Input | `temperature: 0` nicht respektiert → Reproduzierbarkeits-Fehler |

---

## Erweiterung dieser Datei

Neue Demo-Fälle MÜSSEN:
1. Eine spezifische SBKIM-These zuordnen
2. Reproduzierbar sein (gleiche Drinks, gleiche Anfrage → gleiches Verhalten)
3. Akzeptanzkriterium und Negativ-Erwartung explizit benennen
4. Demo-Skript für Vortragssituation enthalten

---

## Versionierung

| Version | Datum | Änderung |
|---|---|---|
| v0.1 | Mai 2026 | Initiale 5 Demo-Fälle |
