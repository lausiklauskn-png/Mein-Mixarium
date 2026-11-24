# Übergabe der gemeinsamen Sitzung (Mixarium-Seite)

Stand **23.11.2026, 18:05 Uhr** (Europe/Berlin). Die gemeinsame Sitzung (Tag) übergibt an die Nacht-Sitzung. Diese Datei ist
die Mixarium-Seite; die gemeinsame Seite (Arbeitsweise, Kern, Rezeptbuch, Fallen) steht in
`Mein-Rezeptbuch/docs/UEBERGABE_GEMEINSAME_SITZUNG.md`, der Auftrag für die Nacht in `Mein-Rezeptbuch/docs/NACHTAUFTRAG.md`.
Halb Fertiges gibt es nicht: alles, was diese Sitzung angefangen hat, ist geprüft und auf `main`.

## Nacht 23./24.11. (Nacht-Sitzung, laufend nachgeführt)

### Stand am Morgen 24.11.2026, 04:30 (Ende der Nacht-Sitzung)

| | Mein Rezeptbuch | Mein Mixarium |
|---|---|---|
| auf `main` | PWA **0.14.3**, Kern **0.22.2** | PWA **10.0.0-vor24**, Kern **0.22.2** (Pin `211b8c9`) |
| Proben am Schluss-Stand | `npm test` 335 · smoke_neu 164 · menue 26 · scan 85 · web 35 · ordner 35 · sprache 77 · zusatz 85 · kern_buch 68 · kern_sprachen 18 | `npm test` 175 · pwa 94 · kategorien 78 · labor 43 · web 28 · scan 56 · ordner 50 · menue 50 · sprachen 88 · zusatz 41 |
| Paket-Probe (APK/Windows, nichts gebaut) | 203 grün · 0 ROT (beide Apps zusammen, ohne Electron) | ebenso |

**Fehlt noch (Rezeptbuch):** Food-Zine, Kreativbuch, KI-Buch, Notizbuch mit Kalender · Wochenplaner ohne Gänge/Ziehen · Wischen zwischen Bildschirmen · Installieren-Knopf im Kopf und Update-Hinweis · Bilder mehrerer Dateien auf einmal zuordnen. Zeile für Zeile: `docs/FUNKTIONSLISTE.md` (in der Nacht gegen den Code geprüft).

**Fehlt noch (Mixarium):** Buch, „Vom Glas“ (Foto eines fertigen Getränks), Handbuch · Bildausschnitt mit Zoom und Ziehen · Notizen je Zutat/Schritt · Herkunft wird nicht gestempelt · Installieren-Knopf. Zeile für Zeile: `docs/FUNKTIONSLISTE.md`.

**Suchfeld (Klaus 24.11.):** in beiden Apps zuerst Wortsuche; nach Bedeutung nur, wenn die Wortsuche nichts findet; der Bedeutungs-Index rechnet ein bearbeitetes Rezept/Getränk neu.

**Achtung, veraltet:** die Abschnitte weiter unten („Stand 18:05“) nennen noch Fassungen und Lücken vom Abend; maßgeblich ist diese Tabelle und die Funktionsliste.


Hier steht, was in der Nacht auf `main` gekommen ist; der Rest der Datei ist der Stand von 18:05. Entscheidungen und Gründe
stehen auf der gemeinsamen Seite (`Mein-Rezeptbuch/docs/UEBERGABE_GEMEINSAME_SITZUNG.md`, Abschnitt „Nacht“).

