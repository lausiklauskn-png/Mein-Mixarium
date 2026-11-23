# Gegenprobe zu tests/smoke_neu_scan.mjs (Mixarium): je Fall eine Sabotage in einer Wegwerf-Kopie; die Probe muss ROT werden,
# und die rote Zeile muss den Namen der Zusicherung tragen. Aufruf: python3 -u tests/gegenprobe_neu_scan.py   (NUR_FALL=<name>)
# Die Fälle zum Kern selbst (Foto nicht verkleinert, nicht zugedeckt, Stufe …) stehen in Mein-Rezeptbuch; hier steht die Verdrahtung der App.
import subprocess, shutil, os, tempfile, sys
F=[('kein-vermerk', "  if (f.kiEntfernt && f.kiEntfernt.length) vermerken(r, f.kiEntfernt, 'scan');", "", 'neu/app.mjs', 'am Getränk steht der Vermerk'),
   ('abbrechen-sendet-weiter', "if (!(await rein.halt(d.name, v.liste))) { fehler.push([d.name, kiMeldung('abgebrochen', sprache())]); break; }", "await rein.halt(d.name, v.liste);", 'neu/app.mjs', 'ROT'),
   ('senden-ohne-schluessel', "  if (!SK.anthropic) return schluesselFenster('anthropic', 'scan');", "", 'neu/app.mjs', 'ROT'),
   ('essens-kategorien', "const scanKats = () => K.alleKategorien(A.getraenke, A.kategorien).filter((c) => c.art !== 'ohne').map((c) => ({ id: c.id, name: katText(c) }));", "const scanKats = () => KATEGORIEN_FEST.map((c) => ({ id: c.id, name: c.de }));", 'neu/app.mjs', 'GETRÄNKE-Kategorien'),
   ('alte-app-geschrieben', "async weg(a) { await lager.setz(eintrag(a), ''); },", "async weg(a) { await lager.setz(eintrag(a), ''); try { for (const n of altNamen[a] || []) alt.removeItem(n); } catch {} },", 'kern/ki/schluessel.mjs', 'Speicher der bisherigen App ist unverändert'),
   ('kein-tresor', "  await tresorAuto(L('vor dem Foto-Scan', 'before the photo scan'));", "", 'neu/app.mjs', 'in den Tresor')]
nur=os.environ.get('NUR_FALL'); gefangen=0; durch=0; tot=0
for name,a,b,f,erwartet in F:
    if nur and nur!=name: continue
    W=tempfile.mkdtemp(prefix='mx-gs-')
    for d in ['neu','kern','getraenke','beispiele','icons','ausgaben','sbkim','assets']: shutil.copytree(d,W+'/'+d)
    s=open(W+'/'+f,encoding='utf-8').read(); n=s.count(a)
    if n!=1: print('==',name,'TOTER ANKER',n); tot+=1; shutil.rmtree(W); continue
    open(W+'/'+f,'w',encoding='utf-8').write(s.replace(a,b))
    try: r=subprocess.run(['node','tests/smoke_neu_scan.mjs'],env={**os.environ,'WURZEL':W},capture_output=True,text=True,timeout=420); aus=r.stdout
    except subprocess.TimeoutExpired as e: aus=(e.stdout or b'').decode() if isinstance(e.stdout,bytes) else (e.stdout or ''); aus+='\n  ✗ ROT: GESTOLPERT (Zeit)'
    rote=[l.strip() for l in aus.splitlines() if 'ROT:' in l]
    treffer=any(erwartet in l for l in rote)
    if treffer: gefangen+=1
    else: durch+=1
    print('==',name,'GEFANGEN' if treffer else ('NICHT GEFANGEN' if not rote else 'ROT AUS ANDEREM GRUND'), '|', (rote[0][:150] if rote else ''))
    shutil.rmtree(W)
print('\n%d gefangen · %d nicht · %d tote Anker' % (gefangen,durch,tot)); sys.exit(1 if durch or tot else 0)
