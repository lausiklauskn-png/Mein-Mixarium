#!/usr/bin/env node
const fs = require('fs');

const strict = process.argv.includes('--strict');
const html = fs.readFileSync('QC_Mixarium_20_04_26.html', 'utf8');
const start = html.indexOf('const LANGS={');
const end = html.indexOf('\nlet CL=', start);
if (start === -1 || end === -1) {
  console.error('❌ LANGS block not found');
  process.exit(1);
}

const snippet = html.slice(start, end);
let LANGS;
try {
  LANGS = Function(`"use strict"; ${snippet}; return LANGS;`)();
} catch (e) {
  console.error('❌ Failed to parse LANGS block:', e.message);
  process.exit(1);
}

const codes = Object.keys(LANGS);
const required = Object.keys(LANGS.de || {});
let issues = 0;

for (const code of codes) {
  const keys = new Set(Object.keys(LANGS[code] || {}));
  const missing = required.filter(k => !keys.has(k));
  if (missing.length) {
    issues += missing.length;
    console.warn(`⚠️ ${code}: missing ${missing.length} keys (e.g. ${missing.slice(0, 8).join(', ')})`);
  }
}

const legacy = (html.match(/Mein Rezeptbuch/g) || []).length;
if (legacy > 0) {
  issues += legacy;
  console.warn(`⚠️ Found legacy branding 'Mein Rezeptbuch' (${legacy}x)`);
}

console.log(`✅ LANGS parsed (${codes.length} languages, ${required.length} base keys)`);
if (issues === 0) {
  console.log('✅ No i18n/branding issues detected');
  process.exit(0);
}

if (strict) {
  console.error(`❌ Strict mode failed with ${issues} issue(s)`);
  process.exit(1);
}

console.log(`⚠️ Non-strict mode: ${issues} issue(s) detected`);
console.log('💡 Run with --strict to fail CI on missing keys.');