| Fassung | Was | Proben |
|---|---|---|
| Kern 0.18.0 (Pin `9c97d27`) · PWA 10.0.0-vor20 | **Das Plus öffnet ein Blatt** „Getränk hinzufügen“ wie im Rezeptbuch (Selbst, Foto-Scan, Text, Datei, Pakete). **Foto-Scan** (Foto aufnehmen, Dateien wählen, PDF, Stapel; Claude oder Mistral OCR + Claude; drei Stufen) mit **Reinigung vor der KI** und **„Datei prüfen“**. **Drei Schlüssel** in den Einstellungen (Anthropic, OpenAI, Mistral; speichern, prüfen, löschen) aus dem Kern; ein Schlüssel der bisherigen App (`mxkey9m`, `mxoaiimg9m`, `mxmistralkey9m`) gilt jetzt weiter und wird nur gelesen. Vor einem Stapel kommt der Stand in den Tresor. | `tests/smoke_neu_scan.mjs` (52) · `tests/gegenprobe_neu_scan.py` (6 Fälle) |
| PWA 10.0.0-vor22 · Kern 0.20.1 (Pin `8ccc296`) | **Gestaltung nach Klaus' Urteil vom Abend** (er sah Bilder und die klickbare Vorschau): **Startgetränke** beim allerersten Start (das Startpaket ohne Alkohol der Ausgabe, als Beispiele markiert; `…/neu/?leer` beginnt leer) · das Wort „Beispiel“ steht nicht mehr auf jeder Karte · Kategorie-Sticker so breit wie ihr Name · **Kopf am Handy: Suche, Farbpalette, Plus**, kein Pfeil; **fliegende Leiste** mit Sonne und Mond (Hell/Dunkel), Farbe, Schrift, Sprache, Ohne Alkohol, „Sichern“ · „wie das Gerät“ fällt als Wahl weg · **Blatt hinter „+“**: acht Kacheln in Wasserfarben (Schreiben, Foto, Web, Text, Entdecken, Labor, Datei, Beispiele), im Weg eine Symbolreihe in der Kopfzeile, kein Erklärtext · **Foto-Scan** wie im Rezeptbuch: Auskunft im Knopf, Fund rot markiert, „Entfernen“ oder „Drin lassen“, Stapel ohne Rückfrage · **Web** in einer Zeile · **„Bekannte Drinks entdecken“** (TheCocktailDB, `getraenke/entdecken.mjs`): eine Zeile zum Suchen, Zufall, Treffer als Bilder, ein Tipp holt den Drink ins Formular, „schon da“ mit Haken, „Ohne Alkohol“ gilt auch dort · **Bewertung am Getränk** (fünf Sterne, `r.rating.stars`) · am Getränk drei Knöpfe in einer Zeile, Werkzeuge als runde Symbole · **Einstellungen**: sieben einklappbare Themen mit Farbfeld · **Schlüssel-Fenster** in einer Reihe, mit Direktlink „Schlüssel holen“ · im Labor nur noch ein „?“ · kein Verweis mehr auf die bisherige App · Mikrofon aus dem Kern 0.20 (schreibt an der Schreibmarke, Satzzeichen-Befehle). | `npm test` 126 · `smoke_neu_pwa` 94 · `smoke_neu_kategorien` 78 · `smoke_neu_labor` 43 · `smoke_neu_scan` 56 · `smoke_neu_web` 28 · `tests/getraenke/entdecken.test.mjs` 22 |


