// UD-58 The phone's queue of changes made offline, in IndexedDB. Browser only.
// Each change gets its ID here, so the server can apply it exactly once however often it is sent.

export type OutboxOp = {
  opId: string;
  kind: "udhaar" | "cash";
  customerId: string;
  customerName?: string;
  amountPaise: number;
  dueDate?: string;
  note?: string;
  /** When it happened on the phone (ISO). The server keeps this time. */
  at: string;
};

const DB = "udhaar-offline";
const STORE = "ops";
const EVENT = "ud-outbox-change";

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: "opId" });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function run<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open();
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const req = fn(tx.objectStore(STORE));
    tx.oncomplete = () => resolve(req.result);
    tx.onerror = () => reject(tx.error);
  }).finally(() => db.close());
}

const changed = () => window.dispatchEvent(new Event(EVENT));

export async function enqueue(op: Omit<OutboxOp, "opId" | "at">): Promise<OutboxOp> {
  const full: OutboxOp = { ...op, opId: crypto.randomUUID(), at: new Date().toISOString() };
  await run("readwrite", (s) => s.put(full));
  changed();
  return full;
}

/** Oldest first, so the server applies changes in the order they happened. */
export async function pending(): Promise<OutboxOp[]> {
  const all = await run<OutboxOp[]>("readonly", (s) => s.getAll() as IDBRequest<OutboxOp[]>);
  return all.sort((a, b) => a.at.localeCompare(b.at));
}

export async function remove(opIds: string[]): Promise<void> {
  if (!opIds.length) return;
  const db = await open();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    for (const id of opIds) tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  }).finally(() => db.close());
  changed();
}

export function onOutboxChange(fn: () => void): () => void {
  window.addEventListener(EVENT, fn);
  return () => window.removeEventListener(EVENT, fn);
}

/** True when a save should go to the queue instead of the server. */
export const isOffline = () => typeof navigator !== "undefined" && navigator.onLine === false;

/** A fetch that failed for network reasons (not a server answer). */
export const isNetworkError = (err: unknown) => err instanceof TypeError || (err instanceof Error && /fetch|network|load failed/i.test(err.message));
