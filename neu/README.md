# Mein Mixarium – neue Fassung (PWA, Vorab)

Adresse nach dem Veröffentlichen: `https://lausiklauskn-png.github.io/Mein-Mixarium/neu/`.
Die bisherige App (`../index.html`, `../QC_Mixarium_20_04_26.html`) bleibt unverändert online, bis Klaus die neue abgenommen hat.
Erst danach kommen APK und Windows-Paket (Klaus 23.11.2026: „mach die PWA fertig, damit ich mir die anschauen kann“).

Kein Bau-Schritt: reine ES-Module, läuft direkt von GitHub Pages. Gestaltung nach `docs/vorschau/mixarium-neu.html`
(von Klaus abgenommen).

## Was woher kommt

| Teil | Ort |
|---|---|
| Speicher, Tresor, Farben mit Hell/Dunkel, Schrift-Regler, Bild verkleinern, Symbole, Spracheingabe, KI-Bild, `sicht` | Küchen-Kern `../kern/` (byte-gleich aus Mein Rezeptbuch, Pin `../KERN-PIN.json`) |
| Einheiten, Gläser, Kategorien, Alkohol, Gerätschaften, Übernahme, Beispiele, Ausgaben | Getränke-Schicht `../getraenke/` (mit Proben) |
| Getränke-Symbole, Platzhalterbild, Lesen der alten App | `getraenke-symbole.mjs`, `platzbild.mjs`, `alt.mjs` |
| Oberfläche, Einkaufsliste, Getränkekarten | `app.mjs`, `app.css` – **vorläufig**, bis der Kern dafür Bausteine hat |

Stand, Offenes und Fallen: `../docs/UEBERGABE_GEMEINSAME_SITZUNG.md`.

## Was diese Fassung kann

Getränke ansehen, suchen, nach Kategorie filtern, „Ohne Alkohol“; Getränk mit Foto, Glas, Temperatur, Portionen umrechnen,
ml/cl/oz; anlegen, bearbeiten (mit Foto, verkleinert auf 1600 px), löschen; Mix-Ansicht im Vollbild mit Bild, Zutaten und
Gerätschaften je Schritt, Wischen/Pfeiltasten/Esc, Bildschirm bleibt an; Einkaufsliste (zusammengerechnet, nach Gruppen,
abhaken, teilen); Getränkekarten für einen Anlass; Tresor; Bild-Blatt mit Ausschnitt, KI-Bild und Gratis-Foto; Spracheingabe; Farbe (im Dunkeln durchgehend getönt), hell/dunkel, Sprache, Einheiten, Schriftgröße als Schieberegler (85–150 %, wirkt sofort); Beispiele laden und
mit einem Tipp löschen; Sicherung speichern und einspielen (Format der alten App, `version: 10`); Sammlung leeren;
Übernahme aus der bisherigen App beim ersten Start (nur lesen); offline nach dem ersten Laden; fliegende Leiste am Handy,
Leiste links am Monitor, „Nur dieses Getränk“.
Ordner (eigene Sammlungen neben den Kategorien; Kern `modell/ordner.mjs`): anlegen, umbenennen, ordnen, löschen (die Getränke
bleiben), ein Getränk über seine Werkzeuge hineinlegen oder herausnehmen; ein Ordner frisst die Kategorie nicht.
Menü am Getränk (Winkel → „Mehr“; Kern `ausgabe/druck.mjs`, `teilen/qr.mjs`, `ki/helfer.mjs`): Drucken (wie am Bildschirm: Portionen,
ml/cl/oz), Teilen per QR-Code (Link im Format der bisherigen App; er öffnet das Getränk im Formular), Übersetzen in eine der acht
Sprachen mit Umschalter aufs Original, Rechtschreibung prüfen, Nährwerte schätzen. Einstellungen → KI: „Alle übersetzen“ mit
Kostenhinweis, abbrechbar. KI-Zeilen sagen, was an wen geht; ohne Schlüssel kommt erst das Schlüssel-Fenster.

## Was noch fehlt (benannte Grenzen)

- Stand der Nacht 23./24.11.: `../docs/UEBERGABE_GEMEINSAME_SITZUNG.md`, Abschnitt „Nacht“ (Labor, KI-Bild, Foto-Scan und die
  Schlüssel sind eingebaut).
