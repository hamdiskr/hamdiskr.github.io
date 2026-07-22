// ===== IndexedDB Database Manager =====
const DB_NAME = 'EnvanterDB';
const DB_VERSION = 1;

class Database {
    constructor() {
        this.db = null;
        this.init();
    }

    init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Products store
                if (!db.objectStoreNames.contains('products')) {
                    const productStore = db.createObjectStore('products', { keyPath: 'id', autoIncrement: true });
                    productStore.createIndex('barcode', 'barcode', { unique: false });
                    productStore.createIndex('name', 'name', { unique: false });
                    productStore.createIndex('category', 'category', { unique: false });
                    productStore.createIndex('syncStatus', 'syncStatus', { unique: false });
                }

                // Activity log store
                if (!db.objectStoreNames.contains('activityLog')) {
                    const activityStore = db.createObjectStore('activityLog', { keyPath: 'id', autoIncrement: true });
                    activityStore.createIndex('timestamp', 'timestamp', { unique: false });
                    activityStore.createIndex('productId', 'productId', { unique: false });
                }

                // Settings store
                if (!db.objectStoreNames.contains('settings')) {
                    db.createObjectStore('settings', { keyPath: 'key' });
                }

                // Sync queue store
                if (!db.objectStoreNames.contains('syncQueue')) {
                    const queueStore = db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
                    queueStore.createIndex('timestamp', 'timestamp', { unique: false });
                    queueStore.createIndex('status', 'status', { unique: false });
                }
            };
        });
    }

    // ===== Products =====
    async addProduct(product) {
        const db = await this.init();
        return new Promise((resolve, reject) => {
            const tx = db.transaction('products', 'readwrite');
            const store = tx.objectStore('products');

            const data = {
                ...product,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                syncStatus: navigator.onLine ? 'synced' : 'pending'
            };

            const request = store.add(data);
            request.onsuccess = () => {
                const id = request.result;
                this.logActivity('create', id, product.name);
                resolve(id);
            };
            request.onerror = () => reject(request.error);
        });
    }

    async updateProduct(id, updates) {
        const db = await this.init();
        return new Promise((resolve, reject) => {
            const tx = db.transaction('products', 'readwrite');
            const store = tx.objectStore('products');

            const getReq = store.get(id);
            getReq.onsuccess = () => {
                const product = getReq.result;
                if (!product) {
                    reject(new Error('Ürün bulunamadı'));
                    return;
                }

                const updated = {
                    ...product,
                    ...updates,
                    updatedAt: new Date().toISOString(),
                    syncStatus: navigator.onLine ? 'synced' : 'pending'
                };

                const putReq = store.put(updated);
                putReq.onsuccess = () => {
                    this.logActivity('update', id, product.name);
                    resolve(updated);
                };
                putReq.onerror = () => reject(putReq.error);
            };
            getReq.onerror = () => reject(getReq.error);
        });
    }

    async deleteProduct(id) {
        const db = await this.init();
        return new Promise((resolve, reject) => {
            const tx = db.transaction('products', 'readwrite');
            const store = tx.objectStore('products');

            const getReq = store.get(id);
            getReq.onsuccess = () => {
                const product = getReq.result;
                const delReq = store.delete(id);
                delReq.onsuccess = () => {
                    this.logActivity('delete', id, product?.name || 'Bilinmeyen');
                    resolve();
                };
                delReq.onerror = () => reject(delReq.error);
            };
        });
    }

    async getProduct(id) {
        const db = await this.init();
        return new Promise((resolve, reject) => {
            const tx = db.transaction('products', 'readonly');
            const store = tx.objectStore('products');
            const request = store.get(id);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getProductByBarcode(barcode) {
        const db = await this.init();
        return new Promise((resolve, reject) => {
            const tx = db.transaction('products', 'readonly');
            const store = tx.objectStore('products');
            const index = store.index('barcode');
            const request = index.get(barcode);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getAllProducts() {
        const db = await this.init();
        return new Promise((resolve, reject) => {
            const tx = db.transaction('products', 'readonly');
            const store = tx.objectStore('products');
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async searchProducts(query) {
        const products = await this.getAllProducts();
        const lowerQuery = query.toLowerCase();
        return products.filter(p =>
            p.barcode?.toLowerCase().includes(lowerQuery) ||
            p.name?.toLowerCase().includes(lowerQuery) ||
            p.category?.toLowerCase().includes(lowerQuery) ||
            p.location?.toLowerCase().includes(lowerQuery)
        );
    }

    // ===== Activity Log =====
    async logActivity(action, productId, productName) {
        const db = await this.init();
        return new Promise((resolve, reject) => {
            const tx = db.transaction('activityLog', 'readwrite');
            const store = tx.objectStore('activityLog');

            const activity = {
                action,
                productId,
                productName,
                timestamp: new Date().toISOString(),
                user: localStorage.getItem('username') || 'Anonim'
            };

            const request = store.add(activity);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getRecentActivity(limit = 20) {
        const db = await this.init();
        return new Promise((resolve, reject) => {
            const tx = db.transaction('activityLog', 'readonly');
            const store = tx.objectStore('activityLog');
            const index = store.index('timestamp');
            const request = index.openCursor(null, 'prev');
            const activities = [];

            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor && activities.length < limit) {
                    activities.push(cursor.value);
                    cursor.continue();
                } else {
                    resolve(activities);
                }
            };
            request.onerror = () => reject(request.error);
        });
    }

    // ===== Settings =====
    async getSetting(key) {
        const db = await this.init();
        return new Promise((resolve, reject) => {
            const tx = db.transaction('settings', 'readonly');
            const store = tx.objectStore('settings');
            const request = store.get(key);
            request.onsuccess = () => resolve(request.result?.value);
            request.onerror = () => reject(request.error);
        });
    }

    async setSetting(key, value) {
        const db = await this.init();
        return new Promise((resolve, reject) => {
            const tx = db.transaction('settings', 'readwrite');
            const store = tx.objectStore('settings');
            const request = store.put({ key, value });
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    // ===== Sync Queue =====
    async addToSyncQueue(operation) {
        const db = await this.init();
        return new Promise((resolve, reject) => {
            const tx = db.transaction('syncQueue', 'readwrite');
            const store = tx.objectStore('syncQueue');
            const request = store.add({
                ...operation,
                timestamp: new Date().toISOString(),
                status: 'pending'
            });
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getPendingSyncItems() {
        const db = await this.init();
        return new Promise((resolve, reject) => {
            const tx = db.transaction('syncQueue', 'readonly');
            const store = tx.objectStore('syncQueue');
            const index = store.index('status');
            const request = index.getAll('pending');
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async clearSyncQueue() {
        const db = await this.init();
        return new Promise((resolve, reject) => {
            const tx = db.transaction('syncQueue', 'readwrite');
            const store = tx.objectStore('syncQueue');
            const request = store.clear();
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    // ===== Export/Import =====
    async exportAllData() {
        const products = await this.getAllProducts();
        const activities = await this.getRecentActivity(1000);
        return { products, activities, exportDate: new Date().toISOString() };
    }

    async importData(data) {
        const db = await this.init();
        return new Promise((resolve, reject) => {
            const tx = db.transaction('products', 'readwrite');
            const store = tx.objectStore('products');

            let count = 0;
            const products = data.products || [];

            products.forEach(product => {
                const { id, ...productData } = product;
                const request = store.add({
                    ...productData,
                    syncStatus: 'pending',
                    importedAt: new Date().toISOString()
                });
                request.onsuccess = () => { count++; };
            });

            tx.oncomplete = () => resolve(count);
            tx.onerror = () => reject(tx.error);
        });
    }

    async clearAllData() {
        const db = await this.init();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(['products', 'activityLog', 'syncQueue'], 'readwrite');
            tx.objectStore('products').clear();
            tx.objectStore('activityLog').clear();
            tx.objectStore('syncQueue').clear();
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    }
}

// Global instance
const db = new Database();