| PWA 10.0.0-vor24 · Kern 0.22.2 (Pin `211b8c9`) | **Zusätze** in `neu/zusatz.mjs` (Vorbild Rezeptbuch): **Prüfung des Bildauftrags** vor jedem KI-Bild (Stelle markiert, ohne/mit senden) und **KI-Bilder für alle ohne Bild** (Anzahl und Kosten vorab, abbrechbar) · **KI-Richter der Suche** · **Tresor-Stände der bisherigen App** kommen einmal in den neuen Tresor · **hoher Kontrast**. **Suchfeld (Klaus 24.11.):** zuerst Wortsuche; nach Bedeutung nur, wenn sie nichts findet; der Bedeutungs-Index rechnet ein bearbeitetes Getränk neu. Nicht gebaut: Buch, „Vom Glas“, Handbuch (der Helfer brach am Nutzungslimit ab; ein halber fünfter Schritt wurde verworfen). | `npm test` 175 · pwa 94 · kategorien 78 · labor 43 · web 28 · scan 56 · ordner 50 · menue 50 · sprachen 88 · zusatz 41, je 0 ROT · Suchregel von Hand gegengeprüft (gefangen) |
| PWA 10.0.0-vor23 · Kern 0.22.1 (Pin `43d204c`) | **Ordner** (Fenster wie die Kategorien: anlegen, umbenennen, auflösen – die Getränke bleiben; ein Getränk in einen Ordner legen; „Ohne Alkohol“ gilt auch dort). **Menü am Getränk** hinter dem Winkel → „Mehr“: Drucken (auch die Notizen), Teilen per QR-Code, Übersetzen, Rechtschreibung prüfen, Nährwerte schätzen; „Teilen“ als Text bleibt daneben. **Alle übersetzen** (Einstellungen): Kostenhinweis vorab, abbrechbar. **Oberfläche in acht Sprachen:** Deutsch und Englisch im Code, die übrigen sechs aus Tabellen (`kern/sprachen/`, `neu/sprachen/`, je 581 Einträge der App); Sätze mit Zahl laufen über `fuelle()`, damit eine Tabelle sie trifft. Schlüssel-Fenster an das Rezeptbuch angeglichen. | `npm test` 175 · pwa 94 · kategorien 78 · labor 43 · web 28 · scan 56 · ordner 50 · menue 50 · sprachen 88, je 0 ROT · Gegenproben Ordner 11, Menü 13, Sprachen 18 gefangen, 0 nicht |
| Kern 0.19.0 (Pin `07485eb`) · PWA 10.0.0-vor21 | **Web-Import ohne öffentliche Weiterleiter** (Plus → Web): Seite direkt abrufen, Rezeptdaten ohne KI lesen, Bild als eigene Kopie; gesperrt → Hinweis, „Seite öffnen“, Einfügen; ohne Rezeptdaten → „Ohne KI aufteilen“ oder „Mit Claude lesen“ (nur sichtbarer Text, Halt bei einer Anweisung an eine KI). **Quelle am Getränk.** Die App ist Ziel für „Teilen“. | `tests/smoke_neu_web.mjs` (28) |


## Stand Mixarium (main `859c911`, PWA **10.0.0-vor19**, Kern **0.17.0** per Pin `0b18345`)

- **Die bisherige App ist unverändert**: `index.html` und `QC_Mixarium_20_04_26.html`, md5 beide `49ce4320795972269057083e4c189f48`.
  Sie bleibt online, bis Klaus die neue abgenommen hat. Die Pflicht-Checkliste aus `CLAUDE.md` gilt weiter für jede Änderung daran.
- **Neue PWA** unter `neu/` (ES-Module ohne Bauschritt), Adresse `https://lausiklauskn-png.github.io/Mein-Mixarium/neu/`.
  Eigener Speicher (Kern-Speicher `KuechenKern-mixarium`), die alte App wird nur gelesen; `neu/alt.mjs` holt einen Vorab-Stand
  aus `MixariumNeu1` einmal herüber.
- **Getränke-Schicht** `getraenke/` (Einheiten ml/cl/oz, Gläser, Kategorien, Warengruppen, Alkohol, Gerätschaften, Übernahme,
  Beispiele, Labor, zwei Ausgaben), mit Proben (`tests/getraenke/`, gegen die Funktionen der alten App gerechnet).
- **Ausgaben** `ausgaben/mixarium-store` (ohne Alkohol) und `ausgaben/mixarium-voll`; **Beispiele** `beispiele/` mit `KATALOG.json`.
- **Proben (zuletzt grün gesehen):** `npm test` **104** · `node tests/smoke_neu_pwa.mjs` **71** · `node tests/smoke_neu_kategorien.mjs`
  **78** · `node tests/smoke_neu_labor.mjs` **43**, je 0 ROT · Gegenproben `python3 -u tests/gegenprobe_neu_kategorien.py` (9 Fälle),
  `python3 -u tests/gegenprobe_neu_labor.py` (3 Fälle) · `node tools/kern-nachziehen.mjs --pruefen` stimmt.
