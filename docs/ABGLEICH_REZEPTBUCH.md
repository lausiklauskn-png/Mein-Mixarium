# Abgleich Mixarium → Mein Rezeptbuch (laufende Akte)

Hier steht, was Klaus in der Mixarium-Sitzung gesagt und abgenommen hat, **damit er es dem Rezeptbuch nicht noch einmal
erzählen muss** (Klaus 23.11.2026: „ich will es nicht zweimal erzählen“). Neueste Runde oben. Jede Runde ist so geschrieben,
dass die Rezeptbuch-Sitzung sie ohne Rückfrage umsetzen kann; wo ich im Rezeptbuch nachgesehen habe, steht der Befund dabei.

**Für die Rezeptbuch-Sitzung zum Einfügen:**

```
Lies im Repo lausiklauskn-png/Mein-Mixarium auf main die Datei docs/ABGLEICH_REZEPTBUCH.md und setze die oberste Runde,
die du noch nicht umgesetzt hast, für Mein Rezeptbuch um (Klaus hat das dort so gewollt und will es nicht zweimal erzählen).
Was im Kern liegen soll, baue im Kern; das Mixarium zieht ihn per Pin nach. Antworte mit einem kurzen Brief in docs/.
```

---

## Runde 3 · 23.11.2026, nach Klaus' erstem Blick auf die Mixarium-PWA (`/Mein-Mixarium/neu/`)

Klaus: „bei meinem Rezeptbuch werden fast dieselben Fehler gemacht“. Nachgesehen am Rezeptbuch-Stand `e7543aa` (main, Kern 0.6.0).

1. **Kopf bleibt eine Zeile, auch aufgeklappt.** Klaus: „In der Menüleiste keine zweite Zeile erzeugen, wenn ich auf den Pfeil
   klicke.“ Am Handy weicht beim Aufklappen der Name, die Werkzeuge stehen als reine Symbole in derselben Zeile; der Kopf
   wird dabei weder höher noch niedriger (im Mixarium fest 56 px, gemessen: gleiche Höhe zu und auf, alle Knöpfe auf einer
   Linie, kein Überlauf bei 390 px). Probe dafür: Höhe vorher = Höhe nachher, eine einzige Knopf-Zeile.

2. **Strichsymbole müssen im Dunkeln hell sein.** Klaus: „die Strich-Emojis sind nicht zu sehen, weil sie schwarz sind auf
   dunklem Untergrund.“ Ursache im Mixarium: dem `<svg>` der Phosphor-Symbole fehlte `fill:currentColor` (die Klasse dafür
   stand nicht am Element), also füllte der Browser schwarz; im Hellen fiel es nicht auf. **Bitte im Kern prüfen**
   (`kern/oberflaeche/symbole.mjs`, Klasse `ic`): jedes Symbol muss die Schriftfarbe seiner Umgebung erben, und die Umgebung
   muss im Dunkeln hell sein (Kopf, runde Knöpfe, Leiste, Einstellungs-Zeilen, Menüs). Probe: berechnete `fill` eines Symbols
   im Kopf und in den Einstellungen ist im Dunkeln hell.

3. **Schriftgröße als Schieberegler, live, für die ganze App** – wie „A··A“ in der Familienakte/Private Akte
   (`klone/familienakte/tests/ui/schrift-knopf.test.mjs`): Knopf hinter dem Pfeil im Kopf und Zeile in den Einstellungen
   öffnen einen Regler 85–150 % in 5er-Schritten; **die Schrift ändert sich, während man schiebt**, die Zahl steht daneben,
   „Zurück auf 100 %“, der Wert bleibt nach dem Neuladen. Klaus: „da steht nur groß, klein. Da kann ich nicht sehen, während
   ich etwas verändere, was verändert wird.“ Befund Rezeptbuch: `kochSchrift` schaltet klein/mittel/groß reihum und gilt nur
   für die Kochansicht – das ist genau, was Klaus nicht will. Im Mixarium ersetzt der Regler die drei Stufen; er gilt auch in
   der Mix-Ansicht. Umsetzung dort: CSS `zoom: var(--z)` auf dem Inhaltsbereich und auf der Mitte der Mix-Ansicht (Kopf und
   Leiste bleiben), beim Schieben nur die Variable setzen, nicht neu zeichnen (sonst verliert der Regler den Finger).
   **Gehört in den Kern** (ein Baustein „Schrift-Regler“).

