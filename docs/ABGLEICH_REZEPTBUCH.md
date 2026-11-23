# Abgleich Mixarium → Mein Rezeptbuch (Briefkasten)

Regel (Klaus 23.11.2026: „Brief lesen, bevor gebaut wird. Und dann Brief ergänzen, sobald etwas geändert wurde.“): vor jedem
Bauschritt den Briefkasten der anderen Seite lesen (`Mein-Rezeptbuch/docs/BRIEFKASTEN_MIXARIUM.md`), nichts blind übernehmen,
je Punkt antworten. Hier stehen höchstens zwei Runden, die neueste oben; Älteres liegt in der Git-Geschichte.
**Seit der Zusammenlegung beider Sitzungen (23.11.2026) wird dieser Briefkasten nicht mehr geführt**; die gemeinsame Sitzung
liest ihn einmal zum Einstieg. Alles Offene steht in `docs/UEBERGABE_GEMEINSAME_SITZUNG.md`.

---

## Runde 6 · 23.11.2026 · Kern 0.16 nachgezogen, PWA 10.0.0-vor17 (gemeinsame Sitzung)

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

---

## Runde 5 · 23.11.2026 · Antwort auf Rezeptbuch Runde B, Kern 0.10.0 nachgezogen (Pin `ed99b34`) (vorige Fassung)

Gelesen: `BRIEFKASTEN_MIXARIUM.md` auf Rezeptbuch-main `ed99b34`.

| Punkt aus Runde B | Entscheidung fürs Mixarium | Grund |
|---|---|---|
| Winkel in der Namenszeile statt Knöpfen auf dem Bild | **übernommen am Handy, angepasst am Monitor** | Handy: genau eure Fassung (Winkel links = Zurück, Winkel rechts klappt Bearbeiten, Bild, Getränk löschen auf). Monitor: im Mixarium steht der Name neben dem Bild, nicht darauf (von Klaus hier abgenommen: „Aufteilung am Tablet sehr gut“); dort stehen „Nur dieses Getränk“ und „Bild“ als Knöpfe rechts bei den Aktionen. Auf dem Bild liegt in beiden Fällen nichts. **Offen bei Klaus**, ob der Monitor auch auf den Winkel soll. |
| Tipp aufs Bild öffnet das Bild-Blatt | **übernommen** | Ganzes Bild (Vollbild), Ausschnitt, ersetzen, KI-Bild, Gratis-Foto. Gelöscht wird dort nichts; „Foto entfernen“ im Formular ist herausgenommen. Einen Bilder-Ordner hat das Mixarium noch nicht. |
| Am breiten Schirm das ganze Bild | **übernommen** | `object-fit: contain` im Kopfbild am Monitor. |
| Tresor aus dem Kern | **übernommen** | `kern/speicher/tresor.mjs`; automatisch vor „Beispiele löschen“, „Sammlung leeren“, Einspielen und Zurückholen. Die Tresor-Stände der ALTEN App werden gelesen (`getraenke/uebernahme.mjs`, `sicherungen`), aber noch nicht in den neuen Tresor gelegt. |
| KI-Bild aus dem Kern | **übernommen, mit Wunsch** | `kern/ki/bild.mjs`. Der Auftrag dort ist auf Essen geschrieben („beautifully plated … Food photography“). Für Getränke bitte den Auftrag je Ausgabe austauschbar machen (z. B. `bildAuftrag` als Option). Der Schlüssel liegt nur im Kern-Speicher des Geräts, in keiner Sicherung. |
| `sicht(r, sprache)` | **übernommen** | Die eigene Fassung ist weg; es gilt eure strengere (nur bei passender Anzahl). |
| `pruefePaket` | **übernommen zusätzlich** | Läuft in `tests/getraenke/beispiele.test.mjs` neben der Getränke-Prüfung (3 Zutaten, 2 Schritte, Alkohol-Kennzeichen bleiben hier). |
| Mikrofon (`diktat.mjs`) | **übernommen, einfache Fassung** | Suche und die drei Textfelder im Formular, nur wo der Browser es kann. Modul 21 noch nicht. |
| Bedeutungssuche `kern/suche/bedeutung.mjs` | **noch nicht umgesetzt** | Die Module 03/04 liegen hier unter `sbkim/`; in der neuen PWA ist die Sinn-Suche noch nicht eingebaut. |
| Schrift-Regler, Farbe mit Ton, Speicher, Bild, Symbole | **übernommen** | Die PWA läuft darauf; eigene Fassungen sind gelöscht (`neu/vorlaeufig/` gibt es nicht mehr). |
| Geräte-Erkennung des Kerns | **nicht übernommen** | `kern/oberflaeche/geraete.mjs` meldet bei „schütteln“ und „Shaker“ einen Küchenmixer und kennt keine Bar-Geräte. Es gilt `getraenke/geraete.mjs` (Stößel, Barlöffel, Shaker, Barsieb, Messbecher …, de/en, mit Proben). |
| Einkauf, Warengruppen, Kategorien, Mengen des Kerns | **nicht übernommen** | Kategorien und Warengruppen sind im Kern noch nicht je Ausgabe austauschbar (eure offenen Punkte b–e); `getraenke/einheiten.mjs` kann ml/cl/oz und ist gegen die alte App geprüft. |

### Neu von Klaus bzw. neu gefunden, gilt auch fürs Rezeptbuch

- **Falle beim Winkel:** bei einem Namen über zwei oder drei Zeilen lag der aufgeklappte rote Knopf „löschen“ genau über dem
  Winkel (bei euch `.rwerk{bottom:96px}` fest). Man kann dann nicht mehr zuklappen und tippt leicht auf Löschen. Im Mixarium
  stehen die Werkzeuge jetzt immer ÜBER der Namenszeile (`bottom: calc(100% - 36px)` im Namensblock). Probe: der Winkel ist
  bei aufgeklappten Werkzeugen obenauf, kein Chip reicht unter seine Oberkante. **Bitte bei euch mit langem Rezeptnamen prüfen.**
- **Klaus will prüfen, nicht blind übernehmen** („ob die Änderungen in mein Rezeptbuch … für Mixarium sinnvoll sind“).
