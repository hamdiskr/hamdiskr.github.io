// ===== USB Barcode Scanner (HID Keyboard Mode) =====
class USBBarcodeScanner {
    constructor() {
        this.buffer = '';
        this.lastKeyTime = 0;
        this.timeout = 50; // ms - barkod karakterleri arası max süre
        this.minLength = 4; // minimum barkod uzunluğu
        this.listeners = [];
        this.isListening = false;
        this.scanStartTime = 0;
    }

    startListening() {
        if (this.isListening) return;
        this.isListening = true;

        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        console.log('USB Barkod Okuyucu dinleyicisi başlatıldı');
    }

    stopListening() {
        if (!this.isListening) return;
        this.isListening = false;
        document.removeEventListener('keydown', this.handleKeyDown.bind(this));
        console.log('USB Barkod Okuyucu dinleyicisi durduruldu');
    }

    handleKeyDown(event) {
        const now = Date.now();
        const timeDiff = now - this.lastKeyTime;

        // Eğer çok uzun süre geçtiyse ve buffer doluysa sıfırla
        if (timeDiff > this.timeout && this.buffer.length > 0) {
            this.buffer = '';
        }

        this.lastKeyTime = now;

        // Enter tuşu = barkod sonlandırıcı
        if (event.key === 'Enter') {
            if (this.buffer.length >= this.minLength) {
                const barcode = this.buffer.trim();
                console.log('USB Barkod okundu:', barcode);

                // Ses bildirimi
                this.playBeep();

                // Callback'leri çağır
                this.listeners.forEach(callback => {
                    try {
                        callback(barcode);
                    } catch (e) {
                        console.error('Barkod callback hatası:', e);
                    }
                });

                // Form alanını güncelle
                this.updateBarcodeField(barcode);
            }
            this.buffer = '';
            event.preventDefault();
            event.stopPropagation();
            return;
        }

        // Sadece printable karakterleri al (barkod okuyucu)
        // Ctrl, Alt, Meta kombinasyonlarını ignore et
        if (event.key.length === 1 && !event.ctrlKey && !event.altKey && !event.metaKey) {
            // Sayısal ve alfanümerik karakterler
            if (/^[a-zA-Z0-9\-_\.\s]$/.test(event.key)) {
                this.buffer += event.key;
            }
        }
    }

    updateBarcodeField(barcode) {
        // Ürün ekleme sayfasındaki barkod alanını güncelle
        const barcodeInput = document.getElementById('product-barcode');
        const usbDisplay = document.getElementById('usb-barcode-display');

        if (barcodeInput) {
            barcodeInput.value = barcode;
            // Otomatik olarak ürün bilgilerini getir
            this.fetchProductByBarcode(barcode);
        }

        if (usbDisplay) {
            usbDisplay.value = barcode;
            usbDisplay.classList.add('highlight');
            setTimeout(() => usbDisplay.classList.remove('highlight'), 500);
        }
    }

    async fetchProductByBarcode(barcode) {
        try {
            const product = await db.getProductByBarcode(barcode);
            if (product) {
                // Ürün bulundu, formu doldur
                document.getElementById('product-name').value = product.name || '';
                document.getElementById('product-category').value = product.category || '';
                document.getElementById('product-quantity').value = product.quantity || '';
                document.getElementById('product-location').value = product.location || '';
                document.getElementById('product-description').value = product.description || '';
                document.getElementById('product-min-stock').value = product.minStock || '';
                document.getElementById('product-id').value = product.id || '';

                showToast('Ürün bulundu! Bilgiler yüklendi.', 'success');
            } else {
                // Yeni ürün - sadece barkodu doldur
                showToast('Yeni ürün. Lütfen bilgileri girin.', 'info');
            }
        } catch (error) {
            console.error('Ürün arama hatası:', error);
        }
    }

    onScan(callback) {
        if (typeof callback === 'function') {
            this.listeners.push(callback);
        }
    }

    offScan(callback) {
        this.listeners = this.listeners.filter(cb => cb !== callback);
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
        } catch (e) {
            // Ses desteklenmiyorsa sessiz devam et
        }
    }

    // Manuel barkod testi
    testScan(barcode) {
        this.listeners.forEach(callback => {
            try {
                callback(barcode);
            } catch (e) {
                console.error('Test callback hatası:', e);
            }
        });
    }
}

// Global instance
const usbScanner = new USBBarcodeScanner();