- **Unterlagen:** `docs/FUNKTIONSLISTE.md` (631 Funktionen der alten App mit Ziel), `docs/vorschau/mixarium-neu.html`,
  `docs/ABGLEICH_REZEPTBUCH.md` (Briefkasten, neueste Runde 6), `neu/README.md`, `getraenke/README.md`, `beispiele/README.md`.

**Fertig in der neuen PWA:** Getränke als Karten, Suche (auch über Zutaten) und **Sinn-Suche** (Modul 03/04 erst beim Einschalten) ·
Kategorien als **Sticker mit Mini-Foto** (Einstellungen → Kategorien: umbenennen, Zeichen/Bild, neu, löschen mit Ziel,
ausblenden, ziehen) · Schalter „Ohne Alkohol“ · Getränk mit Foto, Glas, Temperatur, Portionen, ml/cl/oz · anlegen, bearbeiten,
löschen · **Getränk aus Text** (ohne KI, Bar-Einheiten) · Mix-Ansicht im Vollbild · Einkaufsliste **je Laden** · Getränkekarten ·
**Wochenplan** (Plan der alten App einmal übernommen) · Farbe mit Hell/Dunkel · Schrift-Regler · Sprache Deutsch/Englisch ·
Beispiele laden/löschen · Sicherung, Einspielen, Sammlung leeren · Tresor · Bild: **Tipp → Vollbild mit Knopf zum Bild-Blatt**,
Ausschnitt, ersetzen, KI-Bild, Gratis-Foto · **Bilder-Ordner** (einziger Ort zum Löschen eines Bildes) · Winkel in der
Namenszeile, am Monitor neben dem Bild · **Mix-Labor** (erfinden mit **Haiku 5.5**, Bewertung, Status-Kette, KI-Überarbeitung,
Favorit-Schutz, verwerfen/wiederherstellen, Protokoll) · Anthropic- und OpenAI-Schlüssel nur im Gerät · **Hinweis-Blasen**
(abschaltbar) · **Erklärtexte hinter „?“** · **Ladebalken** bei jeder Wartezeit · Übernahme aus der alten App · offline.

## Was vom Kern kommt und was nicht

Vom Kern: speicher, tresor, farben, schrift, bild, symbole, diktat, hinweis, warten, ki/bild (Auftrag `art: 'getraenk'`),
rezept (`sicht`), kategorien (`kategorienMit` mit Familien-Namen, `katBild`), einkauf (`einkaufMit` mit
`getraenke/warengruppen.mjs`), plan, import/text, suche/bedeutung, ausgabe, pruefung/paket (in Proben).
Bewusst eigen (Grund): `getraenke/geraete.mjs` (eigene Bar-Zeichnungen) · `getraenke/einheiten.mjs` (gegen die alte App geprüft;
`tests/getraenke/kern-abgleich.test.mjs` misst den Kern daran) · `getraenke/uebernahme.mjs` (liest IndexedDB der alten App,
schreibt Sicherung Fassung 10 mit `kategorienZustand`, `einkaufLaeden`) · `getraenke/labor.mjs` (nur Mixarium).
Noch vorläufig in `neu/app.mjs`: Oberfläche (Kopf, fliegende Leiste, Fenster, Karten), Posten-Modell der Einkaufsliste.

## Was Klaus in dieser Sitzung gesagt hat

Erledigt (in Vorschau oder PWA umgesetzt, mit Probe wo möglich):

1. Farbwelten aus Familienbüro/Private Akte, Wasserfarben statt Vollton, Verlauf in Leisten und Knöpfen, hell aufgehellt,
   dunkel mit Verlauf; Farbwerte wie in der Private Akte (Koralle nicht braun); Dunkel für jede Farbe durchgehend, nicht nur der Kopf.
