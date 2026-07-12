const DB_NAME = "shared-notes-files";
const STORE_NAME = "files";
const DB_VERSION = 1;

export const LOCAL_FILE_PREFIX = "shared-notes-file:";

interface StoredFile {
  id: string;
  name: string;
  type: string;
  blob: Blob;
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveLocalFile(file: File): Promise<string> {
  const id = crypto.randomUUID();
  const db = await openDatabase();

  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).put({
      id,
      name: file.name,
      type: file.type,
      blob: file,
    } satisfies StoredFile);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });

  db.close();
  return `${LOCAL_FILE_PREFIX}${id}`;
}

export async function getLocalFile(url: string): Promise<StoredFile | null> {
  if (!url.startsWith(LOCAL_FILE_PREFIX)) return null;
  const id = url.slice(LOCAL_FILE_PREFIX.length);
  const db = await openDatabase();

  const file = await new Promise<StoredFile | null>((resolve, reject) => {
    const request = db
      .transaction(STORE_NAME, "readonly")
      .objectStore(STORE_NAME)
      .get(id);
    request.onsuccess = () => resolve((request.result as StoredFile) ?? null);
    request.onerror = () => reject(request.error);
  });

  db.close();
  return file;
}
