import { readFile, writeFile, rename, unlink } from 'fs/promises';

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

async function safeReadJson(path) {
  try {
    const raw = await readFile(path, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

async function atomicWriteJson(path, obj) {
  const tmp = `${path}.tmp`;
  const bak = `${path}.bak`;
  await writeFile(tmp, JSON.stringify(obj, null, 2), 'utf8');
  try {
    // Windows rename cannot overwrite existing files reliably.
    await rename(path, bak);
  } catch {
    // ignore if no existing file
  }
  await rename(tmp, path);
  try {
    await unlink(bak);
  } catch {
    // ignore
  }
}

let lock = Promise.resolve();
async function withLock(fn) {
   let release;
   const next = new Promise(r => { release = r; });
   const previous = lock;
   lock = next;
   
   await previous;
   try {
     return await fn();
   } finally {
     release();
   }
}

async function loadStateInternal(statePath) {
  const state = (await safeReadJson(statePath)) || {};
  state.meta ||= {};
  state.contacts ||= {};
  state.daily ||= { date: '', sentCount: 0 };

  if (!state.meta.createdAt) state.meta.createdAt = new Date().toISOString();
  state.meta.updatedAt = new Date().toISOString();

  // reset daily counter if day changed
  const t = todayISO();
  if (state.daily.date !== t) {
    state.daily.date = t;
    state.daily.sentCount = 0;
  }

  await atomicWriteJson(statePath, state);
  return state;
}

export async function loadState(statePath) {
  return withLock(() => loadStateInternal(statePath));
}

export async function syncContactsIntoState(statePath, contacts) {
  return withLock(async () => {
    const state = await loadStateInternal(statePath);
    for (const c of contacts) {
      if (!state.contacts[c.id]) {
        state.contacts[c.id] = {
          ...c,
          sent: false,
          replied: false,
          conversation: [],
          leadScore: null,
          leadReason: null,
          forwarded: false,
          lastInboundAt: null,
          lastOutboundAt: null
        };
      } else {
        // keep dynamic fields, update static fields from CSV (name/intent etc.)
        state.contacts[c.id] = {
          ...state.contacts[c.id],
          ...c
        };
      }
    }
    state.meta.updatedAt = new Date().toISOString();
    await atomicWriteJson(statePath, state);
    return state;
  });
}

export async function getState(statePath) {
  return withLock(() => loadStateInternal(statePath));
}

export async function updateContact(statePath, contactId, updater) {
  return withLock(async () => {
    const state = await loadStateInternal(statePath);
    const c = state.contacts[contactId];
    if (!c) return null;
    const updated = updater({ ...c });
    state.contacts[contactId] = updated;
    state.meta.updatedAt = new Date().toISOString();
    await atomicWriteJson(statePath, state);
    return updated;
  });
}

export async function incrementDailySent(statePath) {
  return withLock(async () => {
    const state = await loadStateInternal(statePath);
    state.daily.sentCount = Number(state.daily.sentCount || 0) + 1;
    state.meta.updatedAt = new Date().toISOString();
    await atomicWriteJson(statePath, state);
    return state.daily.sentCount;
  });
}
