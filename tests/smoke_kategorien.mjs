/* Probe: Kategorien umbenennen + fremde Kategorien sichtbar (Klaus 2026-09-15)
   Gemessen wird im ECHTEN Browser an der ECHTEN Datei — eine Probe, die nur
   den Quelltext liest, misst nicht, ob die Seite laeuft. */
import { chromium } from "playwright-core";
import { createServer } from "node:http";
import { readFileSync, existsSync } from "node:fs";
import { extname, join } from "node:path";

const WURZEL = process.cwd();
const TYP = { ".html":"text/html; charset=utf-8", ".js":"text/javascript", ".json":"application/json",
              ".css":"text/css", ".svg":"image/svg+xml", ".png":"image/png", ".jpg":"image/jpeg",
              ".webm":"video/webm", ".mp4":"video/mp4" };
let gruen = 0, rot = 0;
const ok  = (t,b)=>{ if(b){gruen++;console.log("  ✓ "+t);} else {rot++;console.log("  ✗ ROT — "+t);} };

const server = createServer((q,a)=>{
  const pfad = join(WURZEL, decodeURIComponent(q.url.split("?")[0]).replace(/^\/+/,"") || "index.html");
  if(!existsSync(pfad)||!pfad.startsWith(WURZEL)){a.writeHead(404);a.end();return;}
  a.writeHead(200,{"content-type":TYP[extname(pfad)]||"application/octet-stream"});
  a.end(readFileSync(pfad));
});
await new Promise(r=>server.listen(0,r));
const port = server.address().port;

/* Ausgangslage: echte Getraenke + ein Rezeptbuch-Import mit FREMDEN Kennungen.
   'fleisch' stand bis heute in der Sieben-Liste, 'drk' in keiner — genau die
   beiden Faelle, die Klaus gemeldet hat. */
const BESTAND = [
  { id:1, name:"Mojito",            cat:"ckt",     shut:true, ings:[], steps:[], flavors:[] },
  { id:2, name:"Spaghetti Bolognese", cat:"fleisch", shut:true, ings:[], steps:[], flavors:[] },
  { id:3, name:"Linsensuppe",       cat:"suppe",   shut:true, ings:[], steps:[], flavors:[] },
  { id:4, name:"Apfelschorle",      cat:"drk",     shut:true, ings:[], steps:[], flavors:[] },
  { id:5, name:"", cat:"fleisch", shut:true, blank:true, ings:[], steps:[], flavors:[] },
];

const browser = await chromium.launch({ executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
                                        args:["--no-sandbox"] });
const seite = await browser.newPage();
await seite.addInitScript(b=>{
  localStorage.setItem("mix9m", JSON.stringify(b));
  localStorage.setItem("mxlang9m","de");
}, BESTAND);
await seite.goto(`http://127.0.0.1:${port}/index.html`, { waitUntil:"domcontentloaded" });
await seite.waitForFunction(()=>typeof window.catsAlle === "function" && Array.isArray(window.R), null, { timeout:20000 });
await seite.waitForFunction(()=>document.querySelectorAll("#catNav .cpill").length > 0, null, { timeout:20000 });

console.log("\n── 1 · Fremde Kategorien bekommen einen Reiter ──");
const reiter = await seite.evaluate(()=>[...document.querySelectorAll("#catNav .cpill")].map(e=>e.textContent.trim()));
ok("ein Reiter traegt „fleisch“", reiter.some(t=>/fleisch/i.test(t)));
ok("ein Reiter traegt „suppe“",   reiter.some(t=>/suppe/i.test(t)));
ok("ein Reiter traegt „drk“ — der Fall, der bisher STILL verschwand", reiter.some(t=>/drk/i.test(t)));

console.log("\n── 2 · Sie werden auch wirklich gezeichnet ──");
const inAlle = await seite.evaluate(()=>{ CAT="all"; render();
  return document.getElementById("rcont").textContent; });
