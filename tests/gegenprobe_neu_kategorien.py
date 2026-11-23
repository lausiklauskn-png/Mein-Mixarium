# Gegenprobe zu tests/smoke_neu_kategorien.mjs: je Fall eine Sabotage in einer Wegwerf-Kopie, die Probe muss genau dort ROT werden.
#   python3 tests/gegenprobe_neu_kategorien.py [fall …]      (ohne Angabe alle; ein Anker, der nicht genau einmal trifft, heißt TOTER ANKER)
import sys, subprocess, shutil, os
import tempfile
W=tempfile.mkdtemp(prefix='mx-gp-')
FAELLE=[
 ('ordner', "  for (const r of A.getraenke || []) if (typeof r.cat === 'string' && r.cat.startsWith('fld_')) { if (!r.folder) r.folder = r.cat.slice(4); r.cat = ''; }\n", "\n"),
 ('familie', "{ familie: KATEGORIEN_FEST }", "{}"),
 ('ziehen', "    if (g.art === 'kat') { A.kategorien = K.umsortieren(A.getraenke, A.kategorien, g.gr.dataset.kid, vorId); katFenster(); }", "    if (g.art === 'kat') { katFenster(); }"),
 ('laden', "[n]: lae.laeden[n] || [...(lae.laeden[lae.laden] || [])]", "[n]: []"),
 ('warengruppen', "const gruppeVon = (name) => EK.warengruppe(name);", "const gruppeVon = () => 'sonstiges';"),
 ('sinn', "    sem.ids = await sucheBedeutung(window.SbkimMatch, f, c); sem.fuer = f;", "    sem.ids = []; sem.fuer = f;"),
 ('plan-uebernahme', "A.planUebernommen = true; }", "}"),
 ('bilder-loeschen', "if (w.has(r.uid)) { r.img = ''; delete r.imgCrop; r.modified = Date.now(); }", "if (w.has(r.uid)) { r.modified = Date.now(); }"),
 ('uebergang', "  A.kategorien = G.katZustandZuKern(A.kategorien);\n", "  A.kategorien = { eigene: [], namen: {}, ausgeblendet: [], folge: [], ...A.kategorien };\n"),
]
for name,alt,neu in FAELLE:
    if len(sys.argv)>1 and name not in sys.argv[1:]: continue
    shutil.rmtree(W, ignore_errors=True); os.makedirs(W)
    for d in ['neu','kern','getraenke','beispiele','icons','ausgaben','sbkim','assets']: shutil.copytree(d, W+'/'+d)
    shutil.copy('impressum.html', W)
    p=W+'/neu/app.mjs'; s=open(p,encoding='utf-8').read(); n=s.count(alt)
    if n!=1: print('==',name,'TOTER ANKER',n); continue
    open(p,'w',encoding='utf-8').write(s.replace(alt,neu))
    try: r=subprocess.run(['node','tests/smoke_neu_kategorien.mjs'],env={**os.environ,'WURZEL':W},capture_output=True,text=True,timeout=400)
    except subprocess.TimeoutExpired: print('==',name,'GESTOLPERT (Zeitablauf, keine benannte rote Zeile)'); continue
    rot=[l for l in r.stdout.splitlines() if 'ROT' in l]
    print('==',name,'rc',r.returncode); print('\n'.join(rot[:4]))
