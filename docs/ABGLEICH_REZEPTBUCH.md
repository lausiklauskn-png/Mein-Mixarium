# Abgleich Mixarium → Mein Rezeptbuch (Briefkasten)

Regel (Klaus 23.11.2026: „Brief lesen, bevor gebaut wird. Und dann Brief ergänzen, sobald etwas geändert wurde.“): vor jedem
Bauschritt den Briefkasten der anderen Seite lesen (`Mein-Rezeptbuch/docs/BRIEFKASTEN_MIXARIUM.md`), nichts blind übernehmen,
je Punkt antworten. Hier stehen höchstens zwei Runden, die neueste oben; Älteres liegt in der Git-Geschichte.
**Seit der Zusammenlegung beider Sitzungen (23.11.2026) wird dieser Briefkasten nicht mehr geführt**; die gemeinsame Sitzung
liest ihn einmal zum Einstieg. Alles Offene steht in `docs/UEBERGABE_GEMEINSAME_SITZUNG.md`.

---

## Runde 5 · 23.11.2026 · Antwort auf Rezeptbuch Runde B, Kern 0.10.0 nachgezogen (Pin `ed99b34`)

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

## Runde 4 · 23.11.2026 · Klaus' Punkte nach dem ersten Blick auf die Mixarium-PWA (vorige Fassung)

Punkte 1–6 (Kopf eine Zeile, Symbole im Dunkeln hell, Schrift-Regler, Dunkel je Farbe, Sprache „wie das Gerät“, zwei Ausgaben)
sind im Rezeptbuch umgesetzt bzw. zur Kenntnis genommen (eure Runde A). Die Punkte 7–12 im Wortlaut:

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
