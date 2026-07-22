// ===== Bluetooth Barcode Scanner (Web Bluetooth API) =====
class BluetoothBarcodeScanner {
    constructor() {
        this.device = null;
        this.server = null;
        this.characteristic = null;
        this.isConnected = false;
        this.listeners = [];
        this.SERVICE_UUID = '0000ffe0-0000-1000-8000-00805f9b34fb'; // Genel SPP UUID
        this.CHARACTERISTIC_UUID = '0000ffe1-0000-1000-8000-00805f9b34fb';
    }

    async connect() {
        if (!navigator.bluetooth) {
            throw new Error('Tarayıcınız Web Bluetooth API\'sini desteklemiyor. Chrome veya Edge kullanın.');
        }

        try {
            // Cihaz seçimi
            this.device = await navigator.bluetooth.requestDevice({
                acceptAllDevices: true,
                optionalServices: [this.SERVICE_UUID, 'battery_service']
            });

            // Bağlantı durumunu izle
            this.device.addEventListener('gattserverdisconnected', this.handleDisconnect.bind(this));

            // GATT sunucusuna bağlan
            this.server = await this.device.gatt.connect();

            // Servisi bul
            const service = await this.server.getPrimaryService(this.SERVICE_UUID);

            // Karakteristiği bul
            this.characteristic = await service.getCharacteristic(this.CHARACTERISTIC_UUID);

            // Bildirimleri başlat
            await this.characteristic.startNotifications();
            this.characteristic.addEventListener('characteristicvaluechanged', this.handleData.bind(this));

            this.isConnected = true;
            this.updateStatus('connected');
            showToast('Bluetooth barkod okuyucu bağlandı!', 'success');

            return true;
        } catch (error) {
            console.error('Bluetooth bağlantı hatası:', error);
            this.updateStatus('error');
            throw error;
        }
    }

    handleData(event) {
        const value = event.target.value;
        // Uint8Array olarak gelen veriyi string'e çevir
        let barcode = '';
        for (let i = 0; i < value.byteLength; i++) {
            barcode += String.fromCharCode(value.getUint8(i));
        }

        barcode = barcode.trim();
        if (barcode.length > 0) {
            console.log('Bluetooth Barkod okundu:', barcode);
            this.playBeep();

            this.listeners.forEach(callback => {
                try {
                    callback(barcode);
                } catch (e) {
                    console.error('Bluetooth callback hatası:', e);
                }
            });

            // Form alanını güncelle
            this.updateBarcodeField(barcode);
        }
    }

    updateBarcodeField(barcode) {
        const barcodeInput = document.getElementById('product-barcode');
        if (barcodeInput) {
            barcodeInput.value = barcode;
        }

        // Ürün bilgilerini getir
        db.getProductByBarcode(barcode).then(product => {
            if (product) {
                document.getElementById('product-name').value = product.name || '';
                document.getElementById('product-category').value = product.category || '';
                document.getElementById('product-quantity').value = product.quantity || '';
                document.getElementById('product-location').value = product.location || '';
                showToast('Ürün bulundu! Bilgiler yüklendi.', 'success');
            } else {
                showToast('Yeni ürün. Lütfen bilgileri girin.', 'info');
            }
        });
    }

    handleDisconnect() {
        console.log('Bluetooth cihazı bağlantısı kesildi');
        this.isConnected = false;
        this.device = null;
        this.server = null;
        this.characteristic = null;
        this.updateStatus('disconnected');
        showToast('Bluetooth bağlantısı kesildi', 'warning');
    }

    async disconnect() {
        if (this.device && this.device.gatt.connected) {
            await this.device.gatt.disconnect();
        }
        this.handleDisconnect();
    }

    updateStatus(status) {
        const statusEl = document.getElementById('bluetooth-status');
        if (!statusEl) return;

        const statuses = {
            connected: { text: 'Bağlı', class: 'online', icon: 'fa-check-circle' },
            disconnected: { text: 'Bağlı Değil', class: 'offline', icon: 'fa-circle' },
            error: { text: 'Hata', class: 'offline', icon: 'fa-exclamation-circle' },
            connecting: { text: 'Bağlanıyor...', class: '', icon: 'fa-spinner fa-spin' }
        };

        const s = statuses[status] || statuses.disconnected;
        statusEl.innerHTML = `<i class="fas ${s.icon}"></i> ${s.text}`;
        statusEl.className = `status-badge ${s.class}`;
    }

    onScan(callback) {
        if (typeof callback === 'function') {
            this.listeners.push(callback);
        }
    }

    playBeep() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            oscillator.frequency.value = 1500;
            oscillator.type = 'sine';
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.15);
        } catch (e) {}
    }
}

// Global instance
const bluetoothScanner = new BluetoothBarcodeScanner();
