// ===== Camera Barcode Scanner (ZXing) =====
class CameraBarcodeScanner {
    constructor() {
        this.codeReader = null;
        this.videoElement = null;
        this.canvasElement = null;
        this.isScanning = false;
        this.scanInterval = null;
        this.onScanCallback = null;
        this.selectedDeviceId = null;
    }

    async init(videoElementId, canvasElementId) {
        this.videoElement = document.getElementById(videoElementId);
        this.canvasElement = document.getElementById(canvasElementId);

        if (!this.videoElement) {
            console.error('Video elementi bulunamadi:', videoElementId);
            return false;
        }

        try {
            // ZXing global namespace kontrolu
            if (typeof ZXing === 'undefined' || !ZXing.BrowserMultiFormatReader) {
                console.error('ZXing kutuphanesi yuklenmemis');
                return false;
            }

            this.codeReader = new ZXing.BrowserMultiFormatReader();
            console.log('ZXing code reader basarili sekilde olusturuldu');
            return true;
        } catch (error) {
            console.error('ZXing baslatma hatasi:', error);
            return false;
        }
    }

    // Kamera cihazlarini listele
    async listCameras() {
        try {
            const devices = await this.codeReader.listVideoInputDevices();
            console.log('Bulunan kamera cihazlari:', devices);
            return devices;
        } catch (error) {
            console.error('Kamera listeleme hatasi:', error);
            return [];
        }
    }

    async startScanning(callback) {
        if (!this.codeReader) {
            console.error('Code reader baslatilmamis');
            return;
        }

        if (this.isScanning) {
            console.log('Zaten tarama aktif');
            return;
        }

        this.onScanCallback = callback;
        this.isScanning = true;

        try {
            // Once kamera cihazlarini listele
            const devices = await this.listCameras();

            // Arka kamerayi tercih et (mobil icin)
            let selectedDevice = devices[0];
            if (devices.length > 1) {
                const backCamera = devices.find(d => 
                    d.label.toLowerCase().includes('back') || 
                    d.label.toLowerCase().includes('rear') ||
                    d.label.toLowerCase().includes('environment')
                );
                if (backCamera) selectedDevice = backCamera;
            }

            this.selectedDeviceId = selectedDevice ? selectedDevice.deviceId : undefined;
            console.log('Secilen kamera:', selectedDevice?.label || 'Varsayilan');

            // decodeFromVideoDevice kullan (en guncel ve stabil yontem)
            const controls = await this.codeReader.decodeFromVideoDevice(
                this.selectedDeviceId,
                this.videoElement,
                (result, error) => {
                    if (result && this.isScanning) {
                        const barcode = result.getText();
                        const format = result.getBarcodeFormat();
                        console.log(`Barkod okundu: ${barcode} (${format})`);

                        // Ses bildirimi
                        this.playBeep();

                        // Callback'i calistir
                        if (this.onScanCallback) {
                            this.onScanCallback(barcode, format);
                        }
                    }

                    // NotFoundException normaldir, sadece diger hatalari logla
                    if (error && !(error instanceof ZXing.NotFoundException)) {
                        console.warn('Tarama hatasi:', error.message || error);
                    }
                }
            );

            this.controls = controls;
            console.log('Kamera taramasi baslatildi');

        } catch (error) {
            console.error('Kamera baslatma hatasi:', error);
            this.isScanning = false;
            throw error;
        }
    }

    stopScanning() {
        if (!this.isScanning) return;

        console.log('Kamera taramasi durduruluyor...');
        this.isScanning = false;

        // ZXing reader'i resetle
        if (this.codeReader) {
            try {
                this.codeReader.reset();
            } catch (e) {
                console.warn('ZXing reset hatasi:', e);
            }
        }

        // Video akisini durdur
        if (this.videoElement && this.videoElement.srcObject) {
            const stream = this.videoElement.srcObject;
            const tracks = stream.getTracks();
            tracks.forEach(track => {
                track.stop();
                console.log('Kamera track durduruldu:', track.label);
            });
            this.videoElement.srcObject = null;
        }

        // Interval temizle
        if (this.scanInterval) {
            clearInterval(this.scanInterval);
            this.scanInterval = null;
        }

        console.log('Kamera taramasi tamamen durduruldu');
    }

    playBeep() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = 1200;
            oscillator.type = 'sine';
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
        } catch (e) {
            // Ses desteklenmiyorsa sessiz devam et
        }
    }
}

// Global instance
const cameraScanner = new CameraBarcodeScanner();
