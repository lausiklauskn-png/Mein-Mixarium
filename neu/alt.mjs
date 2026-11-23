// Mein Mixarium · Lesen der bisherigen App (nur lesen, nie ändern) und einmaliger Umzug aus dem ersten Vorab-Speicher.
// Der Speicher selbst kommt aus dem Küchen-Kern (kern/speicher/speicher.mjs); hier stehen nur die Schlüsselnamen des Mixariums.

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

/* Erste Vorab-Fassung (23.11.2026) schrieb in die Datenbank `MixariumNeu1`, Lade `kv`, Schlüssel `sammlung` und `einst`.
   Seit dem Umhängen auf den Kern liegt alles im Kern-Speicher. Dieser Leser holt den alten Stand einmal herüber;
   die alte Datenbank bleibt stehen (nichts wird gelöscht). Gibt es sie nicht, entsteht sie beim Nachsehen auch nicht. */
export async function vorabLesen(dbName = 'MixariumNeu1') {
  try {
    return await new Promise((ja) => {
      const a = indexedDB.open(dbName);
      let neu = false;
      a.onupgradeneeded = () => { neu = true; a.transaction.abort(); };
      a.onerror = () => ja(null);
      a.onsuccess = () => {
        const db = a.result;
        if (neu || !db.objectStoreNames.contains('kv')) { db.close(); return ja(null); }
        const l = db.transaction('kv').objectStore('kv'), s = l.get('sammlung'), e = l.get('einst');
        e.onsuccess = () => { db.close(); ja(s.result ? { sammlung: s.result, einst: e.result || null } : null); };
        e.onerror = () => { db.close(); ja(null); };
      };
    });
  } catch (e) { return null; }
}
