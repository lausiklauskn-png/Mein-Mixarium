// VORLÄUFIG – wandert in den Küchen-Kern (kern/speicher). Eigene IndexedDB der neuen Fassung.
// Die alte App wird NUR GELESEN: ihre localStorage-Schlüssel und ihre IndexedDB `MeinMxBackup1` bleiben, wie sie sind.
const DB = 'MixariumNeu1', LADEN = 'kv';
function auf() {
  return new Promise((ja, nein) => {
    const a = indexedDB.open(DB, 1);
    a.onupgradeneeded = () => a.result.createObjectStore(LADEN);
    a.onsuccess = () => ja(a.result); a.onerror = () => nein(a.error);
  });
}
export async function lesen(k) {
  const db = await auf();
  return new Promise((ja, nein) => { const q = db.transaction(LADEN).objectStore(LADEN).get(k); q.onsuccess = () => { db.close(); ja(q.result); }; q.onerror = () => { db.close(); nein(q.error); }; });
}
export async function schreiben(k, v) {
  const db = await auf();
  return new Promise((ja, nein) => { const t = db.transaction(LADEN, 'readwrite'); t.objectStore(LADEN).put(v, k); t.oncomplete = () => { db.close(); ja(); }; t.onerror = () => { db.close(); nein(t.error); }; });
}
/* Dauerhafter Speicher: bitten, nicht verlangen. */
export async function dauerhaft() { try { return !!(navigator.storage && navigator.storage.persist && await navigator.storage.persist()); } catch (e) { return false; } }

/* Abbild der alten App für `ausAlterApp` (getraenke/uebernahme.mjs). Geheime Schlüssel werden gar nicht erst gelesen. */
const ALT_SCHLUESSEL = ['mix9m', 'mxfd9m', 'mxms9m', 'mxNoAlc9', 'mxcats9m', 'mxcatsneu9m', 'mxcatsaus9m', 'mxcatord9m', 'mxlang9m', 'mxknoten9m'];
export async function alteAppLesen(dbName = 'MeinMxBackup1') {
  const ls = {};
  try { for (const k of ALT_SCHLUESSEL) { const v = localStorage.getItem(k); if (v != null) ls[k] = v; } } catch (e) { /* gesperrt: dann eben nichts */ }
  let kv = [];
  try {
    /* Die alte Datenbank darf beim Nachsehen NICHT entstehen: gibt es sie nicht, bricht das Anlegen ab. */
    kv = await new Promise((ja) => {
      const a = indexedDB.open(dbName);
      let neu = false;
      a.onupgradeneeded = () => { neu = true; a.transaction.abort(); };
      a.onerror = () => ja([]);
      a.onsuccess = () => {
        const db = a.result;
        if (neu || !db.objectStoreNames.contains('kv')) { db.close(); return ja([]); }
        const q = db.transaction('kv').objectStore('kv').getAll();
        q.onsuccess = () => { db.close(); ja((q.result || []).filter(z => z && z.k != null && !/key|secret|token|passw/i.test(String(z.k)))); };
        q.onerror = () => { db.close(); ja([]); };
      };
    });
  } catch (e) { kv = []; }
  return { localStorage: ls, indexedDB: { kv } };
}
