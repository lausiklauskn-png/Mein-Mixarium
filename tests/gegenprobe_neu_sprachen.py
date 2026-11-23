# Gegenprobe zu tests/getraenke/sprachen.test.mjs (N) und tests/smoke_neu_sprachen.mjs (B): je Fall eine Sabotage in einer
# Wegwerf-Kopie; die Probe muss ROT werden, und die rote Zeile muss den Namen der gemeinten Zusicherung tragen.
#   python3 tests/gegenprobe_neu_sprachen.py            alle Fälle (die fünf Browser-Fälle brauchen je etwa eine Minute)
#   NUR=N python3 tests/gegenprobe_neu_sprachen.py      nur die Node-Fälle · Schlusszeile: „N gefangen · M nicht“
import subprocess, shutil, os, tempfile, sys
APP, FR, ES, IT, PT, RU, ZH, WZ = 'neu/app.mjs', 'neu/sprachen/fr.mjs', 'neu/sprachen/es.mjs', 'neu/sprachen/it.mjs', 'neu/sprachen/pt.mjs', 'neu/sprachen/ru.mjs', 'neu/sprachen/zh.mjs', 'tools/sprach-schluessel.mjs'
DUNKEL = "const dunkel = () => istDunkel(E.farbe, E.ton);"
# (Name, Probe, Datei, Anker, Ersatz, Name der Zusicherung in der roten Zeile)
F=[('eintrag gelöscht','N',FR,"  'Speichern': 'Enregistrer',\n","",'fr: die Tabelle hat genau die Schlüssel des Werkzeugs'),
   ('fremder Eintrag','N',ZH,"  'Speichern': '保存',\n","  'Speichern': '保存',\n  'Gibt es im Code nicht': '没有',\n",'zh: die Tabelle hat genau die Schlüssel des Werkzeugs'),
   ('leerer Wert','N',ES,"  'Speichern': 'Guardar',","  'Speichern': '',",'es: kein leerer Wert'),
   ('Platzhalter verloren','N',RU,"'Прочитано {0} из {1}'","'Прочитано {0}'",'ru: dieselben Platzhalter'),
   ('deutsch geblieben','N',IT,"  'Speichern': 'Salva',","  'Speichern': 'Speichern',",'it: kein Wert ist der unveränderte deutsche Text'),
   ('Tabelle kaputt','N',PT,"export default {","export default {{",'pt: die Tabelle ist ein gültiges ES-Modul'),
   ('Auslassungspunkte weg','N',FR,"'Préparation du fichier …'","'Préparation du fichier'",'fr: „…“, „·“, Eigennamen und Einheiten bleiben stehen'),
   ('Eigenname übersetzt','N',RU,"'Прочитать с Claude'","'Прочитать с Клодом'",'ru: „…“, „·“, Eigennamen und Einheiten bleiben stehen'),
   ('neuer Text im Code','N',APP,DUNKEL,DUNKEL+" const neu9 = () => L('Ganz neuer Text', 'Brand new text');",'es: die Tabelle hat genau die Schlüssel des Werkzeugs'),
   ('Vorlage mit ${} im Code','N',APP,DUNKEL,DUNKEL+" const neu9 = (n) => L(`${n} neue Texte`, `${n} new texts`);",'jeder Text ist tabellenfähig'),
   ('Text aus unbekannter Liste','N',APP,DUNKEL,DUNKEL+" const neu9 = (x) => L(x.titel[0], x.titel[1]);",'das Werkzeug findet die Texte der App'),
   ('Leser übersieht "…"','N',WZ,"""    if (c === "'" || c === '"') {""","""    if (c === "'") {""",'der Leser:'),
   ('Leser liest Kommentare','N',WZ,"        if (!L.ebene[m.index] || kurzOrt.some(","        if (kurzOrt.some(",'der Leser:'),
   ('wichtiger Text fehlt','B',FR,"  'Einstellungen': 'Réglages',\n","",'fr: die zehn wichtigen Texte sind weder Deutsch noch Englisch'),
   ('Schlüssel trifft nicht','B',ES,"  'Einkaufsliste': ","  'Einkaufs-Liste': ",'es: kein Text eines Schlüssels steht in der App noch auf Englisch'),
   ('Knopf zu lang','B',RU,"  'Mixen': 'Смешать',","  'Mixen': 'Смешать напиток шаг за шагом прямо сейчас',",'ru: kein Knopf bricht um'),
   ('Tabelle nicht verdrahtet','B',APP,"new URL('./sprachen/' + code + '.mjs', import.meta.url).href","new URL('./sprachen-fehlt/' + code + '.mjs', import.meta.url).href",'es: nach der Sprachwahl lädt die App ihre Tabelle selbst'),
   ('Zahl + Wort statt Satz','B',APP,"${n === 1 ? L('1 Getränk', '1 drink') : fuelle(L('{0} Getränke', '{0} drinks'), n)}</small></div>${mini}","${n} ${L('Getränke', 'Drinks')}</small></div>${mini}",'ru: Sätze mit Zahl kommen als Ganzes aus der Tabelle')]
PROBE={'N':['node','--test','tests/getraenke/sprachen.test.mjs'],'B':['node',os.path.abspath('tests/smoke_neu_sprachen.mjs')]}
gefangen=nicht=0
for name,art,f,a,b,soll in F:
    if os.environ.get('NUR') and os.environ['NUR']!=art: continue
    W=tempfile.mkdtemp(prefix='mx-gs-')
    for d in ['neu','kern','getraenke','tools','tests','beispiele','ausgaben','icons']: shutil.copytree(d,W+'/'+d)
    s=open(W+'/'+f,encoding='utf-8').read(); n=s.count(a)
    if n!=1: print('==',name,'TOTER ANKER',n); nicht+=1; shutil.rmtree(W); continue
    open(W+'/'+f,'w',encoding='utf-8').write(s.replace(a,b))
    try: r=subprocess.run(PROBE[art],cwd=W if art=='N' else None,env={**os.environ,'WURZEL':W},capture_output=True,text=True,timeout=400)
    except subprocess.TimeoutExpired: print('==',name,'GESTOLPERT (Zeit)'); nicht+=1; shutil.rmtree(W); continue
    rote=[l.strip() for l in r.stdout.splitlines() if l.startswith('not ok') or 'ROT ' in l]
    ok=r.returncode!=0 and any(soll in l for l in rote)
    print('==',name,'· gefangen' if ok else ('· ROT AUS ANDEREM GRUND' if r.returncode!=0 else '· NICHT GEFANGEN'),'· rc',r.returncode)
    for l in rote[:2]: print('    '+l[:170])
    gefangen+=ok; nicht+=not ok; shutil.rmtree(W)
print(f'\n{gefangen} gefangen · {nicht} nicht'); sys.exit(1 if nicht else 0)
