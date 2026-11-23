# Mein Mixarium – neue Fassung (PWA, Vorab)

Adresse nach dem Veröffentlichen: `https://lausiklauskn-png.github.io/Mein-Mixarium/neu/`.
Die bisherige App (`../index.html`, `../QC_Mixarium_20_04_26.html`) bleibt unverändert online, bis Klaus die neue abgenommen hat.
Erst danach kommen APK und Windows-Paket (Klaus 23.11.2026: „mach die PWA fertig, damit ich mir die anschauen kann“).

Kein Bau-Schritt: reine ES-Module, läuft direkt von GitHub Pages. Gestaltung nach `docs/vorschau/mixarium-neu.html`
(von Klaus abgenommen).

## Was woher kommt

| Teil | Ort | Bleibt? |
|---|---|---|
| Getränke-Logik (Einheiten, Gläser, Kategorien, Alkohol, Gerätschaften, Übernahme, Beispiele) | `../getraenke/` | ja, mit Proben |
| Ausgaben und Beispiel-Katalog | `../kern/` (Pin), `../ausgaben/`, `../beispiele/` | ja, aus dem Küchen-Kern |
| Oberfläche (`app.mjs`, `app.css`), Speicher, Symbole, Platzhalterbild | hier und `vorlaeufig/` | **vorläufig** |

**Vorläufig** heißt (Klaus 23.11.: „jetzt bauen und später umhängen“): Palette und Farbscheibe, Verlaufs-Knöpfe, fliegende
Leiste, klappbarer Kopf, Fenster, Einstellungs-Liste, das Gerüst der Mix-Ansicht, Speicher (IndexedDB `MixariumNeu1`), Symbole
und Platzhalterbild werden gegen die Bausteine des Küchen-Kerns getauscht, sobald Mein Rezeptbuch sie liefert. Hier wird
dafür kein eigener Kern aufgebaut; der Ordner `vorlaeufig/` ist die Liste dessen, was wegfällt.

## Was diese Fassung kann

Getränke ansehen, suchen, nach Kategorie filtern, „Ohne Alkohol“; Getränk mit Foto, Glas, Temperatur, Portionen umrechnen,
ml/cl/oz; anlegen, bearbeiten (mit Foto, verkleinert auf 1600 px), löschen; Mix-Ansicht im Vollbild mit Bild, Zutaten und
Gerätschaften je Schritt, Wischen/Pfeiltasten/Esc, Bildschirm bleibt an; Einkaufsliste (zusammengerechnet, nach Gruppen,
abhaken, teilen); Getränkekarten für einen Anlass; Farbe (im Dunkeln durchgehend getönt), hell/dunkel, Sprache, Einheiten, Schriftgröße als Schieberegler (85–150 %, wirkt sofort); Beispiele laden und
mit einem Tipp löschen; Sicherung speichern und einspielen (Format der alten App, `version: 10`); Sammlung leeren;
Übernahme aus der bisherigen App beim ersten Start (nur lesen); offline nach dem ersten Laden; fliegende Leiste am Handy,
Leiste links am Monitor, „Nur dieses Getränk“.

## Was noch fehlt (benannte Grenzen)

- **Mix-Labor, „Bekannte Drinks entdecken“, Foto-Scan, KI-Bild, Übersetzen, Rechtschreibung** – noch nicht eingebaut; der
  Bereich „Labor“ sagt das und verweist auf die bisherige App. Klaus: alles soll wie vorher funktionieren – das ist der
  nächste Schritt, jede Funktion mit Probe.
- **Ordner, Kategorien umbenennen/anlegen/sortieren, Bewertung, Bildausschnitt wählen, Bücher/PDF, QR-Teilen, Tresor mit
  mehreren Sicherungen, Wochenplan** – Daten werden übernommen und bleiben erhalten, die Oberfläche dafür fehlt noch.
- **Oberfläche nur Deutsch und Englisch.** Kategorien und Gläser sind in 8 Sprachen übersetzt.
- **SBKIM/Mycel** ist hier nicht eingebunden (nicht sichtbar, kein Netz). Das Einhängen als unsichtbares, freischaltbares
  Modul kommt mit dem Kern.
- **Intro** gibt es in dieser Fassung keines; die App zeigt sofort Inhalt.
- **Bilder der Beispiele** sind gezeichnet, bis Klaus' Fotos da sind (`../beispiele/README.md`).
- Nicht gemessen: am Tablet und Handy von Klaus, Ladezeit, Verhalten bei sehr großen Sammlungen mit vielen Fotos.

## Prüfen

```bash
node tests/smoke_neu_pwa.mjs              # echter Browser, Handy und Monitor
npm test                                  # Getränke-Schicht
node tools/kern-nachziehen.mjs --pruefen  # Kern stimmt mit dem Pin überein
```

Zuletzt gemessen (23.11.2026): `smoke_neu_pwa` 49 grün · 0 ROT; Getränke-Schicht 74 von 74; von Hand nachgestellt:
Alkohol-Paket trotz Schalter angeboten → 1 ROT; App füllt den Schirm nicht → 3 ROT.