2. Symbole Phosphor Duotone; im Dunkeln hell; ein Zeichen je Bedeutung (Mixen = Shaker, Alle = Buch, Getränke = Glas).
3. Knöpfe flacher und schmaler, „sportlicher“ (36/34/28/30 px; Weiter/Zurück beim Mixen 46 px).
4. Fliegende Leiste wie in der Private Akte, rastet ein, unten keine Leiste; schmal; ragt nicht in Bilder oder Karten.
5. Kopf minimal, Suche oben, Werkzeuge hinter dem Pfeil; aufgeklappt **keine zweite Zeile**.
6. Sprache: kein Kürzel sichtbar, „wie das Gerät“, einstellbar; Mengen passen sich dem Land an.
7. Mix-Ansicht nicht nur Text: Bild und gezeichnete Gerätschaften; Kopfzeile am Handy einklappbar; keine Sprach- und
   Schrift-Knöpfe dort; Schriftgröße als Schieberegler, der sofort wirkt.
8. Aufteilung Tablet/Monitor „sehr gut“; „Nur dieses Getränk“ nur auf Knopfdruck.
9. „Menü“ heißt „Getränkekarte“ (Klaus wollte evtl. noch einen eigenen Namen vorschlagen).
10. Beispiele: getrennt vom Programm, mit einem Klick löschbar, App leeren und neu aufbauen; **fehlerfrei** (alle Zutaten
    geprüft, kein Englisch); Ordner und Release-Links für Klaus' Bilder (`beispiele/README.md`).
11. Zwei Ausgaben: Store nur ohne Alkohol, „voll“ mit allen Getränken für Klaus selbst.
12. Erst die PWA zum Ansehen, **APK und Windows erst nach Klaus' Urteil**.
13. Bild: Vollbild wirklich groß; keine Knöpfe auf dem Bild; ganzes Bild am breiten Schirm; Bild-Blatt; Tresor; KI-Bild.
14. Feinschliff darf die Sitzung selbst machen, solange nichts langsamer wird (nur Lage und Deckkraft, einmalig).
15. Nicht blind vom Rezeptbuch übernehmen, je Punkt prüfen. Codex wird nicht mehr geprüft.

**Neu seit der Übergabe (gemeinsame Sitzung, 23.11.):** Tipp aufs Bild → Vollbild mit „Bild bearbeiten“ · Monitor: Winkel neben
dem Bild · Kategorien als Sticker mit Mini-Foto (aus der eigenen Kategorie, sonst das gezeichnete Bild, sonst das Zeichen) ·
Bilder-Ordner (Einstellungen → Bilder; einziger Ort zum Löschen eines Bildes) · Getränk aus Text (ohne KI) · Wochenplan
(Karte → Wochenplan; der Plan der alten App wird einmal übernommen, Einträge nur mit Freitext ohne Getränk zeigt er nicht,
sie bleiben in `karten` gespeichert) · „Planen“ am Getränk. Proben: `tests/smoke_neu_kategorien.mjs` (68).

**Mix-Labor (10.0.0-vor16):** `getraenke/labor.mjs` (Regeln der alten App, Punkte und Status-Kette gegen die alte Funktion
gerechnet: 2000 + 3000 Verläufe) und die Oberfläche nach der Vorschau: erfinden (Kategorie, Geschmack, Zutaten), Vorschau, ins Labor,
4 Bewertungen, Status-Kette, KI-Überarbeitung (automatisch und auf Knopfdruck), Favorit-Schutz, verwerfen/wiederherstellen,
Einzelpersonen-Modus, Protokoll. Eigener Anthropic-Schlüssel nur im Gerät; Modell seit 10.0.0-vor18 `claude-haiku-5-5` (Klaus 23.11., `LAB_MODELL`, `LAB_MAX_TOKENS` 8192 – das Denken zählt mit).
Klaus 23.11.: Kacheln dicht gepackt und in Wasserfarben (Bereiche der Private Akte), Erklärtexte hinter „?“ (`frag`), kurze
Meldungen. Proben `tests/getraenke/labor.test.mjs`, `tests/smoke_neu_labor.mjs` (38), Gegenprobe `tests/gegenprobe_neu_labor.py`.
Danach erledigt: Tooltips der alten Apps (Kern 0.16, vor17) · „?“-Erklärungen in Labor, Schlüsseln, Tresor, Text-Import, Paketen, Kategorien, Läden, Bildern (vor17) · Ladebalken (Kern 0.17, vor19).

