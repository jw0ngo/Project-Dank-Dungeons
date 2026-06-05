// ═══════════════════════════════════════════════════════════════
// §1  CONFIG & STORAGE
//     localStorage — survives browser sessions, no server needed
// ═══════════════════════════════════════════════════════════════
const STORE_PREFIX = 'dungeon-forge:map:';

// Persistent player identity — generated once, survives page reloads
// Used for hub presence AND multiplayer room identification
function getLocalId() {
  let id = localStorage.getItem('df_local_id');
  if (!id) {
    id = 'p_' + Math.random().toString(36).slice(2, 10) +
             Math.random().toString(36).slice(2, 10);
    localStorage.setItem('df_local_id', id);
  }
  return id;
}
// LOCAL_ID: persistent per-user identity (hub presence, character data)
const LOCAL_ID = getLocalId();
// SESSION_ID: unique per browser tab — used as the MP room player key.
// This prevents two tabs on the same machine sharing a localStorage ID
// from being treated as the same player in a room.
const SESSION_ID = 'p_' + Math.random().toString(36).slice(2, 10) +
                          Math.random().toString(36).slice(2, 10);

function storeList() {
  const keys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(STORE_PREFIX)) keys.push(k);
  }
  return keys;
}
function storeGet(id)      { try { return JSON.parse(localStorage.getItem(STORE_PREFIX + id)); } catch { return null; } }
function storeSet(id, val) { try { localStorage.setItem(STORE_PREFIX + id, JSON.stringify(val)); } catch(e) { alert('Storage full — try deleting some maps.'); } }
function storeDel(id)      { localStorage.removeItem(STORE_PREFIX + id); }
function getAllMaps() {
  return storeList()
    .map(k => storeGet(k.slice(STORE_PREFIX.length)))
    .filter(Boolean)
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

