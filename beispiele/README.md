# Beispielgetränke für Mein Mixarium

Hier entsteht die Beispielsammlung, die die neue App beim ersten Start anbietet. Getrennt vom Programm, damit sie
sich austauschen lässt.

## So lieferst du Bilder und Sicherungen (Klaus)

**Weg 1 – Ordner im Repo** (für einzelne Bilder bis 25 MB je Datei):
GitHub → Repo Mein-Mixarium → Ordner `beispiele/eingang/bilder/` → „Add file“ → „Upload files“ → Bilder hineinziehen →
unten „Commit directly to the main branch“ → „Commit changes“. JSON-Sicherungen genauso nach `beispiele/eingang/json/`.

**Weg 2 – Release** (für große Mengen, wie im Rezeptbuch mit `eingang-bilder`):
https://github.com/lausiklauskn-png/Mein-Mixarium/releases/new?tag=eingang-bilder&title=Eingang%20Bilder
→ Dateien unten in „Attach binaries“ ziehen → „Publish release“. Für Sicherungen dasselbe mit dem Tag `eingang-json`:
https://github.com/lausiklauskn-png/Mein-Mixarium/releases/new?tag=eingang-json&title=Eingang%20JSON

Dateinamen dürfen bleiben, wie sie sind; am besten heißt ein Bild wie das Getränk („Virgin Mojito.jpg“).
Alles, was hier ankommt, ist Rohmaterial: die Sitzung sortiert, verkleinert (höchstens 1600 px, ohne Metadaten),
ordnet zu und legt das Ergebnis als Paket ab. Die Rohdateien gehen nicht in die App.

Mein Rezeptbuch bereitet ebenfalls Getränke für das Mixarium vor (8 mit Alkohol, dazu alkoholfreie im Beispielbuch).
Sie werden übernommen, sobald das Rezeptbuch damit fertig ist und sie auf dessen main liegen.

## Was daraus wird

| Datei | Inhalt |
|---|---|
| `beispiele/getraenke.json` | Paket ohne Alkohol (für Google Play und Web), Format wie eine Sicherung (`version: 10`) |
| `beispiele/getraenke-mit-alkohol.json` | Zusatzpaket mit Alkohol, nur bei ausgeschaltetem „Ohne Alkohol“ angeboten |
| `beispiele/bilder/` | die verkleinerten Bilder, oder eingebettet im Paket |

## Beispiele löschen und neu aufbauen (wie in Mein Rezeptbuch)

- Jedes Beispiel trägt eine feste Kennung `uid` und die Marke `beispiel: "<Paketname>"`.
- **Alle Beispiele löschen** (Einstellungen → Beispiele): ein Klick entfernt alles mit der Marke `beispiel`.
  Was du an einem Beispiel geändert hast, wird vorher genannt und bleibt auf Wunsch stehen (die Marke fällt dann weg).
- **Sammlung leeren**: entfernt alle Getränke, Ordner, Karten und die Einkaufsliste – erst nach einer Sicherung,
  die die App vorher anbietet. Danach ist die App leer und lässt sich neu aufbauen.
- **Neu aufbauen**: Beispielpaket erneut laden oder eine eigene JSON-Sicherung einspielen. Doppelte werden an der
  `uid` erkannt, Kategorien und Ordner kommen mit.
- So kann jede und jeder eigene Getränke sammeln, die App leeren und mit eigener Sammlung neu anfangen.
