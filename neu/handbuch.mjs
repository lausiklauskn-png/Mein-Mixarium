// Mein Mixarium · Handbuch: kurze Themen zum Aufklappen. Auf den Blättern der App steht kein Erklärtext; wer nachlesen will, findet es hier.
// Jeder Absatz ist ein Paar L('Deutsch', 'English'); die übrigen Sprachen kommen aus den Tabellen (neu/sprachen/). Vorbild: Mein Rezeptbuch.
/** L: der Text-Helfer der App. Zurück: [[symbol, titel, [absätze]], …] */
export const handbuch = (L) => [
  ['drinks', L('Erste Schritte', 'First steps'), [
    L('Die App beginnt mit ein paar Beispielgetränken. Du entfernst sie in den Einstellungen unter „Beispiele“.', 'The app starts with a few example drinks. You remove them in the settings under “Examples”.'),
    L('Ein neues Getränk legst du über das Plus oben an. Alles, was du anlegst, liegt nur in diesem Gerät.', 'You add a new drink with the plus at the top. Everything you add is stored on this device only.'),
    L('Die Leiste am Rand führt zu Getränke, Karte, Einkauf, Labor und Einstellungen.', 'The bar at the edge leads to drinks, drinks list, shopping, lab and settings.'),
  ]],
  ['plus', L('Neues Getränk', 'New drink'), [
    L('Schreiben: Name, Zutaten und Schritte selbst eintragen. Das Mikrofon in den Textfeldern schreibt mit, wenn dein Browser es kann.', 'Write: enter name, ingredients and steps yourself. The microphone in the text fields takes dictation if your browser supports it.'),
    L('Foto: ein Rezept fotografieren oder eine Datei wählen (auch PDF, auch mehrere). Die KI liest es und füllt das Formular; du prüfst und speicherst.', 'Photo: take a picture of a recipe or choose a file (PDF and several files work too). The AI reads it and fills in the form; you check and save.'),
    L('Vom Glas: ein fertiges Getränk fotografieren. Claude schlägt ein Rezept dazu vor. Das ist ein Vorschlag, kein abgelesenes Rezept.', 'From the glass: take a picture of a finished drink. Claude suggests a recipe for it. This is a suggestion, not a recipe that was read.'),
    L('Web: die Adresse einer Rezeptseite einfügen. Text: ein Rezept als Text einfügen, ganz ohne KI. Datei: eine Sicherung oder die Datei einer anderen App einlesen.', 'Web: paste the address of a recipe page. Text: paste a recipe as text, without any AI. File: read a backup or a file from another app.'),
    L('Entdecken: bekannte Drinks bei thecocktaildb.com suchen. Hinaus geht nur der Suchtext. Beispiele: fertige Pakete mit Getränken laden.', 'Discover: search well-known drinks at thecocktaildb.com. Only the search text is sent. Examples: load ready-made packages of drinks.'),
  ]],
  ['lab', L('Labor', 'Lab'), [
    L('Im Labor erfindet die KI neue Getränke nach Kategorie und Geschmack. Dafür braucht es Netz und deinen eigenen Anthropic-Schlüssel.', 'In the lab the AI invents new drinks by category and taste. This needs the network and your own Anthropic key.'),
    L('Was die KI erfindet, landet zuerst im Labor. Du bewertest es; gut bewertete Getränke kommen ins Buch, schwache überarbeitet die KI. Du kannst eines auch annehmen oder verwerfen.', 'What the AI invents goes to the lab first. You rate it; well-rated drinks go into the book, weak ones are revised by the AI. You can also accept or discard one.'),
  ]],
  ['sparkle', L('KI und Schlüssel', 'AI and keys'), [
    L('KI läuft nur mit deinem eigenen Schlüssel und nur, wenn du es auslöst. Im Knopf steht vorher, was an wen geht.', 'AI runs only with your own key and only when you start it. The button says beforehand what is sent to whom.'),
    L('Anthropic (Claude) arbeitet im Labor, liest Fotos und Webseiten, übersetzt, prüft die Rechtschreibung und schätzt Nährwerte. OpenAI malt Bilder. Mistral liest Text aus Fotos (EU).', 'Anthropic (Claude) works in the lab, reads photos and web pages, translates, checks spelling and estimates nutrition. OpenAI draws pictures. Mistral reads text from photos (EU).'),
    L('Einen Schlüssel trägst du in den Einstellungen unter „KI-Schlüssel“ ein. Er bleibt in diesem Gerät und kommt in keine Sicherung. Die Kosten rechnet der Anbieter mit dir ab.', 'You enter a key in the settings under “AI keys”. It stays on this device and is in no backup. The provider bills you directly.'),
  ]],
  ['camera', L('Vor dem Senden geprüft', 'Checked before sending'), [
    L('Ein Foto geht verkleinert und ohne Aufnahmedaten und Ort hinaus. Ein PDF geht als Seitenbilder hinaus, höchstens zehn Seiten.', 'A photo is sent reduced in size and without capture data and location. A PDF is sent as page images, ten pages at most.'),
    L('Steht in einem PDF Text, den man nicht sieht, oder in einem Text, einem Bildauftrag oder einer Suchfrage ein Befehl an eine KI, hält die App an und zeigt die Stelle. Du entscheidest.', 'If a PDF contains text you cannot see, or a text, a picture request or a search query contains an instruction to an AI, the app stops and shows the spot. You decide.'),
  ]],
  ['search', L('Suchen', 'Search'), [
    L('Die Suche findet zuerst Namen und Zutaten. Findet sie nach dem Wort nichts, sucht sie nach Bedeutung, wenn die Sinn-Suche eingeschaltet ist.', 'Search first finds names and ingredients. If nothing is found by word, it searches by meaning when meaning search is on.'),
    L('Die Sinn-Suche findet zum Beispiel „etwas Erfrischendes“. Dafür lädt die App einmal ein Sprachmodell (etwa 120 MB); danach rechnet sie im Gerät.', 'Meaning search finds, for example, “something refreshing”. For this the app loads a language model once (about 120 MB); after that it runs on the device.'),
    L('„KI prüft“ bei den Treffern nach Bedeutung lässt Claude urteilen, was wirklich passt.', '“AI check” at the meaning hits lets Claude judge what really fits.'),
  ]],
  ['shaker', L('Am Getränk', 'At the drink'), [
    L('Die Portionen rechnest du mit Plus und Minus um. „Mixen“ zeigt Schritt für Schritt mit den Zutaten des Schritts; der Bildschirm bleibt dabei an.', 'You convert the servings with plus and minus. “Mix” shows step by step with the ingredients of the step; the screen stays on.'),
    L('Unter „Mehr“: Drucken, Teilen per QR-Code, Übersetzen, Rechtschreibung prüfen und Nährwerte schätzen. Mit den Sternen bewertest du ein Getränk.', 'Under “More”: print, share by QR code, translate, check spelling and estimate nutrition. With the stars you rate a drink.'),
    L('Ein Tipp aufs Bild zeigt es groß. Von dort ersetzt du es, fügst eines ein, lässt ein KI-Bild malen oder erzeugst ein Gratis-Foto (ohne Schlüssel; der Name des Getränks geht an den Dienst Pollinations).', 'A tap on the picture shows it large. From there you replace it, add one, have an AI picture drawn or create a free photo (no key; the drink name goes to the Pollinations service).'),
  ]],
  ['plan', L('Karte, Plan und Einkauf', 'Drinks list, plan and shopping'), [
    L('Eine Getränkekarte stellt für einen Anlass zusammen, was es wann zu trinken gibt, mit der Zahl der Gäste.', 'A drinks list puts together what to drink and when for an occasion, with the number of guests.'),
    L('„Auf die Einkaufsliste“ am Getränk legt die Zutaten auf die Liste. Im Wochenplan trägst du Getränke für die Woche ein; „Einkaufsliste für die Woche“ legt alles auf einmal auf die Liste.', '“Add to shopping list” at the drink puts the ingredients on the list. In the weekly plan you enter drinks for the week; “Shopping list for the week” puts everything on the list at once.'),
  ]],
  ['folder', L('Ordnung', 'Order'), [
    L('Kategorien kannst du umbenennen, neu anlegen und mit eigenem Bild versehen. Ein Ordner sammelt Getränke quer zu den Kategorien, zum Beispiel „Sommerfest“; die Kategorie bleibt dabei erhalten.', 'You can rename categories, add new ones and give them their own picture. A folder collects drinks across categories, for example “Summer party”; the category is kept.'),
    L('„Ohne Alkohol“ blendet alle Getränke mit Alkohol aus, überall in der App. Unter „Einheiten“ wählst du, wie Mengen erscheinen.', '“Without alcohol” hides all drinks with alcohol everywhere in the app. Under “Units” you choose how amounts are shown.'),
    L('Unter „Bilder“ siehst du alle Bilder. „KI-Bilder“ erzeugt für jedes Getränk ohne Bild eines; vorher stehen Anzahl und Kosten da.', 'Under “Pictures” you see all pictures. “AI pictures” creates one for every drink without a picture; number and cost are shown first.'),
  ]],
  ['safe', L('Sichern', 'Backup'), [
    L('Die Getränke liegen nur in diesem Gerät. Wird der Browser geleert, sind sie weg. Eine Sicherung als Datei schützt davor und bringt sie auf ein anderes Gerät.', 'The drinks are stored on this device only. If the browser is cleared, they are gone. A backup file protects against that and takes them to another device.'),
    L('Der Tresor hält dazu mehrere Stände im Gerät. Er hilft, wenn etwas falsch gelöscht oder eingelesen wurde. KI-Schlüssel kommen nie in eine Sicherung.', 'The vault also keeps several states on the device. It helps when something was deleted or imported by mistake. AI keys never go into a backup.'),
  ]],
  ['auge', L('Darstellung und Sprache', 'Appearance and language'), [
    L('Farbe, Hell oder Dunkel, Schriftgröße und hoher Kontrast stellst du in den Einstellungen unter „Darstellung“ ein.', 'You set colour, light or dark, text size and high contrast in the settings under “Appearance”.'),
    L('Die Sprache folgt dem Gerät; du kannst sie dort auch fest wählen. Getränke bleiben, wie sie geschrieben sind; „Übersetzen“ legt eine Fassung in einer anderen Sprache dazu.', 'The language follows the device; you can also choose it there. Drinks stay as they are written; “Translate” adds a version in another language.'),
  ]],
  ['download', L('Ohne Netz und als App', 'Offline and as an app'), [
    L('Nach dem ersten Öffnen läuft die App ohne Netz. Netz brauchen nur die KI, der Web-Import, Entdecken, die Beispielpakete und das erste Laden des Sprachmodells.', 'After the first opening the app runs offline. Only the AI, the web import, Discover, the example packages and the first download of the language model need the network.'),
    L('Der Knopf mit dem Pfeil oben installiert die App auf dem Startbildschirm; danach verschwindet er. Ein Tipp auf die Versionsnummer oben holt die neueste Fassung.', 'The arrow button at the top installs the app on the home screen; after that it disappears. A tap on the version number at the top fetches the latest version.'),
  ]],
];
