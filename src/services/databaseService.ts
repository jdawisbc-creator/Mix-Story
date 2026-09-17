/**
 * Camada de Abstração de Banco de Dados
 * Permite que componentes nunca acessem diretamente o banco.
 * Suporta Firestore e fallback persistente para desenvolvimento ágil.
 */

import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit as firestoreLimit,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import { StorageEngine } from './storageEngine';

export class DatabaseService {
  /**
   * Obtém todos os documentos de uma coleção
   */
  static async getCollection<T>(collectionName: string): Promise<T[]> {
    if (isFirebaseConfigured && db) {
      try {
        const colRef = collection(db, collectionName);
        const snapshot = await getDocs(colRef);
        const docs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as T));
        if (docs.length > 0) {
          // Espelha no IndexedDB e LocalStorage para contingência offline
          StorageEngine.setCollection(collectionName, docs);
          try {
            localStorage.setItem(`mix_db_${collectionName}`, JSON.stringify(docs));
          } catch {}
          return docs;
        }
      } catch (error) {
        console.error(`Erro ao buscar ${collectionName} no Firestore:`, error);
      }
    }

    // Camada de contingência 1: IndexedDB resiliente
    const idbData = await StorageEngine.getCollection<T>(collectionName);
    if (idbData && idbData.length > 0) {
      try {
        localStorage.setItem(`mix_db_${collectionName}`, JSON.stringify(idbData));
      } catch {}
      return idbData;
    }

    // Camada de contingência 2: LocalStorage
    const localData = localStorage.getItem(`mix_db_${collectionName}`);
    if (localData) {
      try {
        const parsed = JSON.parse(localData) as T[];
        if (parsed.length > 0) {
          StorageEngine.setCollection(collectionName, parsed);
        }
        return parsed;
      } catch {
        return [];
      }
    }
    return [];
  }

  /**
   * Obtém um documento específico por ID
   */
  static async getDocument<T>(collectionName: string, id: string): Promise<T | null> {
    if (isFirebaseConfigured && db) {
      try {
        const docRef = doc(db, collectionName, id);
        const snapshot = await getDoc(docRef);
        if (snapshot.exists()) {
          return { id: snapshot.id, ...snapshot.data() } as T;
        }
        return null;
      } catch (error) {
        console.error(`Erro ao buscar documento ${id} em ${collectionName}:`, error);
      }
    }

    const items = await this.getCollection<T & { id: string }>(collectionName);
    return items.find((item) => item.id === id) || null;
  }

  /**
   * Salva ou atualiza um documento
   */
  static async setDocument<T extends { id: string }>(
    collectionName: string,
    id: string,
    data: T
  ): Promise<void> {
    if (isFirebaseConfigured && db) {
      try {
        const docRef = doc(db, collectionName, id);
        await setDoc(docRef, data, { merge: true });
      } catch (error) {
        console.error(`Erro ao gravar ${id} em ${collectionName}:`, error);
      }
    }

    // Persistência local estruturada
    const items = await this.getCollection<T>(collectionName);
    const index = items.findIndex((item) => item.id === id);
    if (index >= 0) {
      items[index] = { ...items[index], ...data };
    } else {
      items.unshift(data);
    }

    // Persiste em ambas as camadas locais
    try {
      localStorage.setItem(`mix_db_${collectionName}`, JSON.stringify(items));
    } catch {}
    await StorageEngine.setCollection(collectionName, items);
  }

  /**
   * Remove um documento
   */
  static async deleteDocument(collectionName: string, id: string): Promise<void> {
    if (isFirebaseConfigured && db) {
      try {
        const docRef = doc(db, collectionName, id);
        await deleteDoc(docRef);
      } catch (error) {
        console.error(`Erro ao deletar ${id} em ${collectionName}:`, error);
      }
    }

    const items = await this.getCollection<{ id: string }>(collectionName);
    const filtered = items.filter((item) => item.id !== id);
    try {
      localStorage.setItem(`mix_db_${collectionName}`, JSON.stringify(filtered));
    } catch {}
    await StorageEngine.setCollection(collectionName, filtered);
  }

  /**
   * Grava uma coleção inteira (usado em restauração de backups)
   */
  static async setCollectionData<T extends { id: string }>(
    collectionName: string,
    items: T[]
  ): Promise<void> {
    if (isFirebaseConfigured && db) {
      try {
        for (const item of items) {
          const docRef = doc(db, collectionName, item.id);
          await setDoc(docRef, item, { merge: true });
        }
      } catch (error) {
        console.error(`Erro ao restaurar coleção ${collectionName} no Firestore:`, error);
      }
    }

    try {
      localStorage.setItem(`mix_db_${collectionName}`, JSON.stringify(items));
    } catch {}
    await StorageEngine.setCollection(collectionName, items);
  }
}
