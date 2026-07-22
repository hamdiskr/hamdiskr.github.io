// ===== Main Application =====
let currentPage = 'dashboard';
let editingProductId = null;

// ===== Toast Notifications =====
function showToast(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icons = {
        success: 'fa-check-circle',
        error: 'fa-times-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };

    toast.innerHTML = `<i class="fas ${icons[type] || icons.info}"></i> ${message}`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(20px) translateX(-50%)';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// ===== Navigation =====
function initNavigation() {
    // Desktop nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.dataset.page;
            navigateTo(page);
            // Mobil menüyü kapat
            closeMobileMenu();
        });
    });

    // Mobil hamburger menu
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleMobileMenu();
        });
    }

    // Sayfa disina tiklayinca menüyü kapat
    document.addEventListener('click', (e) => {
        const navLinks = document.querySelector('.nav-links');
        const mobileBtn = document.getElementById('mobile-menu-btn');
        if (navLinks && navLinks.classList.contains('mobile-open')) {
            if (!navLinks.contains(e.target) && !mobileBtn.contains(e.target)) {
                closeMobileMenu();
            }
        }
    });
}

function toggleMobileMenu() {
    const navLinks = document.querySelector('.nav-links');
    const mobileBtn = document.getElementById('mobile-menu-btn');

    if (navLinks) {
        navLinks.classList.toggle('mobile-open');
    }

    // Hamburger ikonunu degistir
    if (mobileBtn) {
        const icon = mobileBtn.querySelector('i');
        if (navLinks && navLinks.classList.contains('mobile-open')) {
            icon.className = 'fas fa-times';
        } else {
            icon.className = 'fas fa-bars';
        }
    }
}

function closeMobileMenu() {
    const navLinks = document.querySelector('.nav-links');
    const mobileBtn = document.getElementById('mobile-menu-btn');

    if (navLinks) {
        navLinks.classList.remove('mobile-open');
    }

    if (mobileBtn) {
        const icon = mobileBtn.querySelector('i');
        if (icon) icon.className = 'fas fa-bars';
    }
}

function navigateTo(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));

    const pageEl = document.getElementById(`page-${page}`);
    const navLink = document.querySelector(`[data-page="${page}"]`);

    if (pageEl) pageEl.classList.add('active');
    if (navLink) navLink.classList.add('active');

    currentPage = page;

    // Sayfa ozel yuklemeler
    if (page === 'dashboard') loadDashboard();
    if (page === 'products') loadProducts();
    if (page === 'add') initAddPage();

    // Kamera sayfasindan cikinca durdur
    if (page !== 'add') {
        cameraScanner.stopScanning();
    }

    // Sayfa basina scroll
    window.scrollTo(0, 0);
}

// ===== Dashboard =====
async function loadDashboard() {
    try {
        const products = await db.getAllProducts();
        const lowStockCount = products.filter(p =>
            p.minStock && Number(p.quantity) <= Number(p.minStock)
        ).length;
        const syncedCount = products.filter(p => p.syncStatus === 'synced').length;
        const pendingCount = products.filter(p => p.syncStatus === 'pending').length;

        const totalEl = document.getElementById('total-products');
        const lowEl = document.getElementById('low-stock');
        const syncEl = document.getElementById('synced-count');
        const pendingEl = document.getElementById('pending-sync');

        if (totalEl) totalEl.textContent = products.length;
        if (lowEl) lowEl.textContent = lowStockCount;
        if (syncEl) syncEl.textContent = syncedCount;
        if (pendingEl) pendingEl.textContent = pendingCount;

        // Son islemler
        const activities = await db.getRecentActivity(10);
        const activityList = document.getElementById('activity-list');

        if (activityList) {
            if (activities.length === 0) {
                activityList.innerHTML = '<p class="empty-state">Henuz islem kaydi yok.</p>';
            } else {
                activityList.innerHTML = activities.map(a => {
                    const actionIcons = {
                        create: 'fa-plus',
                        update: 'fa-edit',
                        delete: 'fa-trash'
                    };
                    const actionTexts = {
                        create: 'eklendi',
                        update: 'guncellendi',
                        delete: 'silindi'
                    };
                    const time = new Date(a.timestamp).toLocaleString('tr-TR');
                    return `
                        <div class="activity-item">
                            <div class="activity-icon">
                                <i class="fas ${actionIcons[a.action] || 'fa-circle'}"></i>
                            </div>
                            <div class="activity-details">
                                <div class="activity-text">
                                    <strong>${a.productName}</strong> ${actionTexts[a.action] || a.action}
                                </div>
                                <div class="activity-time">${time}</div>
                            </div>
                        </div>
                    `;
                }).join('');
            }
        }
    } catch (error) {
        console.error('Dashboard yukleme hatasi:', error);
    }
}

