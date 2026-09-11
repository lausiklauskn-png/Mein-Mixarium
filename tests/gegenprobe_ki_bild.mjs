// Gegenprobe zu tests/smoke_ki_bild.mjs.
//
// Baut je einen Fehler ein und besteht darauf, dass die Probe umfällt — und
// zwar an der ROTEN ZEILE, die zu diesem Fehler gehört. Ein Fall, der die
// Probe an einer FREMDEN Zusicherung umwirft, sieht wie ein Treffer aus und
// beweist nichts.
//
//   node tests/gegenprobe_ki_bild.mjs
//
// Sabotiert wird eine WEGWERF-KOPIE, nie der Arbeitsbaum: ein abgebrochener
// Lauf ließe sonst eine erfundene Zeile liegen, und die nächste Prüfung
// meldete rote Proben, die niemandem gehören (PWA-Toolpoint, 2026-09-09).

import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, readFileSync, writeFileSync, existsSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const WURZEL = join(dirname(fileURLToPath(import.meta.url)), '..');

// Jeder Fall: was ersetzt wird, und WELCHE rote Zeile das treffen muss.
const FAELLE = [
  { name: 'der Tab verschwindet aus der Leiste',
    alt: `<div class="fovtab" onclick="switchFovTab('importOv','imggen',this)" id="impTabImgGen"`,
    neu: `<div class="fovtab" style="display:none" onclick="switchFovTab('importOv','imggen',this)" id="impTabImgGen"`,
    trifft: /der Tab steht in der Leiste/ },

  { name: 'der Hauptbereich steht auch OHNE Schlüssel da',
    alt: `  if(getOpenAiImgKey()){switchToImgGenMain();}`,
    neu: `  if(true){switchToImgGenMain();}`,
    trifft: /ohne Schlüssel ist der Hauptbereich zu/ },

  { name: 'der OpenAI-Schlüssel landet in der Anthropic-Schublade',
    alt: `function saveOpenAiImgKey(key){if(key){localStorage.setItem(OPENAI_IMG_KEY_LS,key.trim());}`,
    neu: `function saveOpenAiImgKey(key){if(key){localStorage.setItem(OPENAI_IMG_KEY_LS,key.trim());localStorage.setItem('mxkey9m',key.trim());}`,
    trifft: /der Anthropic-Schlüssel bleibt unberührt/ },

  { name: 'der Schlüssel wird ausgeschrieben statt maskiert',
    alt: `  if(sub&&key)sub.textContent=key.slice(0,7)+'…'+key.slice(-4);`,
    neu: `  if(sub&&key)sub.textContent=key;`,
    trifft: /der Schlüssel wird maskiert/ },

  { name: 'Knabbereien werden als Getränk beschrieben',
    alt: `  if(recipe.cat==='knab'||recipe.cat==='finger'){`,
    neu: `  if(false){`,
    trifft: /eine Knabberei wird NICHT als Getränk beschrieben/ },

  { name: 'das erzeugte Bild wird nicht abgelegt',
    alt: `        r.img=comp;comp=null;`,
    neu: `        comp=null;`,
    trifft: /das Bild landet im Getränk/ },

  { name: 'vorhandene Bilder werden immer überschrieben',
    alt: `  return{all,replaceChecked,list:all.filter(r=>!r.img)};`,
    neu: `  return{all,replaceChecked,list:all};`,
    trifft: /ein vorhandenes Bild wird ohne Haken NICHT ersetzt/ },

  { name: 'der Notaus hält den Lauf nicht an',
    alt: `    if(_imgGenAborted)break;`,
    neu: `    if(false)break;`,
    trifft: /nach dem Notaus läuft kein weiterer bezahlter Aufruf/ },

  { name: 'nach einem bezahlten Lauf wird nicht zum Sichern geraten',
    alt: `    if(hint)hint.style.display='block';`,
    neu: `    if(hint)hint.style.display='none';`,
    trifft: /nach einem bezahlten Lauf wird zum Sichern geraten/ },

  { name: 'ein anderes Modell wird gerufen',
    alt: `body:JSON.stringify({model:'dall-e-3',prompt:_buildDallePrompt(recipe)`,
    neu: `body:JSON.stringify({model:'dall-e-2',prompt:_buildDallePrompt(recipe)`,
    trifft: /gerufen wird OpenAI, mit dall-e-3/ },

  { name: 'der Knopf bleibt offen, obwohl es nichts zu tun gibt',
    alt: `  if(btn)btn.disabled=(!st.list.length);`,
    neu: `  if(btn)btn.disabled=false;`,
    trifft: /sind alle versorgt, ist der Knopf gesperrt/ },

  { name: 'der Tab wird nicht mehr übersetzt',
    alt: `'impTabImgGen','imggenSetupTitleEl'`,
    neu: `'imggenSetupTitleEl'`,
    trifft: /nicht achtmal derselbe Text/ },
];

