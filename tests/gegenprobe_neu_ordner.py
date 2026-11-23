# Gegenprobe zu tests/smoke_neu_ordner.mjs (Ordner): je Fall eine Sabotage in einer Wegwerf-Kopie; die Probe muss ROT werden,
# und die rote Zeile muss den Namen der Zusicherung tragen (Spalte "erwartet").
#   python3 -u tests/gegenprobe_neu_ordner.py      NUR_FALL=a,b fährt einzelne Fälle · NUR_ANKER=1 prüft nur, ob jeder Anker genau einmal trifft
import subprocess, shutil, os, tempfile, sys
F=[('ordner-frisst-kategorie', "? { ...r, folder: id ? String(id) : '' } : r));", "? { ...r, folder: id ? String(id) : '', cat: id ? '' : r.cat } : r));", 'kern/modell/ordner.mjs', 'die Kategorie steht weiter am Getränk'),
   ('loeschen-nimmt-getraenke-mit', "  return { rezepte: r, ordner: (ordner || []).filter((o) => !gleich(o.id, id)), betroffen };", "  return { rezepte: (rezepte || []).filter((x) => !gleich(x.folder, id)), ordner: (ordner || []).filter((o) => !gleich(o.id, id)), betroffen };", 'kern/modell/ordner.mjs', 'das Getränk ist noch da'),
   ('leerer-ordner-in-leiste', "ordner = ordListe().filter((o) => o.anzahl > 0);", "ordner = ordListe();", 'neu/app.mjs', 'ein leerer Ordner steht dort nicht'),
   ('geister-ordner', "const imOrd = findeOrdner(A.ordner, ordnerVonRezept(r, A.ordner)),", "const imOrd = r.folder ? (findeOrdner(A.ordner, r.folder) || { name: String(r.folder) }) : null,", 'neu/app.mjs', 'ein Ordner, den es nicht gibt, ist kein Ordner'),
   ('werkzeuge-klappen-zu', "A.getraenke = legeIn(A.getraenke, A.ordner, uid, oid); sichern(); Z.fenster = null;", "A.getraenke = legeIn(A.getraenke, A.ordner, uid, oid); sichern(); Z.fenster = null; Z.bildWerk = false;", 'neu/app.mjs', 'die Werkzeuge bleiben nach der Wahl offen'),
   ('ohne-alkohol-im-ordner', "const ordListe = () => ordUebersicht(G.filterOhneAlkohol(A.getraenke, ohneAlk()), A.ordner);", "const ordListe = () => ordUebersicht(A.getraenke, A.ordner);", 'neu/app.mjs', 'gilt auch im Ordner'),
   ('rueckgaengig-ans-ende', "A.ordner = [...A.ordner.slice(0, stelle), o, ...A.ordner.slice(stelle)];", "A.ordner = [...A.ordner, o];", 'neu/app.mjs', 'an dieselbe Stelle'),
   ('ordner-als-kategorie', "cat: katOffen() || 'mock', folder: ordWahl(),", "cat: Z.kat !== 'all' ? Z.kat : 'mock', folder: ordWahl(),", 'neu/app.mjs', 'die Kategorie ist kein Ordner'),
   ('zahl-oeffnet-nicht', "if (d.geh) { Z.fenster = null; Z.kat = d.kat; Z.uid = null; return geh('start'); } ", "", 'neu/app.mjs', 'die Zahl am Ordner öffnet ihn auf der Startseite'),
   ('umbenennen-wirkt-nicht', "{ A.ordner = ordUmbenennen(A.ordner, ev.target.dataset.oid, ev.target.value); sichern(); ordnerFenster(); return; }", "{ ordnerFenster(); return; }", 'neu/app.mjs', 'Umbenennen wirkt'),
   ('ziehen-wirkt-nicht', "if (g.art === 'ord') { A.ordner = ordUmsortieren(A.ordner, g.gr.dataset.oid, vorId); ordnerFenster(); } else", "if (g.art === 'ord') { ordnerFenster(); } else", 'neu/app.mjs', 'ziehen am Griff ordnet die Ordner um')]
nur=os.environ.get('NUR_FALL'); nur=nur.split(',') if nur else None; gefangen=0; durch=0; tot=0
if os.environ.get('NUR_ANKER'):
    for name,a,b,f,erwartet in F:
        n=open(f,encoding='utf-8').read().count(a)
        if n!=1: print('==',name,'TOTER ANKER',n); tot+=1
    print('%d Fälle, %d tote Anker' % (len(F),tot)); sys.exit(1 if tot else 0)
for name,a,b,f,erwartet in F:
    if nur and name not in nur: continue
    W=tempfile.mkdtemp(prefix='mx-go-')
    for d in ['neu','kern','getraenke','beispiele','icons','ausgaben','assets']: shutil.copytree(d,W+'/'+d)
    shutil.copy('impressum.html', W)
    s=open(W+'/'+f,encoding='utf-8').read(); n=s.count(a)
    if n!=1: print('==',name,'TOTER ANKER',n); tot+=1; shutil.rmtree(W); continue
    open(W+'/'+f,'w',encoding='utf-8').write(s.replace(a,b))
    try: r=subprocess.run(['node','tests/smoke_neu_ordner.mjs'],env={**os.environ,'WURZEL':W},capture_output=True,text=True,timeout=420); aus=r.stdout
    except subprocess.TimeoutExpired as e: aus=(e.stdout or b'').decode() if isinstance(e.stdout,bytes) else (e.stdout or ''); aus+='\n  ✗ ROT GESTOLPERT (Zeit)'
    rote=[l.strip() for l in aus.splitlines() if '✗ ROT' in l]
    treffer=any(erwartet in l for l in rote)
    if treffer: gefangen+=1
    else: durch+=1
    print('==',name,'GEFANGEN' if treffer else ('NICHT GEFANGEN' if not rote else 'ROT AUS ANDEREM GRUND'), '|', (next((l for l in rote if erwartet in l), rote[0] if rote else '')[:150]))
    shutil.rmtree(W)
print('\n%d gefangen · %d nicht · %d tote Anker' % (gefangen,durch,tot)); sys.exit(1 if durch or tot else 0)
