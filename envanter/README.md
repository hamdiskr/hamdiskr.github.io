# Envanter Yonetim Sistemi

Web tabanli, yerelde (offline) calisan ve online senkronizasyon destekleyen envanter yonetim uygulamasi.

## Ozellikler

### Barkod Okuma (4 Farkli Kanal)
- **Kamera**: Cihaz kamerasi ile barkod/QR kod okuma (ZXing)
- **USB Barkod Okuyucu**: Tak-calistir HID klavye modu destegi
- **Bluetooth Barkod Okuyucu**: Web Bluetooth API ile kablosuz okuyucu destegi
- **Manuel Giris**: Klavye ile barkod numarasi girisi

### Veri Girisi
- **Excel/CSV**: Toplu veri yukleme ve sablon indirme (SheetJS)
- **Fotograf OCR**: Tablo iceren fotograflardan otomatik veri cikarma (Tesseract.js)
- **Manuel Form**: Tek tek urun ekleme/duzenleme

### Online/Offline
- **Offline Mod**: Internet olmadan tam calisabilirlik (IndexedDB)
- **Online Senkronizasyon**: Bulut sunucusu ile veri senkronizasyonu
- **PWA**: Telefona uygulama gibi kurulabilir, push notification

### Veri Yonetimi
- CRUD islemleri (Olustur, Oku, Guncelle, Sil)
- Arama ve filtreleme
- Dusuk stok uyarlari
- Aktivite loglari
- Veri yedekleme ve geri yukleme

## Kurulum

1. Dosyalari bir web sunucusuna yukleyin (veya `npx serve` ile calistirin)
2. `index.html` dosyasini tarayicida acin
3. Modern bir tarayici kullanin (Chrome, Edge, Firefox)
4. PWA olarak kurmak icin tarayici menusunden "Ana ekrana ekle" secin

## Kullanim

### USB Barkod Okuyucu
1. USB barkod okuyucuyu bilgisayara takin
2. "Ekle" sayfasina gidin
3. "USB Okuyucu" sekmesini secin
4. Barkod okuyucu otomatik olarak taninacaktir
5. Barkod okutun - veri otomatik forma dusecektir

### Excel ile Toplu Yukleme
1. "Ice Aktar" sayfasina gidin
2. Excel dosyasini surukleyin veya secin
3. Onizleme tablosunda verileri kontrol edin
4. "Ice Aktar" butonuna tiklayin

### OCR ile Fotograf Okuma
1. "Ice Aktar" sayfasina gidin
2. "Fotograftan Tablo Okuma" bolumune fotograf yukleyin
3. OCR sonucunu kontrol edin ve duzeltmeleri yapin
4. "Onayla ve Kaydet" butonuna tiklayin

## Teknolojiler

- **Frontend**: Vanilla JS, CSS3, HTML5
- **Database**: IndexedDB (yerel)
- **Barkod**: ZXing (kamera), HID Keyboard API (USB)
- **Excel**: SheetJS (xlsx)
- **OCR**: Tesseract.js
- **PWA**: Service Worker, Web App Manifest

## Tarayici Destegi

- Chrome/Edge: Tam destek (USB, Bluetooth, Kamera, PWA)
- Firefox: Kismi destek (Kamera, USB, PWA)
- Safari: Kismi destek (Kamera, PWA)
- Mobil Chrome: Tam destek

## Lisans

MIT License
