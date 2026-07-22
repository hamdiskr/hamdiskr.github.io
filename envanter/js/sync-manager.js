// ===== Sync Manager (Online/Offline) =====
class SyncManager {
    constructor() {
        this.isOnline = navigator.onLine;
        this.syncInProgress = false;
        this.apiUrl = localStorage.getItem('apiUrl') || '';
        this.autoSync = true;
        this.listeners = [];

        // Network event listeners
        window.addEventListener('online', () => this.handleOnline());
        window.addEventListener('offline', () => this.handleOffline());
    }

    handleOnline() {
        this.isOnline = true;
        this.updateUI();
        showToast('Internet baglantisi saglandi!', 'success');

        if (this.autoSync) {
            this.sync().catch(console.error);
        }
    }

    handleOffline() {
        this.isOnline = false;
        this.updateUI();
        showToast('Cevrimdisi moda gecildi. Veriler yerel olarak kaydediliyor.', 'warning');
    }

    updateUI() {
        const indicator = document.getElementById('offline-indicator');
        if (indicator) {
            if (this.isOnline) {
                indicator.classList.add('hidden');
            } else {
                indicator.classList.remove('hidden');
            }
        }
    }

    async sync() {
        if (!this.isOnline || this.syncInProgress) return;
        this.syncInProgress = true;

        const statusEl = document.getElementById('sync-status');
        if (statusEl) statusEl.classList.remove('hidden');

        try {
            // 1. Bekleyen verileri al
            const pendingItems = await db.getPendingSyncItems();

            if (pendingItems.length === 0) {
                showToast('Senkronize edilecek veri yok.', 'info');
                return;
            }

            // 2. Sunucuya gonder (simulasyon)
            // Gercek API entegrasyonu burada yapilir
            for (const item of pendingItems) {
                await this.sendToServer(item);
            }

            // 3. Sunucudan veri cek (simulasyon)
            await this.fetchFromServer();

            // 4. Sync queue'yu temizle
            await db.clearSyncQueue();

            // 5. Urun syncStatus'lerini guncelle
            await this.markAsSynced();

            showToast(`${pendingItems.length} veri basariyla senkronize edildi!`, 'success');
            this.notifyListeners('synced');

        } catch (error) {
            console.error('Senkronizasyon hatasi:', error);
            showToast('Senkronizasyon basarisiz. Tekrar denenecek.', 'error');
        } finally {
            this.syncInProgress = false;
            if (statusEl) statusEl.classList.add('hidden');
        }
    }

    async sendToServer(item) {
        // Gercek API cagrisi
        // const response = await fetch(`${this.apiUrl}/api/products`, {
        //     method: item.operation === 'delete' ? 'DELETE' : 'POST',
        //     headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        //     body: JSON.stringify(item.data)
        // });

        // Simulasyon
        await new Promise(resolve => setTimeout(resolve, 100));
        console.log('Sunucuya gonderildi:', item);
    }

    async fetchFromServer() {
        // Gercek API cagrisi
        // const response = await fetch(`${this.apiUrl}/api/products`, {
        //     headers: { 'Authorization': `Bearer ${token}` }
        // });
        // const serverProducts = await response.json();

        // Simulasyon
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    async markAsSynced() {
        const products = await db.getAllProducts();
        for (const product of products) {
            if (product.syncStatus === 'pending') {
                await db.updateProduct(product.id, { syncStatus: 'synced' });
            }
        }
    }

    async queueOperation(operation, data) {
        await db.addToSyncQueue({
            operation,
            data,
            timestamp: new Date().toISOString()
        });
    }

    getStats() {
        return {
            isOnline: this.isOnline,
            syncInProgress: this.syncInProgress,
            autoSync: this.autoSync
        };
    }

    onStatusChange(callback) {
        this.listeners.push(callback);
    }

    notifyListeners(event) {
        this.listeners.forEach(cb => cb(event, this.getStats()));
    }
}

// Global instance
const syncManager = new SyncManager();
