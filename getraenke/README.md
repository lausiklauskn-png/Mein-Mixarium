# getraenke/ – die Getränke-Schicht von Mein Mixarium

Reines ESM, keine Abhängigkeiten, läuft im Browser und in Node 22. Alles hier ist **rein**: keine Funktion liest einen
Speicher, zeichnet etwas oder geht ins Netz. Die Logik stammt aus der heutigen App (`QC_Mixarium_20_04_26.html`); jede
Datei nennt im Kopf, aus welcher Funktion und QC-Zeile ihre Regeln kommen. Die QC-Datei und `index.html` bleiben unberührt.

## Die Module

| Datei | Was sie tut | Woher (QC) |
|---|---|---|
| `einheiten.mjs` | Mengen lesen (Dezimalkomma, `1/2`, `½`, `2-3`, leer), Einheiten erkennen, ml ↔ cl ↔ oz, zwischen metrisch und US umrechnen, Portionen skalieren, System aus der Locale, Menge und Einheit trennen | `parseAmt`, `fmtNum`, `scaleAmt` (~12032), `_unitKind`, `convertAmtUnitLocal` (~5627) |
| `glaeser.mjs` | Glastypen und Temperaturen in 8 Sprachen, Symbol-Kennung statt Emoji | `GLASS_TYPES`, `TEMPS` (~5753) |
| `kategorien.mjs` | die 10 Getränke-Kategorien, das Familien-Wörterbuch (18), `katVonRezept`, `ordnerVonRezept`, mitgebrachte Kategorien, eigene Namen, Reihenfolge | `CATS`, `KAT_FAMILIE`, `catsFremd`, `catsAlle` (~5739–6111) |
| `alkohol.mjs` | „hat Alkohol“ und der Schalter „Ohne Alkohol“ genau wie alt; dazu ein strengerer Befund mit Zutaten-Stichworten | `alcAllowed` (~8085) |
| `geraete.mjs` | 13 Gerätschafts-Zeichnungen (64er Raster) und `geraeteFuerSchritt(text)` | Zeichnungen wörtlich aus `docs/vorschau/mixarium-neu.html` |
| `uebernahme.mjs` | Daten aus der alten App (localStorage + IndexedDB-Dump) und aus Sicherungen lesen, zusammenführen ohne Dubletten, Beispiele einspielen und löschen, Sammlung leeren, Ausgaben `store` und `voll` | `boot`, `sv`, `_zusammenfuehren`, `importData`, `importJsonFromVault` |
| `index.mjs` | exportiert alles | |

## Was bewusst NICHT hier ist (kommt aus dem Küchen-Kern)

Oberfläche und Kochansicht, Speichern und Laden (localStorage, IndexedDB), die Übersetzungs-Engine, Farben und
Strichstärken der Zeichnungen, Import-Dialoge, Bilder verkleinern, SBKIM/Mycel. `uebernahme.mjs` bekommt die alten
Speicherwerte **übergeben** und gibt ein Modell zurück; wer liest und wer schreibt, entscheidet der Kern.

## Das Modell

Ein Getränk behält die Feldnamen der alten App (`id`, `name`, `cat`, `folder`, `alcohol`, `glass`, `servings`, `ings`,
`steps`, `img`, `rating`, `herkunft` …) und jedes unbekannte Feld. Neu bzw. zugesichert:

- `uid` an jedem Getränk; eine mitgebrachte bleibt, `id` ist nur die lokale Nummer.
- Zutaten getrennt: `{amt, unit, name}`. Getrennt wird nur, wenn der ganze Rest eine bekannte Einheit ist (`"4 cl"` ja,
  `"1 Fresh"` nein); das Original steht dann in `amtRoh`.
- `cat` getrimmt; leer heißt „ohne Kategorie“ und wird nicht geraten.
- `uidFrisch: true` an Getränken aus einer Sicherung, die **keine** `uid` mitbrachten. Solche werden beim Zusammenführen
  über den Namen verglichen; in der Sammlung trägt niemand die Marke.
- Beispiele: `beispiel: "<paket>"` und `beispielPruef` (Prüfwert des Inhalts beim Einspielen).

## Zusammenführen ohne Dubletten (aus `_zusammenfuehren`)

1. Eingehende `uid` gibt es schon → kommt nicht dazu; die längere Herkunfts-Kette gewinnt.
2. Eingehende `uid` gibt es nicht → kommt dazu, auch bei gleichem Namen.
3. Ohne `uid` (alte Sicherungen) → kommt nur dazu, wenn der Name (getrimmt, klein) noch nicht vorkommt.
4. Ohne Namen kommt nichts dazu.