// ── Ausgangslage: die Probe muss OHNE Eingriff grün sein ─────────────────────
function laufProbe(wurzel) {
  const r = spawnSync('node', [join(wurzel, 'tests', 'smoke_ki_bild.mjs')], { encoding: 'utf-8', cwd: wurzel });
  return { code: r.status, aus: (r.stdout || '') + (r.stderr || '') };
}

function frischeKopie() {
  const d = mkdtempSync(join(tmpdir(), 'mx-gegenprobe-'));
  execFileSync('sh', ['-c',
    `tar -c --exclude=./.git --exclude=./node_modules -C '${WURZEL}' . | tar -x -C '${d}'`]);
  // node_modules wird VERWIESEN, nie kopiert — nur gelesen.
  if (existsSync(join(WURZEL, 'node_modules'))) symlinkSync(join(WURZEL, 'node_modules'), join(d, 'node_modules'));
  return d;
}

console.log('Ausgangslage prüfen …');
{
  const d = frischeKopie();
  const r = laufProbe(d);
  rmSync(d, { recursive: true, force: true });
  if (r.code !== 0) {
    console.log('❌ ABBRUCH: die Probe ist schon OHNE Eingriff rot — es gäbe nichts zu messen.\n');
    console.log(r.aus.split('\n').filter(l => l.includes('ROT') || l.includes('NICHT LAUFFÄHIG')).join('\n'));
    process.exit(2);
  }
  if (r.aus.includes('NICHT LAUFFÄHIG')) {
    console.log('⊘ NICHT LAUFFÄHIG: die Probe selbst läuft hier nicht (playwright-core/Chromium).');
    process.exit(0);
  }
  console.log('  ✓ grün\n');
}

let gefangen = 0; const durchgerutscht = [], falscheZeile = [], toteAnker = [];

for (const f of FAELLE) {
  const d = frischeKopie();
  let treffer = 0;
  for (const datei of ['index.html', 'QC_Mixarium_20_04_26.html']) {
    const p = join(d, datei);
    const s = readFileSync(p, 'utf-8');
    const n = s.split(f.alt).length - 1;
    treffer += n;
    if (n) writeFileSync(p, s.split(f.alt).join(f.neu));
  }
  if (treffer === 0) {
    toteAnker.push(f.name);
    console.log('  ⚠ TOTER ANKER: ' + f.name);
    rmSync(d, { recursive: true, force: true });
    continue;
  }
  const r = laufProbe(d);
  rmSync(d, { recursive: true, force: true });

  const roteZeilen = r.aus.split('\n').filter(l => l.includes('✗ ROT:'));
  if (r.code === 0) {
    durchgerutscht.push(f.name);
    console.log('  ✗ NICHT GEFANGEN: ' + f.name);
  } else if (!roteZeilen.some(l => f.trifft.test(l))) {
    // Rot ja — aber an der falschen Stelle. Das beweist nichts über die
    // Zusicherung, um die es geht.
    falscheZeile.push(f.name + '  → rot war: ' + (roteZeilen[0] || 'Absturz').trim());
    console.log('  ✗ AUS DEM FALSCHEN GRUND: ' + f.name);
    console.log('      rot war: ' + (roteZeilen[0] || '(Absturz, keine rote Zeile)').trim());
  } else {
    gefangen++;
    console.log('  ✓ gefangen: ' + f.name);
  }
}

console.log(`\n${gefangen} gefangen · ${durchgerutscht.length} durchgerutscht · ` +
            `${falscheZeile.length} aus dem falschen Grund · ${toteAnker.length} tote Anker`);
if (durchgerutscht.length || falscheZeile.length || toteAnker.length) process.exit(1);
