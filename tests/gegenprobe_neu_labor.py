# Gegenprobe zu tests/smoke_neu_labor.mjs: je Fall eine Sabotage in einer Wegwerf-Kopie; die Probe muss genau dort ROT werden.
#   python3 tests/gegenprobe_neu_labor.py
import subprocess, shutil, os, tempfile
F=[('kopfzeile',"'anthropic-dangerous-direct-browser-access': 'true' ","",'neu/app.mjs'),
   ('ueberarbeitung',"    if (f.ueberarbeiten) labUeberarbeiten(r); return zeichne(); }","    return zeichne(); }",'neu/app.mjs'),
   ('ohne-bild',"content: bild ? [{ type: 'image'","content: false ? [{ type: 'image'",'neu/app.mjs'),
   ('ohne-hinweis',"${h ? `Der Nutzer sagt","${false ? `Der Nutzer sagt",'getraenke/labor.mjs'),
   ('modell',"export const LAB_MODELL = 'claude-haiku-5-5';","export const LAB_MODELL = 'claude-opus-5-5';",'getraenke/labor.mjs')]
for name,a,b,f in F:
    W=tempfile.mkdtemp(prefix='mx-gl-')
    for d in ['neu','kern','getraenke','beispiele','icons','ausgaben','sbkim','assets']: shutil.copytree(d,W+'/'+d)
    s=open(W+'/'+f,encoding='utf-8').read(); n=s.count(a)
    if n!=1: print('==',name,'TOTER ANKER',n); continue
    open(W+'/'+f,'w',encoding='utf-8').write(s.replace(a,b))
    try: r=subprocess.run(['node','tests/smoke_neu_labor.mjs'],env={**os.environ,'WURZEL':W},capture_output=True,text=True,timeout=300)
    except subprocess.TimeoutExpired: print('==',name,'GESTOLPERT'); continue
    print('==',name,'rc',r.returncode); print('\n'.join([l for l in r.stdout.splitlines() if 'ROT' in l][:3]))
