import { Platform } from 'react-native';
import { supabase } from '../supabaseClient';

// ──────────────────────────────────────────────────────────────────────────────
// SYSTEM SYNC  — localStorage-first, Supabase as async backup
//
// Why localStorage-first?
//   The admin is a mock user (admin-id-0000) with no real Supabase session.
//   Supabase RLS blocks writes without auth, so saveModerators() was silently
//   failing and data was lost on every reload.
//
// Strategy:
//   READ  → localStorage first, fall back to Supabase if localStorage is empty
//   WRITE → always write localStorage immediately + attempt Supabase in background
// ──────────────────────────────────────────────────────────────────────────────

const LS_KEYS = {
  moderators: '__sys_moderators__',
  requests:   '__sys_requests__',
  users:      '__sys_users__',
};

// ── localStorage helpers ──────────────────────────────────────────────────────
function lsGet(key, defaultValue = []) {
  if (Platform.OS !== 'web') return defaultValue;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function lsSet(key, value) {
  if (Platform.OS !== 'web') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn('localStorage write failed:', e);
  }
}

// ── Supabase helpers (best-effort, never throw) ───────────────────────────────
async function sbRead(title, defaultData = []) {
  try {
    const { data, error } = await supabase
      .from('propiedades')
      .select('descripcion')
      .eq('titulo', title)
      .limit(1);
    if (error || !data?.length) return null;
    return JSON.parse(data[0].descripcion);
  } catch {
    return null;
  }
}

async function sbWrite(title, payload) {
  try {
    const { data } = await supabase
      .from('propiedades')
      .select('id')
      .eq('titulo', title)
      .limit(1);

    const serialized = JSON.stringify(payload);

    if (data?.length) {
      await supabase
        .from('propiedades')
        .update({ descripcion: serialized })
        .eq('id', data[0].id);
    } else {
      await supabase.from('propiedades').insert({
        titulo: title,
        descripcion: serialized,
        precio: 0, recamaras: 0, banos: 0, m2: 0, cocheras: 0,
        tipo: 'Venta', ubicacion: 'System Settings',
        lat: '0', lng: '0', imagenes: [],
      });
    }
  } catch {
    // Silently ignore — localStorage already has the data
  }
}

// ── Generic read: localStorage → Supabase fallback ───────────────────────────
async function readSystem(lsKey, sbTitle, defaultData = []) {
  const cached = lsGet(lsKey, null);
  if (cached !== null) return cached;

  // Cache miss → try Supabase, then populate localStorage
  const fromSb = await sbRead(sbTitle, defaultData);
  const result = fromSb ?? defaultData;
  lsSet(lsKey, result);
  return result;
}

// ── Generic write: localStorage immediately + Supabase in background ──────────
async function writeSystem(lsKey, sbTitle, payload) {
  lsSet(lsKey, payload);
  // Fire-and-forget Supabase sync (don't await — never blocks UI)
  sbWrite(sbTitle, payload).catch(() => {});
}

// ── Moderators ────────────────────────────────────────────────────────────────
export async function fetchModerators() {
  return readSystem(LS_KEYS.moderators, '__system_moderators__', []);
}

export async function saveModerators(moderatorIds) {
  await writeSystem(LS_KEYS.moderators, '__system_moderators__', moderatorIds);
}

// ── Requests ──────────────────────────────────────────────────────────────────
export async function fetchRequests() {
  return readSystem(LS_KEYS.requests, '__system_requests__', []);
}

export async function saveRequests(requests) {
  await writeSystem(LS_KEYS.requests, '__system_requests__', requests);
}

export async function submitRequest(req) {
  const list = await fetchRequests();
  await saveRequests([req, ...list]);
}

export async function updateRequestStatus(reqId, status) {
  const list = await fetchRequests();
  await saveRequests(list.map(r => r.id === reqId ? { ...r, status } : r));
}

// ── User Registry ─────────────────────────────────────────────────────────────
export async function fetchUsers() {
  return readSystem(LS_KEYS.users, '__system_users__', []);
}

export async function saveUsers(users) {
  await writeSystem(LS_KEYS.users, '__system_users__', users);
}

export async function upsertUser(userRecord) {
  const list = await fetchUsers();
  const idx = list.findIndex(u => u.id === userRecord.id);
  const newList = idx >= 0
    ? list.map((u, i) => i === idx ? { ...u, ...userRecord } : u)
    : [userRecord, ...list];
  await saveUsers(newList);
}

// ── Force sync FROM Supabase → localStorage (admin can call this manually) ────
// Useful for importing data from another device/browser into this session.
export async function forceSyncFromSupabase() {
  const [mods, reqs, users] = await Promise.all([
    sbRead('__system_moderators__', []),
    sbRead('__system_requests__',   []),
    sbRead('__system_users__',      []),
  ]);
  if (mods  !== null) lsSet(LS_KEYS.moderators, mods);
  if (reqs  !== null) lsSet(LS_KEYS.requests,   reqs);
  if (users !== null) lsSet(LS_KEYS.users,       users);
  return { mods: mods ?? [], reqs: reqs ?? [], users: users ?? [] };
}