**Offen** (gesagt, noch nicht gebaut), nach Wichtigkeit:

1. **„Es soll alles noch so funktionieren wie vorher. Auch das Labor, vielleicht sogar noch besser.“** Es fehlen noch:
   „Bekannte Drinks entdecken“ (TheCocktailDB, Netz nur auf Knopfdruck) · Foto-Scan (einzeln/Stapel, Claude/Mistral, Reinigung
   vor der KI, „Datei prüfen“) · Web-Import (ohne öffentliche Weiterleiter) · Mistral-Schlüssel · Übersetzen (alle/einzeln, mit
   Kostenhinweis) · Rechtschreibung · Ordner-Ansicht (alte `fld_`-Kategorien liegen in `folder`, ohne Ansicht) · Bewertung am
   Getränk außerhalb des Labors · Sammel-Weg „KI-Bilder für alle“ · Bücher (PDF, Flipbook, EPUB) · Drucken · QR-Teilen ·
   Handbuch/Hilfe · Barrierefreiheit-Schalter · App-Bewertung. Mit Zeilen: `docs/FUNKTIONSLISTE.md`.
2. **Oberfläche in den übrigen sechs Sprachen** (jetzt Deutsch/Englisch; Kategorien und Gläser in 8 Sprachen).
3. **Mikrofon aus Modul 21** in allen größeren Feldern (jetzt `diktat.mjs`).
4. **SBKIM/Mycel:** funktionsfähig im Hintergrund, unsichtbar, später freischaltbar; in `neu/` nur Modul 03/04 für die Sinn-Suche.
5. **Beispielbilder** von Klaus (Release `eingang-bilder`/`eingang-json` oder `beispiele/eingang/`): nichts angekommen.
6. **Intro** nur beim ersten Start: nicht bestätigt, nicht gebaut.
7. **Android, Windows, Google Play** erst nach Klaus' Go.

## Aus dem Briefkasten des Rezeptbuchs noch nicht umgesetzt

Gelesen: Runde C (`Mein-Rezeptbuch/docs/BRIEFKASTEN_MIXARIUM.md`), beantwortet in Runde 6. Noch offen: Mikrofon nach Modul 21 ·
Tresor-Stände der alten App in den neuen Tresor legen · Sammel-Weg KI-Bilder · KI-Richter. Winkel, Bilder-Ordner und
Bedeutungssuche sind inzwischen umgesetzt.

## Wünsche an den Kern (aus Mixarium-Sicht)

