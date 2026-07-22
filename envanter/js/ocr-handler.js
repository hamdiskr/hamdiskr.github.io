// ===== OCR Handler (Tesseract.js) =====
class OCRHandler {
    constructor() {
        this.worker = null;
        this.isInitialized = false;
        this.lang = 'tur+eng';
    }

    async init() {
        if (this.isInitialized) return;

        try {
            showToast('OCR motoru yükleniyor...', 'info');
            this.worker = await Tesseract.createWorker(this.lang);
            this.isInitialized = true;
            showToast('OCR motoru hazır!', 'success');
        } catch (error) {
            console.error('OCR başlatma hatası:', error);
            showToast('OCR yüklenemedi. Fotoğraf modu kullanılamayabilir.', 'error');
        }
    }

    async processImage(imageFile) {
        if (!this.isInitialized) {
            await this.init();
        }

        if (!this.worker) {
            throw new Error('OCR motoru başlatılamadı');
        }

        try {
            const result = await this.worker.recognize(imageFile);
            return this.parseTableData(result.data.text);
        } catch (error) {
            console.error('OCR işleme hatası:', error);
            throw error;
        }
    }

    parseTableData(text) {
        // OCR metnini satırlara böl
        const lines = text.split('\n').filter(line => line.trim().length > 0);

        // Tablo yapısını algıla (boşluklar veya tab karakterlerine göre sütunlar)
        const rows = [];
        let headers = [];

        // İlk satırı başlık olarak varsay
        if (lines.length > 0) {
            headers = this.splitColumns(lines[0]);
        }

        // Geri kalan satırları veri olarak işle
        for (let i = 1; i < lines.length; i++) {
            const columns = this.splitColumns(lines[i]);
            if (columns.length >= 2) {
                const row = {};
                columns.forEach((col, idx) => {
                    const header = headers[idx] || `Sutun_${idx + 1}`;
                    row[header] = col.trim();
                });
                rows.push(row);
            }
        }

        return { headers, rows, rawText: text };
    }

    splitColumns(line) {
        // Tab karakterlerine göre böl
        if (line.includes('\t')) {
            return line.split('\t').map(c => c.trim());
        }

        // Birden fazla boşluğa göre böl (tablo sütunları genelde hizalıdır)
        const columns = line.split(/\s{2,}/).map(c => c.trim());

        // Eğer çok az sütun varsa, tek boşlukla da dene
        if (columns.length < 2) {
            return line.split(/\s+/).map(c => c.trim());
        }

        return columns;
    }

    // Akıllı tablo eşleştirme - başlıkları standart alanlara map et
    mapToProductFields(rows) {
        const fieldMappings = {
            'barkod': ['barkod', 'barcode', 'kod', 'code', 'sku', 'no'],
            'name': ['urun', 'urun adi', 'product', 'name', 'isim', 'aciklama', 'description'],
            'category': ['kategori', 'category', 'tur', 'type'],
            'quantity': ['miktar', 'adet', 'quantity', 'qty', 'stok', 'stock'],
            'location': ['konum', 'location', 'raf', 'shelf', 'yer', 'depo'],
            'minStock': ['min', 'minimum', 'alt limit', 'kritik']
        };

        return rows.map(row => {
            const mapped = {};
            const rowKeys = Object.keys(row);

            for (const [standardField, possibleNames] of Object.entries(fieldMappings)) {
                for (const possibleName of possibleNames) {
                    const matchedKey = rowKeys.find(k =>
                        k.toLowerCase().includes(possibleName) ||
                        possibleName.includes(k.toLowerCase())
                    );
                    if (matchedKey) {
                        mapped[standardField] = row[matchedKey];
                        break;
                    }
                }
            }

            // Eşleşmeyen alanları da ekle
            rowKeys.forEach(key => {
                if (!Object.values(fieldMappings).flat().some(p => key.toLowerCase().includes(p))) {
                    mapped[key] = row[key];
                }
            });

            return mapped;
        });
    }

    async terminate() {
        if (this.worker) {
            await this.worker.terminate();
            this.worker = null;
            this.isInitialized = false;
        }
    }
}

// Global instance
const ocrHandler = new OCRHandler();