- **Bücher/PDF** – Daten werden übernommen und bleiben erhalten, die Oberfläche dafür fehlt noch.
- **Oberfläche in acht Sprachen:** Deutsch und Englisch stehen im Code, die übrigen sechs kommen aus Tabellen (Abschnitt „Sprachen“);
  fehlt ein Eintrag, steht Englisch da. Kategorien und Gläser tragen ihre Namen in allen acht Sprachen selbst.
- **SBKIM/Mycel** ist hier nicht eingebunden (nicht sichtbar, kein Netz). Das Einhängen als unsichtbares, freischaltbares
  Modul kommt mit dem Kern.
- **Intro** gibt es in dieser Fassung keines; die App zeigt sofort Inhalt.
- **Bilder der Beispiele** sind gezeichnet, bis Klaus' Fotos da sind (`../beispiele/README.md`).
- Nicht gemessen: am Tablet und Handy von Klaus, Ladezeit, Verhalten bei sehr großen Sammlungen mit vielen Fotos.

## Sprachen

Deutsch und Englisch stehen im Code: `L('Speichern', 'Save')`. Spanisch, Französisch, Italienisch, Portugiesisch, Russisch und
Chinesisch kommen aus `sprachen/<code>.mjs` (`export default { 'Deutscher Text': 'Übersetzung', … }`, Reihenfolge wie im Code,
ein Eintrag je Zeile); ohne Eintrag steht Englisch da. `tabellenLaden()` in `app.mjs` lädt sie beim Start und beim Sprachwechsel
(erst die Tabelle des Kerns, dann die der App; bei gleichem Schlüssel gilt die der App).

Neue Texte so schreiben, dass eine Tabelle sie trifft – die Probe `tests/getraenke/sprachen.test.mjs` wird sonst rot:

- Zahlen und Namen über `fuelle`: `fuelle(L('{0} von {1} offen', '{0} of {1} open'), a, b)`, nie ``L(`${a} von ${b} offen`, …)``.
- Einzahl und Mehrzahl als zwei ganze Sätze: `n === 1 ? L('1 Getränk', '1 drink') : fuelle(L('{0} Getränke', '{0} drinks'), n)`.
  Nicht Zahl + Wort zusammensetzen: Russisch braucht „Напитков: 7“.
- Ein deutsches Wort mit zwei Bedeutungen braucht zwei Schlüssel („Ordner“ als Mehrzahl: `ordMehr()`, Schlüssel `'Ordner{0}'`).

```bash
node tools/sprach-schluessel.mjs --pruefe              # fehlt ein Schlüssel, ist einer überzählig? (Rückgabewert 1, wenn etwas fehlt)
node tools/sprach-schluessel.mjs --fehlt fr > x.json   # die Lücken einer Sprache als { "Deutsch": "English" } – übersetzen, dann:
node tools/sprach-schluessel.mjs --trage-ein fr x.json # einsortieren; die Tabelle wird in Code-Reihenfolge neu geschrieben
node tools/sprach-schluessel.mjs --bericht             # was keine Tabelle treffen kann
```

Benannte Grenze (steht im Bericht des Werkzeugs): die Namen der Gerätschaften stehen schon in den Tabellen, laufen aber noch nicht
über `text()`; dort steht in den sechs Sprachen Englisch.

## Prüfen

```bash
node tests/smoke_neu_pwa.mjs              # echter Browser, Handy und Monitor
node tests/smoke_neu_ordner.mjs           # Ordner; Gegenprobe: python3 -u tests/gegenprobe_neu_ordner.py
node tests/smoke_neu_menue.mjs            # Menü am Getränk, Alle übersetzen (KI gestellt); Gegenprobe: gegenprobe_neu_menue.py
npm test                                  # Getränke-Schicht
node tools/kern-nachziehen.mjs --pruefen  # Kern stimmt mit dem Pin überein
node tests/smoke_neu_sprachen.mjs         # Sprach-Tabellen im echten Browser (misst die Tabellen, nicht die Verdrahtung)
```

Zuletzt gemessen (23.11.2026): `smoke_neu_pwa` 63 grün · 0 ROT; Getränke-Schicht und Beispiele 86 von 86; von Hand nachgestellt:
Alkohol-Paket trotz Schalter angeboten → 1 ROT; App füllt den Schirm nicht → 3 ROT.