**Erledigt mit Kern 0.11.0 (gemeinsame Sitzung, 23.11.2026):** Bildauftrag je Ausgabe (`art: 'getraenk'`, die PWA nutzt ihn
für KI-Bild und Gratis-Foto, Probe liest den Auftrag mit) · „Shaker“/„schütteln“ ist im Kern kein Küchenmixer mehr; Geräte mit
englischen Namen und eigenem Raster (`vb`). Die PWA behält trotzdem `getraenke/geraete.mjs` (eigene Zeichnungen, eigene Proben).
· Englische Namen für Farben, Töne und Schrift-Regler kommen aus dem Kern; `FARBE_EN` in `neu/app.mjs` ist weg.
**Kern 0.12.0:** `kategorienMit(KATEGORIEN)` und `einkaufMit({ gruppen, einheiten })` – Kategorien, Warengruppen und Einheiten
je Ausgabe; Mengen mit Achteln. `tests/getraenke/kern-abgleich.test.mjs` misst den Kern an allen Mengen der Beispielpakete gegen
`getraenke/einheiten.mjs` (lesen gleich, Umrechnen bis auf die Rundung gleich) und an den Getränke-Kategorien.
**PWA 10.0.0-vor8 (umgehängt):** Kategorien laufen über `kategorienMit(G.KATEGORIEN, { familie: KATEGORIEN_FEST })` (Kern 0.13:
mitgebrachte Kennungen tragen den Familien-Namen), die Einkaufsliste über `einkaufMit` mit `getraenke/warengruppen.mjs`.
Neu in der PWA: **Einstellungen → Kategorien** (umbenennen, Zeichen, neu, löschen mit Ziel, ausblenden/zurück, ziehen) und
**Läden** in der Einkaufsliste (je Laden eigene Reihenfolge der Gruppen, ziehen). Der alte Kategorie-Zustand wird beim Start
verlustfrei umgewandelt (`katZustandZuKern`); die Sicherung bleibt Fassung 10 und trägt zusätzlich `kategorienZustand` und
`einkaufLaeden`. Benannte Änderungen: ein altes `cat: "fld_…"` zieht nach `folder` und erscheint unter „Ohne Kategorie“ (die PWA
hat noch keine Ordner-Ansicht) · Säfte vor Obst („Limettensaft“ ist ein Saft) · neue Gruppe „Spirituosen & Wein“.
Proben: `tests/smoke_neu_kategorien.mjs` (32, Monitor und Finger), Gegenprobe `tests/gegenprobe_neu_kategorien.py` (6 Fälle).
Die Einkaufsliste behält ihr eigenes Posten-Modell (abhaken je Posten, zusammenzählen bei gleicher Einheit); nur Gruppen und
Läden kommen aus dem Kern.

Die früheren Wünsche (Bildauftrag je Ausgabe, Bar-Geräte, Kategorien/Warengruppen/Einheiten je Ausgabe, englische Namen) sind mit Kern 0.11–0.13 erledigt. Offener Wunsch: das Posten-Modell der Einkaufsliste und die Oberflächen-Bausteine (Kopf, Leiste, Fenster) gemeinsam in den Kern.

## Entscheidungen dieser Sitzung (mit Grund)