4. **Farben genau wie in der Private Akte, und Dunkel für JEDE Farbe.** Klaus: „Die Farbwerte wurden nicht übernommen …
   wenn ich dunkel drücke, habe ich egal was ich anklicke dasselbe. Der einzige, der mit wechselt, ist die Leiste oben. Was
   ist denn das für ein Dunkeleffekt.“
   - Paletten-Werte unverändert aus `Private-Akte/app.js` (`FARBEN`). Koralle-Akzent ist `#c2562b` (4,51:1 auf Weiß – reicht;
     ein dunklerer Ton wirkt braun, das hatte ich fälschlich gemacht). Der Kern hat die Werte richtig.
   - **Hell und Dunkel sind ein eigener Schalter** („Wie das Gerät / Hell / Dunkel“) und **gelten für jede Farbe**. Im Dunkeln
     wird nicht nur der Kopf gefärbt, sondern alles aus der Palettenfarbe gemischt: Grund, Karten, Linien, Knöpfe, Menüs,
     Fenster, Leiste, Mix-/Kochansicht. Mixarium-Rezept (neu/app.css, Block „Dunkel folgt der gewählten Farbe ÜBERALL“):
     `--bg: color-mix(akz 15%, #05080e)`, `--fl: color-mix(akz 27%, #0a0e17)`, `--fl2: 38%`, Linien `akz 55%` über Weiß 14 %,
     Knöpfe als Verlauf `akz 62% → 30%` auf Nacht, Akzentschrift `akz 38%` in Weiß. Probe: die sieben Farben ergeben im
     Dunkeln sieben verschiedene Grund- und Kartenfarben.
   - Befund Rezeptbuch: Dunkel gibt es dort nur als **eine eigene Palette „Dunkelbraun“** (`f.dunkel`), nicht als Schalter;
     wer Wasserblau wählt, hat kein Dunkel, und die App folgt dem Gerät nicht. Bitte auf Schalter + getönte Mischung
     umstellen (`farbeSetzen(el, name, ton)`), Hellbraun/Dunkelbraun können als Farben bleiben.
   - Im Hellen trägt auch der Grund die Farbe (habt ihr schon: `--bg` aus `k3`).

5. **Sprache „wie das Gerät“** als erste Wahl im Sprachmenü: von Klaus so abgenommen.

6. **Zwei Ausgaben** (Klaus: „Ja, zwei Ausgaben, so machen“): `mixarium-store` nur Beispiele ohne Alkohol, `mixarium-voll`
   alle. Liegt bereits in `ausgaben/` hier und nutzt euren Ausgaben-Schalter; nichts zu tun, nur zur Kenntnis.

7. **Bild im Vollbild füllt wirklich den ganzen Schirm** (Klaus 23.11., Bildschirmfoto vom Tablet: es ging nur ein kleines
   Fenster auf). Schwarzer Grund über der ganzen App, Bild ganz sichtbar (`object-fit: contain`), Name unten, × oben rechts;
   Tipp, × oder Esc schließt, die Zurück-Taste auch. Bitte im Rezeptbuch prüfen. Probe: das Vollbild ist so groß wie das Fenster.

8. **Rohe Kennungen nie anzeigen.** Im Bildschirmfoto stand beim Glas „bowle“ (aus der Sicherung, keine bekannte Glas-Kennung).
   Unbekannte Werte werden als Text mit großem Anfangsbuchstaben gezeigt, nicht geraten und nicht still verworfen.

9. **Keine Knöpfe auf dem Bild.** Klaus 23.11.: „Nur dieses Getränk und größer machen kannst du rechts positionieren, neben
   den Containern, nicht direkt im Bild. Oder einen kleinen Pfeil, wo man die Funktion drin hat, sodass nicht das Bild gestört
   wird.“ Umsetzung Mixarium: am Monitor stehen „Nur dieses Getränk“ und „Bild vergrößern“ als Knöpfe rechts neben dem Bild
   unter den anderen Aktionen; am Handy liegt auf dem Bild nur ein kleiner Pfeil (28 px), der „Zurück“ und „Bild groß“
   ausklappt. Ein Tipp auf das Bild selbst zeigt es im Vollbild. Das Kopfbild am Monitor ist höher (400 px statt 330).
   Gilt sinngemäß für „Nur dieses Rezept“ und das Bild-Vollbild im Rezeptbuch.

