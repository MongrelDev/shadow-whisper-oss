const TRANSCRIPTION_DB = "shadow-whisper-transcription";
const PENDING_STORE = "pending";
const PENDING_TRANSCRIPTION_ID = "current";

export interface PendingTranscription {
  readonly id: typeof PENDING_TRANSCRIPTION_ID;
  readonly sessionId: string;
  readonly blob: Blob;
  readonly mimeType: string;
  readonly durationMs: number;
  readonly skillId?: string;
  readonly createdAt: number;
}

function openPendingTranscriptionDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(TRANSCRIPTION_DB, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(PENDING_STORE, { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("pending transcription db failed"));
  });
}

async function withPendingStore<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  const db = await openPendingTranscriptionDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PENDING_STORE, mode);
    let result: T | undefined;
    const request = run(tx.objectStore(PENDING_STORE));
    request.onsuccess = () => {
      result = request.result;
    };
    request.onerror = () =>
      reject(request.error ?? new Error("pending transcription request failed"));
    tx.oncomplete = () => {
      db.close();
      resolve(result as T);
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error ?? new Error("pending transcription transaction failed"));
    };
  });
}

export function savePendingTranscription(
  input: Omit<PendingTranscription, "id">
): Promise<IDBValidKey> {
  return withPendingStore("readwrite", (store) =>
    store.put({ id: PENDING_TRANSCRIPTION_ID, ...input } satisfies PendingTranscription)
  );
}

export function readPendingTranscription(): Promise<PendingTranscription | undefined> {
  return withPendingStore("readonly", (store) => store.get(PENDING_TRANSCRIPTION_ID)).then(
    (value) => value as PendingTranscription | undefined
  );
}

export function clearPendingTranscription(): Promise<undefined> {
  return withPendingStore("readwrite", (store) => store.delete(PENDING_TRANSCRIPTION_ID));
}
