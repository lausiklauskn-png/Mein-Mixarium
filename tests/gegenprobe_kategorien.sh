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
# ⚠ Ablagen INNERHALB der Wegwerf-Kopie. Feste /tmp-Namen teilen sich zwei
#   Laeufe nebeneinander — sie ueberschreiben einander die Quelldatei. In
#   den Rezeptbuechern ist genau das am 2026-09-15 passiert: 15 Faelle
#   „rot aus falschem Grund", und es sah aus wie ein Fehler im Code.
SICH="$KOPIE/../_sicherung.html"; ANKERFEHL="$KOPIE/../_ankerfehl"
DATEI="QC_Mixarium_20_04_26.html"

gefangen=0; durch=0; tot=0; falsch=0

lauf(){ node tests/smoke_kategorien.mjs 2>&1; }

# Ausgangslage MUSS gruen sein — sonst misst kein Fall etwas.
# ⚠ EIN TOTER ANKER FIEL BISHER ERST NACH EINEM VOLLEN LAUF AUF — also nach
#   Minuten. `NUR_ANKER=1 bash tests/gegenprobe_kategorien.sh` prueft in
#   Sekunden NUR, ob jeder Anker genau einmal trifft; es faehrt keine Probe.
#   Uebertragen aus Mein Rezeptbuch, wo er am 2026-09-16 viermal zuschlug.
if [ -n "${NUR_ANKER:-}" ]; then
  lauf(){ echo "0 grün · 0 ROT"; }
else
if lauf | grep -qE "^[0-9]+ grün · 0 ROT$"; then echo "Ausgangslage gruen"; else
  echo "ABBRUCH: die Probe ist schon OHNE Eingriff rot."; lauf | tail -5; exit 2; fi
fi

fall(){ # $1 Name  $2 Muster-das-in-der-roten-Zeile-stehen-muss  $3 python-Ersetzung
  cp "$DATEI" "$SICH"
  ANKERFEHL="$ANKERFEHL" python3 - "$3" <<'PY'
import io,sys
p='QC_Mixarium_20_04_26.html'
s=io.open(p,encoding='utf-8').read()
alt,neu=sys.argv[1].split('@@@')
if s.count(alt)!=1:
    io.open(__import__('os').environ['ANKERFEHL'],'w').write('1');sys.exit(0)
io.open(p,'w',encoding='utf-8').write(s.replace(alt,neu,1))
PY
  if [ -f "$ANKERFEHL" ]; then rm -f "$ANKERFEHL"
    echo "  ⊘ ANKER NICHT GEFUNDEN — $1"; tot=$((tot+1))
    cp "$SICH" "$DATEI"; return; fi
  cp "$DATEI" index.html
  AUS="$(lauf)"
  cp "$SICH" "$DATEI"; cp "$DATEI" index.html
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
'onclick="katEmojiOeffnen(this)"@@@onclick="void 0"'

fall "das Raster wird wieder in die scrollende Liste gebaut" "AUSSERHALB der scrollenden Liste" \
'<div class="kat-list">${zeilen}</div>@@@<div class="kat-list">${zeilen}${katEmojiRaster()}</div><div hidden>'

fall "das Gitter wird wieder plattgedrueckt (kein eigener Scrollbereich)" "wirklich aufgeklappt" \
'.kat-emoji-gitter{display:grid;grid-template-columns:repeat(auto-fill,minmax(40px,1fr));gap:2px;@@@.kat-emoji-gitter{display:none;grid-template-columns:repeat(auto-fill,minmax(40px,1fr));gap:2px;'

fall "das Raster schiebt die Liste wieder (Layout bewegt sich beim Oeffnen)" "bewegt sich die angetippte Zeile NICHT" \
'.kat-emoji-raster{position:absolute;left:12px;right:12px;z-index:3;@@@.kat-emoji-raster{position:static;z-index:3;'

fall "das Raster deckt wieder die Knoepfe mit ab (toter Speichern-Knopf)" "verdeckt den Speichern-Knopf nicht" \
"      raster.style.bottom=Math.max(0,bb.bottom-lb.bottom)+'px';@@@      raster.style.bottom='0px';raster.style.top='0px';"

fall "die bearbeitete Zeile wird nicht mehr markiert" "bearbeitete Zeile ist markiert" \
"  if(zeile)zeile.classList.add('kat-row-aktiv');@@@  if(false)zeile.classList.add('kat-row-aktiv');"

fall "die Kopfzeile nennt die Zeile nicht mehr" "nennt sie beim Namen" \
"    kopf.textContent=wie?((X.fuer||'Symbol fuer')+' '+wie):(X.sym||'');@@@    kopf.textContent='';"

fall "die Marke bleibt nach dem Schliessen stehen" "gibt der Liste ihren Platz zurueck" \
"    if(box)box.classList.remove('emoji-auf');@@@    if(false)box.classList.remove('emoji-auf');"

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

fall "das Scrollen beim Oeffnen kommt zurueck" "verschiebt die Liste nicht" \
"  raster.hidden=false;
}@@@  raster.scrollIntoView({block:'nearest'});
  raster.hidden=false;
}"

