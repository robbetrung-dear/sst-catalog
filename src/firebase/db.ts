import { db } from './config';
import { collection, doc, setDoc, getDoc, getDocs, onSnapshot, writeBatch, deleteDoc, query, limit } from 'firebase/firestore';
import { Product, CategoryMeta, InfoTrendItem, StoreProfile, SiteSettings, StockNotification } from '../types';
import { INITIAL_PRODUCTS, INITIAL_CATEGORIES, INITIAL_INFO_TRENDS, INITIAL_STORE_PROFILE, INITIAL_SITE_SETTINGS, INITIAL_NOTIFICATIONS } from '../data/initialData';
import { sanitizeProductData } from '../utils/csvHelper';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const message = error instanceof Error ? error.message : String(error);
  // Gracefully log offline notice without disrupting UI
  if (message.includes('offline') || message.includes('Could not reach Cloud Firestore backend')) {
    return;
  }
  const errInfo: FirestoreErrorInfo = {
    error: message,
    authInfo: {
      userId: null,
      email: null,
      emailVerified: null,
      isAnonymous: null,
      tenantId: null,
      providerInfo: []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
}

// References
const productsRef = collection(db, 'products');
const storeDataRef = collection(db, 'storeData');

// Safe doc ID helper
export const sanitizeDocId = (id: string | number): string => {
  const str = String(id || '').trim();
  const safe = str.replace(/[\/\\]+/g, '-').replace(/^[\.]+|[\.]+$/g, '');
  return safe || `prd_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
};

// Initial Setup Check & Auto-Healing
export const initializeFirebaseData = async () => {
  if (typeof window !== 'undefined' && sessionStorage.getItem('sst_firestore_init_done') === 'true') {
    return;
  }
  try {
    const profileDoc = await getDoc(doc(storeDataRef, 'storeProfile'));
    if (!profileDoc.exists()) {
      const batch = writeBatch(db);
      batch.set(doc(storeDataRef, 'storeProfile'), INITIAL_STORE_PROFILE);
      batch.set(doc(storeDataRef, 'siteSettings'), INITIAL_SITE_SETTINGS);
      batch.set(doc(storeDataRef, 'categories'), { items: INITIAL_CATEGORIES });
      batch.set(doc(storeDataRef, 'infoTrends'), { items: INITIAL_INFO_TRENDS });
      batch.set(doc(storeDataRef, 'notifications'), { items: INITIAL_NOTIFICATIONS });
      await batch.commit();
    } else {
      const profileData = profileDoc.data();
      if (profileData && (profileData.namaToko === 'TJS' || profileData.namaToko === 'TJS Catalog' || profileData.namaToko === 'SST')) {
        // Automatically ensure branding is SST Catalog
        const updatedProfile = {
          ...profileData,
          namaToko: 'SST Catalog',
          konteks: profileData.konteks ? profileData.konteks.replace(/TJS Catalog|TJS/g, 'SST Catalog') : INITIAL_STORE_PROFILE.konteks,
          waTemplate: profileData.waTemplate ? profileData.waTemplate.replace(/TJS Catalog|TJS/g, 'SST Catalog') : INITIAL_STORE_PROFILE.waTemplate,
        };
        await setDoc(doc(storeDataRef, 'storeProfile'), updatedProfile);

        const settingsDoc = await getDoc(doc(storeDataRef, 'siteSettings'));
        if (settingsDoc.exists()) {
          const settingsData = settingsDoc.data();
          if (settingsData.footerCopyright && (settingsData.footerCopyright.includes('TJS') || settingsData.footerCopyright.includes('TJS Catalog'))) {
            await setDoc(doc(storeDataRef, 'siteSettings'), {
              ...settingsData,
              footerCopyright: settingsData.footerCopyright.replace(/TJS Catalog|TJS/g, 'SST Catalog')
            });
          }
        }
      }
    }

    // Check if products collection is empty using limit(1) instead of fetching all documents
    const productsSnapshot = await getDocs(query(productsRef, limit(1)));
    if (productsSnapshot.empty) {
      console.log("Firestore products collection is empty. Populating default catalog...");
      const cleanProducts = INITIAL_PRODUCTS.map((p, idx) => sanitizeProductData(p, idx));
      for (let i = 0; i < cleanProducts.length; i += 400) {
        const batch = writeBatch(db);
        const chunk = cleanProducts.slice(i, i + 400);
        chunk.forEach(product => {
          const pDoc = doc(productsRef, sanitizeDocId(product.id));
          batch.set(pDoc, product);
        });
        await batch.commit();
      }
    }
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('sst_firestore_init_done', 'true');
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'initialization');
  }
};

// Listeners with explicit error callbacks
export const listenToProducts = (callback: (products: Product[]) => void) => {
  return onSnapshot(
    productsRef,
    (snapshot) => {
      const products = snapshot.docs.map(doc => doc.data() as Product);
      callback(products);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'products');
    }
  );
};

export const listenToStoreData = <T>(docId: string, callback: (data: T) => void, isArray = false) => {
  return onSnapshot(
    doc(storeDataRef, docId),
    (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        callback((isArray ? data.items : data) as T);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, `storeData/${docId}`);
    }
  );
};

// Mutations
export const saveProductToDb = async (product: Product) => {
  const clean = sanitizeProductData(product);
  const docId = sanitizeDocId(clean.id);
  await setDoc(doc(productsRef, docId), clean);
};

export const deleteProductFromDb = async (id: string | number) => {
  const docId = sanitizeDocId(id);
  await deleteDoc(doc(productsRef, docId));
};

export const saveProductsBatch = async (products: Product[], replace: boolean) => {
  if (!products || products.length === 0) {
    throw new Error('Tidak ada data produk yang valid untuk disimpan.');
  }

  // Pre-validate and sanitize all products
  const cleanProducts = products.map((p, idx) => sanitizeProductData(p, idx));

  // If replacing existing database
  if (replace) {
    const snapshot = await getDocs(productsRef);
    const existingDocs = snapshot.docs;
    
    // Chunked batch delete (max 400 per batch)
    for (let i = 0; i < existingDocs.length; i += 400) {
      const deleteBatch = writeBatch(db);
      const chunk = existingDocs.slice(i, i + 400);
      chunk.forEach(d => deleteBatch.delete(d.ref));
      await deleteBatch.commit();
    }
  }
  
  // Chunked batch write (max 400 per batch)
  for (let i = 0; i < cleanProducts.length; i += 400) {
    const writeBatchChunk = writeBatch(db);
    const chunk = cleanProducts.slice(i, i + 400);
    chunk.forEach(p => {
      const docId = sanitizeDocId(p.id);
      writeBatchChunk.set(doc(productsRef, docId), p);
    });
    await writeBatchChunk.commit();
  }
};

export const saveStoreDataToDb = async (docId: string, data: any, isArray = false) => {
  const payload = isArray ? { items: data } : data;
  await setDoc(doc(storeDataRef, docId), payload);
};

export const resetDbToDefault = async () => {
  const snapshot = await getDocs(productsRef);
  const existingDocs = snapshot.docs;
  for (let i = 0; i < existingDocs.length; i += 400) {
    const deleteBatch = writeBatch(db);
    const chunk = existingDocs.slice(i, i + 400);
    chunk.forEach(d => deleteBatch.delete(d.ref));
    await deleteBatch.commit();
  }

  const batch = writeBatch(db);
  batch.set(doc(storeDataRef, 'storeProfile'), INITIAL_STORE_PROFILE);
  batch.set(doc(storeDataRef, 'siteSettings'), INITIAL_SITE_SETTINGS);
  batch.set(doc(storeDataRef, 'categories'), { items: INITIAL_CATEGORIES });
  batch.set(doc(storeDataRef, 'infoTrends'), { items: INITIAL_INFO_TRENDS });
  batch.set(doc(storeDataRef, 'notifications'), { items: INITIAL_NOTIFICATIONS });
  await batch.commit();
  
  const cleanProducts = INITIAL_PRODUCTS.map((p, idx) => sanitizeProductData(p, idx));
  for (let i = 0; i < cleanProducts.length; i += 400) {
    const productBatch = writeBatch(db);
    const chunk = cleanProducts.slice(i, i + 400);
    chunk.forEach(product => {
      const pDoc = doc(productsRef, sanitizeDocId(product.id));
      productBatch.set(pDoc, product);
    });
    await productBatch.commit();
  }
};
