#!/usr/bin/env bash
# Gegenprobe zu tests/smoke_kategorien.mjs — jeder eingebaute Fehler MUSS die
# Probe umwerfen, UND die rote Zeile muss den Namen der gemeinten Zusicherung
# tragen. „Rot" allein genuegt nicht: ein Absturz aus fremdem Grund saehe
# genauso aus.
#
# ⚠ Laeuft in einer WEGWERF-KOPIE. Sabotage im echten Baum bleibt nach einem
#   Abbruch liegen und sieht danach wie ein Baufehler aus (PWA-Toolpoint,
#   2026-09-09 und 2026-09-14).
set -u
QUELLE="$(cd "$(dirname "$0")/.." && pwd)"
KOPIE="$(mktemp -d)/mix"
mkdir -p "$KOPIE"
cp -a "$QUELLE/." "$KOPIE/" 2>/dev/null
rm -rf "$KOPIE/node_modules"; ln -s "$QUELLE/node_modules" "$KOPIE/node_modules"
cd "$KOPIE" || exit 2
DATEI="QC_Mixarium_20_04_26.html"

gefangen=0; durch=0; tot=0; falsch=0

lauf(){ node tests/smoke_kategorien.mjs 2>&1; }

# Ausgangslage MUSS gruen sein — sonst misst kein Fall etwas.
if lauf | grep -qE "^[0-9]+ grün · 0 ROT$"; then echo "Ausgangslage gruen"; else
  echo "ABBRUCH: die Probe ist schon OHNE Eingriff rot."; lauf | tail -5; exit 2; fi

fall(){ # $1 Name  $2 Muster-das-in-der-roten-Zeile-stehen-muss  $3 python-Ersetzung
  cp "$DATEI" /tmp/_sicherung.html
  python3 - "$3" <<'PY'
import io,sys
p='QC_Mixarium_20_04_26.html'
s=io.open(p,encoding='utf-8').read()
alt,neu=sys.argv[1].split('@@@')
if s.count(alt)!=1:
    io.open('/tmp/_ankerfehl','w').write('1');sys.exit(0)
io.open(p,'w',encoding='utf-8').write(s.replace(alt,neu,1))
PY
  if [ -f /tmp/_ankerfehl ]; then rm -f /tmp/_ankerfehl
    echo "  ⊘ ANKER NICHT GEFUNDEN — $1"; tot=$((tot+1))
    cp /tmp/_sicherung.html "$DATEI"; return; fi
  cp "$DATEI" index.html
  AUS="$(lauf)"
  cp /tmp/_sicherung.html "$DATEI"; cp "$DATEI" index.html
  if echo "$AUS" | grep -qE "^[0-9]+ grün · 0 ROT$"; then
    echo "  ✗ NICHT GEFANGEN — $1"; durch=$((durch+1))
  elif echo "$AUS" | grep "✗ ROT" | grep -q "$2"; then
    echo "  ✓ gefangen — $1"; gefangen=$((gefangen+1))
  else
    echo "  ⚠ ROT AUS FALSCHEM GRUND — $1"
    echo "$AUS" | grep "✗ ROT" | head -2 | sed 's/^/      /'
    falsch=$((falsch+1))
  fi
}

echo "── Gegenprobe Kategorien ──"