// ===== Products Page =====
async function loadProducts() {
    try {
        const products = await db.getAllProducts();
        renderProductsTable(products);
    } catch (error) {
        console.error('Urunler yukleme hatasi:', error);
    }
}

function renderProductsTable(products) {
    const tbody = document.getElementById('products-tbody');
    if (!tbody) return;

    if (products.length === 0) {
        tbody.innerHTML = '<tr class="empty-row"><td colspan="8" class="empty-state">Henuz urun kaydi yok.</td></tr>';
        return;
    }

    tbody.innerHTML = products.map(p => {
        const isLowStock = p.minStock && Number(p.quantity) <= Number(p.minStock);
        const syncBadge = p.syncStatus === 'synced'
            ? '<span class="badge badge-success"><i class="fas fa-check"></i> Senkronize</span>'
            : '<span class="badge badge-warning"><i class="fas fa-clock"></i> Bekliyor</span>';

        return `
            <tr data-id="${p.id}">
                <td><code>${p.barcode || '-'}</code></td>
                <td><strong>${p.name || '-'}</strong></td>
                <td>${p.category || '-'}</td>
                <td class="${isLowStock ? 'text-danger' : ''}">
                    ${p.quantity || 0} ${isLowStock ? '<i class="fas fa-exclamation-triangle" title="Dusuk stok!"></i>' : ''}
                </td>
                <td>${p.location || '-'}</td>
                <td>${syncBadge}</td>
                <td>${p.updatedAt ? new Date(p.updatedAt).toLocaleDateString('tr-TR') : '-'}</td>
                <td>
                    <div class="table-actions">
                        <button class="btn btn-sm btn-secondary" onclick="viewProduct(${p.id})" title="Goruntule">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-primary" onclick="editProduct(${p.id})" title="Duzenle">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deleteProduct(${p.id})" title="Sil">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// Arama
const searchInput = document.getElementById('product-search');
if (searchInput) {
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(async () => {
            const query = e.target.value.trim();
            if (query) {
                const results = await db.searchProducts(query);
                renderProductsTable(results);
            } else {
                loadProducts();
            }
        }, 300);
    });
}

// ===== Add/Edit Product Page =====
function initAddPage() {
    editingProductId = null;
    const form = document.getElementById('product-form');
    if (form) form.reset();

    const productIdInput = document.getElementById('product-id');
    if (productIdInput) productIdInput.value = '';

    const photoPreview = document.getElementById('photo-preview');
    const uploadPlaceholder = document.getElementById('upload-placeholder');

    if (photoPreview) photoPreview.classList.add('hidden');
    if (uploadPlaceholder) uploadPlaceholder.classList.remove('hidden');

    // Varsayilan olarak manuel sekmesini sec
    selectMethodTab('manual');
}

function selectMethodTab(method) {
    document.querySelectorAll('.method-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.method-content').forEach(c => c.classList.remove('active'));

    const tab = document.querySelector(`.method-tab[data-method="${method}"]`);
    const content = document.getElementById(`method-${method}`);

    if (tab) tab.classList.add('active');
    if (content) content.classList.add('active');

    // Kamera baslat/durdur
    if (method === 'camera') {
        initCameraScanner();
    } else {
        cameraScanner.stopScanning();
    }

    // USB dinleyici
    if (method === 'usb') {
        usbScanner.startListening();
        const usbStatus = document.getElementById('usb-status');
        if (usbStatus) {
            usbStatus.innerHTML = '<i class="fas fa-circle" style="color:var(--success)"></i> Aktif - Okuyucu bekleniyor...';
        }
    } else {
        usbScanner.stopListening();
    }
}

// Barkod giris metodu secimi
document.querySelectorAll('.method-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        const method = tab.dataset.method;
        selectMethodTab(method);
    });
});

// ===== KAMERA BARKOD OKUYUCU - DÜZELTİLMİŞ =====
async function initCameraScanner() {
    const videoEl = document.getElementById('camera-video');
    const startBtn = document.getElementById('start-camera-btn');
    const stopBtn = document.getElementById('stop-camera-btn');

    if (!videoEl) {
        showToast('Video elementi bulunamadi!', 'error');
        return;
    }

    try {
        // ZXing'in yuklendiginden emin ol
        if (typeof ZXing === 'undefined') {
            showToast('Barkod kutuphanesi yukleniyor, lutfen bekleyin...', 'info');
            // 1 saniye bekle ve tekrar dene
            setTimeout(initCameraScanner, 1000);
            return;
        }

        showToast('Kamera baslatiliyor...', 'info');

        const initialized = await cameraScanner.init('camera-video', 'camera-canvas');
        if (!initialized) {
            showToast('Barkod okuyucu baslatilamadi!', 'error');
            return;
        }

        await cameraScanner.startScanning((barcode, format) => {
            console.log('Kamera barkod:', barcode);

            // Barkod input alanlarini guncelle
            const barcodeInput = document.getElementById('barcode-input');
            const productBarcode = document.getElementById('product-barcode');

            if (barcodeInput) barcodeInput.value = barcode;
            if (productBarcode) productBarcode.value = barcode;

            showToast(`Barkod okundu: ${barcode}`, 'success');

            // Urun bilgilerini getir
            db.getProductByBarcode(barcode).then(product => {
                if (product) {
                    document.getElementById('product-name').value = product.name || '';
                    document.getElementById('product-category').value = product.category || '';
                    document.getElementById('product-quantity').value = product.quantity || '';
                    document.getElementById('product-location').value = product.location || '';
                    showToast('Urun bulundu! Bilgiler yuklendi.', 'success');
                } else {
                    showToast('Yeni urun. Lutfen bilgileri girin.', 'info');
                }
            });
        });

        if (startBtn) startBtn.classList.add('hidden');
        if (stopBtn) stopBtn.classList.remove('hidden');

    } catch (error) {
        console.error('Kamera baslatma hatasi:', error);
        showToast('Kamera baslatilamadi: ' + error.message, 'error');
    }
}

// Start/Stop butonlari
document.getElementById('start-camera-btn')?.addEventListener('click', initCameraScanner);
document.getElementById('stop-camera-btn')?.addEventListener('click', () => {
    cameraScanner.stopScanning();
    const startBtn = document.getElementById('start-camera-btn');
    const stopBtn = document.getElementById('stop-camera-btn');
    if (startBtn) startBtn.classList.remove('hidden');
    if (stopBtn) stopBtn.classList.add('hidden');
});

// Bluetooth baglanti
document.getElementById('connect-bluetooth-btn')?.addEventListener('click', async () => {
    try {
        bluetoothScanner.updateStatus('connecting');
        await bluetoothScanner.connect();
    } catch (error) {
        showToast(error.message, 'error');
    }
});

// Manuel barkod input
document.getElementById('barcode-input')?.addEventListener('change', (e) => {
    const productBarcode = document.getElementById('product-barcode');
    if (productBarcode) productBarcode.value = e.target.value;
});

// Urun formu gonderimi
document.getElementById('product-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const productData = {
        barcode: document.getElementById('product-barcode')?.value.trim() || '',
        name: document.getElementById('product-name')?.value.trim() || '',
        category: document.getElementById('product-category')?.value || '',
        quantity: Number(document.getElementById('product-quantity')?.value) || 0,
        location: document.getElementById('product-location')?.value.trim() || '',
        minStock: Number(document.getElementById('product-min-stock')?.value) || 0,
        description: document.getElementById('product-description')?.value.trim() || '',
        photo: document.getElementById('photo-preview')?.src || null
    };

    if (!productData.barcode || !productData.name) {
        showToast('Barkod ve urun adi zorunludur!', 'error');
        return;
    }

    try {
        if (editingProductId) {
            await db.updateProduct(editingProductId, productData);
            showToast('Urun basariyla guncellendi!', 'success');
        } else {
            // Ayni barkod var mi kontrol et
            const existing = await db.getProductByBarcode(productData.barcode);
            if (existing && !editingProductId) {
                if (confirm('Bu barkodlu urun zaten var. Miktari guncellemek ister misiniz?')) {
                    await db.updateProduct(existing.id, {
                        quantity: Number(existing.quantity) + productData.quantity
                    });
                    showToast('Urun miktari guncellendi!', 'success');
                }
                return;
            }

            await db.addProduct(productData);
            showToast('Urun basariyla eklendi!', 'success');
        }

        // Formu temizle
        document.getElementById('product-form')?.reset();
        const photoPreview = document.getElementById('photo-preview');
        const uploadPlaceholder = document.getElementById('upload-placeholder');
        const removePhotoBtn = document.getElementById('remove-photo-btn');

        if (photoPreview) photoPreview.classList.add('hidden');
        if (uploadPlaceholder) uploadPlaceholder.classList.remove('hidden');
        if (removePhotoBtn) removePhotoBtn.classList.add('hidden');

        editingProductId = null;

        // Senkronizasyon kuyruguna ekle
        if (!navigator.onLine) {
            await syncManager.queueOperation('create', productData);
        }

    } catch (error) {
        console.error('Urun kaydetme hatasi:', error);
        showToast('Urun kaydedilemedi: ' + error.message, 'error');
    }
});

document.getElementById('cancel-btn')?.addEventListener('click', () => {
    document.getElementById('product-form')?.reset();
    editingProductId = null;
    navigateTo('products');
});

// Foto yukleme
document.getElementById('photo-upload-area')?.addEventListener('click', (e) => {
    if (e.target.id === 'remove-photo-btn') return;
    document.getElementById('product-photo')?.click();
});

document.getElementById('product-photo')?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            const photoPreview = document.getElementById('photo-preview');
            const uploadPlaceholder = document.getElementById('upload-placeholder');
            const removePhotoBtn = document.getElementById('remove-photo-btn');

            if (photoPreview) {
                photoPreview.src = event.target.result;
                photoPreview.classList.remove('hidden');
            }
            if (uploadPlaceholder) uploadPlaceholder.classList.add('hidden');
            if (removePhotoBtn) removePhotoBtn.classList.remove('hidden');
        };
        reader.readAsDataURL(file);
    }
});

document.getElementById('remove-photo-btn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    document.getElementById('product-photo').value = '';
    const photoPreview = document.getElementById('photo-preview');
    const uploadPlaceholder = document.getElementById('upload-placeholder');
    const removePhotoBtn = document.getElementById('remove-photo-btn');

    if (photoPreview) photoPreview.classList.add('hidden');
    if (uploadPlaceholder) uploadPlaceholder.classList.remove('hidden');
    if (removePhotoBtn) removePhotoBtn.classList.add('hidden');
});

// ===== Product Actions =====
async function viewProduct(id) {
    try {
        const product = await db.getProduct(id);
        if (!product) return;

        const modalBody = document.getElementById('modal-body');
        if (!modalBody) return;

        modalBody.innerHTML = `
            <div class="product-detail-grid">
                <div class="detail-item">
                    <span class="detail-label">Barkod</span>
                    <span class="detail-value">${product.barcode || '-'}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Urun Adi</span>
                    <span class="detail-value">${product.name || '-'}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Kategori</span>
                    <span class="detail-value">${product.category || '-'}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Miktar</span>
                    <span class="detail-value">${product.quantity || 0}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Konum</span>
                    <span class="detail-value">${product.location || '-'}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Min. Stok</span>
                    <span class="detail-value">${product.minStock || '-'}</span>
                </div>
            </div>
            <div class="detail-item" style="margin-top:12px;">
                <span class="detail-label">Aciklama</span>
                <span class="detail-value">${product.description || '-'}</span>
            </div>
            ${product.photo ? `<img src="${product.photo}" class="product-detail-photo" alt="Urun fotografi">` : ''}
        `;

        const editBtn = document.getElementById('modal-edit-btn');
        const deleteBtn = document.getElementById('modal-delete-btn');

        if (editBtn) editBtn.onclick = () => { closeModal(); editProduct(id); };
        if (deleteBtn) deleteBtn.onclick = () => { closeModal(); deleteProduct(id); };

        openModal();
    } catch (error) {
        console.error('Urun goruntuleme hatasi:', error);
    }
}

async function editProduct(id) {
    try {
        const product = await db.getProduct(id);
        if (!product) return;

        editingProductId = id;
        navigateTo('add');

        // Formu doldur (kisa gecikme ile sayfanin yuklenmesini bekle)
        setTimeout(() => {
            const barcodeEl = document.getElementById('product-barcode');
            const nameEl = document.getElementById('product-name');
            const categoryEl = document.getElementById('product-category');
            const quantityEl = document.getElementById('product-quantity');
            const locationEl = document.getElementById('product-location');
            const minStockEl = document.getElementById('product-min-stock');
            const descriptionEl = document.getElementById('product-description');
            const productIdEl = document.getElementById('product-id');

            if (barcodeEl) barcodeEl.value = product.barcode || '';
            if (nameEl) nameEl.value = product.name || '';
            if (categoryEl) categoryEl.value = product.category || '';
            if (quantityEl) quantityEl.value = product.quantity || '';
            if (locationEl) locationEl.value = product.location || '';
            if (minStockEl) minStockEl.value = product.minStock || '';
            if (descriptionEl) descriptionEl.value = product.description || '';
            if (productIdEl) productIdEl.value = product.id;

            if (product.photo) {
                const photoPreview = document.getElementById('photo-preview');
                const uploadPlaceholder = document.getElementById('upload-placeholder');
                const removePhotoBtn = document.getElementById('remove-photo-btn');

                if (photoPreview) {
                    photoPreview.src = product.photo;
                    photoPreview.classList.remove('hidden');
                }
                if (uploadPlaceholder) uploadPlaceholder.classList.add('hidden');
                if (removePhotoBtn) removePhotoBtn.classList.remove('hidden');
            }
        }, 100);
    } catch (error) {
        console.error('Urun duzenleme hatasi:', error);
    }
}

async function deleteProduct(id) {
    if (!confirm('Bu urunu silmek istediginizden emin misiniz?')) return;

    try {
        await db.deleteProduct(id);
        showToast('Urun silindi!', 'success');
        loadProducts();
    } catch (error) {
        console.error('Urun silme hatasi:', error);
        showToast('Urun silinemedi!', 'error');
    }
}

// ===== Modal =====
function openModal() {
    const modal = document.getElementById('product-modal');
    if (modal) {
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal() {
    const modal = document.getElementById('product-modal');
    if (modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = '';
    }
}

document.querySelectorAll('.modal-close, .modal-close-btn').forEach(btn => {
    btn.addEventListener('click', closeModal);
});

document.getElementById('product-modal')?.addEventListener('click', (e) => {
    if (e.target.id === 'product-modal') closeModal();
});

// ===== Import Page =====
// Excel yukleme
document.getElementById('excel-upload-area')?.addEventListener('click', () => {
    document.getElementById('excel-file')?.click();
});

document.getElementById('excel-file')?.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
        showToast('Excel dosyasi okunuyor...', 'info');
        const rawData = await excelHandler.readFile(file);
        const parsed = excelHandler.parseData(rawData);

        // Onizleme tablosu olustur
        renderPreviewTable(parsed.headers, parsed.rows, 'preview-table');
        const excelPreview = document.getElementById('excel-preview');
        if (excelPreview) excelPreview.classList.remove('hidden');

    } catch (error) {
        showToast('Excel okuma hatasi: ' + error.message, 'error');
    }
});

document.getElementById('cancel-import-btn')?.addEventListener('click', () => {
    const excelPreview = document.getElementById('excel-preview');
    if (excelPreview) excelPreview.classList.add('hidden');
    const excelFile = document.getElementById('excel-file');
    if (excelFile) excelFile.value = '';
});

document.getElementById('confirm-import-btn')?.addEventListener('click', async () => {
    try {
        const rows = getPreviewData('preview-table');
        let added = 0;
        let errors = 0;

        for (const row of rows) {
            const validationErrors = excelHandler.validateRow(row);
            if (validationErrors.length > 0) {
                errors++;
                continue;
            }

            try {
                await db.addProduct({
                    barcode: String(row.barcode || '').trim(),
                    name: String(row.name || '').trim(),
                    category: String(row.category || '').trim(),
                    quantity: Number(row.quantity) || 0,
                    location: String(row.location || '').trim(),
                    minStock: Number(row.minStock) || 0,
                    description: String(row.description || '').trim()
                });
                added++;
            } catch (e) {
                errors++;
            }
        }

        showToast(`${added} urun eklendi, ${errors} hata`, added > 0 ? 'success' : 'warning');
        const excelPreview = document.getElementById('excel-preview');
        if (excelPreview) excelPreview.classList.add('hidden');
        const excelFile = document.getElementById('excel-file');
        if (excelFile) excelFile.value = '';

    } catch (error) {
        showToast('Iceri aktarma hatasi: ' + error.message, 'error');
    }
});

// Sablon indir
document.getElementById('download-template')?.addEventListener('click', (e) => {
    e.preventDefault();
    const wb = excelHandler.generateTemplate();
    excelHandler.downloadWorkbook(wb, 'envanter_sablonu.xlsx');
    showToast('Sablon indirildi!', 'success');
});

// OCR - Foto yukleme
document.getElementById('ocr-upload-area')?.addEventListener('click', () => {
    document.getElementById('ocr-photo')?.click();
});

document.getElementById('ocr-photo')?.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
        const ocrProcessing = document.getElementById('ocr-processing');
        const ocrResult = document.getElementById('ocr-result');

        if (ocrProcessing) ocrProcessing.classList.remove('hidden');
        if (ocrResult) ocrResult.classList.add('hidden');

        const result = await ocrHandler.processImage(file);

        if (result.rows.length === 0) {
            showToast('Tablo verisi bulunamadi. Lutfen net bir fotograf yukleyin.', 'warning');
            if (ocrProcessing) ocrProcessing.classList.add('hidden');
            return;
        }

        // Urun alanlarina map et
        const mappedRows = ocrHandler.mapToProductFields(result.rows);

        // Onizleme tablosu
        const headers = Object.keys(mappedRows[0] || {});
        renderPreviewTable(headers, mappedRows, 'ocr-preview-table');

        if (ocrProcessing) ocrProcessing.classList.add('hidden');
        if (ocrResult) ocrResult.classList.remove('hidden');

        showToast(`${result.rows.length} satir tespit edildi. Lutfen kontrol edin.`, 'success');

    } catch (error) {
        const ocrProcessing = document.getElementById('ocr-processing');
        if (ocrProcessing) ocrProcessing.classList.add('hidden');
        showToast('OCR hatasi: ' + error.message, 'error');
    }
});

document.getElementById('cancel-ocr-btn')?.addEventListener('click', () => {
    const ocrResult = document.getElementById('ocr-result');
    if (ocrResult) ocrResult.classList.add('hidden');
    const ocrPhoto = document.getElementById('ocr-photo');
    if (ocrPhoto) ocrPhoto.value = '';
});

document.getElementById('confirm-ocr-btn')?.addEventListener('click', async () => {
    try {
        const rows = getPreviewData('ocr-preview-table');
        let added = 0;

        for (const row of rows) {
            if (row.barcode && row.name) {
                await db.addProduct({
                    barcode: String(row.barcode).trim(),
                    name: String(row.name).trim(),
                    category: String(row.category || '').trim(),
                    quantity: Number(row.quantity) || 0,
                    location: String(row.location || '').trim(),
                    minStock: Number(row.minStock) || 0,
                    description: String(row.description || '').trim()
                });
                added++;
            }
        }

        showToast(`${added} urun OCR ile eklendi!`, 'success');
        const ocrResult = document.getElementById('ocr-result');
        if (ocrResult) ocrResult.classList.add('hidden');
        const ocrPhoto = document.getElementById('ocr-photo');
        if (ocrPhoto) ocrPhoto.value = '';

    } catch (error) {
        showToast('OCR kaydetme hatasi: ' + error.message, 'error');
    }
});

// Onizleme tablosu render
function renderPreviewTable(headers, rows, tableId) {
    const table = document.getElementById(tableId);
    if (!table) return;

    const thead = `<thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>`;
    const tbody = `<tbody>${rows.map((row, idx) =>
        `<tr>${headers.map(h => `<td><input type="text" value="${row[h] || ''}" data-row="${idx}" data-col="${h}"></td>`).join('')}</tr>`
    ).join('')}</tbody>`;

    table.innerHTML = thead + tbody;
}

function getPreviewData(tableId) {
    const table = document.getElementById(tableId);
    if (!table) return [];

    const headers = Array.from(table.querySelectorAll('thead th')).map(th => th.textContent.trim());
    const rows = [];

    table.querySelectorAll('tbody tr').forEach(tr => {
        const row = {};
        tr.querySelectorAll('td input').forEach((input, idx) => {
            const header = headers[idx];
            if (header) row[header] = input.value;
        });
        rows.push(row);
    });

    return rows;
}

// ===== Export =====
document.getElementById('export-btn')?.addEventListener('click', async () => {
    try {
        const products = await db.getAllProducts();
        if (products.length === 0) {
            showToast('Disa aktarilacak urun yok!', 'warning');
            return;
        }

        const wb = excelHandler.exportToExcel(products);
        const date = new Date().toISOString().split('T')[0];
        excelHandler.downloadWorkbook(wb, `envanter_raporu_${date}.xlsx`);
        showToast('Rapor indirildi!', 'success');
    } catch (error) {
        showToast('Disa aktarma hatasi: ' + error.message, 'error');
    }
});

// ===== Settings =====
// Dark mode
document.getElementById('dark-mode-toggle')?.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);

    const icon = document.querySelector('#dark-mode-toggle i');
    if (icon) icon.className = newTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
});

// Sync button
document.getElementById('sync-btn')?.addEventListener('click', () => {
    syncManager.sync();
});

// Yedekleme
document.getElementById('backup-btn')?.addEventListener('click', async () => {
    try {
        const data = await db.exportAllData();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `envanter_yedek_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('Yedekleme tamamlandi!', 'success');
    } catch (error) {
        showToast('Yedekleme hatasi: ' + error.message, 'error');
    }
});

