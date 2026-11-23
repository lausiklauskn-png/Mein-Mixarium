# Abgleich für Sitzung A (Mein Rezeptbuch) – aus Klaus' Abnahme der Mixarium-Vorschau, 23.11.2026

Zum Einfügen in die Sitzung im Repo Mein-Rezeptbuch (PR #452). Grundlage: Klaus' Rückmeldungen zur Mixarium-Vorschau
(https://claude.ai/artifact/Mib1gJ2k2gNR4kAJyLKB61, Datei `docs/vorschau/mixarium-neu.html` im Repo Mein-Mixarium, PR #271),
abgeglichen mit deiner Vorschau `docs/vorschau/rezeptbuch-neu.html` (Zweig `ccr-ae23bc33-b9zbpd`, Stand a8c4054).

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
