/**
 * state.js - State store and mutation actions
 */
export function deriveInitials(name) {
  if (!name) return 'SR';
  const w = name.trim().replace(/[^a-zA-Z0-9\s]/g, '').split(/\s+/).filter(Boolean);
  if (w.length >= 3) return (w[0][0] + w[1][0] + w[2][0]).toUpperCase();
  if (w.length === 2) return (w[0][0] + (w[1].length > 1 ? w[1].slice(0, 2) : w[1][0])).toUpperCase();
  return (w[0] ? w[0].slice(0, 3) : 'SR').toUpperCase();
}

export function generateRandomTilt() {
  const sign = Math.random() < 0.5 ? -1 : 1;
  return `${sign * (Math.random() * 5 + 1.5).toFixed(1)}deg`;
}

export function generateStampCode() {
  return `SR-${Math.floor(1000 + Math.random() * 9000)}`;
}

const state = { stamps: [], filter: 'all', storageError: null };
const listeners = new Set();

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notify() {
  const snapshot = getState();
  listeners.forEach((fn) => fn(snapshot));
}

export function getState() {
  return {
    stamps: [...state.stamps],
    filter: state.filter,
    storageError: state.storageError,
    stats: getStats()
  };
}

export function getStats() {
  let visited = 0, dream = 0;
  for (const s of state.stamps) {
    if (s.isDream) dream++; else visited++;
  }
  return { total: state.stamps.length, visited, dream };
}

export function initStamps(loaded) {
  state.stamps = Array.isArray(loaded) ? loaded : [];
  notify();
}

export function setStorageError(msg) {
  state.storageError = msg;
  notify();
}

export function addStamp({ place, date, color, memory, isDream }) {
  const newStamp = {
    id: 's_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
    code: generateStampCode(),
    place: place.trim(),
    initials: deriveInitials(place),
    date: date || (isDream ? '' : new Date().toISOString().split('T')[0]),
    color: color || 'blue',
    memory: (memory || '').trim(),
    isDream: Boolean(isDream),
    tilt: generateRandomTilt(),
    createdAt: Date.now()
  };
  state.stamps.unshift(newStamp);
  notify();
  return newStamp;
}

export function deleteStamp(id) {
  const idx = state.stamps.findIndex((s) => s.id === id);
  if (idx !== -1) {
    state.stamps.splice(idx, 1);
    notify();
    return true;
  }
  return false;
}

export function toggleStampStatus(id) {
  const s = state.stamps.find((item) => item.id === id);
  if (s) {
    s.isDream = !s.isDream;
    if (!s.isDream && !s.date) s.date = new Date().toISOString().split('T')[0];
    notify();
    return s;
  }
  return null;
}

export function setFilter(filter) {
  if (['all', 'visited', 'dream'].includes(filter)) {
    state.filter = filter;
    notify();
  }
}
