# Gegenprobe zu tests/smoke_neu_menue.mjs (Menü am Getränk, Alle übersetzen): je Fall eine Sabotage in einer Wegwerf-Kopie; die Probe
# muss ROT werden, und die rote Zeile muss den Namen der Zusicherung tragen (Spalte "erwartet").
#   python3 -u tests/gegenprobe_neu_menue.py      NUR_FALL=a,b fährt einzelne Fälle · NUR_ANKER=1 prüft nur, ob jeder Anker genau einmal trifft
import subprocess, shutil, os, tempfile, sys
F=[('ki-ohne-schluessel', "await schlLaden(); if (!SK.anthropic) return schluesselFenster('anthropic', 'gmenue');\n  Z.fenster = null; zeichne();\n  const opt", "await schlLaden();\n  Z.fenster = null; zeichne();\n  const opt", 'neu/app.mjs', 'ohne Anthropic-Schlüssel kommt das Schlüssel-Fenster'),
   ('recht-uebernimmt-alles', "rechtschreibungAnwenden(r, f.recht.aenderungen.filter((_, i) => wahl.includes(i)))", "rechtschreibungAnwenden(r, f.recht.aenderungen)", 'neu/app.mjs', 'übernommen ist, was angehakt war'),
   ('teil-link-nicht-gelesen', "const geteiltesGetraenk = /^#share=/.test(location.hash) ? location.href : '';", "const geteiltesGetraenk = '';", 'neu/app.mjs', 'der geteilte Link wird beim Start gelesen'),
   ('adresse-bleibt-stehen', "if (location.search || location.hash) history.replaceState(", "if (location.search) history.replaceState(", 'neu/app.mjs', 'die Adresszeile ist wieder sauber'),
   ('druck-nicht-wie-am-schirm', "translations: undefined, servings: Z.port, ings: zutatenVon(r).map((x) => ({ ...x, amt: zahl(x.amt || '') })), flavors: schilder }", "translations: undefined, flavors: schilder }", 'neu/app.mjs', 'auf dem Blatt stehen Portionen und Mengen wie am Bildschirm'),
   ('naehr-mit-schritten', "Ingredients: ${(r.ings || []).map(zutatZeile).filter(Boolean).join(', ')}.", "Ingredients: ${(r.ings || []).map(zutatZeile).filter(Boolean).join(', ')}. Steps: ${(r.steps || []).map((s) => s.txt).join(' ')}.", 'kern/ki/helfer.mjs', 'Name und Zutaten, keine Schritte'),
   ('ki-zeile-ohne-auskunft', "<small>Anthropic · ${esc(kiWas(art, r))}</small></span><i class=\"ki-marke\">KI</i></button>`;", "<small></small></span><i class=\"ki-marke\">KI</i></button>`;", 'neu/app.mjs', 'eine KI-Zeile sagt in der Zeile, was an wen hinausgeht'),
   ('original-zeigt-uebersetzung', "const zeig = (r) => (r && !Z.original ? sicht(r) : r);", "const zeig = (r) => sicht(r);", 'neu/app.mjs', 'ein Tipp zeigt das Original'),
   ('alle-ohne-ueberspringen', ".filter((r) => G.istSichtbar(r) && !uebersetzungPasst(r, (r.translations || {})[ziel]));", ".filter((r) => G.istSichtbar(r));", 'neu/app.mjs', 'schon Übersetzte zählen nicht mit'),
   ('alle-mit-alkohol', "const uebOffen = (ziel) => G.filterOhneAlkohol(A.getraenke, ohneAlk()).filter(", "const uebOffen = (ziel) => A.getraenke.filter(", 'neu/app.mjs', 'ein ausgeblendetes Getränk mit Alkohol ging nicht an die KI'),
   ('fehlschlag-haelt-auf', "fehler++; grund = f.message; if (f.schluesselAbgelehnt", "fehler++; grund = f.message; break; if (f.schluesselAbgelehnt", 'neu/app.mjs', 'ein Fehlschlag hält den Rest nicht auf'),
   ('abbrechen-wirkt-nicht', "  if (uebLauf && !(Z.fenster && Z.fenster.uebLauf === uebLauf)) { uebLauf.stopp = true; uebLauf.ab.abort(); }", "", 'neu/app.mjs', 'hört sofort auf')]
nur=os.environ.get('NUR_FALL'); nur=nur.split(',') if nur else None; gefangen=0; durch=0; tot=0
if os.environ.get('NUR_ANKER'):
    for name,a,b,f,erwartet in F:
        n=open(f,encoding='utf-8').read().count(a)
        if n!=1: print('==',name,'TOTER ANKER',n); tot+=1
    print('%d Fälle, %d tote Anker' % (len(F),tot)); sys.exit(1 if tot else 0)
for name,a,b,f,erwartet in F:
    if nur and name not in nur: continue
    W=tempfile.mkdtemp(prefix='mx-gm-')
    for d in ['neu','kern','getraenke','beispiele','icons','ausgaben','assets']: shutil.copytree(d,W+'/'+d)
    shutil.copy('impressum.html', W)
    s=open(W+'/'+f,encoding='utf-8').read(); n=s.count(a)
    if n!=1: print('==',name,'TOTER ANKER',n); tot+=1; shutil.rmtree(W); continue
    open(W+'/'+f,'w',encoding='utf-8').write(s.replace(a,b))
    try: r=subprocess.run(['node','tests/smoke_neu_menue.mjs'],env={**os.environ,'WURZEL':W},capture_output=True,text=True,timeout=420); aus=r.stdout
    except subprocess.TimeoutExpired as e: aus=(e.stdout or b'').decode() if isinstance(e.stdout,bytes) else (e.stdout or ''); aus+='\n  ✗ ROT GESTOLPERT (Zeit)'
    rote=[l.strip() for l in aus.splitlines() if '✗ ROT' in l]
    treffer=any(erwartet in l for l in rote)
    if treffer: gefangen+=1
    else: durch+=1
    print('==',name,'GEFANGEN' if treffer else ('NICHT GEFANGEN' if not rote else 'ROT AUS ANDEREM GRUND'), '|', (next((l for l in rote if erwartet in l), rote[0] if rote else '')[:150]))
    shutil.rmtree(W)
print('\n%d gefangen · %d nicht · %d tote Anker' % (gefangen,durch,tot)); sys.exit(1 if durch or tot else 0)
