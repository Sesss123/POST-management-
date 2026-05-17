import { openDB } from 'idb';
export const generateUuid = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

const DB_NAME = 'restoledger_offline_db';
const DB_VERSION = 1;
const STORE_DRAFTS = 'offline_drafts';
const STORE_CACHE = 'cached_menu';

const initDB = async () => {
    return openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
            if (!db.objectStoreNames.contains(STORE_DRAFTS)) {
                const draftStore = db.createObjectStore(STORE_DRAFTS, { keyPath: 'id', autoIncrement: true });
                draftStore.createIndex('status', 'status');
                draftStore.createIndex('shop_id', 'shop_id');
                draftStore.createIndex('created_at', 'created_at');
            }
            if (!db.objectStoreNames.contains(STORE_CACHE)) {
                db.createObjectStore(STORE_CACHE, { keyPath: 'shop_id' });
            }
        },
    });
};

export const saveOfflineDraft = async (draftData) => {
    const db = await initDB();
    const draft = {
        ...draftData,
        uuid: draftData.uuid || crypto.randomUUID(),
        idempotency_key: draftData.idempotency_key || `offline-${Date.now()}-${crypto.randomUUID()}`,
        status: 'pending_sync',
        created_at: new Date().toISOString(),
        synced_at: null,
        error_message: null
    };
    await db.add(STORE_DRAFTS, draft);
    return draft;
};

export const getPendingDrafts = async (shopId) => {
    const db = await initDB();
    const allDrafts = await db.getAllFromIndex(STORE_DRAFTS, 'shop_id', shopId);
    return allDrafts.filter(d => d.status === 'pending_sync' || d.status === 'failed' || d.status === 'conflict');
};

export const updateDraftStatus = async (id, status, error_message = null, invoice_id = null, conflict = null) => {
    const db = await initDB();
    const draft = await db.get(STORE_DRAFTS, id);
    if (draft) {
        draft.status = status;
        if (status === 'synced') {
            draft.synced_at = new Date().toISOString();
            draft.invoice_id = invoice_id;
        }
        draft.error_message = error_message;
        draft.conflict = conflict;
        await db.put(STORE_DRAFTS, draft);
    }
};

export const updateDraft = async (draft) => {
    const db = await initDB();
    await db.put(STORE_DRAFTS, draft);
};

export const deleteDraft = async (id) => {
    const db = await initDB();
    await db.delete(STORE_DRAFTS, id);
};

export const cacheMenuData = async (shopId, menuItems) => {
    const db = await initDB();
    await db.put(STORE_CACHE, {
        shop_id: shopId,
        items: menuItems,
        updated_at: new Date().toISOString()
    });
};

export const getCachedMenu = async (shopId) => {
    const db = await initDB();
    const cache = await db.get(STORE_CACHE, shopId);
    return cache ? cache.items : [];
};
