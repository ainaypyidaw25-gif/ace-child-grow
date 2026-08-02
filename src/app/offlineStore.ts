import type { OfflineRecord } from '../domain/offline/offlineLibrary';

// Device storage for downloaded educational content.
//
// IndexedDB rather than localStorage: the library is a few megabytes of
// structured records, well past localStorage's ~5 MB string budget, and reads
// must not block the UI thread.
//
// Every entry point resolves rather than throws. Private browsing, a full disk
// and locked-down Android WebViews all reject IndexedDB, and offline downloads
// are a convenience — never a reason for the app to fail to render.

const DB_NAME = 'ace-offline-library';
const DB_VERSION = 1;
const STORE = 'content';

export function isOfflineStorageAvailable(): boolean {
  try {
    return typeof indexedDB !== 'undefined' && indexedDB !== null;
  } catch {
    return false;
  }
}

function openDb(): Promise<IDBDatabase | null> {
  if (!isOfflineStorageAvailable()) return Promise.resolve(null);
  return new Promise((resolve) => {
    let request: IDBOpenDBRequest;
    try {
      request = indexedDB.open(DB_NAME, DB_VERSION);
    } catch {
      resolve(null);
      return;
    }
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'slug' });
        store.createIndex('by_type', 'type', { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
    request.onblocked = () => resolve(null);
  });
}

function finish(tx: IDBTransaction): Promise<boolean> {
  return new Promise((resolve) => {
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => resolve(false);
    tx.onabort = () => resolve(false);
  });
}

/** Write records and drop the ones no longer published, in one transaction. */
export async function saveRecords(put: OfflineRecord[], remove: string[] = []): Promise<boolean> {
  const db = await openDb();
  if (!db) return false;
  try {
    const tx = db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    for (const record of put) store.put(record);
    for (const slug of remove) store.delete(slug);
    const ok = await finish(tx);
    db.close();
    return ok;
  } catch {
    db.close();
    return false;
  }
}

export async function readAllRecords(): Promise<OfflineRecord[]> {
  const db = await openDb();
  if (!db) return [];
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE, 'readonly');
      const request = tx.objectStore(STORE).getAll();
      request.onsuccess = () => {
        resolve((request.result as OfflineRecord[]) ?? []);
        db.close();
      };
      request.onerror = () => {
        resolve([]);
        db.close();
      };
    } catch {
      resolve([]);
      db.close();
    }
  });
}

export async function clearRecords(): Promise<boolean> {
  const db = await openDb();
  if (!db) return false;
  try {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).clear();
    const ok = await finish(tx);
    db.close();
    return ok;
  } catch {
    db.close();
    return false;
  }
}