// Geri yukleme
document.getElementById('restore-btn')?.addEventListener('click', () => {
    document.getElementById('restore-file')?.click();
});

document.getElementById('restore-file')?.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
        const text = await file.text();
        const data = JSON.parse(text);
        const count = await db.importData(data);
        showToast(`${count} urun geri yuklendi!`, 'success');
        loadProducts();
    } catch (error) {
        showToast('Geri yukleme hatasi: ' + error.message, 'error');
    }
});

// Tum verileri sil
document.getElementById('clear-data-btn')?.addEventListener('click', async () => {
    if (!confirm('TUM verileri silmek istediginizden emin misiniz? Bu islem geri alinamaz!')) return;
    if (!confirm('Emin misiniz? Tum urunler, loglar ve ayarlar silinecek!')) return;

    try {
        await db.clearAllData();
        showToast('Tum veriler silindi!', 'success');
        loadDashboard();
    } catch (error) {
        showToast('Silme hatasi: ' + error.message, 'error');
    }
});

// ===== Initialization =====
document.addEventListener('DOMContentLoaded', async () => {
    // Tema yukle
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);

    const darkModeIcon = document.querySelector('#dark-mode-toggle i');
    if (darkModeIcon) darkModeIcon.className = savedTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';

    // Navigasyon
    initNavigation();

    // Offline durumunu kontrol et
    syncManager.updateUI();

    // Dashboard'u yukle
    loadDashboard();

    // Service Worker kaydet (PWA)
    if ('serviceWorker' in navigator) {
        try {
            await navigator.serviceWorker.register('sw.js');
            console.log('Service Worker kaydedildi');
        } catch (error) {
            console.log('Service Worker kaydedilemedi:', error);
        }
    }

    console.log('Envanter Sistemi baslatildi!');
});