ok("„Alle“ zeigt Spaghetti Bolognese", /Spaghetti Bolognese/.test(inAlle));
ok("„Alle“ zeigt Apfelschorle (cat=drk)", /Apfelschorle/.test(inAlle));
ok("„Alle“ zeigt weiterhin den Mojito", /Mojito/.test(inAlle));

console.log("\n── 3 · Kein Remap mehr nach Knabbereien ──");
const kats = await seite.evaluate(()=>window.R.filter(r=>r.name).map(r=>[r.name,r.cat]));
ok("Spaghetti steht auf 'fleisch', nicht auf 'knab'",
   kats.some(([n,c])=>n==="Spaghetti Bolognese" && c==="fleisch"));
ok("keins der Gerichte wurde nach 'knab' geschoben", !kats.some(([,c])=>c==="knab"));

console.log("\n── 4 · Umbenennen wirkt ──");
await seite.evaluate(()=>{ CATS_EIGEN={ fleisch:{name:"Hauptgerichte",ico:"🍝"} }; svCatsEigen(); renderCatNav(); });
const nachher = await seite.evaluate(()=>[...document.querySelectorAll("#catNav .cpill")].map(e=>e.textContent.trim()));
ok("der Reiter heisst jetzt „Hauptgerichte“", nachher.some(t=>/Hauptgerichte/.test(t)));
ok("das eigene Symbol steht davor", nachher.some(t=>t.includes("🍝")));
ok("die alte Beschriftung ist weg", !nachher.some(t=>/\bfleisch\b/i.test(t)));

console.log("\n── 5 · Die KENNUNG bleibt — sonst verlieren Rezepte ihr Zuhause ──");
const idNach = await seite.evaluate(()=>window.R.find(r=>r.name==="Spaghetti Bolognese").cat);
ok("r.cat ist unveraendert 'fleisch'", idNach==="fleisch");
const nochDa = await seite.evaluate(()=>{ CAT="fleisch"; render();
  return document.getElementById("rcont").textContent.includes("Spaghetti Bolognese"); });
ok("das Rezept steht im umbenannten Reiter", nochDa);

console.log("\n── 6 · Zuruecksetzen ──");
await seite.evaluate(()=>{ CATS_EIGEN={}; svCatsEigen(); renderCatNav(); });
const zurueck = await seite.evaluate(()=>[...document.querySelectorAll("#catNav .cpill")].map(e=>e.textContent.trim()));
ok("die Vorgabe ist zurueck", zurueck.some(t=>/fleisch/i.test(t)) && !zurueck.some(t=>/Hauptgerichte/.test(t)));

console.log("\n── 7 · Der Dialog laesst sich oeffnen und bedienen ──");
await seite.evaluate(()=>openKatUmbenennen());
ok("der Dialog steht da", await seite.locator("#katRenameOv").count() === 1);
const zeilen = await seite.locator("#katRenameOv .kat-row").count();
ok("er listet jede Kategorie, auch die mitgebrachten ("+zeilen+")",
   zeilen === await seite.evaluate(()=>catsAlle().length));
ok("die mitgebrachten sind als solche gekennzeichnet",
   await seite.locator("#katRenameOv .kat-fremd").count() >= 3);
await seite.fill('#katRenameOv .kat-row[data-kid="drk"] .kat-name', "Getränke");
await seite.evaluate(()=>katSpeichern());
ok("nach dem Speichern ist der Dialog zu", await seite.locator("#katRenameOv").count() === 0);
const drkNeu = await seite.evaluate(()=>[...document.querySelectorAll("#catNav .cpill")].map(e=>e.textContent.trim()));
ok("der Reiter heisst „Getränke“", drkNeu.some(t=>/Getränke/.test(t)));
ok("es ueberlebt ein Neuladen",
   await seite.evaluate(()=>JSON.parse(localStorage.getItem("mxcats9m")||"{}").drk?.name === "Getränke"));
