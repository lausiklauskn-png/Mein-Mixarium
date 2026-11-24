# Gegenprobe zu tests/smoke_neu_zusatz.mjs: je Fall eine Sabotage in einer Wegwerf-Kopie; die Probe muss ROT werden,
# und die rote Zeile muss den Namen der Zusicherung tragen. Aufruf: python3 -u tests/gegenprobe_neu_zusatz.py   (NUR_FALL=a,b · NUR_ANKER=1)
# Ein Fall: (Name, alt, neu, Datei, erwartete rote Zeile[, alt2, neu2, Datei2]) – wo zwei Riegel einander decken, nimmt die Sabotage beide.
import subprocess, shutil, os, tempfile, sys
# Zwei Riegel decken einander (Merker in den Einstellungen + alte Kennung am Stand): die Sabotage nimmt beide.
F=[('alter-stand-doppelt', "    if (schon.has(s.alt)) continue;", "", 'kern/speicher/alt-tresor.mjs', 'kein alter Stand doppelt', "E.altTresor = true; app.einstSichern();", "app.einstSichern();", 'neu/zusatz.mjs'),
   ('alte-zeit-verloren', "await tr.ablegen(s.sicherung, s.art, s.name, { ts: s.ts, alt: s.alt });", "await tr.ablegen(s.sicherung, s.art, s.name, { alt: s.alt });", 'kern/speicher/alt-tresor.mjs', 'mit ihrem Namen, ihrer alten Zeit'),
   ('alte-bilder-fehlen', "(!r.img && r.id != null && b[r.id] ? { ...r, img: b[r.id] } : r)", "(r)", 'kern/speicher/alt-tresor.mjs', 'das Bild hängt wieder an seinem Getränk'),
   ('alte-db-angelegt', "    a.onupgradeneeded = () => { neu = true; try { a.transaction.abort(); } catch { /* schon zu */ } };", "    a.onupgradeneeded = () => { neu = true; };", 'kern/speicher/alt-tresor.mjs', 'wird ihre Datenbank nicht angelegt', "  if (idb.databases) { const alle = await idb.databases(); if (!alle.some((x) => x.name === db)) return null; }\n", "", 'kern/speicher/alt-tresor.mjs'),
   ('alter-ort-falsch', "schluessel: 'mix9m_bvault'", "schluessel: 'mrz9m_bvault'", 'neu/zusatz.mjs', 'eine kurze Meldung sagt, dass zwei Stände übernommen sind'),
   ('alter-start-fehlt', "  ZU.altTresor().catch(() => {});", "", 'neu/app.mjs', 'eine kurze Meldung sagt, dass zwei Stände übernommen sind'),
   ('richter-ohne-schluessel', "    if (!SK.anthropic) { app.schluesselFenster('anthropic', 'richter'); return; }", "", 'neu/zusatz.mjs', 'ohne Anthropic-Schlüssel kommt das Schlüssel-Fenster'),
   ('richter-nicht-weiter', "  const danach = ['sammel-bilder', 'richter'];", "  const danach = ['sammel-bilder'];", 'neu/zusatz.mjs', 'läuft die Prüfung von selbst weiter'),
   ('richter-sendet-falle', "if ((await pruefe(k.text)).length) urteile.push({ uid: k.uid, passt: null, warum: '', ausgeschlossen: 'ki-anweisung' }); else zumRichter.push(k);", "zumRichter.push(k);", 'kern/suche/richter.mjs', 'das Getränk mit dem Befehl an eine KI geht nicht hinaus'),
   ('richter-sendet-schritte', "zut && 'Zutaten: ' + kurz(zut, 300)]", "zut && 'Zutaten: ' + kurz(zut, 300), (r.steps || []).map((x) => x.txt).join(' ')]", 'kern/suche/richter.mjs', 'Schritte gehen nie hinaus'),
   ('richter-frage-ungeprueft', "  if ((await pruefe(String(anfrage))).length) return ohne('frage');", "", 'kern/suche/richter.mjs', 'steht in der Suchfrage ein Befehl an eine KI, geht nichts hinaus'),
   ('richter-ordnet-nicht', "const vorn = da ? sinn.filter((r) => !u(r) || u(r).passt !== false) : sinn, hinten = da ? sinn.filter((r) => u(r) && u(r).passt === false) : [];", "const vorn = sinn, hinten = [];", 'neu/zusatz.mjs', 'was nicht passt, steht eingeklappt'),
   ('richter-reiht-nicht', "    if (da) vorn.sort((x, y) => ja(y) - ja(x));", "", 'neu/zusatz.mjs', 'die passenden rücken vor, das nicht geprüfte steht dahinter'),
   ('richter-sendet-ausgeblendetes', " && !da.has(r.uid) && erlaubt.has(r.uid) && inWahl(r));", " && !da.has(r.uid) && inWahl(r));", 'neu/app.mjs', 'das ausgeblendete Getränk mit Alkohol'),
   ('bild-ohne-halt', "    if (!st.length) return r;", "    if (st.length >= 0) return r;", 'neu/zusatz.mjs', 'vor dem Senden hält die App an und zeigt die Stelle markiert'),
   ('bild-ohne-sendet-doch', "    return w === 'a' ? p.sauber : w === 'b' ? r : null;", "    return w === 'a' ? r : w === 'b' ? r : null;", 'neu/zusatz.mjs', '„Ohne senden“: der Auftrag geht ohne die Stelle hinaus'),
   ('bild-kreuz-sendet', "    return w === 'a' ? p.sauber : w === 'b' ? r : null;", "    return w === 'a' ? p.sauber : r;", 'neu/zusatz.mjs', 'das Kreuz bricht ab: nichts geht hinaus'),
   ('bild-freigabe-uebergangen', "await gratisBild(frei, { art: 'getraenk' }) : await kiBild(schluessel, frei, { art: 'getraenk' });", "await gratisBild(sicht(r), { art: 'getraenk' }) : await kiBild(schluessel, sicht(r), { art: 'getraenk' });", 'neu/app.mjs', '„Ohne senden“: der Auftrag geht ohne die Stelle hinaus'),
   ('sammel-ohne-kosten', "id=\"sammel-kosten\">${esc(sammelKosten(n, app.sprache()))}</p>", "id=\"sammel-kosten\"></p>", 'neu/zusatz.mjs', 'nennt ein Fenster Anzahl, Kosten und Empfänger'),
   ('sammel-ohne-schluessel', "    if (!SK.openai) { app.schluesselFenster('openai', 'sammel-bilder'); return false; }", "", 'neu/zusatz.mjs', 'ohne OpenAI-Schlüssel kommt das Schlüssel-Fenster'),
   ('sammel-nicht-weiter', "  const danach = ['sammel-bilder'", "  const danach = ['sammel-nie'", 'neu/zusatz.mjs', 'nach dem Speichern des Schlüssels nennt ein Fenster'),
   ('sammel-sendet-falle', "    if (p.stellen.length) { aus.uebersprungen.push({ uid: r.uid, name: r.name, stellen: p.stellen }); continue; }", "", 'kern/ki/bild.mjs', 'das Getränk mit dem Befehl wurde übersprungen und ging nicht hinaus'),
   ('sammel-sendet-ausgeblendetes', "  sichtbare: () => G.filterOhneAlkohol(A.getraenke, ohneAlk()).filter(G.istSichtbar),", "  sichtbare: () => A.getraenke.filter(G.istSichtbar),", 'neu/app.mjs', 'das ausgeblendete mit Alkohol zählt nicht'),
   ('sammel-essen-auftrag', "pruefe: kiAnweisungen, art: 'getraenk', abbruch", "pruefe: kiAnweisungen, abbruch", 'neu/zusatz.mjs', 'die Aufträge sind Getränke-Aufträge'),
   ('sammel-bricht-nicht-ab', "abbruch: () => stopp,", "abbruch: () => false,", 'neu/zusatz.mjs', '„Abbrechen“ hört nach dem laufenden Bild auf'),
   ('sammel-laeuft-nach-nein', "aus.grund = f.status === 401 ? 'schluessel' : 'limit'; aus.offen = liste.length - i - 1; break; }", "aus.grund = f.status === 401 ? 'schluessel' : 'limit'; aus.offen = liste.length - i - 1; }", 'kern/ki/bild.mjs', 'ein abgelehnter Schlüssel beendet den Lauf'),
   ('kontrast-setzt-nichts', "  if (kontrast) Object.assign(v, d", "  if (false) Object.assign(v, d", 'kern/oberflaeche/farben.mjs', 'Nebentext hat mindestens 7:1'),
   ('kontrast-merkt-nicht', "  kontrast() { E.kontrast = !E.kontrast; einstSichern(); },", "  kontrast() { E.kontrast = !E.kontrast; },", 'neu/app.mjs', 'nach dem Neuladen ist er noch an'),
   ('kontrast-dunkel-blass', ".mx[data-kontrast]{--linie:var(--line);--muted:var(--mut);background:var(--bg)}", ".mx[data-kontrast]{background:var(--bg)}", 'neu/app.css', 'er gilt auch im dunklen Ton'),
   ('kontrast-grund-bunt', ".mx[data-kontrast]{--linie:var(--line);--muted:var(--mut);background:var(--bg)}", ".mx[data-kontrast]{--linie:var(--line);--muted:var(--mut)}", 'neu/app.css', 'der Grund ist glatt'),
   ('kontrast-feld-blass', ".mx[data-kontrast] .kfeld{color:var(--ink);border:2px solid currentColor;", ".mx[data-kontrast] .kfeld{border:2px solid currentColor;", 'neu/app.css', 'die Wasserfarben-Felder tragen ihr Symbol deutlich'),
   ('sammel-bild-verloren', "bildAn: (uid, img) => bildSetzen(img, uid),", "bildAn: (uid, img) => bildSetzen(img),", 'neu/app.mjs', 'die Bilder hängen an ihren Getränken'),
   ('kopf-bleibt-nach-install', "if (c?.outcome === 'accepted') fertig = true;", "", 'kern/oberflaeche/app-pflege.mjs', 'nach „Installieren“ ist er weg'),
   ('kopf-menue-install-bleibt', "w.addEventListener('appinstalled', () => { frage = null; fertig = true; beiAenderung(); });", "", 'kern/oberflaeche/app-pflege.mjs', 'über das Browser-Menü installiert'),
   ('kopf-als-app-knopf', "zeigen: () => !fertig && !laeuftAlsApp(w),", "zeigen: () => !fertig,", 'kern/oberflaeche/app-pflege.mjs', 'läuft die Seite als App'),
   ('kopf-loescht-fremde', "cachePrefix: 'mixarium-neu-'", "cachePrefix: ''", 'neu/app.mjs', 'nicht den der anderen'),
   ('kopf-offline-loescht', "  if (!ok) return 'offline';", "", 'kern/oberflaeche/app-pflege.mjs', 'ohne Netz: eine kurze Meldung'),
   ('hb-ohne-zeile', "z(I('book'), L('Handbuch', 'Manual'), '', 'data-a=\"handbuch\"') + ", "", 'neu/app.mjs', 'unter „Über“ öffnet „Handbuch“'),
   ('hb-offen', "`<details><summary>${I(i)}", "`<details open><summary>${I(i)}", 'neu/app.mjs', 'alle eingeklappt'),
   ('hb-spanisch-luecke', "  'Im Labor erfindet die KI neue Getränke nach Kategorie und Geschmack. Dafür braucht es Netz und deinen eigenen Anthropic-Schlüssel.': 'En el laboratorio la IA inventa bebidas nuevas según categoría y sabor. Para ello hace falta conexión y tu propia clave de Anthropic.',\n", "", 'neu/sprachen/es.mjs', 'auf Spanisch ist jeder Absatz übersetzt')]
