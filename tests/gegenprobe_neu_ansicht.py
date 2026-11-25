# Gegenprobe zu tests/smoke_neu_ansicht.mjs (R13 „?“-Blasen, R35 Pfeil-Leiste) und tests/smoke_neu_pwa.mjs (R32 Vollbild, R34 Symbol-Knöpfe):
# je Fall eine Sabotage in einer Wegwerf-Kopie; die rote Zeile muss den Namen der Zusicherung tragen.  python3 -u tests/gegenprobe_neu_ansicht.py (NUR_FALL · NUR_ANKER=1)
import subprocess, shutil, os, tempfile, sys
APP='neu/app.mjs'; A='tests/smoke_neu_ansicht.mjs'; P='tests/smoke_neu_pwa.mjs'
F=[('blase-fest', "fragLegen(e.target); } }, true);", "} }, true);", APP, A, 'jede Blase'),
   ('blase-rollt-nicht', "addEventListener('scroll', () => document.querySelectorAll('details.frag[open]').forEach(fragLegen), true); ", "", APP, A, 'wandert beim Rollen'),
   ('pfeil-bewegt-nicht', "    E.fl = f; einstSichern(); },", "    einstSichern(); },", APP, A, 'nach oben'),
   ('pfeil-schliesst', "  'fl-pos'() { Z.flPos = true; Z.flAuf = true; },", "  'fl-pos'() { Z.flPos = false; Z.flAuf = false; },", APP, A, 'Pfeil-Viereck'),
   ('voll-ohne-fokus', "const an = !(vollAn() || Z.fokus); Z.fokus = an;", "const an = !(vollAn() || Z.fokus);", APP, P, 'R32'),
   ('portion-weg', "<div class=\"portion kompakt\"", "<div class=\"portion\"", APP, P, 'R34')]
nur=os.environ.get('NUR_FALL'); nur=nur.split(',') if nur else None; gefangen=0; durch=0; anders=0; tot=0
if os.environ.get('NUR_ANKER'):
    for name,a,b,f,pr,e in F:
        n=open(f,encoding='utf-8').read().count(a)
        if n!=1: print('==',name,'TOTER ANKER',n); tot+=1
    print('%d Fälle, %d tote Anker' % (len(F),tot)); sys.exit(1 if tot else 0)
for name,a,b,f,pr,erwartet in F:
    if nur and name not in nur: continue
    W=tempfile.mkdtemp(prefix='mx-gans-')
    for d in ['neu','kern','getraenke','beispiele','icons','ausgaben','assets']: shutil.copytree(d,W+'/'+d)
    shutil.copy('impressum.html', W)
    s=open(W+'/'+f,encoding='utf-8').read()
    if s.count(a)!=1: print('==',name,'TOTER ANKER'); tot+=1; shutil.rmtree(W); continue
    open(W+'/'+f,'w',encoding='utf-8').write(s.replace(a,b))
    try: aus=subprocess.run(['node',pr],env={**os.environ,'WURZEL':W},capture_output=True,text=True,timeout=420).stdout
    except subprocess.TimeoutExpired as e: aus=(e.stdout or b'').decode() if isinstance(e.stdout,bytes) else (e.stdout or ''); aus+='\n  ✗ ROT GESTOLPERT (Zeit)'
    rote=[l.strip() for l in aus.splitlines() if '✗ ROT' in l]
    treffer=any(erwartet in l for l in rote)
    if treffer: gefangen+=1
    elif rote: anders+=1
    else: durch+=1
    print('==',name,'GEFANGEN' if treffer else ('NICHT GEFANGEN' if not rote else 'ROT AUS ANDEREM GRUND'), '|', (rote[0][:150] if rote else ''))
    shutil.rmtree(W)
print('\n%d gefangen · %d nicht · %d aus anderem Grund · %d tote Anker' % (gefangen,durch,anders,tot)); sys.exit(1 if durch or anders or tot else 0)