10. **Englische Zutaten in den Beispielen.** Klaus 23.11. (Bildschirmfoto „Queen Charlotte“: Red wine, Grenadine,
    Lemon-lime soda, Glas „Collins glass“): „es ist die englische Zutatenliste, die nicht übersetzt wurde.“ Zwei Ursachen:
    (a) **Daten:** in `beispiele/getraenke-mit-alkohol-fuer-mixarium.json` sind bei fünf Getränken aus TheCocktailDB Zutaten
    und teils Schritte englisch (Amaretto fizz, Mango Mojito, Blind Russian, Amaretto Sunrise, Queen Charlotte), dazu
    Mengen wie „Garnish with“, „to fill“, „1 Fresh“. Im Mixarium ist die Datei jetzt durchgehend deutsch (eigene Prüfsumme
    im Katalog). **Bitte eure Fassung genauso berichtigen** und das Beispielbuch auf dieselbe Mischung prüfen.
    (b) **Anzeige:** liegt am Rezept `translations[<App-Sprache>]`, muss sie gezeigt werden – **auch für Deutsch**. Die alten
    Apps zeigen `translations.de` nie (`rTr` greift nur, wenn die Sprache nicht Deutsch ist). Im Mixarium: `sicht(r)` in
    `neu/app.mjs`. Bitte im Kern lösen. Freie Glas-Angaben („Collins glass“) werden lesbar gezeigt, nicht roh.
    Probe: im Beispielpaket kein englisches Wort in Zutaten/Schritten; ein Rezept mit `translations.de` zeigt Deutsch.

11. **Alle Beispiele Zeile für Zeile prüfen.** Klaus 23.11.: „Nicht nur bei Queen Charlotte, prüft das bei allen Zutaten,
    bei allen Beispielen. Die müssen ja wenigstens fehlerfrei sein.“ Im Mixarium durchgesehen und berichtigt: falsche
    Kategorien (Raspberry Cooler stand unter Bowlen, Blind Russian unter Smoothies), Siezen und Duzen gemischt, Zutat im
    Schritt anders genannt als in der Liste („Soda“ statt Zitronenlimonade), Mango Mojito hatte nur einen von vier Schritten
    und keinen Zucker, Solero ohne Alkohol-Kennzeichen, Portionen 2 bei Rezepten für ein Glas, Zeit 0, rohe Glas-Angaben.
    Dazu eine **Probe für die Pakete** (`tests/getraenke/beispiele.test.mjs`): bekannte Kategorie, mindestens 3 Zutaten und
    2 Schritte, lesbare Mengen, kein Englisch, keine Sie-Anrede, jede Zutat kommt in einem Schritt vor, Alkohol-Kennzeichen
    passt zum Paket. **Bitte dieselbe Probe über das Beispielbuch des Rezeptbuchs legen** (dort z. B. bekannt: Stollen,
    Eierschecke, Sushi Tempura) – am besten als Kern-Baustein „Paket prüfen“.
    ⚠ Amaretto Sunrise: TheCocktailDB nennt 1 cl Amaretto und ¼ cl Grenadine auf 4 oz Saft; ich habe 1 oz und ¼ oz gesetzt
    (die übliche Mischung). Das ist eine Änderung an Klaus' Daten und ihm gemeldet.

12. **Ein Zeichen, eine Bedeutung.** Klaus 23.11.: „Das Symbol für Mixen ist dasselbe wie für Alle und für Getränke.“
    Im Mixarium: „Mixen“ trägt jetzt einen Shaker (eigene Zeichnung im Stil der Symbole), „Alle“ ein Buch, „Getränke“ das
    Glas. Bitte im Rezeptbuch prüfen, dass „Kochen“, „Alle“ und „Rezepte“ nicht dasselbe Zeichen tragen.

### Was das Mixarium aus eurem Brief (`docs/BRIEF_2026-11-23_REZEPTBUCH-AN-MIXARIUM.md`) annimmt

- Punkte 1–10 mit euren Ergänzungen: ja. Geräte ohne KI aus dem Schritttext, von Hand ergänzbar (`r.geraete`): hier schon so.
- Übersetzung ohne eigene Leiste/Zeile/Box: ja; die Sprachzeile aus der Vorschau gibt es in der PWA nicht.
- SBKIM/Mycel eingebaut, **nicht geladen**, Freischaltung entscheidet Klaus später: ja, hier genauso (in der neuen PWA ist
  es noch gar nicht eingehängt).
- Bedeutungssuche: im Mixarium derselbe Weg (`SbkimEmbedding`, QC-Abschnitt „Bedeutungs-Suche“). Bitte als `kern/suche/`
  ohne Deckel bauen; das Mixarium übernimmt es. Der Deckel hier ist noch nicht nachgemessen.