fall "catsFremd findet nichts mehr" "drk" \
'  return out;
}
/* Alle Kategorien@@@  return [];
}
/* Alle Kategorien'

fall "der Remap nach Knabbereien kommt zurueck" "knab" \
"    const ALT_ESSEN=['vorsp','suppe','fleisch','fisch','vegi','kuchen','dessert'];
    R=R.filter(r=>!(r.blank&&ALT_ESSEN.includes(r.cat)));@@@    const ALT_ESSEN=['vorsp','suppe','fleisch','fisch','vegi','kuchen','dessert'];
    R=R.filter(r=>{if(!ALT_ESSEN.includes(r.cat))return true;if(r.blank)return false;r.cat='knab';return true;});"

fall "der eigene Name wird ignoriert" "Hauptgerichte" \
"function katBeschriftung(c){if(!c)return'';const e=CATS_EIGEN[c.id];if(e&&e.name)return e.name;@@@function katBeschriftung(c){if(!c)return'';const e=null;if(e&&e.name)return e.name;"

fall "das eigene Symbol wird ignoriert" "Symbol steht davor" \
"function katSymbol(c){if(!c)return'📦';const e=CATS_EIGEN[c.id];if(e&&e.ico)return e.ico;@@@function katSymbol(c){if(!c)return'📦';const e=null;if(e&&e.ico)return e.ico;"

fall "gespeichert wird nicht — nichts ueberlebt ein Neuladen" "Neuladen" \
"  CATS_EIGEN=neu;svCatsEigen();@@@  CATS_EIGEN=neu;"

fall "das Umbenennen aendert die KENNUNG mit" "bleibt r.cat = 'drk'" \
"    if(nm||ic){neu[id]={};if(nm)neu[id].name=nm;if(ic)neu[id].ico=ic;}@@@    if(nm||ic){neu[id]={};if(nm)neu[id].name=nm;if(ic)neu[id].ico=ic;R.forEach(r=>{if(r.cat===id)r.cat=nm||id;});}"

fall "der Blank-Riegel faellt weg" "Blank-Karte" \
"    R=R.filter(r=>!(r.blank&&ALT_ESSEN.includes(r.cat)));@@@    R=R.filter(r=>true||!(r.blank&&ALT_ESSEN.includes(r.cat)));"

fall "die Alle-Ansicht laeuft wieder nur ueber CATS" "Apfelschorle" \
"    for(const cat of catsAlle()){@@@    for(const cat of CATS.filter(c=>c.id!=='all')){"

fall "der Dialog listet die mitgebrachten nicht" "listet jede Kategorie" \
"  const liste=catsAlle();@@@  const liste=CATS.filter(c=>c.id!=='all');"

fall "die Herkunfts-Marke am mitgebrachten Eintrag faellt weg" "gekennzeichnet" \
"      \${c.fremd?\`<span class=\"kat-fremd\">\${h(X.f)}</span>\`:''}@@@      \${''}"

fall "das Symbol-Feld oeffnet die Auswahl nicht mehr" "Tipp aufs Symbol-Feld" \
'onclick="katEmojiOeffnen(this)" onfocus="katEmojiOeffnen(this)"@@@onclick="void 0" onfocus="void 0"'

fall "das Raster wandert nicht unter die bearbeitete Zeile" "DIREKT unter" \
"  if(zeile&&zeile.parentNode)zeile.parentNode.insertBefore(raster,zeile.nextSibling);@@@  if(false)zeile.parentNode.insertBefore(raster,zeile.nextSibling);"

fall "die Wahl schreibt nichts ins Feld" "schreibt es ins Feld" \
"    _katZiel.value=e;@@@    _katZiel.value=_katZiel.value;"

fall "das Raster bleibt nach der Wahl offen" "schliesst das Raster wieder" \
"  katEmojiSchliessen();
}
function openKatUmbenennen(){@@@  _katZiel=null;
}
function openKatUmbenennen(){"

fall "der Vorrat schrumpft auf eine Handvoll" "bietet eine Auswahl an" \
'const KAT_EMOJIS = [@@@const KAT_EMOJIS = ["🍹","🍸","🥤"]; const _KAT_UNUSED = ['

echo
echo "$gefangen gefangen · $durch durchgerutscht · $falsch aus falschem Grund · $tot tote Anker"
cd /; rm -rf "$(dirname "$KOPIE")"
[ "$durch" -eq 0 ] && [ "$falsch" -eq 0 ] && [ "$tot" -eq 0 ]
