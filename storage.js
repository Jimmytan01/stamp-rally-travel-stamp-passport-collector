/**
 * storage.js - LocalStorage interface for Stamp Rally
 */
const STORAGE_KEY = 'stamp_rally_passport_v1';

export function isStorageAvailable() {
  try {
    const testKey = '__sr_test__';
    window.localStorage.setItem(testKey, '1');
    window.localStorage.removeItem(testKey);
    return true;
  } catch (err) {
    return false;
  }
}

export function loadStamps() {
  if (!isStorageAvailable()) {
    return {
      success: false,
      data: [],
      error: 'Storage unavailable. Changes will not persist across sessions.'
    };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { success: true, data: [] };
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return { success: false, data: [], error: 'Passport data invalid. Initialized empty.' };
    }
    return { success: true, data: parsed };
  } catch (err) {
    return { success: false, data: [], error: 'Failed to read passport stamps.' };
  }
}

export function saveStamps(stamps) {
  if (!isStorageAvailable()) {
    return { success: false, error: 'Local storage unavailable. Changes not saved.' };
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stamps));
    return { success: true };
  } catch (err) {
    const isQuota = err && (err.name === 'QuotaExceededError' || err.code === 22 || err.code === 1014);
    return {
      success: false,
      error: isQuota
        ? 'Storage quota exceeded! Delete some stamps to free up room.'
        : 'Failed to save passport: ' + (err.message || 'Unknown error')
    };
  }
}