- Labor auf Haiku 5.5 (Klaus' Ja): laut Anthropic etwa ein Zehntel des Preises und besser im Befolgen von Anweisungen;
  `max_tokens` 8192, weil das Denken mitzählt; keine Sampling-Parameter und kein Vorfüllen (beides 400).
- Erklärtexte in Fenstern als kurze Zeile + „?“ (Klaus: „nicht ein Buch“); im Schlüssel-Fenster bleibt nur „Es ist ein Schlüssel gespeichert“.
- Ladebalken aus dem Kern statt Toasts wie „KI-Bild wird erzeugt, das dauert etwa 20 Sekunden“ – ein Toast verschwindet, bevor das Bild da ist.
- Kacheln im Labor: first-fit-decreasing über CSS `order` (`kachelnPacken`), damit jede Reihe voll ist.

## Nicht gemessen

- **Die Live-Seite**: `github.io` ist aus der Sitzung nicht erreichbar; geprüft ist nur lokal im Browser (Playwright).
- Klaus' Tablet und Handy: Bedienung der fliegenden Leiste mit dem Finger, Installieren, Offline, Ladezeit (Ziel unter 1 s).
- Echte Aufrufe an OpenAI (KI-Bild), Pollinations und Anthropic (Labor mit Haiku 5.5); die Proben stellen die Antworten nach.
- Das echte Sprachmodell der Sinn-Suche (120 MB, Dauer); die Probe stellt Modul 03 und seinen Ladestand nach.
- Mikrofon: nur, dass die Knöpfe da sind, wo der Browser es kann; kein Diktat gefahren.
- Übernahme aus einer **echten** IndexedDB `MeinMxBackup1` und aus Klaus' echten Daten; die Probe stellt nur localStorage.
- Große Sammlungen mit vielen Fotos (Speicher, Tempo); `zoom` für den Schrift-Regler in Firefox.
- Service Worker und Aktualisierung von Fassung zu Fassung auf dem Gerät.

## Offene Fragen an Klaus

1. **Amaretto Sunrise:** in seinen Daten standen 1 cl Amaretto und ¼ cl Grenadine auf 4 oz Saft; im Beispielpaket jetzt 1 oz und
   ¼ oz. So lassen oder zurück?
2. **Mango Mojito:** hatte nur einen Schritt und keinen Zucker; ergänzt nach dem Original auf 6 Gläser, Rum 180 ml statt 200. In Ordnung?
3. ~~Winkel am Monitor~~ – erledigt: Klaus wollte ihn am Monitor neben dem Bild (gebaut).
4. **Name „Getränkekarte“** (in der Leiste „Karte“) endgültig?
5. **Kräftig:** in der Private Akte ein dunkles Blau mit Petrol; Klaus fand es unpassend zum Namen. Ändern?
6. **Intro:** soll die neue App eines haben (nur beim ersten Start)?
7. **Freischalten von SBKIM/Mycel:** wie?
8. **Beispielbilder und Sicherungen:** woher, wann?
9. Wo werden die Ausgaben veröffentlicht (Web = `mixarium-voll` unter `/neu/`; Store-APK = `mixarium-store`)?

## Fallen, die schon Zeit gekostet haben

- **Symbole ohne Füllfarbe:** ein Phosphor-`<svg>` ohne `fill:currentColor` ist im Hellen unauffällig schwarz und im Dunkeln unsichtbar.
- **Variablenname doppelt belegt:** `--schrift` war zugleich Schriftart und Palettenfarbe; die App lief in Serifenschrift.
- **`height:100%` ohne Höhe am Elternteil:** die App füllte den Schirm nicht, die Mix-Ansicht rutschte weg. Probe misst die Höhe.
- **Aufgeklappte Werkzeuge über dem Winkel:** bei langem Namen lag „löschen“ über dem Winkel. Probe mit langem Namen.
- **Bedingte Kette mit `&&`:** ein Commit ging einmal mit roter Probe hinaus, weil die Probe nicht davor stand. Erst Probe, dann Commit.
- **Prüfung zeichengenau:** `innerHTML` gibt SVG leicht anders zurück als die Quelle; am Pfad prüfen, nicht am ganzen Text.
- **`document.startViewTransition`:** Zustand ändert sich erst im nächsten Bild; Proben müssen kurz warten.
- **Der Session-Branch nach einem Merge:** neu von `origin/main` aufsetzen (`git reset --hard origin/main`), dann pushen.
- **Beispiele in der App:** dieselbe `uid` kommt beim erneuten Laden nicht noch einmal; berichtigte Beispiele sieht man erst
  nach „Alle Beispiele löschen“ und neuem Laden.
- **Nicht am Arbeitsbaum arbeiten, während ein Helfer darin baut;** nur eigene Pfade committen (`git commit <pfade>`).
- **Der Brief dieser Sitzung** lag nicht auf main von Meine-Familienakte, sondern auf dem Zweig `ccr-2d0572d2-vhgluh`.
- **`data-d` ist schon vergeben** (Getränk öffnen); die Wochen-Knöpfe heißen `data-tage`.
- **Plan-Übernahme nur einmal:** `A.planUebernommen`, sonst kommt ein gelöschter übernommener Eintrag zurück.
- **Gegenprobe-Kopien brauchen `sbkim/` und `assets/`**; Python-Läufer mit `-u`, eine hängende Probe fängt `TimeoutExpired` als „GESTOLPERT“.
- **`Zs(p, f)` in den Proben verliert Argumente;** für Funktionen mit Argument `p.evaluate` nehmen.
