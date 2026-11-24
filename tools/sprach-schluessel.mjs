// Sprach-Schlüssel der neuen PWA: sammelt jedes Textpaar (Deutsch → Englisch), das zur Laufzeit bei L() bzw. text() ankommt.
// Der DEUTSCHE Text ist der Schlüssel der Tabellen neu/sprachen/<code>.mjs (es, fr, it, pt, ru, zh); ohne Eintrag steht Englisch da.
//   node tools/sprach-schluessel.mjs                       gibt { "Deutsch": "English" } aus (Reihenfolge wie im Code)
//   node tools/sprach-schluessel.mjs --nach datei.json     schreibt dasselbe in eine Datei
//   node tools/sprach-schluessel.mjs --pruefe              je Sprache: fehlende und überzählige Schlüssel; Rückgabewert 1, wenn etwas fehlt
//   node tools/sprach-schluessel.mjs --fehlt fr            die fehlenden Schlüssel einer Sprache als { "Deutsch": "English" } (zum Übersetzen)
//   node tools/sprach-schluessel.mjs --trage-ein fr x.json trägt { "Deutsch": "Übersetzung" } ein und schreibt die Tabelle neu (Code-Reihenfolge)
//   node tools/sprach-schluessel.mjs --bericht             was KEINE Tabelle treffen kann, was nicht über text() läuft, was nur vorbereitet ist
// Ohne Abhängigkeiten; liest nur. Nicht in die Tabellen gehören: Aufträge an die KI, Kennungen, Inhalte der Beispiele.
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const WURZEL = join(dirname(fileURLToPath(import.meta.url)), '..');
export const CODES = ['es', 'fr', 'it', 'pt', 'ru', 'zh'];
export const TABELLEN_ORT = 'neu/sprachen';
const hat = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
/* Die Dateien der App. Der Kern (kern/) hat eigene Tabellen unter kern/sprachen/ und gehört nicht hierher. */
const APP = ['neu/app.mjs', 'neu/zusatz.mjs', 'neu/handbuch.mjs', 'neu/alt.mjs', 'neu/platzbild.mjs', 'neu/getraenke-symbole.mjs'];
const dateien = (wurzel) => APP.filter((d) => existsSync(join(wurzel, d))).concat(readdirSync(join(wurzel, 'getraenke')).filter((n) => n.endsWith('.mjs')).sort().map((n) => 'getraenke/' + n));
/* Listen, deren Texte nicht als L('…', '…') im Code stehen, sondern erst zur Laufzeit bei L() ankommen.
   form 'paar': jedes ['Deutsch', 'English'] in der Konstante · form 'feld': jedes { de: '…', en: '…' } ohne weitere Sprache.
   `aufrufe` sind die Stellen in neu/app.mjs, die sie zeigen (Wortlaut der Klammer). Ein Aufruf, der hier nicht steht,
   macht --pruefe rot: dann fehlt eine Liste – oder die Stelle gehört unter KERN_AUFRUFE. */
const LISTEN = [
  { datei: 'neu/app.mjs', name: 'NAV', form: 'paar', aufrufe: ['...n'] },
  { datei: 'neu/app.mjs', name: 'ABSCHNITTE', form: 'paar', aufrufe: ['de, en'] },
  { datei: 'neu/app.mjs', name: 'NEU_TABS', form: 'paar', aufrufe: ['n[0], n[1]', '...NEU_TABS.find((x) => x[0] === tab)[2]'] },
  { datei: 'getraenke/labor.mjs', name: 'LAB_STATUS', form: 'feld', aufrufe: ['x.de, x.en'] },
  { datei: 'getraenke/labor.mjs', name: 'DIMENSIONEN', form: 'feld', aufrufe: ['d.de, d.en'] },
  { datei: 'getraenke/labor.mjs', name: 'GESCHMAECKER', form: 'feld', aufrufe: ['g.de, g.en'] },
  /* VORBEREITET: die Gerätschaften der Bar (Stößel, Barlöffel, Barsieb …) stehen schon in den Tabellen, kommen aber noch nicht an:
     geraetName() gibt g[sprache] || g.en zurück. Sobald es über text() läuft, treffen die Tabellen ohne weiteres Zutun. */
  { datei: 'getraenke/geraete.mjs', name: 'GERAETE', form: 'feld', aufrufe: [], vorbereitet: true },
];
/* Texte aus dem Kern, die die App durch L() reicht: sie stehen in den Tabellen des Kerns. */
const KERN_AUFRUFE = ['STUFEN[st].name[0], STUFEN[st].name[1]', 'x.name[0], x.name[1]', 'KOSTEN.de, KOSTEN.en'];

