import fs from 'fs';
const src=fs.readFileSync('QC_Mixarium_20_04_26.html','utf8').split('\n');
const tests=fs.readdirSync('tests').map(f=>[f,fs.readFileSync('tests/'+f,'utf8')]);
// Abschnitte: Zeile nach einer ═-Zeile, sowie ── Unterabschnitte
const secs=[];
for(let i=0;i<src.length;i++){
  if(/^\/\/ ═{10,}/.test(src[i]) && /^\s*\/\/ \S/.test(src[i+1]||'') && !/^\/\/ ═/.test(src[i+1]) && [2,3,4,5].some(d=>/^\/\/ ═{10,}/.test(src[i+d]||''))&& !/^\/\/ ═{10,}/.test(src[i-1]||'')){secs.push({line:i+2,name:src[i+1].replace(/^\s*\/\/\s*/,'').replace(/[═─\s]+$/,'').trim(),fns:[]});}
}
secs.unshift({line:1,name:'(vor den Abschnitten: Kopf, Stil, frühe Helfer)',fns:[]});
for(let i=0;i<src.length;i++){
  const re=/(?:^|[^.\w$])function\s+([A-Za-z_$][\w$]*)\s*\(/g;let m;
  while((m=re.exec(src[i]))){let s=secs[0];for(const x of secs){if(x.line<=i+1)s=x;}s.fns.push({n:m[1],l:i+1});}
}
const K={
 'TRANSLATIONS':['Kern','Übersetzung (8 Sprachen); Getränke-Wörter in der Getränke-Schicht'],
 'STATIC DATA':['nur Mixarium','Kategorien, Gläser, Temperaturen, eigene Kategorie-Namen'],
 'STATE':['Kern','Zustand, Speichern'],
 'INDEXEDDB BACKUP LAYER':['Kern + Übernahme','Sicherung; Übernahme aus MeinMxBackup1 ist Getränke-Schicht'],
 'BOOT PROGRESS':['entfällt','Intro nur beim ersten Start, überspringbar'],
 'BOOT / SEED':['Kern + nur Mixarium','Start im Kern; Beispiel-Getränke (ohne Alkohol) hier'],
 'LANGUAGE':['Kern',''],
 'THEME':['Kern (geändert)','8 Themen → Wasserfarben aus Familienbüro/Private Akte (7), je hell und dunkel; Klaus 23.11.'],
 'PWA':['Kern',''],'TOAST':['Kern',''],'SCREENS':['Kern',''],
 'KI-LABOR (Mix-Labor) — Getränke erfinden & bewerten':['nur Mixarium','**alles wie bisher, jede Funktion mit Probe** (Klaus 23.11.): Erfinden, 4 Bewertungen, experimentell → Buch/entfernt, KI-Überarbeitung, Favorit-Schutz, Einzelpersonen-Modus, Entdecken (Netz auf Knopfdruck)'],
 'ALKOHOL-TOGGLE (systemweit, Privacy-First)':['nur Mixarium','Schalter „ohne Alkohol“ (mxNoAlc9)'],
 'SEARCH':['Kern','Suche, Bedeutungssuche'],
 'OVERLAYS':['Kern',''],
 'KI-BILD (DALL·E 3) — Foto für ein Getränk erzeugen':['Kern','KI-Aufruf mit eigenem Schlüssel; Bild-Auftrag für Getränke hier'],
 'IMAGE IMPORT':['Kern',''],'DRAG & DROP — Karten, Zutaten, Schritte':['Kern',''],
 'AI SCAN':['Kern + nur Mixarium','Foto-Import im Kern; Getränke-Prompt hier'],
 'REZEPT TEILEN (QR-Code + Web Share)':['Kern',''],
 'JSON EXPORT/IMPORT':['Kern + Übernahme','Format version 10, Übernahme alter Sicherungen'],
 'COVER HELPERS':['Kern','Bücher'],'PDF BOOK EXPORT':['Kern','Bücher'],'FLIPBOOK EXPORT':['Kern','Bücher'],
 'CAT NAV':['Kern + nur Mixarium','Kategorie-Mechanik im Kern, Getränke-Kategorien hier'],
 'BADGE':['Kern',''],
 'MENU SCREEN':['Kern','Planer (Mein Menü / Wochenplan)'],
 'COURSE SHEET':['nur Mixarium','Gänge → Gläser'],
 'MENU VIEWER':['Kern','Menü-Ansicht, Einkaufsliste'],
 'PRINT':['Kern',''],'FOLDERS':['Kern',''],'NEW RECIPE':['Kern',''],
 'BILD-AUSSCHNITT ANPASSEN (Crop)':['Kern',''],'NOTES':['Kern',''],
 'SERVING SIZE SCALING':['Kern + nur Mixarium','Skalieren im Kern; ml/cl/Spritzer/Barlöffel hier'],
 'RENDER':['Kern + nur Mixarium','Karte im Kern; Glas/Temperatur/Alkohol-Marke hier'],
 'ACTIONS':['Kern',''],'KEYBOARD SHORTCUTS':['Kern',''],
 'INIT':['Kern','Wischen, Zurück-Taste, KI-Panel, Barrierefreiheit, Text-Import'],
 'WEB RECIPE IMPORT – Rezept aus dem Internet laden':['Kern (geändert)','ohne öffentliche Weiterleiter'],
 'JSON SANITIZER — fixes unescaped control chars and quotes in AI responses':['Kern',''],
 'TRANSLATION ENGINE':['Kern','Sprachknopf sichtbar im Kopf; Getränke-Übersetzung am Getränk gespeichert (Klaus 23.11.)'],
 'BACKUP VAULT – Mehrere Sicherungen verwalten':['Kern',''],
 'HANDBUCH / MANUAL':['Kern + nur Mixarium','Hilfe-Gerüst im Kern, Getränke-Texte hier'],
};
let out=[];let tot=0;
out.push('# Funktionsliste Mein Mixarium (Bestand v9.5)\n');
out.push('Erhoben am 23.11.2026 aus `QC_Mixarium_20_04_26.html` (main `'+process.argv[2]+'`, '+src.length+' Zeilen), maschinell mit `tools/funktionsliste.mjs`.');
out.push('Spalte **Ziel**: *Kern* = kommt aus dem Küchen-Kern von Mein Rezeptbuch (byte-gleich, Pin) · *nur Mixarium* = Getränke-Schicht in diesem Repo · *entfällt* = nicht in der neuen Fassung.');
out.push('Spalte **Probe**: vorhandene Probe unter `tests/`, die eine Funktion des Abschnitts beim Namen nennt.');
out.push('Abgleich mit der Funktionsliste von Sitzung A: **offen** – sie liegt noch nicht im Repo Mein-Rezeptbuch (geprüft 23.11., alle Zweige).\n');
out.push('## Übersicht\n\n| Abschnitt | ab Zeile | Funktionen | Ziel | Hinweis | Probe |\n|---|---:|---:|---|---|---|');
const det=[];
for(const s of secs){ if(!s.fns.length)continue; tot+=s.fns.length;
  const k=K[s.name]||['Kern','']; const probe=new Set();
  for(const f of s.fns){const hits=tests.filter(([t,c])=>new RegExp('\\b'+f.n.replace(/\$/g,'\\$')+'\\b').test(c));if(f.n.length<5||hits.length>6)continue;for(const [t] of hits)probe.add(t.replace(/\.(mjs|sh)$/,''));}
  if(0)for(const [t,c] of tests)if(new RegExp('\\b'+f.n.replace(/\$/g,'\\$')+'\\b').test(c))probe.add(t.replace(/\.(mjs|sh)$/,''));
  out.push(`| ${s.name.replace(/\|/g,'/')} | ${s.line} | ${s.fns.length} | ${k[0]} | ${k[1]} | ${[...probe].join(', ')||'–'} |`);
  det.push(`### ${s.name} (ab Zeile ${s.line}) – ${k[0]}\n\n`+s.fns.map(f=>'`'+f.n+'`').join(' · ')+'\n');
}
out.push(`\n**Summe: ${tot} Funktionsdefinitionen.**\n`);
out.push(`## Außerhalb der Seite

| Teil | Ziel | Hinweis |
|---|---|---|
| \`sbkim/\` (SBKIM/Mycel, 41 Dateien, u. a. \`23_rendezvous_ui.js\`) | Modul im Hintergrund, **unsichtbar** | Klaus 23.11.: bleibt drin, taucht nirgends auf (kein Knopf, kein Widget, keine Hilfe, kein Netz), nur über Freischaltung nutzbar; Vorschlag 7× auf die Fassungsnummer + Code |
| \`assets/\` (Reinigung, Prüfer) | Kern | Reinigung vor der KI, Prüfung auf Knopfdruck |
| \`app-sw.js\` | Kern | Offline-Speicher |
| \`gift*.html\`, \`invite-v5.html\`, \`impressum.html\` | nur Mixarium | eigenständige Seiten, unverändert |
| \`mr-*.html\` | – | Fremdkörper aus Muttis Rezeptbuch, nicht anfassen |
| TheCocktailDB (Entdecken) | nur Mixarium | Netz nur auf Knopfdruck |
| Web-Import über allorigins/codetabs | **entfällt** | in der App direkt laden (Capacitor-HTTP) |
| Beispielgetränke | nur Mixarium | zwei Ausgaben (Klaus 23.11.): *store* nur ohne Alkohol, *voll* mit allen; Pakete unter \`beispiele/\`, löschbar mit einem Klick |

## Speicher (Übernahme in der Getränke-Schicht)

\`mix9m\` (Getränke), \`mxfd9m\` (Ordner), \`mxms9m\` (Menüplan), \`mxNoAlc9\` (ohne Alkohol), \`mxcats9m\`/\`mxcatsneu9m\`/\`mxcatsaus9m\`/\`mxcatord9m\` (Kategorien), \`mxlang9m\`, \`mxtheme9m\`, \`mxknoten9m\`, Schlüssel \`mxkey9m\`/\`mxmistralkey9m\` (werden **nicht** übernommen, nur hingewiesen), IndexedDB \`MeinMxBackup1\`. Gelesen wird nur, nichts gelöscht.

## Getränke-Felder am Rezept (Bestand)

\`id uid name cat folder ings steps img imgCrop servings prepTime flavors glass rating translations herkunft dbId kiEntfernt\` sowie Labor-Felder \`labGen labStatus labScore labRatings labLog labFavorite labRevision*\`. Alkohol: Kategorie-Marke \`alcohol:true\` (Cocktails) plus Zutaten-Erkennung.

## Einzelne Funktionen je Abschnitt
`);
fs.writeFileSync('docs/FUNKTIONSLISTE.md',out.join('\n')+'\n'+det.join('\n'));
console.log(tot);