# Jeder Fall fährt nur seinen Abschnitt der Probe (NUR_TEIL); der Abschnitt hängt am ersten Wort des Namens.
TEILE={'alter':'1','alte':'1','richter':'2','bild':'3','sammel':'4','buch':'5','glas':'6','kontrast':'7','handbuch':'7','kopf':'20','hb':'21'}
def teil(name): return TEILE[name.split('-')[0]]
nur=os.environ.get('NUR_FALL'); nur=nur.split(',') if nur else None; gefangen=0; durch=0; tot=0
def anker(fall):
    name,a,b,f,erwartet=fall[:5]; paare=[(a,b,f)]+([(fall[5],fall[6],fall[7])] if len(fall)>5 else []); return name,erwartet,paare
if os.environ.get('NUR_ANKER'):
    for fall in F:
        name,erwartet,paare=anker(fall)
        for a,_,pf in paare:
            n=open(pf,encoding='utf-8').read().count(a)
            if n!=1: print('==',name,'TOTER ANKER',n); tot+=1
    print('%d Fälle, %d tote Anker' % (len(F),tot)); sys.exit(1 if tot else 0)
for fall in F:
    name,erwartet,paare=anker(fall)
    if nur and name not in nur: continue
    W=tempfile.mkdtemp(prefix='mx-gz-')
    for d in ['neu','kern','getraenke','beispiele','icons','ausgaben','assets','sbkim']: shutil.copytree(d,W+'/'+d)
    shutil.copy('impressum.html', W)
    if any(open(W+'/'+pf,encoding='utf-8').read().count(a)!=1 for a,_,pf in paare): print('==',name,'TOTER ANKER'); tot+=1; shutil.rmtree(W); continue
    for a,b,pf in paare: s=open(W+'/'+pf,encoding='utf-8').read(); open(W+'/'+pf,'w',encoding='utf-8').write(s.replace(a,b))
    try: r=subprocess.run(['node','tests/smoke_neu_zusatz.mjs'],env={**os.environ,'WURZEL':W,'NUR_TEIL':teil(name)},capture_output=True,text=True,timeout=420); aus=r.stdout
    except subprocess.TimeoutExpired as e: aus=(e.stdout or b'').decode() if isinstance(e.stdout,bytes) else (e.stdout or ''); aus+='\n  ✗ ROT GESTOLPERT (Zeit)'
    rote=[l.strip() for l in aus.splitlines() if '✗ ROT' in l]
    treffer=any(erwartet in l for l in rote)
    if treffer: gefangen+=1
    else: durch+=1
    print('==',name,'GEFANGEN' if treffer else ('NICHT GEFANGEN' if not rote else 'ROT AUS ANDEREM GRUND'), '|', (next((l for l in rote if erwartet in l), rote[0] if rote else '')[:150]))
    shutil.rmtree(W)
print('\n%d gefangen · %d nicht · %d tote Anker' % (gefangen,durch,tot)); sys.exit(1 if durch or tot else 0)
