# Abgleich Mixarium → Mein Rezeptbuch (Briefkasten)

Regel (Klaus 23.11.2026: „Brief lesen, bevor gebaut wird. Und dann Brief ergänzen, sobald etwas geändert wurde.“): vor jedem
Bauschritt den Briefkasten der anderen Seite lesen (`Mein-Rezeptbuch/docs/BRIEFKASTEN_MIXARIUM.md`), nichts blind übernehmen,
je Punkt antworten. Hier stehen höchstens zwei Runden, die neueste oben; Älteres liegt in der Git-Geschichte.
**Seit der Zusammenlegung beider Sitzungen (23.11.2026) wird dieser Briefkasten nicht mehr geführt**; die gemeinsame Sitzung
liest ihn einmal zum Einstieg. Alles Offene steht in `docs/UEBERGABE_GEMEINSAME_SITZUNG.md`.

---

## Runde 8 · 26.11.2026 · Antwort auf Rezeptbuch Runde K, Kern 0.33.3 nachgezogen, PWA 10.0.0-vor43

- **Übernommen:** Kern 0.32–0.33.3 (Doppelte im ganzen Bestand, Mengen-Regel mit mindestens drei verschiedenen Mengen, Namen in anderer
  Schrift, Fotos als WebP 1600, „Platz sparen“). Auf der Bilder-Seite „Doppelte suchen“ und „Platz sparen“ (vor42).
- **Aus Klaus' Rezeptbuch (26.11.):** die 8 Getränke mit Alkohol in der überarbeiteten Fassung (bisherige Kennungen bleiben), dazu ein
  neues Paket „Getränke & Fingerfood aus dem Rezeptbuch“ (10 alkoholfreie Getränke, Pizza-Toast, Gyoza, Ebi Tempura), erzeugt mit
  `tools/rezeptbuch-getraenke.py` aus `Mein-Rezeptbuch/beispiele/rezeptbuch-2026-11-26.json`. Glas-Angaben werden auf die Kennungen des
  Mixariums gebracht. Die Startgetränke bleiben (Klaus: „vorläufig“).
- **Zurück an das Rezeptbuch:** die Paket-Prüfung des Mixariums fand fünf Rezepte, in denen eine Zutat in keinem Schritt vorkam
  (Solero, Frucht-Shake, Amaretto Sunrise, Pizza-Toast, Gyoza) – im Rezeptbuch nachgebessert (0.19.13).
- **Warengruppen:** neue Gruppe „Kaffee, Tee & Gewürze“; Obst/Kräuter und Kühlregal kennen mehr Wörter (Zucker bleibt Vorrat).

## Runde 7 · 23./24.11.2026 nachts · Antwort auf Rezeptbuch Runde D und E, Kern 0.22.1 nachgezogen (Pin `43d204c`), PWA 10.0.0-vor23 (vorige Fassung)

Gelesen: `BRIEFKASTEN_MIXARIUM.md` Runde D und E. Kern per Pin übernommen, nichts von Hand geändert.

| Punkt | Entscheidung fürs Mixarium |
|---|---|
| Gestaltung vom Abend (kein Erklärtext, Wasserfarben-Felder, einklappbare Einstellungen, Kopf mit Suche/Farbe/Plus, fliegende Leiste mit Sonne/Mond und „Sichern“) | **übernommen** (vor22) |
| Foto-Scan, Web-Import, Schlüssel (Kern 0.18–0.20) | **übernommen** (vor20–vor22) |
| Ordner (Kern 0.20) | **übernommen als Fenster**, nicht als eigene Ansicht: so sind im Mixarium auch die Kategorien gebaut |
| Menü am Rezept (Kern 0.21) | **übernommen, angepasst:** Reihenfolge Drucken, QR, Übersetzen, Rechtschreibung, Nährwerte; die Einheiten-Wahl gibt es hier schon an anderer Stelle (ml/cl/oz), nicht gedoppelt |
| Sprachtabellen (Kern 0.22) | **übernommen**; eigene Tabellen `neu/sprachen/` mit Werkzeug `tools/sprach-schluessel.mjs` (`--fehlt`, `--trage-ein`, `--pruefe`) |
| Zusätze (`neu/zusatz.mjs`: KI-Richter, KI-Bilder für alle, Bildauftrag, alte Tresor-Stände, Buch, Handbuch, hoher Kontrast, „Vom Teller“) | **in Arbeit** (folgt als vor24) |

### Zurück ans Rezeptbuch (gefunden im Mixarium)

- Die Meldung mit Knopf lag bei 390 px und langem Text außerhalb des Bildes → im Rezeptbuch behoben (0.14.0).
- Der Kern druckte Notizen zum ganzen Rezept nicht → Kern 0.22.1.
- „von 12 Rezepten“ in der Auskunft → `vieleText` im Kern 0.22.1.
- Offen im Kern: die Kostenschätzung liefert nur den langen Satz (die Kurzzeile baut das Mixarium selbst); der Ladebalken hat kein „Abbrechen“.

---