/* ── Lesen: wo ist Code, wo Text? ── Die meisten Aufrufe stehen in `…${ L('…', '…') }…`; deshalb zählt die Ebene mit:
   ebene[i] = 0 in Kommentar, Zeichenkette, Vorlagen-Text und Regex; sonst 1 + Zahl der umschließenden ${…}.
   ende: Anfang einer Zeichenkette/Vorlage → ihr Ende. einschub: Vorlagen, in denen ein ${…} steht. */
const VOR_REGEX = new Set(['', 'return', 'typeof', 'case', 'in', 'of', 'delete', 'void', 'throw', 'new', 'else', 'do', 'yield', 'await']);
export function lesen(q) {
  const n = q.length, ebene = new Uint8Array(n), ende = new Map(), einschub = new Set(), stapel = [];
  let i = 0, tiefe = 0, vor = '', inVorlage = false;
  while (i < n) {
    const c = q[i], d = q[i + 1];
    if (inVorlage) {
      if (c === '\\') { i += 2; continue; }
      if (c === '`') { ende.set(stapel.pop().start, i); inVorlage = false; vor = 'wert'; i++; continue; }
      if (c === '$' && d === '{') { einschub.add(stapel[stapel.length - 1].start); stapel.push({ tiefe }); tiefe = 0; inVorlage = false; vor = ''; i += 2; continue; }
      i++; continue;
    }
    if (c === '/' && d === '/') { const e = q.indexOf('\n', i); i = e < 0 ? n : e; continue; }
    if (c === '/' && d === '*') { const e = q.indexOf('*/', i + 2); i = e < 0 ? n : e + 2; continue; }
    if (c === "'" || c === '"') { let j = i + 1; while (j < n && q[j] !== c) j += q[j] === '\\' ? 2 : 1; ende.set(i, j); i = j + 1; vor = 'wert'; continue; }
    if (c === '`') { stapel.push({ start: i }); inVorlage = true; i++; continue; }
    if (c === '/' && (VOR_REGEX.has(vor) || /^[(,=:[!&|?{};+\-*%<>~^}]$/.test(vor))) {
      let j = i + 1, klasse = false, ok = false;
      for (; j < n && q[j] !== '\n'; j++) { if (q[j] === '\\') { j++; continue; } if (q[j] === '[') klasse = true; else if (q[j] === ']') klasse = false; else if (q[j] === '/' && !klasse) { ok = true; break; } }
      if (ok) { j++; while (j < n && /[a-z]/.test(q[j])) j++; i = j; vor = 'wert'; continue; }
    }
    if (c === '}' && tiefe === 0 && stapel.length && !('start' in stapel[stapel.length - 1])) { tiefe = stapel.pop().tiefe; inVorlage = true; i++; continue; }
    const hoch = 1 + stapel.filter((s) => !('start' in s)).length;
    if (/[\w$]/.test(c)) { let j = i; while (j < n && /[\w$]/.test(q[j])) ebene[j++] = hoch; vor = q.slice(i, j); i = j; continue; }
    if (c === '{') tiefe++; else if (c === '}') tiefe--;
    ebene[i] = hoch; if (!/\s/.test(c)) vor = c; i++;
  }
  return { q, ebene, ende, einschub };
}
/* Maskierte Zeichen einer Zeichenkette auflösen (ohne eval). */
const MASKE = { n: '\n', t: '\t', r: '\r', b: '\b', f: '\f', v: '\v', 0: '\0' };
export const entmaskiere = (s) => s.replace(/\\(u\{([0-9a-fA-F]+)\}|u([0-9a-fA-F]{4})|x([0-9a-fA-F]{2})|\r?\n|[\s\S])/g, (_, a, u1, u2, x) =>
  (u1 || u2 || x ? String.fromCodePoint(parseInt(u1 || u2 || x, 16)) : /^\r?\n$/.test(a) ? '' : (a in MASKE ? MASKE[a] : a)));
/* Die Stücke zwischen den Kommas einer Klammer, die bei `auf` beginnt: [[von, bis), …] und das Ende der Klammer. */
function stuecke(L, auf) {
  const { q, ebene, ende } = L, e = ebene[auf], aus = [];
  let tiefe = 0, von = auf + 1;
  for (let i = auf + 1; i < q.length; i++) {
    if (ebene[i] === 0 && ende.has(i)) { i = ende.get(i); continue; }      // Zeichenkette oder Vorlage als Ganzes überspringen
    if (ebene[i] !== e) continue;
    const c = q[i];
    if ('([{'.includes(c)) tiefe++;
    else if (')]}'.includes(c)) { if (tiefe === 0) { if (q.slice(von, i).trim() || aus.length) aus.push([von, i]); return { teile: aus, zu: i }; } tiefe--; }
    else if (c === ',' && tiefe === 0) { aus.push([von, i]); von = i + 1; }
  }
  return { teile: aus, zu: q.length };
}
/* Ein Stück als fester Text: '…', "…", `…` ohne ${}, auch 'a' + 'b'. Sonst null; { vorlage } bei einer Vorlage mit ${}. */
function festerText(L, [von, bis]) {
  const { q, ende, einschub } = L;
  let i = von, aus = '';
  for (;;) {
    while (i < bis && /\s/.test(q[i])) i++;
    if (!"'\"`".includes(q[i]) || !ende.has(i) || ende.get(i) >= bis) return null;
    if (einschub.has(i)) return { vorlage: q.slice(i + 1, ende.get(i)) };
    aus += entmaskiere(q.slice(i + 1, ende.get(i))); i = ende.get(i) + 1;
    while (i < bis && /\s/.test(q[i])) i++;
    if (i >= bis) return { text: aus };
    if (q[i] !== '+') return null;
    i++;
  }
}
const zeile = (q, i) => q.slice(0, i).split('\n').length;
const kurz = (s) => s.replace(/\s+/g, ' ').trim();

/* ── Sammeln ── */
export function sammle(wurzel = WURZEL) {
  const paare = [], vorlagen = [], indirekt = [], nurDeEn = [], eigeneSprachen = [], unklar = [], vorbereitet = [], nurDeutsch = [];
  const dazu = (de, en, datei, z) => { if (typeof de === 'string' && de !== '') paare.push({ de, en, datei, zeile: z }); };
  for (const datei of dateien(wurzel)) {
    const q = readFileSync(join(wurzel, datei), 'utf8'), L = lesen(q), app = datei.startsWith('neu/');
    /* Wie heißt text() hier? `import { text as spText }` – und der Kurzname davor: `const L = (de, en) => spText(sprache(), de, en)`. */
    const imp = q.match(/import\s*\{([^}]*)\}\s*from\s*['"][^'"]*oberflaeche\/sprache\.mjs['"]/);
    const tm = imp && imp[1].split(',').map((x) => x.trim().match(/^text(?:\s+as\s+([\w$]+))?$/)).find(Boolean);
    const namen = [], kurzOrt = [];                                        // [Name, Platz des deutschen Texts in der Klammer]
    if (tm) {
      const tName = (tm[1] || 'text').replace(/\$/g, '\\$');
      namen.push([tName, 1]);
      const re = new RegExp('(?:const|let|var)\\s+([\\w$]+)\\s*=\\s*\\(\\s*([\\w$]+)\\s*,\\s*([\\w$]+)\\s*\\)\\s*=>\\s*' + tName + '\\s*\\([^,()]*(?:\\([^()]*\\))?\\s*,\\s*\\2\\s*,\\s*\\3\\s*\\)', 'g');
      for (const m of q.matchAll(re)) if (L.ebene[m.index]) { namen.push([m[1].replace(/\$/g, '\\$'), 0]); kurzOrt.push([m.index, m.index + m[0].length]); }
    }
    for (const [name, vorn] of namen) {
      for (const m of q.matchAll(new RegExp('(?<![\\w$.])' + name + '\\s*\\(', 'g'))) {
        if (!L.ebene[m.index] || kurzOrt.some(([v, b]) => m.index >= v && m.index < b)) continue;   // Kommentar, Text – oder die Festlegung des Kurznamens
        const auf = m.index + m[0].length - 1, { teile, zu } = stuecke(L, auf), z = zeile(q, m.index);
        const roh = kurz(q.slice(teile[vorn] ? teile[vorn][0] : auf + 1, zu));
        const a = teile[vorn] ? festerText(L, teile[vorn]) : null, b = teile[vorn + 1] ? festerText(L, teile[vorn + 1]) : null;
        if (teile.length === vorn + 2 && a && b && 'text' in a && 'text' in b) dazu(a.text, b.text, datei, z);
        else if ((a && a.vorlage != null) || (b && b.vorlage != null)) vorlagen.push({ datei, zeile: z, text: '`' + kurz(a && a.vorlage != null ? a.vorlage : b.vorlage) + '`' });
        else if (a && 'text' in a) unklar.push({ datei, zeile: z, aufruf: roh });                  // fester deutscher Text, aber das Englische ist keiner
        else indirekt.push({ datei, zeile: z, aufruf: roh });
      }
    }
    /* Auskunft: Fehlertexte der Getränke-Schicht, die fest auf Deutsch stehen (throw new Error('…') ohne text()). */
    if (!app) for (const m of q.matchAll(/new\s+Error\s*\(/g)) {
      if (!L.ebene[m.index]) continue;
      const { teile } = stuecke(L, m.index + m[0].length - 1), i = teile[0] ? teile[0][0] + q.slice(...teile[0]).search(/\S/) : -1;
      const t = i >= 0 && L.ende.has(i) && !L.einschub.has(i) ? entmaskiere(q.slice(i + 1, L.ende.get(i))) : '';   // beginnt die Klammer mit festem Text?
      if (/\s/.test(t.trim())) nurDeutsch.push({ datei, zeile: zeile(q, m.index), text: t.trim() });
    }
    /* Listen und – als Auskunft – jedes { de, en } in getraenke/, das nicht über text() läuft. */
    const konst = [...q.matchAll(/(?:^|\n)(?:export\s+)?const\s+([\w$]+)\s*=/g)].filter((m) => L.ebene[m.index + m[0].length - 1] === 1);
    konst.forEach((m, k) => {
      const name = m[1], von = m.index + m[0].length, bis = k + 1 < konst.length ? konst[k + 1].index : q.length, liste = LISTEN.find((l) => l.datei === datei && l.name === name);
      for (let i = von; i < bis; i++) {
        if (L.ebene[i] === 0 && L.ende.has(i)) { i = L.ende.get(i); continue; }
        if (L.ebene[i] !== 1) continue;
        if (q[i] === '[' && liste && liste.form === 'paar') {
          const { teile } = stuecke(L, i), t = teile.map((x) => festerText(L, x));
          if (t.length === 2 && t.every((x) => x && 'text' in x)) dazu(t[0].text, t[1].text, datei, zeile(q, i));
        }
        if (q[i] === '{' && (app ? liste && liste.form === 'feld' : true)) {
          const f = {};
          for (const st of stuecke(L, i).teile) { const s = q.slice(...st), d = s.match(/^\s*(?:([\w$]+)|'([^']*)'|"([^"]*)")\s*:/); if (d) { const w = festerText(L, [st[0] + d[0].length, st[1]]); if (w && 'text' in w) f[d[1] || d[2] || d[3]] = w.text; } }
          if (typeof f.de !== 'string' || !f.de) continue;
          const weitere = CODES.filter((c) => c in f);
          if (weitere.length) eigeneSprachen.push({ datei, name, zeile: zeile(q, i) });
          else if (typeof f.en === 'string') {
            if (liste && liste.form === 'feld') { dazu(f.de, f.en, datei, zeile(q, i)); if (liste.vorbereitet) vorbereitet.push({ datei, name, zeile: zeile(q, i), de: f.de, en: f.en }); }
            else nurDeEn.push({ datei, name, zeile: zeile(q, i), de: f.de, en: f.en });
          }
        }
      }
    });
  }
  /* Ein Schlüssel, eine Übersetzung: derselbe deutsche Text mit zwei englischen Fassungen wird gemeldet (der erste gilt). */
  const schluessel = {}, wo = {}, zwei = [];
  for (const p of paare) {
    if (!hat(schluessel, p.de)) { schluessel[p.de] = p.en; wo[p.de] = `${p.datei}:${p.zeile}`; }
    else if (schluessel[p.de] !== p.en && !zwei.some((x) => x.de === p.de && x.en.includes(p.en))) { const x = zwei.find((y) => y.de === p.de); if (x) x.en.push(p.en); else zwei.push({ de: p.de, en: [schluessel[p.de], p.en], wo: `${p.datei}:${p.zeile}` }); }
  }
  const bekannt = new Set(LISTEN.flatMap((l) => l.aufrufe).concat(KERN_AUFRUFE));
  return { schluessel, wo, zwei, vorlagen, unklar, nurDeEn, nurDeutsch, vorbereitet, eigeneSprachen, indirekt, unerklaert: indirekt.filter((x) => !bekannt.has(x.aufruf)), ausKern: indirekt.filter((x) => KERN_AUFRUFE.includes(x.aufruf)) };
}

/* ── Tabellen ── */
export const tabellenPfad = (code, wurzel = WURZEL) => join(wurzel, TABELLEN_ORT, code + '.mjs');
export async function tabelleLesen(code, wurzel = WURZEL) {
  const p = tabellenPfad(code, wurzel); if (!existsSync(p)) return null;
  const m = await import(pathToFileURL(p).href + '?t=' + Date.now()); return m.default || {};
}
export async function pruefe(wurzel = WURZEL) {
  const s = sammle(wurzel), soll = Object.keys(s.schluessel), aus = {};
  for (const c of CODES) { const t = await tabelleLesen(c, wurzel); aus[c] = { da: !!t, fehlt: soll.filter((k) => !t || !hat(t, k)), zuviel: t ? Object.keys(t).filter((k) => !hat(s.schluessel, k)) : [] }; }
  return { ...s, sprachen: aus };
}
const NAMEN = { es: 'Spanisch', fr: 'Französisch', it: 'Italienisch', pt: 'Portugiesisch', ru: 'Russisch', zh: 'Chinesisch' };
const js = (t) => "'" + String(t).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n') + "'";
/* Schreibt die Tabelle in Code-Reihenfolge, ein Eintrag je Zeile. Einträge ohne Schlüssel im Code fallen weg – und werden genannt
   (ein leicht geänderter deutscher Text ist ein NEUER Schlüssel; seine alte Übersetzung soll nicht still verschwinden). */
export function tabelleSchreiben(code, eintraege, wurzel = WURZEL, kopf = '') {
  const s = sammle(wurzel), z = [];
  let datei = '';
  for (const de of Object.keys(s.schluessel)) {
    if (!hat(eintraege, de)) continue;
    const d = s.wo[de].replace(/:\d+$/, ''); if (d !== datei) { datei = d; z.push(`  /* ${d} */`); }
    z.push(`  ${js(de)}: ${js(eintraege[de])},`);
  }
  const alt = existsSync(tabellenPfad(code, wurzel)) ? (readFileSync(tabellenPfad(code, wurzel), 'utf8').match(/^(?:\/\/.*\n)+/) || [''])[0] : '';
  const k = kopf || alt || `// Mein Mixarium · Oberfläche auf ${NAMEN[code]}. Schlüssel ist der DEUTSCHE Text im Code; ohne Eintrag steht Englisch da.\n`;
  mkdirSync(join(wurzel, TABELLEN_ORT), { recursive: true });
  writeFileSync(tabellenPfad(code, wurzel), `${k}export default {\n${z.join('\n')}\n};\n`);
  return { zahl: z.filter((x) => !x.startsWith('  /*')).length, weg: Object.keys(eintraege).filter((k) => !hat(s.schluessel, k)) };
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  const [a, b, c] = process.argv.slice(2);
  if (a === '--pruefe') {
    const r = await pruefe(); let rot = false;
    console.log(`${Object.keys(r.schluessel).length} Schlüssel im Code.`);
    for (const code of CODES) {
      const x = r.sprachen[code];
      console.log(`${code}: ${!x.da ? 'Tabelle fehlt' : `${x.fehlt.length} fehlen · ${x.zuviel.length} überzählig`}`);
      for (const k of x.da ? x.fehlt : []) console.log(`   fehlt      ${JSON.stringify(k)}   (${r.wo[k]})`);
      for (const k of x.zuviel) console.log(`   überzählig ${JSON.stringify(k)}`);
      if (x.fehlt.length) rot = true;
    }
    for (const x of r.unerklaert) { rot = true; console.log(`Unbekannte Liste: ${x.datei}:${x.zeile} reicht (${x.aufruf}) durch – in LISTEN oder KERN_AUFRUFE eintragen.`); }
    for (const x of r.unklar) { rot = true; console.log(`Nicht lesbar: ${x.datei}:${x.zeile} (${x.aufruf})`); }
    for (const x of r.zwei) console.log(`Hinweis: ${JSON.stringify(x.de)} steht mit zwei englischen Fassungen im Code (${x.en.map((e) => JSON.stringify(e)).join(' / ')}); die Tabelle kennt nur eine Übersetzung.`);
    process.exit(rot ? 1 : 0);
  } else if (a === '--fehlt' && CODES.includes(b)) {
    const r = await pruefe(); console.log(JSON.stringify(Object.fromEntries(r.sprachen[b].fehlt.map((k) => [k, r.schluessel[k]])), null, 1));
  } else if (a === '--trage-ein' && CODES.includes(b) && c) {
    const alt = (await tabelleLesen(b)) || {}, r = tabelleSchreiben(b, { ...alt, ...JSON.parse(readFileSync(c, 'utf8')) });
    console.log(`${TABELLEN_ORT}/${b}.mjs: ${r.zahl} Einträge.`);
    for (const k of r.weg) console.log(`   weggefallen (kein Schlüssel im Code mehr): ${JSON.stringify(k)}${hat(alt, k) ? ' – war: ' + JSON.stringify(alt[k]) : ''}`);
  } else if (a === '--bericht') {
    const r = sammle(), g = (l, f) => l.forEach((x) => console.log('   ' + f(x)));
    console.log(`${Object.keys(r.schluessel).length} Schlüssel.\n\nVorlagen mit \${…} – keine Tabelle kann sie treffen (${r.vorlagen.length}):`); g(r.vorlagen, (x) => `${x.datei}:${x.zeile}  ${x.text}`);
    console.log(`\nAus dem Kern durchgereicht – stehen in dessen Tabellen (${r.ausKern.length}):`); g(r.ausKern, (x) => `${x.datei}:${x.zeile}  (${x.aufruf})`);
    console.log(`\nNur Deutsch und Englisch, NICHT über text() – dort bleibt Englisch stehen (${r.nurDeEn.length}):`); g(r.nurDeEn, (x) => `${x.datei}:${x.zeile}  ${x.name}: ${x.de} / ${x.en}`);
    console.log(`\nVorbereitet: steht in den Tabellen, läuft aber noch NICHT über text() – bis dahin bleibt Englisch stehen (${r.vorbereitet.length}):`); g(r.vorbereitet, (x) => `${x.datei}:${x.zeile}  ${x.name}: ${x.de} / ${x.en}`);
    console.log(`\nFehlertexte der Getränke-Schicht nur auf Deutsch, ohne text() (${r.nurDeutsch.length}):`); g(r.nurDeutsch, (x) => `${x.datei}:${x.zeile}  ${x.text}`);
    const e = {}; for (const x of r.eigeneSprachen) e[`${x.datei} ${x.name}`] = (e[`${x.datei} ${x.name}`] || 0) + 1;
    console.log('\nEigene Felder je Sprache – brauchen keine Tabelle:'); g(Object.entries(e), ([k, n]) => `${k}: ${n} Einträge`);
    console.log(`\nZwei englische Fassungen für einen deutschen Text (${r.zwei.length}):`); g(r.zwei, (x) => `${JSON.stringify(x.de)}: ${x.en.join(' / ')}  (${x.wo})`);
  } else if (!a || a === '--nach') {
    const t = JSON.stringify(sammle().schluessel, null, 1) + '\n';
    if (a === '--nach' && b) { writeFileSync(b, t); console.log(`${Object.keys(JSON.parse(t)).length} Schlüssel → ${b}`); } else process.stdout.write(t);
  } else { console.error('Aufruf: node tools/sprach-schluessel.mjs [--nach datei.json | --pruefe | --fehlt <code> | --trage-ein <code> <datei.json> | --bericht]'); process.exit(2); }
}
