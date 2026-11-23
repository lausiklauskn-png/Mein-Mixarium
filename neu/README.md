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

## Was noch fehlt (benannte Grenzen)

- Stand der Nacht 23./24.11.: `../docs/UEBERGABE_GEMEINSAME_SITZUNG.md`, Abschnitt „Nacht“ (Labor, KI-Bild, Foto-Scan und die
  Schlüssel sind eingebaut).
- **Ordner, Kategorien umbenennen/anlegen/sortieren, Bewertung, Bildausschnitt wählen, Bücher/PDF, QR-Teilen, Tresor mit
  mehreren Sicherungen, Wochenplan** – Daten werden übernommen und bleiben erhalten, die Oberfläche dafür fehlt noch.
- **Oberfläche in der App noch nur Deutsch und Englisch.** Kategorien und Gläser sind in 8 Sprachen übersetzt; die Tabellen für
  die übrige Oberfläche liegen bereit, die App lädt sie noch nicht (Abschnitt „Sprachen“).
- **SBKIM/Mycel** ist hier nicht eingebunden (nicht sichtbar, kein Netz). Das Einhängen als unsichtbares, freischaltbares
  Modul kommt mit dem Kern.
- **Intro** gibt es in dieser Fassung keines; die App zeigt sofort Inhalt.
- **Bilder der Beispiele** sind gezeichnet, bis Klaus' Fotos da sind (`../beispiele/README.md`).
- Nicht gemessen: am Tablet und Handy von Klaus, Ladezeit, Verhalten bei sehr großen Sammlungen mit vielen Fotos.

## Sprachen

Deutsch und Englisch stehen im Code: `L('Speichern', 'Save')`. Spanisch, Französisch, Italienisch, Portugiesisch, Russisch und
Chinesisch kommen aus `sprachen/<code>.mjs` (`export default { 'Deutscher Text': 'Übersetzung', … }`, Reihenfolge wie im Code,
ein Eintrag je Zeile); ohne Eintrag steht Englisch da. Geladen werden sie mit `ladeTabelle(code, [Adresse])` aus
`../kern/oberflaeche/sprache.mjs` – das ist in `app.mjs` noch nicht verdrahtet. Die Texte des Kerns haben eigene Tabellen (`../kern/sprachen/`).

```bash
node tools/sprach-schluessel.mjs --pruefe              # fehlt ein Schlüssel, ist einer überzählig? (Rückgabewert 1, wenn etwas fehlt)
node tools/sprach-schluessel.mjs --fehlt fr > x.json   # die Lücken einer Sprache als { "Deutsch": "English" } – übersetzen, dann:
node tools/sprach-schluessel.mjs --trage-ein fr x.json # einsortieren; die Tabelle wird in Code-Reihenfolge neu geschrieben
node tools/sprach-schluessel.mjs --bericht             # was keine Tabelle treffen kann
```

Benannte Grenzen (stehen im Bericht des Werkzeugs): ``L(`… ${n} …`)`` kann keine Tabelle treffen – dafür `fuelle(L('{0} …', '{0} …'), n)`;
derselbe deutsche Text mit zwei Bedeutungen („Getränke“ als Bereich und hinter einer Zahl) hat nur eine Übersetzung; die Namen der
Gerätschaften stehen schon in den Tabellen, laufen aber noch nicht über `text()`.

## Prüfen

```bash
node tests/smoke_neu_pwa.mjs              # echter Browser, Handy und Monitor
npm test                                  # Getränke-Schicht
node tools/kern-nachziehen.mjs --pruefen  # Kern stimmt mit dem Pin überein
node tests/smoke_neu_sprachen.mjs         # Sprach-Tabellen im echten Browser (misst die Tabellen, nicht die Verdrahtung)
```

Zuletzt gemessen (23.11.2026): `smoke_neu_pwa` 63 grün · 0 ROT; Getränke-Schicht und Beispiele 86 von 86; von Hand nachgestellt:
Alkohol-Paket trotz Schalter angeboten → 1 ROT; App füllt den Schirm nicht → 3 ROT.
