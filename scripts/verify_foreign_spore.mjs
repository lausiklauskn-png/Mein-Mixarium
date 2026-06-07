#!/usr/bin/env node
/*
 * verify_foreign_spore.mjs — eigenstaendige Gegenprobe einer fremden SBKIM-Spore.
 *
 * Spiegelt 1:1 die In-App-Logik aus sbkim/02_spore.js (verifyForeignSpore):
 *   1. Pflichtfelder vorhanden.
 *   2. nodeId == base64url(SHA-256(rohem Ed25519-Public-Key)) ohne Padding.
 *   3. Ed25519-Signatur deckt den kanonisierten Spore-Body (ohne "signature")
 *      mit sortierten Schluesseln, UTF-8, JSON.stringify.
 *
 * Zero-dependency (nur node:crypto WebCrypto), offline. Beweist "✔ VALID",
 * bevor eine Spore als sbkim/<name>_inbox.json byte-1:1 uebernommen wird.
 *
 * Aufruf: node scripts/verify_foreign_spore.mjs <pfad-zur-spore.json> [...]
 */
import { readFile } from "node:fs/promises";
import { webcrypto } from "node:crypto";

const subtle = webcrypto.subtle;
const REQUIRED = ["createdAt", "domain", "embeddingModel", "endpoint", "id", "nodeType", "protocolVersion", "publicKey", "signature"];
const VALID_NODE_TYPES = ["hybrid", "active", "passive", "corpus", "endpoint"];

function utf8(s) { return new TextEncoder().encode(s); }

function b64urlDecode(str) {
  str = String(str).replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) str += "=";
  return new Uint8Array(Buffer.from(str, "base64"));
}
function b64urlEncode(bytes) {
  return Buffer.from(bytes).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function canonicalize(value) {
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(canonicalize);
  const out = {};
  for (const k of Object.keys(value).sort()) out[k] = canonicalize(value[k]);
  return out;
}
function canonicalJsonBytes(obj) { return utf8(JSON.stringify(canonicalize(obj))); }

function majorVersion(v) { return String(v == null ? "" : v).split(".")[0]; }

async function deriveNodeIdFromJwk(jwk) {
  const pub = await subtle.importKey("jwk", jwk, { name: "Ed25519" }, true, ["verify"]);
  const raw = await subtle.exportKey("raw", pub);
  const hash = await subtle.digest("SHA-256", raw);
  return b64urlEncode(new Uint8Array(hash));
}

async function verifyForeignSpore(spore) {
  if (!spore || typeof spore !== "object") return { valid: false, reason: "Spore ist kein Objekt." };
  for (const f of REQUIRED) if (!(f in spore)) return { valid: false, reason: "Pflichtfeld fehlt: " + f };
  if (majorVersion(spore.protocolVersion) !== majorVersion("0.1"))
    return { valid: false, reason: "Inkompatible Hauptversion: " + spore.protocolVersion };
  if (VALID_NODE_TYPES.indexOf(spore.nodeType) === -1)
    return { valid: false, reason: "nodeType ungueltig: " + spore.nodeType };

  let derivedId;
  try { derivedId = await deriveNodeIdFromJwk(spore.publicKey); }
  catch (e) { return { valid: false, reason: "publicKey nicht importierbar: " + (e && e.message || e) }; }
  if (derivedId !== spore.id) return { valid: false, reason: "nodeId stimmt nicht zum Public Key" };

  const pub = await subtle.importKey("jwk", spore.publicKey, { name: "Ed25519" }, true, ["verify"]);
  const unsigned = {};
  for (const k of Object.keys(spore)) if (k !== "signature") unsigned[k] = spore[k];
  const bytes = canonicalJsonBytes(unsigned);
  let sigBytes;
  try { sigBytes = b64urlDecode(spore.signature); }
  catch { return { valid: false, reason: "Signatur nicht dekodierbar (kein base64url)" }; }
  const ok = await subtle.verify({ name: "Ed25519" }, pub, sigBytes, bytes);
  if (!ok) return { valid: false, reason: "Signatur ungueltig" };
  return { valid: true };
}

const files = process.argv.slice(2);
if (!files.length) { console.error("Aufruf: node scripts/verify_foreign_spore.mjs <spore.json> [...]"); process.exit(2); }

let allValid = true;
for (const f of files) {
  let spore;
  try { spore = JSON.parse(await readFile(f, "utf8")); }
  catch (e) { console.log(`✘ ${f} — nicht lesbar: ${e && e.message || e}`); allValid = false; continue; }
  const r = await verifyForeignSpore(spore);
  if (r.valid) console.log(`✔ VALID  ${f}  (id ${String(spore.id).slice(0, 16)}…, ${Array.isArray(spore.domainVector) ? spore.domainVector.length + "-dim" : "kein Vektor"})`);
  else { console.log(`✘ INVALID ${f} — ${r.reason}`); allValid = false; }
}
process.exit(allValid ? 0 : 1);
