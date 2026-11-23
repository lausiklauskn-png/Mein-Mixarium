// Küchen-Kern aus Mein-Rezeptbuch byte-gleich übernehmen und prüfen. Den Kern NIE hier von Hand ändern.
//   node tools/kern-nachziehen.mjs --pruefen                 prüft kern/ gegen KERN.json (Prüfsummen, keine fremden Dateien)
//   node tools/kern-nachziehen.mjs <Pfad zum Klon von Mein-Rezeptbuch>   kopiert kern/ + KERN.json, schreibt KERN-PIN.json
import { readFileSync, writeFileSync, readdirSync, statSync, rmSync, mkdirSync, copyFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';
import { execFileSync } from 'node:child_process';
const sha = (p) => createHash('sha256').update(readFileSync(p)).digest('hex');
const alle = (d, aus = []) => { for (const n of readdirSync(d).sort()) { const p = join(d, n); if (statSync(p).isDirectory()) alle(p, aus); else aus.push(p); } return aus; };
export function pruefen(wurzel = '.') {
  const fehler = [];
  if (!existsSync(join(wurzel, 'KERN.json'))) return ['KERN.json fehlt'];
  const soll = JSON.parse(readFileSync(join(wurzel, 'KERN.json'), 'utf8')).dateien || {};
  const ist = existsSync(join(wurzel, 'kern')) ? alle(join(wurzel, 'kern')).map((p) => p.slice(wurzel === '.' ? 0 : wurzel.length + 1)) : [];
  for (const [p, s] of Object.entries(soll)) {
    if (!existsSync(join(wurzel, p))) fehler.push(`fehlt: ${p}`);
    else if (sha(join(wurzel, p)) !== s) fehler.push(`von Hand geändert oder veraltet: ${p}`);
  }
  for (const p of ist) if (!(p in soll)) fehler.push(`nicht im Pin: ${p}`);
  if (!Object.keys(soll).length) fehler.push('KERN.json nennt keine Datei');
  return fehler;
}
if (import.meta.url === `file://${process.argv[1]}`) {
  const a = process.argv[2];
  if (a === '--pruefen' || !a) {
    const f = pruefen();
    if (f.length) { console.error('Kern stimmt NICHT mit dem Pin überein:\n - ' + f.join('\n - ')); process.exit(1); }
    const pin = existsSync('KERN-PIN.json') ? JSON.parse(readFileSync('KERN-PIN.json', 'utf8')) : {};
    console.log(`Kern stimmt mit dem Pin überein (Fassung ${JSON.parse(readFileSync('KERN.json', 'utf8')).fassung}, Commit ${String(pin.commit || '?').slice(0, 7)}).`);
  } else {
    const q = a;
    if (!existsSync(join(q, 'KERN.json')) || !existsSync(join(q, 'kern'))) { console.error('Dort liegt kein Kern (KERN.json und kern/ erwartet): ' + q); process.exit(2); }
    const git = (...x) => execFileSync('git', ['-C', q, ...x], { encoding: 'utf8' }).trim();
    if (git('status', '--porcelain', '--', 'kern', 'KERN.json')) { console.error('Die Quelle hat ungespeicherte Änderungen am Kern. Nur von einem sauberen Stand übernehmen.'); process.exit(2); }
    rmSync('kern', { recursive: true, force: true });
    for (const p of alle(join(q, 'kern'))) { const z = p.slice(q.length + 1); mkdirSync(dirname(z), { recursive: true }); copyFileSync(p, z); }
    copyFileSync(join(q, 'KERN.json'), 'KERN.json');
    writeFileSync('KERN-PIN.json', JSON.stringify({ quelle: 'lausiklauskn-png/Mein-Rezeptbuch', zweig: 'main', commit: git('rev-parse', 'HEAD'), datum: git('log', '-1', '--format=%cI'), fassung: JSON.parse(readFileSync('KERN.json', 'utf8')).fassung }, null, 1) + '\n');
    const f = pruefen();
    if (f.length) { console.error('Nach dem Kopieren stimmt der Kern nicht:\n - ' + f.join('\n - ')); process.exit(1); }
    console.log('Kern übernommen und geprüft.');
  }
}
