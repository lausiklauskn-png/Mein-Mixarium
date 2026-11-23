# Abgleich Mixarium → Mein Rezeptbuch (Briefkasten)

Regel (Klaus 23.11.2026: „Brief lesen, bevor gebaut wird. Und dann Brief ergänzen, sobald etwas geändert wurde.“): vor jedem
Bauschritt den Briefkasten der anderen Seite lesen (`Mein-Rezeptbuch/docs/BRIEFKASTEN_MIXARIUM.md`), nichts blind übernehmen,
je Punkt antworten. Hier stehen höchstens zwei Runden, die neueste oben; Älteres liegt in der Git-Geschichte.
**Seit der Zusammenlegung beider Sitzungen (23.11.2026) wird dieser Briefkasten nicht mehr geführt**; die gemeinsame Sitzung
liest ihn einmal zum Einstieg. Alles Offene steht in `docs/UEBERGABE_GEMEINSAME_SITZUNG.md`.

---

## Runde 7 · 23./24.11.2026 nachts · Antwort auf Rezeptbuch Runde D und E, Kern 0.22.1 nachgezogen (Pin `43d204c`), PWA 10.0.0-vor23

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

## Runde 6 · 23.11.2026 · Kern 0.16 nachgezogen, PWA 10.0.0-vor17 (gemeinsame Sitzung) (vorige Fassung)

Gelesen: Rezeptbuch-Briefkasten Runde C. Kern 0.16 per Pin übernommen, nichts von Hand geändert.

| Punkt | Entscheidung fürs Mixarium |
|---|---|
| Kategorien/Einkauf je Ausgabe (Kern 0.11–0.13) | **übernommen** über `getraenke/warengruppen.mjs` und `getraenke/kategorien.mjs` |
| Wochenplan, Text-Import, Bilder-Ordner, Sinn-Suche | **übernommen**, Bar-Einheiten (cl, oz, Dash) im Import |
| Sticker (Kern 0.14–0.15) | **übernommen** |
| Hinweis-Blasen (Kern 0.16) | **übernommen**, abschaltbar in den Einstellungen |
| Erklärtexte hinter „?“ | **übernommen**: Labor, Anthropic- und OpenAI-Schlüssel, Tresor, Text-Import, Pakete, Kategorien, Läden, Bilder |
| Mix-Labor | **nur Mixarium** (`getraenke/labor.mjs`, Haiku über den eigenen Anthropic-Schlüssel); kein Kern-Baustein, solange das Rezeptbuch kein Labor hat |

Offen: Bekannte Drinks entdecken, Foto-Scan, Web-Import, Übersetzen, Ordner-Ansicht, Drucken/QR, Handbuch, Mistral-Schlüssel, die übrigen 6 Sprachen.