fall "das Woerterbuch wird uebergangen — die rohe Kennung kommt zurueck" "traegt KLARTEXT" \
"    const bk=katFamilie(id);@@@    const bk=null;"

fall "ein Name wird erfunden, wo das Woerterbuch schweigt" "keinen erfundenen Namen" \
"      out.push({id:id,ico:'📦',de:id,col:'#7a5840',fremd:true,unbekannt:true});@@@      out.push({id:id,ico:'🍹',de:'Erfunden',col:'#7a5840',fremd:true,unbekannt:true});"

fall "ein Rezept ohne Kategorie faellt wieder durch" "zaehlt BEIDE" \
"  if(!id)return KAT_OHNE;@@@  if(!id)return '';"

fall "ein toter Ordner gilt wieder als Zuhause" "zaehlt BEIDE" \
"    return da?id:KAT_OHNE;@@@    return id;"

fall "der Sammel-Reiter steht auch ohne Heimatlose da" "OHNE Heimatlose gibt es den Reiter nicht" \
"  if(ohne>0){@@@  if(ohne>=0){"

fall "die Alle-Ansicht fragt wieder das rohe Feld" "zeichnet das Rezept ohne Kategorie" \
"      const grp=list.filter(r=>katVonRezept(r)===cat.id);if(!grp.length)continue;@@@      const grp=list.filter(r=>r.cat===cat.id);if(!grp.length)continue;"

fall "die Getraenke-Symbole verschwinden wieder" "eigene Getraenke-Symbole" \
'"🍶","🍼","🚰","⚗️","🫧","🍋‍🟩",@@@'

# ── Die Ordner-Ansicht zaehlt wieder anders als die Leiste (Klaus 2026-09-16) ──
fall "der Ordner-Baum fragt wieder das rohe Feld" "dieselbe Zahl" \
"      recipes:R.filter(r=>!r.folder&&katVonRezept(r)===c.id&&r.name)})),@@@      recipes:R.filter(r=>!r.folder&&r.cat===c.id&&r.name)})),"

fall "ein Ordner-Rezept ohne r.folder faellt im Baum wieder heraus" "faellt nirgends heraus" \
"      recipes:R.filter(r=>(r.folder===String(f.id)||r.cat==='fld_'+f.id)&&r.name)}))@@@      recipes:R.filter(r=>r.folder===String(f.id)&&r.name)}))"

echo
echo "$gefangen gefangen · $durch durchgerutscht · $falsch aus falschem Grund · $tot tote Anker"
cd /; rm -rf "$(dirname "$KOPIE")"
[ "$durch" -eq 0 ] && [ "$falsch" -eq 0 ] && [ "$tot" -eq 0 ]
