/**
 * Motor de Armazenamento Seguro e Persistente
 * Mix Variedades Store
 * 
 * Implementa IndexedDB resiliente para que os dados da loja
 * NUNCA dependam apenas do localStorage volátil do navegador.
 */

const DB_NAME = 'MixVariedades_SecureDB';
const DB_VERSION = 1;
const STORE_NAME = 'collections';

let idbInstance: IDBDatabase | null = null;

async function getIDB(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return null;
  }
  if (idbInstance) {
    return idbInstance;
  }

  return new Promise((resolve) => {
    try {
      const req = window.indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
      req.onsuccess = () => {
        idbInstance = req.result;
        resolve(idbInstance);
      };
      req.onerror = () => {
        console.warn('Falha ao abrir IndexedDB, operando com redundância:', req.error);
        resolve(null);
      };
    } catch {
      resolve(null);
    }
  });
}

export class StorageEngine {
  /**
   * Salva uma coleção no IndexedDB resiliente
   */
  static async setCollection<T>(collectionName: string, items: T[]): Promise<void> {
    try {
      const db = await getIDB();
      if (!db) return;
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(items, collectionName);
    } catch (err) {
      console.warn(`Erro ao persistir no IndexedDB (${collectionName}):`, err);
    }
  }

  /**
   * Obtém uma coleção do IndexedDB
   */
  static async getCollection<T>(collectionName: string): Promise<T[] | null> {
    try {
      const db = await getIDB();
      if (!db) return null;
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(collectionName);
        req.onsuccess = () => {
          resolve((req.result as T[]) || null);
        };
        req.onerror = () => {
          resolve(null);
        };
      });
    } catch {
      return null;
    }
  }

  /**
   * Remove uma coleção inteira do IndexedDB
   */
  static async clearCollection(collectionName: string): Promise<void> {
    try {
      const db = await getIDB();
      if (!db) return;
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.delete(collectionName);
    } catch (err) {
      console.warn(`Erro ao limpar coleção IndexedDB (${collectionName}):`, err);
    }
  }
}