/* ⚠ DIESE ZEILE GEHOERT HIERHIN, NICHT NACH OBEN. Schritt 5 setzt CATS_EIGEN
   von Hand — eine Sabotage IM Speicher-Weg kommt dort nie vorbei. Gemessen
   wird die Kennung deshalb NACH dem echten Knopf. */
ok("auch ueber den echten Speicher-Weg bleibt r.cat = 'drk'",
   await seite.evaluate(()=>window.R.find(r=>r.name==="Apfelschorle").cat === "drk"));
ok("und das Rezept steht im umbenannten Reiter", await seite.evaluate(()=>{
   CAT="drk"; render(); return document.getElementById("rcont").textContent.includes("Apfelschorle"); }));

console.log("\n── 9 · Emoji-Auswahl: einmal antippen, aussuchen ──");
await seite.evaluate(()=>{ CATS_EIGEN={}; svCatsEigen(); openKatUmbenennen(); });
ok("das Raster ist zu, solange niemand tippt",
   await seite.evaluate(()=>document.getElementById("katEmojiRaster").hidden === true));
await seite.click('#katRenameOv .kat-row[data-kid="fleisch"] .kat-ico');
ok("ein Tipp aufs Symbol-Feld öffnet es",
   await seite.evaluate(()=>document.getElementById("katEmojiRaster").hidden === false));
ok("… und es steht DIREKT unter der bearbeiteten Zeile", await seite.evaluate(()=>{
   const r=document.getElementById("katEmojiRaster");
   return r.previousElementSibling?.dataset?.kid === "fleisch"; }));
ok("es bietet eine Auswahl an (" + (await seite.locator("#katEmojiRaster .kat-emoji").count()) + " Symbole)",
   await seite.locator("#katEmojiRaster .kat-emoji").count() >= 40);
/* ⚠ Gemessen wird ein Emoji, das NICHT die Vorgabe der Kategorie ist —
   sonst wäre der Wächter auch grün, wenn gar nichts geschrieben würde. */
await seite.evaluate(()=>[...document.querySelectorAll("#katEmojiRaster .kat-emoji")]
  .find(b=>b.textContent==="🥦").click());
ok("ein Tipp aufs Emoji schreibt es ins Feld",
   await seite.inputValue('#katRenameOv .kat-row[data-kid="fleisch"] .kat-ico') === "🥦");
ok("… und schliesst das Raster wieder",
   await seite.evaluate(()=>document.getElementById("katEmojiRaster").hidden === true));
ok("… und gibt das Zurücksetzen frei",
   await seite.evaluate(()=>!document.querySelector('#katRenameOv .kat-row[data-kid="fleisch"] .kat-reset').disabled));

console.log("\n── 10 · Tippen bleibt möglich, und das Symbol kommt an ──");
await seite.fill('#katRenameOv .kat-row[data-kid="suppe"] .kat-ico', "🍜");
await seite.evaluate(()=>katSpeichern());
const symbole = await seite.evaluate(()=>[...document.querySelectorAll("#catNav .cpill")].map(e=>e.textContent.trim()));
ok("das ausgesuchte Symbol steht am Reiter", symbole.some(t=>t.includes("🥦")));
ok("das getippte Symbol steht am Reiter", symbole.some(t=>t.includes("🍜")));
ok("beides überlebt ein Neuladen", await seite.evaluate(()=>{
   const g=JSON.parse(localStorage.getItem("mxcats9m")||"{}");
   return g.fleisch?.ico==="🥦" && g.suppe?.ico==="🍜"; }));

console.log("\n── 8 · Leere Karten alter Essens-Kategorien fliegen weiter raus ──");
ok("keine Blank-Karte mit cat='fleisch'",
   await seite.evaluate(()=>!window.R.some(r=>r.blank && r.cat==="fleisch")));

await browser.close(); server.close();
console.log(`\n${gruen} grün · ${rot} ROT`);
process.exit(rot ? 1 : 0);
