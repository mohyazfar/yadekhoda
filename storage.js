// ============================================
// storage.js - ذخیره‌سازی با IndexedDB (نسخه اصلاح‌شده)
// ============================================

const DB_NAME = 'ZekrDB';
const STORE_NAME = 'zekrStore';
const STORAGE_PREFIX = 'zekr_';
let db = null;
let dbPromise = null;

function openDB() {
    if (db) {
        return Promise.resolve(db);
    }

    if (dbPromise) {
        return dbPromise;
    }

    dbPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);

        request.onupgradeneeded = (event) => {
            const database = event.target.result;
            if (!database.objectStoreNames.contains(STORE_NAME)) {
                const store = database.createObjectStore(STORE_NAME, { keyPath: 'key' });
                store.createIndex('key', 'key', { unique: true });
            }
        };

        request.onsuccess = (event) => {
            db = event.target.result;
            dbPromise = null;
            resolve(db);
        };

        request.onerror = (event) => {
            dbPromise = null;
            reject(event.target.error);
        };
    });

    return dbPromise;
}

export async function initStorage() {
    try {
        await openDB();
        console.log('✅ IndexedDB مقداردهی شد');
        return true;
    } catch (error) {
        console.error('❌ خطا در مقداردهی IndexedDB:', error);
        return false;
    }
}

export async function getStorage(key, defaultValue = null) {
    try {
        const database = await openDB();
        const transaction = database.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(STORAGE_PREFIX + key);

        return new Promise((resolve) => {
            request.onsuccess = () => {
                const result = request.result;
                resolve(result ? result.value : defaultValue);
            };
            request.onerror = () => {
                resolve(defaultValue);
            };
        });
    } catch {
        try {
            const value = localStorage.getItem(STORAGE_PREFIX + key);
            return value === null ? defaultValue : JSON.parse(value);
        } catch {
            return defaultValue;
        }
    }
}

export async function setStorage(key, value) {
    try {
        const database = await openDB();
        const transaction = database.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put({ key: STORAGE_PREFIX + key, value: value });

        return new Promise((resolve) => {
            request.onsuccess = () => resolve(true);
            request.onerror = () => resolve(false);
        });
    } catch {
        try {
            localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
            return true;
        } catch {
            return false;
        }
    }
}

export async function removeStorage(key) {
    try {
        const database = await openDB();
        const transaction = database.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(STORAGE_PREFIX + key);

        return new Promise((resolve) => {
            request.onsuccess = () => resolve(true);
            request.onerror = () => resolve(false);
        });
    } catch {
        try {
            localStorage.removeItem(STORAGE_PREFIX + key);
            return true;
        } catch {
            return false;
        }
    }
}

export async function getAllKeys() {
    try {
        const database = await openDB();
        const transaction = database.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const keys = [];

        return new Promise((resolve) => {
            const request = store.openCursor();
            
            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    const key = cursor.key;
                    if (key.startsWith(STORAGE_PREFIX)) {
                        keys.push(key.replace(STORAGE_PREFIX, ''));
                    }
                    cursor.continue();
                } else {
                    resolve(keys);
                }
            };
            
            request.onerror = () => {
                resolve(keys);
            };
        });
    } catch {
        try {
            const keys = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(STORAGE_PREFIX)) {
                    keys.push(key.replace(STORAGE_PREFIX, ''));
                }
            }
            return keys;
        } catch {
            return [];
        }
    }
}

export async function getBackupData() {
    const backup = {};
    const keys = await getAllKeys();
    for (const key of keys) {
        backup[key] = await getStorage(key);
    }
    return backup;
}

export async function restoreBackup(data) {
    if (!data || typeof data !== 'object') return 0;
    let count = 0;
    for (const key of Object.keys(data)) {
        if (data[key] !== undefined && data[key] !== null) {
            await setStorage(key, data[key]);
            count++;
        }
    }
    return count;
}

export async function getStorageNumber(key, defaultValue = 0) {
    const value = await getStorage(key, defaultValue);
    return typeof value === 'number' ? value : defaultValue;
}

export async function getStorageBoolean(key, defaultValue = true) {
    const value = await getStorage(key, defaultValue);
    return typeof value === 'boolean' ? value : defaultValue;
}

export async function clearAllStorage() {
    const keys = await getAllKeys();
    let count = 0;
    for (const key of keys) {
        await removeStorage(key);
        count++;
    }
    return count;
}

export async function getAllItems() {
    try {
        const database = await openDB();
        const transaction = database.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const items = {};

        return new Promise((resolve) => {
            const request = store.openCursor();
            
            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    const key = cursor.key;
                    if (key.startsWith(STORAGE_PREFIX)) {
                        const cleanKey = key.replace(STORAGE_PREFIX, '');
                        items[cleanKey] = cursor.value.value;
                    }
                    cursor.continue();
                } else {
                    resolve(items);
                }
            };
            
            request.onerror = () => {
                resolve(items);
            };
        });
    } catch {
        try {
            const items = {};
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(STORAGE_PREFIX)) {
                    const cleanKey = key.replace(STORAGE_PREFIX, '');
                    try {
                        items[cleanKey] = JSON.parse(localStorage.getItem(key));
                    } catch {
                        items[cleanKey] = localStorage.getItem(key);
                    }
                }
            }
            return items;
        } catch {
            return {};
        }
    }
}

export function isStorageAvailable() {
    try {
        const test = '__storage_test__';
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
        return true;
    } catch {
        return false;
    }
}