- Sushi-Befund: in `getraenke/` schon so gelöst (`blank` nur ohne Namen, Kennung getrimmt, Groß/Klein bleibt getrennt) –
  deckt sich mit eurem `modell/rezept.mjs`.
- Erklärtexte hinter „?“: ja, übernehme ich mit dem Kern-Baustein; bis dahin halte ich Unterzeilen kurz.
- Spracheingabe, Bild anpassen, Import-Blatt hinter +, Einkaufsliste je Laden, Wochenplan: ja, aus dem Kern.
- Notizbuch mit Kalender, Kreativbuch/Food-Zine: für das Mixarium später; kein Einwand.

### Was das Mixarium vom Kern braucht, um seine vorläufigen Teile abzugeben

Kern 0.6.0 ist hier byte-gleich übernommen (Pin `e7543aa`). Zum Umhängen der Mixarium-PWA auf den Kern fehlt oder ist zu
klären: (a) Schrift-Regler und Hell/Dunkel-Schalter aus dieser Runde; (b) `kategorien-fest.mjs` und `warengruppen.mjs`
je Ausgabe austauschbar (Getränke-Kategorien, Bar-Warengruppen); (c) Geräteliste per `erweitern()` – die Bar-Geräte liegen
in `getraenke/geraete.mjs`; (d) Mengen: `getraenke/einheiten.mjs` kann ml↔cl↔oz, Spannen und Brüche und ist gegen die alte
App geprüft (zwei Rechenfehler der alten App berichtigt: „10,5“ wurde 1,5; „1 ½“ wurde 1) – bitte prüfen, ob
`modell/mengen.mjs` dasselbe tut, sonst gern übernehmen; (e) Alkohol-Schalter und -Kennzeichen bleiben Getränke-Schicht.

---

## Runde 2 · 23.11.2026 – zwei Ausgaben

```
Ergänzung aus der Mixarium-Sitzung (Klaus 23.11.: „Ja, zwei Ausgaben, so machen“): Das Mixarium braucht zwei
Ausgaben aus demselben Code – „store“ (Google Play, nur Beispiele ohne Alkohol, Alkohol-Paket weder im Paket noch
angeboten) und „voll“ (Web-App und Klaus' eigene APK/Windows-App, alle Beispiele). Erledigt im Kern 0.1.0.
```

## Runde 1 · 23.11.2026 – aus der Abnahme der Vorschau (vom Rezeptbuch bereits übernommen)

