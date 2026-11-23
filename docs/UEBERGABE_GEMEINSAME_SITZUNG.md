# Übergabe an die gemeinsame Sitzung (Mixarium-Seite)

Stand 23.11.2026. Klaus legt die Mixarium-Sitzung und die Rezeptbuch-Sitzung zu **einer** zusammen, weil er sonst alles
zweimal sagen muss. Diese Datei ist die Übergabe der Mixarium-Seite; die Rezeptbuch-Seite steht in
`Mein-Rezeptbuch/docs/UEBERGABE_GEMEINSAME_SITZUNG.md` (dort auch: wie die gemeinsame Sitzung arbeitet).
Diese Sitzung arbeitet nach der Übergabe nicht weiter.

## Stand Mixarium (main, PWA 10.0.0-vor16, Kern 0.15.0 per Pin `74ab9e3`)

- **Die bisherige App ist unverändert**: `index.html` und `QC_Mixarium_20_04_26.html`, md5 beide `49ce4320795972269057083e4c189f48`.
  Sie bleibt online, bis Klaus die neue abgenommen hat. Die Pflicht-Checkliste aus `CLAUDE.md` gilt weiter für jede Änderung daran.
- **Neue PWA** unter `neu/` (ES-Module ohne Bauschritt), Adresse `https://lausiklauskn-png.github.io/Mein-Mixarium/neu/`.
  Eigener Speicher (Kern-Speicher `KuechenKern-mixarium`), die alte App wird nur gelesen. Eine erste Vorab-Fassung schrieb nach
  `MixariumNeu1`; `neu/alt.mjs` holt diesen Stand einmal herüber.
- **Getränke-Schicht** `getraenke/` (Einheiten ml/cl/oz, Gläser, Kategorien, Alkohol, Gerätschaften, Übernahme, Beispiele, zwei
  Ausgaben), mit Proben und Gegenprobe (`tests/getraenke/`).
- **Ausgaben** `ausgaben/mixarium-store` (ohne Alkohol) und `ausgaben/mixarium-voll`; **Beispiele** `beispiele/` mit `KATALOG.json`:
  Startpaket ohne Alkohol (7 Getränke, gezeichnete Bilder) und Alkohol-Paket (8 Getränke, durchgesehen und berichtigt).
- **Proben:** `npm test` 86 von 86 · `node tests/smoke_neu_pwa.mjs` 63 grün, 0 ROT (echter Browser, Handy und Monitor) ·
  `node tools/kern-nachziehen.mjs --pruefen` stimmt · `node kern/ausgabe/ausgabe.mjs ausgaben/mixarium-<store|voll>/ausgabe.json` in Ordnung.
