# Gegenprobe zu tests/smoke_neu_menue.mjs, Teil 10 (R14 Übersetzung bearbeiten, R30 Original ändern, R15 im Gerät, R28 Chips): je Fall eine
# Sabotage in einer Wegwerf-Kopie; die rote Zeile muss den Namen der Zusicherung tragen.   python3 -u tests/gegenprobe_neu_fassung.py (NUR_FALL · NUR_ANKER=1)
import subprocess, shutil, os, tempfile, sys
APP='neu/app.mjs'
F=[('bearbeitet-original', "editor(ueb ? { ...roh, ...kernSicht(roh, ueb), uid: roh.uid } : roh);", "editor(roh);", APP, 'R14: „Bearbeiten“ zeigt, was dasteht'),
   ('fragt-nicht', "      return fassungFrage(r, { name: felder.name, ings: felder.ings, steps: felder.steps }, f.ueb, sonst);", "      Object.assign(r, felder);", APP, 'R14: geänderter Text einer Übersetzung'),
   ('haupt-ohne-original', "neu = alsHauptfassung(alt, f.ziel, f.neu, q, sprache());", "neu = { ...f.neu, translations: {} };", APP, '„Ja, als Hauptfassung“'),
   ('alte-fassung-bleibt', "delete r.translations; sichern(); setTimeout(", "sichern(); setTimeout(", APP, 'R30'),
   ('keine-meldung', "if (geaendert && Z.uid === uids[0]) { uebersetzFenster().then(zeichne); }", "if (false) {}", APP, 'R30'),
   ('kein-geraet', "const geraetUebersetzer = () => typeof self !== 'undefined' && 'Translator' in self", "const geraetUebersetzer = () => false && 'Translator' in self", APP, 'R15: mit Übersetzer im Gerät zwei Wege'),
   ('neue-fassung-unsichtbar', "Z.original = false; Z.lese = { uid: r.uid, s: ziel }; melde(fuelle(L('Übersetzt: {0}'", "Z.original = false; melde(fuelle(L('Übersetzt: {0}'", APP, 'R28')]
nur=os.environ.get('NUR_FALL'); nur=nur.split(',') if nur else None; gefangen=0; durch=0; anders=0; tot=0
if os.environ.get('NUR_ANKER'):
    for name,a,b,f,e in F:
        n=open(f,encoding='utf-8').read().count(a)
        if n!=1: print('==',name,'TOTER ANKER',n); tot+=1
    print('%d Fälle, %d tote Anker' % (len(F),tot)); sys.exit(1 if tot else 0)
for name,a,b,f,erwartet in F:
    if nur and name not in nur: continue
    W=tempfile.mkdtemp(prefix='mx-gfass-')
    for d in ['neu','kern','getraenke','beispiele','icons','ausgaben','assets']: shutil.copytree(d,W+'/'+d)
    shutil.copy('impressum.html', W)
    s=open(W+'/'+f,encoding='utf-8').read()
    if s.count(a)!=1: print('==',name,'TOTER ANKER'); tot+=1; shutil.rmtree(W); continue
    open(W+'/'+f,'w',encoding='utf-8').write(s.replace(a,b))
    try: aus=subprocess.run(['node','tests/smoke_neu_menue.mjs'],env={**os.environ,'WURZEL':W},capture_output=True,text=True,timeout=420).stdout
    except subprocess.TimeoutExpired as e: aus=(e.stdout or b'').decode() if isinstance(e.stdout,bytes) else (e.stdout or ''); aus+='\n  ✗ ROT GESTOLPERT (Zeit)'
    rote=[l.strip() for l in aus.splitlines() if '✗ ROT' in l]
    treffer=any(erwartet in l for l in rote)
    if treffer: gefangen+=1
    elif rote: anders+=1
    else: durch+=1
    print('==',name,'GEFANGEN' if treffer else ('NICHT GEFANGEN' if not rote else 'ROT AUS ANDEREM GRUND'), '|', (rote[0][:150] if rote else ''))
    shutil.rmtree(W)
print('\n%d gefangen · %d nicht · %d aus anderem Grund · %d tote Anker' % (gefangen,durch,anders,tot)); sys.exit(1 if durch or anders or tot else 0)