Neues steht vorn; Ordner und eigene Kategorien aus der Datei kommen mit, vorhandene werden nicht überschrieben.

## Benannte Abweichungen von der alten App

| Wo | Alt | Hier | Grund |
|---|---|---|---|
| `mengeLesen("10.5")`, `"20,5"`, `"100.25"` | 1,5 / 2,5 / 10,25 | 10,5 / 20,5 / 100,25 | Rechenfehler der Regel für „1½“ (`mixed2`, QC ~12044) |
| `mengeLesen("1 ½")` | 1 | 1,5 | kommt in Klaus' Beispielbuch vor |
| `katsFremd` bei `"sushi "` | zweiter, leerer Reiter | eine Kennung | gedeutete statt rohe Kennung (Brief des Rezeptbuchs 23.11., Abschnitt 5) |
| dieselbe `uid` zweimal in einer Datei | beide kommen | eine kommt | Dubletten über `uid` |
| benanntes Getränk mit `blank: true` | nur über die Suche zu finden | `blank` fällt weg, gezählt im Befund | Brief, Abschnitt 5 |
| `pt` als Sprache | US-Maße (`LANG_UNIT_SYSTEM`) | metrisch; das Land entscheidet | Vorgabe: en-US, en-LR, my → US |
| Getränke aus IndexedDB statt localStorage | nur auf iOS, wenn dort mehr liegt | immer, wenn dort mehr liegt | bei vollem Speicher schreibt `sv` nur noch die IndexedDB |

Alles andere rechnet gleich; die Proben laden die alten Funktionen aus der QC-Datei und vergleichen.

## Grenzen

- **Die alte App erkennt Alkohol nur an der Kategorie `ckt` und am Feld `alcohol`.** Eine Erkennung über Zutaten gibt es
  dort nicht. `alkoholBefund` (Stichworte de/en) ist neu, ein Hinweis und kein Beweis, und wird nur für die
  Store-Ausgabe benutzt. Er kann danebengreifen: Kochrezepte mit Wein werden herausgenommen; Bitter (Angostura),
  „Martini“, „Port“, „Cider“ stehen nicht in der Liste; steht in einer Zutat „Sirup“, „Aroma“ oder „alkoholfrei“, gilt sie
  als entlastet. Jedes herausgenommene Getränk steht mit Grund in `entfernt`.
- **Ein nacktes `en` gilt als US** (wie in der alten App und wie CLDR es ergänzt). `en-GB`, `en-AU` … sind metrisch.
- **EL, TL und Barlöffel werden nicht in ml umgerechnet** – die alte App tut es auch nicht (EL ↔ tbsp, TL ↔ tsp, 1:1).
- **Gläser und Temperaturen:** die Namen für es, fr, it, pt sind ergänzt (`ERGAENZT`), nicht von Klaus gegengelesen.
  `glass: "bowle"` und freie Glas-Texte aus TheCocktailDB sind keine Kennung der Liste und bleiben, wie sie sind.
- **Gerätschaften** haben Namen nur in de und en. Die Erkennung ist eine Wörterliste: „gewürfelte Mango“ meldet ein
  Messer, auch wenn im Schritt nichts geschnitten wird.
- **Der IndexedDB-Dump ist nicht an einem echten Gerät gemessen.** Die Struktur (`kv`, Zeilen `{k, v}`) ist aus dem
  Quelltext abgelesen; die Proben stellen sie nach.
- **Nicht übernommen:** API-Schlüssel (`mxkey9m`, `mxmistralkey9m`, `mxoaiimg9m`), Thema, Bedienhilfen, Bewertungs- und
  Hinweis-Merker. Sie stehen im Befund unter `nichtUebernommen` bzw. `unbeachtet` – nur der Name, nie der Wert.
- **Einkaufsliste:** die alte App speichert keine; `einkauf` ist im Modell leer angelegt.
- **Nichts davon ist im Browser gefahren.** Gemessen ist in Node 22.

## Proben

```bash
npm test                                    # node --test "tests/getraenke/*.test.mjs"
node tests/getraenke/gegenprobe.mjs         # Sabotage in einer Wegwerf-Kopie; Rückgabewert direkt lesen
NUR_ANKER=1 node tests/getraenke/gegenprobe.mjs
```

`tests/getraenke/_alt.mjs` holt die alten Funktionen wörtlich aus der QC-Datei (die **letzte** Deklaration, wie der
Browser: `parseAmt` steht dort zweimal, ~11037 und ~12032) und führt sie in einem eigenen `vm`-Kontext aus.