- **Unterlagen:** `docs/FUNKTIONSLISTE.md` (631 Funktionen der alten App mit Ziel), `docs/vorschau/mixarium-neu.html` (von Klaus
  abgenommene Vorschau, Artefakt https://claude.ai/artifact/Mib1gJ2k2gNR4kAJyLKB61), `docs/ABGLEICH_REZEPTBUCH.md` (Briefkasten),
  `neu/README.md`, `getraenke/README.md`, `beispiele/README.md`.

**Fertig in der neuen PWA:** Getränke als Karten, Suche (auch über Zutaten), Kategorien, Schalter „Ohne Alkohol“ · Getränk mit
Foto, Glas, Temperatur, Portionen umrechnen, ml/cl/oz · anlegen, bearbeiten, löschen · Mix-Ansicht im Vollbild (Bild, Zutaten
und Gerätschaften je Schritt, Wischen, Pfeiltasten, Esc, Bildschirm bleibt an) · Einkaufsliste · Getränkekarten für einen
Anlass · Farbe mit Hell/Dunkel je Farbe · Schrift-Regler 85–150 % · Sprache (Oberfläche Deutsch/Englisch) · Beispiele laden und
mit einem Tipp löschen · Sicherung als Datei, Einspielen, Sammlung leeren · Tresor · Bild-Blatt (ganzes Bild, Ausschnitt,
ersetzen, KI-Bild, Gratis-Foto) · Winkel in der Namenszeile am Handy · fliegende Leiste am Handy, Leiste links am Monitor,
„Nur dieses Getränk“ · Übernahme aus der alten App beim ersten Start · offline.

## Was vom Kern kommt und was nicht

| Vom Küchen-Kern übernommen (läuft in der PWA) | Bewusst NICHT vom Kern (Grund) |
|---|---|
| `speicher/speicher`, `speicher/tresor` | `oberflaeche/geraete`: meldet bei „schütteln“ einen Küchenmixer, kennt keine Bar-Geräte → `getraenke/geraete.mjs` |
| `oberflaeche/farben` (mit Ton), `schrift`, `bild`, `symbole`, `diktat` | `modell/kategorien(-fest)`, `warengruppen`, `einkauf`: noch nicht je Ausgabe austauschbar → `getraenke/kategorien.mjs`, Einkauf in `neu/app.mjs` |
| `ki/bild` (KI-Bild, Gratis-Foto) | `modell/mengen`: `getraenke/einheiten.mjs` kann ml/cl/oz, Spannen, Brüche und ist gegen die alte App geprüft |
| `modell/rezept` (nur `sicht`) | `sicherung/sicherung` (Fassung 11) und `speicher/uebernahme`: hier gilt `getraenke/uebernahme.mjs` (liest auch IndexedDB der alten App, Tresor, Rezeptbuch-Pakete; schreibt Fassung 10) |
| `ausgabe/ausgabe`, `pruefung/paket` (in Proben) | `suche/bedeutung`, `modell/kochen`, `modell/plan`, `import/text`: noch nicht eingebaut |

**Noch vorläufig** (eigener Code in `neu/app.mjs` und `neu/app.css`, soll auf Kern-Bausteine, sobald es sie gibt): die ganze
Oberfläche (Kopf, fliegende Leiste, Fenster, Karten, Einstellungs-Liste, Gerüst der Mix-Ansicht), die Einkaufsliste, die
Getränkekarten. Getränke-eigen und bleibend: `neu/getraenke-symbole.mjs`, `neu/platzbild.mjs`, `neu/alt.mjs`, `getraenke/`.

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
Einzelpersonen-Modus, Protokoll. Eigener Anthropic-Schlüssel nur im Gerät; Modell `claude-haiku-4-5` (wie bisher, an einer Stelle).
Klaus 23.11.: Kacheln dicht gepackt und in Wasserfarben (Bereiche der Private Akte), Erklärtexte hinter „?“ (`frag`), kurze
Meldungen. Proben `tests/getraenke/labor.test.mjs`, `tests/smoke_neu_labor.mjs` (38), Gegenprobe `tests/gegenprobe_neu_labor.py`.
Offen: „Bekannte Drinks entdecken“; die „?“-Erklärungen in den übrigen Bereichen der PWA; Tooltips der alten Apps prüfen.

**Offen** (gesagt, noch nicht gebaut):

1. **„Es soll alles noch so funktionieren wie vorher. Auch das Labor, vielleicht sogar noch besser.“** In der neuen PWA fehlen:
   Mix-Labor (erfinden, vier Bewertungen, experimentell → Buch/entfernt, KI-Überarbeitung, Favorit-Schutz, Einzelpersonen-Modus),
   „Bekannte Drinks entdecken“ (TheCocktailDB, Netz nur auf Knopfdruck), Foto-Scan (einzeln/Stapel, Claude/Mistral, Reinigung
   vor der KI, Datei prüfen), Web-Import (ohne öffentliche Weiterleiter), Text-Import, Übersetzen (alle/einzeln, mit
   Kostenhinweis), Rechtschreibung, Ordner, Kategorien umbenennen/anlegen/löschen/sortieren, Bewertung am Getränk,
   Bildausschnitt mit Zoom, Bilder-Ordner, Sammel-Weg „KI-Bilder für alle“, Bücher (PDF, Flipbook, EPUB), Drucken, QR-Teilen,
   Wochenplan (Daten sind übernommen), Bedeutungssuche, Handbuch/Hilfe, Barrierefreiheit-Schalter, App-Bewertung,
   Schlüssel für Anthropic und Mistral. Vollständige Liste mit Zeilen: `docs/FUNKTIONSLISTE.md`.
2. **SBKIM/Mycel:** soll funktionsfähig im Hintergrund bleiben, unsichtbar, später freischaltbar. In `neu/` ist es noch gar
   nicht eingehängt. Wie freigeschaltet wird, entscheidet Klaus später (mein Vorschlag war: siebenmal auf die Fassungsnummer + Code).
3. **Beispielbilder:** Klaus wollte Bilder und JSON-Sicherungen liefern (Release `eingang-bilder` / `eingang-json` oder Ordner
   `beispiele/eingang/`). Bisher ist nichts angekommen; das Startpaket hat gezeichnete Bilder.
4. **Intro** nur beim ersten Start, überspringbar: die PWA hat gar keines. Ob eines gewünscht ist, ist nicht bestätigt.
5. **Oberfläche in den übrigen sechs Sprachen** (jetzt Deutsch/Englisch; Kategorien und Gläser sind in 8 Sprachen).
6. **Android, Windows, Google Play** (Capacitor, Ziel API 36; Windows-Paket; Store-Fassung = Ausgabe `mixarium-store`).
7. **Erklärtexte hinter „?“**, Spracheingabe in allen größeren Feldern mit Modul 21, Einkaufsliste je Laden (aus dem
   Rezeptbuch, hier noch nicht).

## Aus dem Briefkasten des Rezeptbuchs noch nicht umgesetzt

Gelesen: `Mein-Rezeptbuch/docs/BRIEFKASTEN_MIXARIUM.md` (main `ed99b34`). Antworten je Punkt stehen in
`docs/ABGLEICH_REZEPTBUCH.md`, Runde 5. Noch nicht umgesetzt:

- **Winkel am Monitor:** am Handy übernommen; am Monitor steht der Name neben dem Bild, dort sind „Nur dieses Getränk“ und
  „Bild“ Knöpfe rechts. Im Rezeptbuch steht der Winkel überall. → Frage an Klaus.
- **Bilder-Ordner** (dort wird ein Bild gelöscht): fehlt. „Foto entfernen“ ist aus dem Formular genommen, im Bild-Blatt wird
  nichts gelöscht; ein Bild lässt sich im Mixarium zurzeit nur ersetzen.
- **Bedeutungssuche** (`kern/suche/bedeutung.mjs`, Module 03/04 aus `sbkim/`): nicht eingebaut.
- **Mikrofon nach Modul 21:** nur die einfache Fassung `diktat.mjs`.
- **Tresor-Stände der alten App** in den neuen Tresor legen: gelesen, aber nicht abgelegt.
- **Sammel-Weg KI-Bilder**, KI-Richter: nicht eingebaut.

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

- `ki/bild.mjs`: Bildauftrag je Ausgabe austauschbar (jetzt „beautifully plated … Food photography“, für Getränke unpassend).
- `oberflaeche/geraete.mjs`: „shaker“/„schüttel“ nicht fest dem Mixer zuordnen; Bar-Geräte per `erweitern()` mit eigenen Wörtern.
- Kategorien, Warengruppen und Einheiten je Ausgabe; `getraenke/einheiten.mjs` gegen `modell/mengen.mjs` prüfen. Die alte App
  rechnete falsch: „10,5“ wurde 1,5 und „1 ½“ wurde 1 (in `getraenke/` berichtigt, Probe hält die alten Werte fest).
- Falle beim Winkel: Werkzeuge über der Namenszeile verankern, nicht mit festem Abstand (siehe Fallen).
- Schrift-Regler, Farben: englische Namen fehlen im Kern (hier in `neu/app.mjs` ergänzt).

## Nicht gemessen

- **Die Live-Seite**: `github.io` ist aus der Sitzung nicht erreichbar; geprüft ist nur lokal im Browser (Playwright).
- Klaus' Tablet und Handy: Bedienung der fliegenden Leiste mit dem Finger, Installieren, Offline, Ladezeit (Ziel unter 1 s).
- Echter OpenAI-Aufruf (KI-Bild) und Gratis-Foto; es gibt nur die Prüfung „ohne Schlüssel wird gefragt und nichts geladen“.
- Mikrofon: nur, dass die Knöpfe da sind, wo der Browser es kann; kein Diktat gefahren.
- Übernahme aus einer **echten** IndexedDB `MeinMxBackup1` und aus Klaus' echten Daten; die Probe stellt nur localStorage.
- Große Sammlungen mit vielen Fotos (Speicher, Tempo); `zoom` für den Schrift-Regler in Firefox.
- Service Worker und Aktualisierung von Fassung zu Fassung auf dem Gerät.

## Offene Fragen an Klaus

1. **Amaretto Sunrise:** in seinen Daten standen 1 cl Amaretto und ¼ cl Grenadine auf 4 oz Saft; im Beispielpaket jetzt 1 oz und
   ¼ oz. So lassen oder zurück?
2. **Mango Mojito:** hatte nur einen Schritt und keinen Zucker; ergänzt nach dem Original auf 6 Gläser, Rum 180 ml statt 200. In Ordnung?
3. **Winkel am Monitor** wie im Rezeptbuch, oder Knöpfe rechts neben dem Bild (jetzt so)?
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