```
Abgleich aus der Mixarium-Sitzung (Klaus hat dort am 23.11. abgenommen; bitte für Mein Rezeptbuch übernehmen,
damit beide Apps gleich laufen und der Küchen-Kern es einmal für beide liefert). Vorbild zum Nachsehen:
Repo Mein-Mixarium, docs/vorschau/mixarium-neu.html (PR #271), Abschnitt „Punkte zum Ja“.

Schon gleich, nichts zu tun: Wasserfarben der Private Akte über die Farbscheibe; fliegende Leiste statt Leiste unten,
verschiebbar und einrastend; Leiste am Monitor links, einklappbar; Phosphor Duotone (Klaus: Ja, Lucide fällt weg);
Master-Detail am Monitor; Einkaufsliste mit Herkunft je Posten; Pakete/Beispiele erst auf Tippen.

Bitte angleichen:

1. Knöpfe und Farben: Knöpfe, gewählte Reiter, Plus/Minus, die aktive Leistenzeile und „Weiter“ in der Kochansicht
   NICHT in Vollton-Akzent, sondern als Verlauf in der Palettenfarbe (Wasserfarbe): hell z. B.
   linear-gradient(120deg, k1 aufgehellt, k3 aufgehellt) mit Schrift in der Schriftfarbe der Palette und 1 px Rand in
   Akzent 28 %; dunkel ein Verlauf aus der Akzentfarbe in die Nacht mit heller Schrift. Klaus: „keine Volltonfarben,
   eher Wasserfarben, wie Familienbüro oder Private Akte“, „im Dunkelmodus immer ein kleiner Farbverlauf“.
   Maße, die Klaus abgenommen hat: Hauptknopf 36 px hoch (Padding 6/15, Ecken 11 px, nicht ganz rund), runde
   Knöpfe 34 px, Reiter/Chips 28 px (Ecken 9 px), Plus/Minus 30 px. Nur Weiter/Zurück in der Kochansicht 46 px.
   „Etwas sportlicher, nicht so hoch, nicht so breit.“

2. Fliegende Leiste schmaler und ohne Überdeckung: Griff 12 × 64 px (statt 18 × 76), aufgeklappte Knöpfe 34 px
   hoch, 13 px Schrift, Fach höchstens ca. 180 px breit. Auf der Seite, an der der Griff sitzt (links/rechts/unten),
   hält der Inhalt einen eigenen Rand frei (ca. 24 px), damit der Griff nie in Fotos oder Karten hineinragt.
   Klaus: „so gestalten, dass sie nicht in die Bilder hineinkommt oder optisch in die Container reinfällt“.

3. Kopf: oben die Suche (am Monitor als Feld im Kopf, am Handy als Feld oben auf der Startseite) und rechts ein
   Pfeil nach links, der die Werkzeuge ausklappt (Suche, Farbe, Sprache, Einstellungen; im Mixarium dazu „Ohne
   Alkohol“). Eingeklappt ist der Kopf minimal. Klaus fand Suche oben und die Lage der Einstellungen „sehr gut“.

4. Sprache: KEIN Kürzel „DE“ sichtbar im Kopf („jeder kennt seine Sprache“). Die Sprache folgt dem Gerät und ist
   einstellbar in den Einstellungen und über die Weltkugel im ausgeklappten Kopf. Rezepte werden beim Umschalten
   mitübersetzt (KI mit eigenem Schlüssel), die Übersetzung am Rezept gespeichert, das Original einen Tipp entfernt.
   Mengen passen sich automatisch dem Land an (metrisch/US), umschaltbar am Rezept.

5. Kochansicht nicht nur Text (Klaus: „zu nackig“): oben das Foto des Rezepts (oder des Schritts), darunter der
   Schritt groß, die Zutaten dieses Schritts und gezeichnete Gerätschaften als Kacheln (Schneebesen, Pfanne, Topf,
   Messer, Reibe, Sieb, Mixer, Backform …), selbst gezeichnet im Stil der Symbole, fest in der App, kein Netz.
   Am Monitor links Foto + Schritt, rechts „Für diesen Schritt“ (Zutaten, Wecker, Gerätschaften). Am Handy klappt die
   Kopfzeile der Kochansicht mit einem Pfeil auf die schmale Fortschrittslinie zusammen. KEINE Sprach- und
   Schriftgrößen-Knöpfe in der Kochansicht. Die Gerätschaften stehen auch als Liste am Rezept.

6. Schriftgröße der Kochansicht (klein/mittel/groß) in den Einstellungen, nicht in der Kochansicht.

7. „Nur dieses Rezept“: am Monitor ein Knopf im geöffneten Rezept blendet Liste und Leiste aus, damit nur dieses
   Rezept bearbeitet oder gekocht wird; derselbe Knopf holt sie zurück. Ohne Tipp bleibt alles eingeblendet.

8. SBKIM/Mycel: NICHT entfernen. Bleibt im Hintergrund funktionsfähig, ist aber unsichtbar (kein Knopf, kein
   Widget, keine Netz-Leiste, kein Eintrag in Hilfe oder Einstellungen, kein Netzverkehr). Wie man es freischaltet,
   entscheidet Klaus später. In deiner Vorschau steht „gibt es in dieser Fassung nicht“, bitte so ändern.

9. Beispiele beim ersten Start: aus Klaus' bestehenden JSON-Sicherungen, als eigene Datei(en) neben der App auf dem
   Server, getrennt vom Programm; in Android/Windows im Paket, damit der erste Start ohne Netz geht. Euer
   Paket-Weg (auf Tippen, wegen Google Play) passt; im Mixarium gilt derselbe Mechanismus. Bitte im Kern als ein
   gemeinsamer Baustein („Beispiel-Paket laden“ = Import einer Sicherung mit Fotos, Dubletten über r.uid).

10. Gemeinsame Bausteine, die das Mixarium aus dem Kern übernimmt: Palette/Farbscheibe, Verlaufs-Knöpfe, fliegende
    Leiste mit Randfreihaltung, klappbarer Kopf, Sprache/Einheiten, Kochansicht-Gerüst (Bild, Schritt, Zutaten,
    Gerätschaften, Fortschritt, Wischen/Pfeiltasten, Wach-Sperre), „Nur dieses …“, Einstellungen-Liste,
    Beispiel-Paket. Die Gerätschafts-Zeichnungen bitte als erweiterbare Liste im Kern, das Mixarium hängt seine
    Bar-Geräte (Stößel, Barlöffel, Shaker, Barsieb, Messbecher …) als Ausgabe an.
```
