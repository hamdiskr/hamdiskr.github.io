// ===== Excel/CSV Handler (SheetJS) =====
class ExcelHandler {
    constructor() {
        this.expectedHeaders = ['barkod', 'urun_adi', 'kategori', 'miktar', 'konum', 'min_stok', 'aciklama'];
    }

    readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                    const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
                    resolve(jsonData);
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = () => reject(reader.error);
            reader.readAsArrayBuffer(file);
        });
    }

    parseData(rawData) {
        if (!rawData || rawData.length < 2) {
            throw new Error('Dosyada yeterli veri bulunamadı');
        }

        const headers = rawData[0].map(h => String(h).toLowerCase().trim());
        const rows = [];

        for (let i = 1; i < rawData.length; i++) {
            const row = rawData[i];
            if (row.length === 0) continue;

            const obj = {};
            headers.forEach((header, idx) => {
                obj[header] = row[idx] !== undefined ? row[idx] : '';
            });

            // Standart alanlara map et
            const mapped = this.mapToStandardFields(obj);
            rows.push(mapped);
        }

        return { headers, rows };
    }

    mapToStandardFields(row) {
        const mappings = {
            barcode: ['barkod', 'barcode', 'kod', 'code', 'sku'],
            name: ['urun_adi', 'urun adi', 'product', 'name', 'isim', 'urun'],
            category: ['kategori', 'category', 'tur', 'type'],
            quantity: ['miktar', 'adet', 'quantity', 'qty', 'stok', 'stock'],
            location: ['konum', 'location', 'raf', 'shelf', 'yer'],
            minStock: ['min_stok', 'min stok', 'minimum', 'alt limit', 'kritik'],
            description: ['aciklama', 'description', 'not', 'note']
        };

        const result = {};
        const rowKeys = Object.keys(row);

        for (const [standardField, possibleNames] of Object.entries(mappings)) {
            for (const possibleName of possibleNames) {
                const matchedKey = rowKeys.find(k =>
                    String(k).toLowerCase().trim() === possibleName
                );
                if (matchedKey !== undefined) {
                    result[standardField] = row[matchedKey];
                    break;
                }
            }
        }

        return result;
    }

    validateRow(row) {
        const errors = [];
        if (!row.barcode || String(row.barcode).trim() === '') {
            errors.push('Barkod alanı zorunludur');
        }
        if (!row.name || String(row.name).trim() === '') {
            errors.push('Urun adi zorunludur');
        }
        if (row.quantity !== undefined && isNaN(Number(row.quantity))) {
            errors.push('Miktar sayisal olmalidir');
        }
        return errors;
    }

    generateTemplate() {
        const ws = XLSX.utils.aoa_to_sheet([
            ['barkod', 'urun_adi', 'kategori', 'miktar', 'konum', 'min_stok', 'aciklama'],
            ['8681234567890', 'Ornek Urun', 'Elektronik', 100, 'A-12-3', 10, 'Aciklama metni'],
            ['8689876543210', 'Ornek Urun 2', 'Gida', 50, 'B-05-1', 5, '']
        ]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Urunler');
        return wb;
    }

    exportToExcel(products) {
        const data = products.map(p => ({
            'Barkod': p.barcode || '',
            'Urun Adi': p.name || '',
            'Kategori': p.category || '',
            'Miktar': p.quantity || 0,
            'Konum': p.location || '',
            'Min Stok': p.minStock || '',
            'Aciklama': p.description || '',
            'Son Guncelleme': p.updatedAt ? new Date(p.updatedAt).toLocaleString('tr-TR') : ''
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Urun Listesi');
        return wb;
    }

    downloadWorkbook(workbook, filename) {
        XLSX.writeFile(workbook, filename);
    }
}

// Global instance
const excelHandler = new ExcelHandler();
