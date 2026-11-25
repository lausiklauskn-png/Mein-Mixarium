# Gegenprobe zu tests/smoke_neu_doppel.mjs (R6 Doppelungen): je Fall eine Sabotage in einer Wegwerf-Kopie; die Probe muss ROT werden,
# und die rote Zeile muss den Namen der Zusicherung tragen.   python3 -u tests/gegenprobe_neu_doppel.py   (NUR_FALL=a,b · NUR_ANKER=1)
import subprocess, shutil, os, tempfile, sys
D='kern/modell/doppel.mjs'; APP='neu/app.mjs'
F=[('alkohol-trennt-nicht', "  if ((x === 'ohne') !== (y === 'ohne') && (x || y)) return true;\n", "", D, 'kein Doppel: Virgin Mojito'),
   ('datei-prueft-nicht', "    doppelNach(vorher);\n", "", APP, 'genau drei Paare'),
   ('vorgabe-loescht', "p.stufe === 'sicher' ? 'meins' : 'beide'", "'meins'", APP, 'genau drei Paare'),
   ('wahl-wirkt-nicht', "dp.wahl.set(b.dataset.neu, b.dataset.w);", "", APP, 'die beiden neuen sind nach der Wahl weg'),
   ('neues-bleibt', "A.getraenke = A.getraenke.filter((r) => r.uid !== neu.uid).map(", "A.getraenke = A.getraenke.map(", APP, 'die beiden neuen sind nach der Wahl weg'),
   ('ohne-rueckgaengig', "fuelle(L('{0} Doppel zusammengeführt', '{0} duplicates merged'), n), L('Rückgängig', 'Undo'),", "fuelle(L('{0} Doppel zusammengeführt', '{0} duplicates merged'), n), '',", APP, 'die Meldung sagt es und bietet Rückgängig'),
   ('kennung-vom-neuen', "    const zus = w === 'meins' ? alt : { ...wendeAn(alt, neu, w), modified: Date.now() };", "    const zus = w === 'meins' ? alt : { ...wendeAn(alt, neu, w), uid: neu.uid, id: neu.id, modified: Date.now() };", APP, '„Ganz das neue“'),
   ('bild-ohne-pruefung', "  try {\n    const bm = await createImageBitmap(", "  try { throw 0;\n    const bm = await createImageBitmap(", APP, 'genau drei Paare'),
   ('formular-ohne-band', "    if (p) { f.doppel = p; const alt = $('#ed-doppel');", "    if (false) { f.doppel = p; const alt = $('#ed-doppel');", APP, 'ähnliches Getränk: ein Band im Formular'),
   ('formular-text-legt-an', "A.getraenke = A.getraenke.map((x) => (x.uid === ziel.uid ? zus : x)); sichern(); Z.fenster = null; Z.uid = ziel.uid;", "A.getraenke = [...A.getraenke, { ...zus, uid: 'neu-' + Date.now() }]; sichern(); Z.fenster = null; Z.uid = ziel.uid;", APP, '„Nur den Text übernehmen“'),
   ('eigen-speichert-nicht', "if (!r && wahl !== 'eigen') {", "if (!r) {", APP, '„Als eigenes Getränk speichern“')]
nur=os.environ.get('NUR_FALL'); nur=nur.split(',') if nur else None; gefangen=0; durch=0; anders=0; tot=0
if os.environ.get('NUR_ANKER'):
    for name,a,b,f,erwartet in F:
        n=open(f,encoding='utf-8').read().count(a)
        if n!=1: print('==',name,'TOTER ANKER',n); tot+=1
    print('%d Fälle, %d tote Anker' % (len(F),tot)); sys.exit(1 if tot else 0)
for name,a,b,f,erwartet in F:
    if nur and name not in nur: continue
    W=tempfile.mkdtemp(prefix='mx-gdoppel-')
    for d in ['neu','kern','getraenke','beispiele','icons','ausgaben','assets']: shutil.copytree(d,W+'/'+d)
    shutil.copy('impressum.html', W)
    s=open(W+'/'+f,encoding='utf-8').read()
    if s.count(a)!=1: print('==',name,'TOTER ANKER'); tot+=1; shutil.rmtree(W); continue
    open(W+'/'+f,'w',encoding='utf-8').write(s.replace(a,b))
    try: r=subprocess.run(['node','tests/smoke_neu_doppel.mjs'],env={**os.environ,'WURZEL':W},capture_output=True,text=True,timeout=420); aus=r.stdout
    except subprocess.TimeoutExpired as e: aus=(e.stdout or b'').decode() if isinstance(e.stdout,bytes) else (e.stdout or ''); aus+='\n  ✗ ROT GESTOLPERT (Zeit)'
    rote=[l.strip() for l in aus.splitlines() if '✗ ROT' in l]
    treffer=any(erwartet in l for l in rote)
    if treffer: gefangen+=1
    elif rote: anders+=1
    else: durch+=1
    print('==',name,'GEFANGEN' if treffer else ('NICHT GEFANGEN' if not rote else 'ROT AUS ANDEREM GRUND'), '|', (rote[0][:150] if rote else ''))
    shutil.rmtree(W)
print('\n%d gefangen · %d nicht · %d aus anderem Grund · %d tote Anker' % (gefangen,durch,anders,tot)); sys.exit(1 if durch or anders or tot else 0)
