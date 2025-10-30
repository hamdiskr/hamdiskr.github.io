class ModernMP3Player {
    constructor() {
        this.audio = document.getElementById('audio-player');
        this.isPlaying = false;
        this.bookmarks = [];
        this.delayTimeout = null;
        this.delayInterval = null;
        this.currentTrack = null;
        this.savedTracks = this.loadSavedTracks();
        this.youtubeIntegration = null;
        this.audioContext = null;

        this.initializeElements();
        this.setupEventListeners();
        this.setupWaveform();
        this.loadSavedTracksList();
        this.initializeYouTube();
    }

    initializeElements() {
        // Tab elements
        this.tabBtns = document.querySelectorAll('.tab-btn');
        this.tabPanels = document.querySelectorAll('.tab-panel');

        // Input elements
        this.fileInput = document.getElementById('file-input');
        this.urlInput = document.getElementById('url-input');
        this.youtubeInput = document.getElementById('youtube-input');

        // Player elements
        this.playerMain = document.getElementById('player-main');
        this.trackTitle = document.getElementById('track-title');
        this.trackArtist = document.getElementById('track-artist');
        this.playBtn = document.getElementById('play-btn');
        this.currentTime = document.getElementById('current-time');
        this.totalTime = document.getElementById('total-time');
        this.progressBar = document.getElementById('progress-bar');
        this.timeCursor = document.getElementById('time-cursor');
        this.timeTooltip = document.getElementById('time-tooltip');
        this.hoverTooltip = document.getElementById('hover-tooltip');
        this.volumeSlider = document.getElementById('volume-slider');
        this.delayInput = document.getElementById('delay-input');

        // Waveform
        this.waveformCanvas = document.getElementById('waveform');
        this.waveformCtx = this.waveformCanvas.getContext('2d');
        this.waveformBookmarks = document.getElementById('waveform-bookmarks');
        this.waveformBookmarkLabels = document.getElementById('waveform-bookmark-labels');

        // YouTube
        this.youtubePlayerContainer = document.getElementById('youtube-player-container');

        // Bookmarks
        this.bookmarksSection = document.getElementById('bookmarks-section');
        this.bookmarksList = document.getElementById('bookmarks-list');
        this.bookmarkNameInput = document.getElementById('bookmark-name');

        // Saved tracks
        this.savedTracksList = document.getElementById('saved-tracks-list');
    }

    setupEventListeners() {
        // Tab switching
        this.tabBtns.forEach(btn => {
            btn.addEventListener('click', () => this.switchTab(btn.dataset.tab));
        });

        // File input
        this.fileInput.addEventListener('change', (e) => this.loadFile(e.target.files[0]));

        // URL loading
        document.getElementById('load-url').addEventListener('click', () => {
            this.loadURL(this.urlInput.value);
        });

        // YouTube loading
        document.getElementById('load-youtube').addEventListener('click', () => {
            this.loadYouTube(this.youtubeInput.value);
        });

        // Player controls
        this.playBtn.addEventListener('click', () => this.togglePlay());
        document.getElementById('prev-btn').addEventListener('click', () => this.seekBackward());
        document.getElementById('next-btn').addEventListener('click', () => this.seekForward());
        document.getElementById('bookmark-btn').addEventListener('click', () => this.addQuickBookmark());
        document.getElementById('delayed-play').addEventListener('click', () => this.delayedPlay());
        document.getElementById('cancel-delay').addEventListener('click', () => this.cancelDelay());
        document.getElementById('save-track').addEventListener('click', () => this.saveCurrentTrack());
        document.getElementById('add-bookmark').addEventListener('click', () => this.addNamedBookmark());

        // Audio events
        this.audio.addEventListener('loadedmetadata', () => this.onAudioLoaded());
        this.audio.addEventListener('timeupdate', () => this.updateProgress());
        this.audio.addEventListener('ended', () => this.onAudioEnded());

        // Volume control
        this.volumeSlider.addEventListener('input', (e) => {
            const volume = e.target.value;
            if (this.currentTrack && this.currentTrack.source === 'youtube' && this.youtubeIntegration) {
                this.youTubeSetVolume(volume);
            } else {
                this.audio.volume = volume / 100;
            }
        });

        // Waveform click and drag
        this.waveformCanvas.addEventListener('click', (e) => this.seekToPosition(e));
        this.setupProgressBarDrag();

        // Responsive canvas
        window.addEventListener('resize', () => this.resizeCanvas());

        // Bookmark name input enter key
        this.bookmarkNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addNamedBookmark();
            }
        });
    }

    // YouTube Player Fonksiyonları
    initializeYouTube() {
        this.youtubeIntegration = new YouTubeIntegration(this);
    }

    createYouTubePlayer(videoId) {
        if (this.youtubeIntegration) {
            this.youtubeIntegration.createPlayer(videoId);
        }
    }



    // YouTube Kontrol Fonksiyonları
    youTubeTogglePlayPause() {
        if (this.youtubeIntegration) {
            this.youtubeIntegration.togglePlayPause();
        }
    }

    youTubeSetVolume(volume) {
        if (this.youtubeIntegration) {
            this.youtubeIntegration.setVolume(volume);
        }
    }

    youTubeSeekTo(seconds) {
        if (this.youtubeIntegration) {
            this.youtubeIntegration.seekTo(seconds);
        }
    }

    youTubeSkipForward(seconds = 10) {
        if (this.youtubeIntegration) {
            this.youtubeIntegration.skipForward(seconds);
        }
    }

    youTubeSkipBackward(seconds = 10) {
        if (this.youtubeIntegration) {
            this.youtubeIntegration.skipBackward(seconds);
        }
    }

    handleYouTubeError(errorType) {
        console.error('YouTube hatası:', errorType);

        const playerContainer = document.getElementById('youtube-player');
        if (playerContainer) {
            playerContainer.innerHTML = `
                <div style="text-align: center; padding: 20px; background: #f8d7da; color: #721c24; border-radius: 10px; border: 1px solid #f5c6cb;">
                    <i class="fas fa-exclamation-triangle"></i><br>
                    YouTube videosu yüklenemedi.<br>
                    <small>Lütfen başka bir video deneyin veya URL'yi kontrol edin.</small>
                </div>
            `;
        }

        // Player container'ı göster
        this.youtubePlayerContainer.style.display = 'block';
    }

    handleYouTubeError(errorType) {
        console.error('YouTube hatası:', errorType);

        const playerContainer = document.getElementById('youtube-player');
        if (playerContainer) {
            playerContainer.innerHTML = `
                <div style="text-align: center; padding: 20px; background: #f8d7da; color: #721c24; border-radius: 10px; border: 1px solid #f5c6cb;">
                    <i class="fas fa-exclamation-triangle"></i><br>
                    YouTube videosu yüklenemedi.<br>
                    <small>Lütfen başka bir video deneyin veya URL'yi kontrol edin.</small>
                </div>
            `;
        }

        // Player container'ı göster
        this.youtubePlayerContainer.style.display = 'block';
    }



    reloadYouTubeWithAutoplay(autoplay) {
        if (!this.youtubePlayer || !this.youtubePlayer.iframe) return;

        // 513 hatasını önlemek için daha az agresif yaklaşım
        try {
            const iframe = this.youtubePlayer.iframe;
            const videoId = this.youtubePlayer.videoId;
            const currentTime = Math.floor(this.youtubePlayer.currentTime || 0);

            // Yeni URL oluştur (daha temiz)
            const baseUrl = `https://www.youtube.com/embed/${videoId}`;
            const params = new URLSearchParams({
                autoplay: autoplay ? '1' : '0',
                controls: '1',
                modestbranding: '1',
                rel: '0',
                start: currentTime > 0 ? currentTime.toString() : '0'
            });

            const newSrc = `${baseUrl}?${params.toString()}`;

            // Sadece gerçekten farklıysa yeniden yükle
            if (iframe.src !== newSrc) {
                iframe.src = newSrc;
            }

        } catch (error) {
            console.error('YouTube reload hatası:', error);
            // Hata durumunda sadece görsel güncelleme yap
            this.updateYouTubeControlPanel(autoplay ? 'playing' : 'paused');
        }
    }

    reloadYouTubeFromTime(seconds) {
        if (!this.youtubePlayer || !this.youtubePlayer.iframe) return;

        try {
            const iframe = this.youtubePlayer.iframe;
            const videoId = this.youtubePlayer.videoId;
            const startTime = Math.floor(seconds);

            // Yeni URL oluştur
            const baseUrl = `https://www.youtube.com/embed/${videoId}`;
            const params = new URLSearchParams({
                autoplay: this.youtubePlayer.isPlaying ? '1' : '0',
                controls: '1',
                modestbranding: '1',
                rel: '0',
                start: startTime.toString()
            });

            const newSrc = `${baseUrl}?${params.toString()}`;
            iframe.src = newSrc;

        } catch (error) {
            console.error('YouTube seek hatası:', error);
            // Hata durumunda sadece görsel güncelleme
            this.youtubePlayer.currentTime = seconds;
            const percentage = (seconds / this.youtubePlayer.duration) * 100;
            this.progressBar.style.width = `${percentage}%`;
            this.timeCursor.style.left = `${percentage}%`;
            this.currentTime.textContent = this.formatTime(seconds);
        }
    }

    startYouTubeProgressSimulation() {
        this.stopYouTubeProgressSimulation();

        this.youtubeProgressInterval = setInterval(() => {
            if (this.youtubePlayer && this.youtubePlayer.isPlaying) {
                this.youtubePlayer.currentTime += 1;

                const currentTime = this.youtubePlayer.currentTime;
                const duration = this.youtubePlayer.duration;

                if (currentTime >= duration) {
                    this.onAudioEnded();
                    return;
                }

                // Progress bar'ı güncelle
                const percentage = (currentTime / duration) * 100;
                this.progressBar.style.width = `${percentage}%`;
                this.timeCursor.style.left = `${percentage}%`;
                this.currentTime.textContent = this.formatTime(currentTime);

                // Kaydetme
                if (Math.floor(currentTime) % 10 === 0) {
                    this.saveCurrentTrackData();
                }
            }
        }, 1000);
    }

    stopYouTubeProgressSimulation() {
        if (this.youtubeProgressInterval) {
            clearInterval(this.youtubeProgressInterval);
            this.youtubeProgressInterval = null;
        }
    }

    handleYouTubeProgress(info) {
        // YouTube'dan gelen progress bilgilerini işle
        if (this.youtubePlayer && info) {
            this.youtubePlayer.currentTime = info.currentTime || 0;
            this.youtubePlayer.duration = info.duration || 180;

            // Progress bar'ı güncelle
            if (this.youtubePlayer.duration > 0) {
                const percentage = (this.youtubePlayer.currentTime / this.youtubePlayer.duration) * 100;
                this.progressBar.style.width = `${percentage}%`;
                this.timeCursor.style.left = `${percentage}%`;
                this.currentTime.textContent = this.formatTime(this.youtubePlayer.currentTime);
                this.totalTime.textContent = this.formatTime(this.youtubePlayer.duration);
            }
        }
    }

    handleYouTubeStateChange(state) {
        // YouTube'dan gelen durum değişikliklerini işle
        if (this.youtubePlayer) {
            switch (state) {
                case 1: // Playing
                    this.youtubePlayer.isPlaying = true;
                    this.isPlaying = true;
                    this.playBtn.innerHTML = '<i class="fas fa-pause"></i>';
                    break;
                case 2: // Paused
                    this.youtubePlayer.isPlaying = false;
                    this.isPlaying = false;
                    this.playBtn.innerHTML = '<i class="fas fa-play"></i>';
                    break;
                case 0: // Ended
                    this.onAudioEnded();
                    break;
            }
        }
    }

    getCurrentTime() {
        if (this.currentTrack && this.currentTrack.source === 'youtube' && this.youtubePlayer && this.youtubePlayer.isSimulated) {
            return this.youtubePlayer.currentTime || 0;
        }
        return this.audio.currentTime || 0;
    }

    // getCurrentDuration fonksiyonu aşağıda tanımlanmış

    // Diğer fonksiyonlar buraya eklenecek...
    formatTime(seconds) {
        if (isNaN(seconds)) return '0:00';
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    loadSavedTracks() {
        try {
            const saved = localStorage.getItem('mp3player_saved_tracks');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('Kayıtlı müzikler yüklenirken hata:', error);
            return [];
        }
    }

    saveSavedTracks() {
        try {
            localStorage.setItem('mp3player_saved_tracks', JSON.stringify(this.savedTracks));
        } catch (error) {
            console.error('Müzikler kaydedilirken hata:', error);
        }
    }

    loadSavedTracksList() {
        this.savedTracksList.innerHTML = '';

        if (this.savedTracks.length === 0) {
            this.savedTracksList.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">Henüz kayıtlı müzik yok</p>';
            return;
        }

        // Tarihe göre sırala (en yeni önce)
        const sortedTracks = [...this.savedTracks].sort((a, b) => {
            const dateA = new Date(a.lastPlayed || a.dateAdded);
            const dateB = new Date(b.lastPlayed || b.dateAdded);
            return dateB - dateA;
        });

        sortedTracks.forEach(track => {
            const trackElement = document.createElement('div');
            trackElement.className = 'saved-track-item';

            const bookmarkCount = track.bookmarks ? track.bookmarks.length : 0;
            const lastPlayedDate = track.lastPlayed ? new Date(track.lastPlayed) : new Date(track.dateAdded);
            const timeAgo = this.getTimeAgo(lastPlayedDate);
            const fullDate = lastPlayedDate.toLocaleString('tr-TR');

            const sourceIcon = track.source === 'file' ? '📁' :
                track.source === 'youtube' ? '📺' : '🔗';

            trackElement.innerHTML = `
                <div class="saved-track-info">
                    <div class="saved-track-title">
                        ${sourceIcon} ${track.title}
                        ${track.source === 'file' ? '<span class="file-required">*</span>' : ''}
                    </div>
                    <div class="saved-track-meta">
                        ${track.artist} • ${bookmarkCount} bayrak
                        <span class="saved-track-position">
                            ${track.lastPosition ? `• ${this.formatTime(track.lastPosition)} konumunda` : ''}
                        </span>
                    </div>
                </div>
                <div class="saved-track-time">
                    <div class="time-ago" title="${fullDate}">${timeAgo}</div>
                </div>
                <div class="saved-track-actions">
                    <button type="button" class="delete-saved-track" data-id="${track.id}" title="Sil">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;

            trackElement.addEventListener('click', (e) => {
                if (!e.target.closest('.delete-saved-track')) {
                    this.loadSavedTrack(track);
                }
            });

            const deleteBtn = trackElement.querySelector('.delete-saved-track');
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteSavedTrack(track.id);
            });

            this.savedTracksList.appendChild(trackElement);
        });
    }

    getTimeAgo(date) {
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) {
            return 'Az önce';
        } else if (diffInSeconds < 3600) {
            const minutes = Math.floor(diffInSeconds / 60);
            return `${minutes} dk önce`;
        } else if (diffInSeconds < 86400) {
            const hours = Math.floor(diffInSeconds / 3600);
            return `${hours} saat önce`;
        } else if (diffInSeconds < 2592000) {
            const days = Math.floor(diffInSeconds / 86400);
            return `${days} gün önce`;
        } else if (diffInSeconds < 31536000) {
            const months = Math.floor(diffInSeconds / 2592000);
            return `${months} ay önce`;
        } else {
            const years = Math.floor(diffInSeconds / 31536000);
            return `${years} yıl önce`;
        }
    }

    loadSavedTrack(track) {
        if (track.source === 'file') {
            this.requestFileForSavedTrack(track);
            return;
        }

        this.currentTrack = { ...track };
        this.loadTrack(this.currentTrack);
    }

    requestFileForSavedTrack(savedTrack) {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'audio/*';
        fileInput.style.display = 'none';

        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            if (savedTrack.fileData) {
                if (file.name !== savedTrack.fileData.name ||
                    file.size !== savedTrack.fileData.size) {
                    const confirmLoad = confirm(
                        `Seçilen dosya kaydedilen dosyadan farklı görünüyor.\n\n` +
                        `Kaydedilen: ${savedTrack.fileData.name} (${this.formatFileSize(savedTrack.fileData.size)})\n` +
                        `Seçilen: ${file.name} (${this.formatFileSize(file.size)})\n\n` +
                        `Yine de yüklemek istiyor musunuz?`
                    );

                    if (!confirmLoad) return;
                }
            }

            const url = URL.createObjectURL(file);
            savedTrack.url = url;

            this.currentTrack = { ...savedTrack };
            this.loadTrack(this.currentTrack);

            document.body.removeChild(fileInput);
        });

        document.body.appendChild(fileInput);
        fileInput.click();
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    deleteSavedTrack(trackId) {
        if (confirm('Bu müziği silmek istediğinizden emin misiniz?')) {
            this.savedTracks = this.savedTracks.filter(t => t.id !== trackId);
            this.saveSavedTracks();
            this.loadSavedTracksList();
        }
    }

    showPlayer() {
        this.playerMain.classList.add('active');
    }

    setupWaveform() {
        this.resizeCanvas();
        this.drawWaveform();
    }

    resizeCanvas() {
        const container = this.waveformCanvas.parentElement;
        this.waveformCanvas.width = container.offsetWidth;
        this.waveformCanvas.height = container.offsetHeight;
    }

    drawWaveform() {
        const canvas = this.waveformCanvas;
        const ctx = this.waveformCtx;
        const width = canvas.width;
        const height = canvas.height;

        ctx.clearRect(0, 0, width, height);
        
        // Arka plan
        ctx.fillStyle = '#f8f9fa';
        ctx.fillRect(0, 0, width, height);

        if (this.audioContext && this.audioBuffer) {
            // Gerçek ses verisi ile waveform çiz
            this.drawRealWaveform(ctx, width, height);
        } else {
            // Simulated waveform (YouTube veya yüklenmemiş dosyalar için)
            this.drawSimulatedWaveform(ctx, width, height);
        }
    }

    drawRealWaveform(ctx, width, height) {
        const audioData = this.audioBuffer.getChannelData(0);
        const step = Math.ceil(audioData.length / width);
        const centerY = height / 2;
        const amplitude = height * 0.4;

        ctx.strokeStyle = '#667eea';
        ctx.lineWidth = 1;
        ctx.beginPath();

        for (let i = 0; i < width; i++) {
            let min = 1.0;
            let max = -1.0;
            
            for (let j = 0; j < step; j++) {
                const datum = audioData[(i * step) + j];
                if (datum < min) min = datum;
                if (datum > max) max = datum;
            }
            
            const yMin = centerY + (min * amplitude);
            const yMax = centerY + (max * amplitude);
            
            if (i === 0) {
                ctx.moveTo(i, yMin);
            } else {
                ctx.lineTo(i, yMin);
            }
            ctx.lineTo(i, yMax);
        }

        ctx.stroke();
    }

    drawSimulatedWaveform(ctx, width, height) {
        const centerY = height / 2;
        const amplitude = height * 0.3;

        // Daha gerçekçi simulated waveform
        ctx.strokeStyle = '#667eea';
        ctx.lineWidth = 1;
        ctx.beginPath();

        for (let x = 0; x < width; x += 1) {
            // Çoklu frekans karışımı
            const freq1 = Math.sin(x * 0.01) * 0.5;
            const freq2 = Math.sin(x * 0.03) * 0.3;
            const freq3 = Math.sin(x * 0.05) * 0.2;
            const noise = (Math.random() - 0.5) * 0.4;
            
            const wave = (freq1 + freq2 + freq3 + noise) * amplitude;
            const y = centerY + wave;

            if (x === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }

        ctx.stroke();
    }

    async generateWaveformData(audioUrl) {
        try {
            // AudioContext oluştur
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }

            // Ses dosyasını fetch et
            const response = await fetch(audioUrl);
            const arrayBuffer = await response.arrayBuffer();
            
            // Ses verisini decode et
            this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            
            // Waveform'u yeniden çiz
            this.drawWaveform();
            
        } catch (error) {
            console.error('Waveform verisi oluşturulamadı:', error);
            // Hata durumunda simulated waveform kullan
            this.audioBuffer = null;
            this.drawWaveform();
        }
    }

    switchTab(tabName) {
        this.tabBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        this.tabPanels.forEach(panel => {
            panel.classList.toggle('active', panel.id === `${tabName}-panel`);
        });
    }

    async loadFile(file) {
        if (!file) return;
        try {
            const url = URL.createObjectURL(file);
            const fileName = file.name.replace(/\.[^/.]+$/, "");

            this.currentTrack = {
                id: this.generateId(),
                title: fileName,
                artist: 'Yerel Dosya',
                source: 'file',
                url: url,
                fileData: {
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    lastModified: file.lastModified
                },
                bookmarks: [],
                volume: 50,
                lastPosition: 0,
                dateAdded: new Date().toISOString()
            };

            this.loadTrack(this.currentTrack);
        } catch (error) {
            console.error('Dosya yükleme hatası:', error);
            alert('Dosya yüklenirken hata oluştu. Lütfen tekrar deneyin.');
        }
    }

    loadURL(url) {
        if (!url) {
            alert('Lütfen geçerli bir URL girin');
            return;
        }

        const fileName = url.split('/').pop().split('?')[0];

        this.currentTrack = {
            id: this.generateId(),
            title: fileName || 'Bilinmeyen Şarkı',
            artist: 'URL Kaynağı',
            source: 'url',
            url: url,
            bookmarks: [],
            volume: 50,
            lastPosition: 0,
            dateAdded: new Date().toISOString()
        };

        this.loadTrack(this.currentTrack);
    }

    async loadYouTube(url) {
        if (!url) {
            alert('Lütfen geçerli bir YouTube URL\'si girin');
            return;
        }

        const loadBtn = document.getElementById('load-youtube');
        const originalText = loadBtn.innerHTML;
        loadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Yükleniyor...';
        loadBtn.disabled = true;

        try {
            const videoId = this.extractYouTubeId(url);
            if (!videoId) {
                alert('Geçersiz YouTube URL\'si. Lütfen doğru bir URL girin.');
                return;
            }

            console.log('YouTube video ID:', videoId);

            this.currentTrack = {
                id: this.generateId(),
                title: 'YouTube Video',
                artist: 'YouTube',
                source: 'youtube',
                url: url,
                youtubeId: videoId,
                originalUrl: url,
                bookmarks: [],
                volume: 50,
                lastPosition: 0,
                dateAdded: new Date().toISOString()
            };

            this.loadTrack(this.currentTrack);

        } catch (error) {
            console.error('YouTube yükleme hatası:', error);
            alert(`YouTube videosu yüklenirken hata oluştu: ${error.message}`);
        } finally {
            loadBtn.innerHTML = originalText;
            loadBtn.disabled = false;
        }
    }

    extractYouTubeId(url) {
        if (this.youtubeIntegration) {
            return this.youtubeIntegration.extractVideoId(url);
        }
        return null;
    }

    extractYouTubeId(url) {
        const patterns = [
            /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
            /youtube\.com\/watch\?.*v=([^&\n?#]+)/
        ];

        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match && match[1].length === 11) {
                return match[1];
            }
        }
        return null;
    }

    async getYouTubeVideoInfo(videoId) {
        try {
            const response = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`);
            if (response.ok) {
                const data = await response.json();
                return {
                    title: data.title || 'YouTube Video',
                    channelTitle: data.author_name || 'YouTube',
                    thumbnail: data.thumbnail_url || `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
                };
            }
        } catch (error) {
            console.error('Video info alınamadı:', error);
        }

        return {
            title: 'YouTube Video',
            channelTitle: 'YouTube',
            thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
        };
    }

    loadTrack(track) {
        // Önceki track'i temizle
        this.cleanupPreviousTrack();
        
        this.currentTrack = track;
        this.trackTitle.textContent = track.title;
        this.trackArtist.textContent = track.artist;
        this.bookmarks = [...track.bookmarks];
        this.volumeSlider.value = track.volume;

        if (track.source === 'youtube') {
            this.youtubePlayerContainer.style.display = 'none';
            this.audio.style.display = 'none';

            // YouTube player'ı oluştur
            this.createYouTubePlayer(track.youtubeId);
        } else {
            this.youtubePlayerContainer.style.display = 'none';
            this.audio.style.display = 'block';
            this.audio.src = track.url;
            this.audio.volume = track.volume / 100;

            // Gerçek waveform verisi oluştur
            this.generateWaveformData(track.url);

            this.audio.addEventListener('loadedmetadata', () => {
                if (track.lastPosition > 0) {
                    this.audio.currentTime = track.lastPosition;
                }
                this.updateWaveformBookmarks();
            }, { once: true });
        }

        this.showPlayer();
        this.updateBookmarksList();
        this.drawWaveform();
    }

    cleanupPreviousTrack() {
        // YouTube integration'ı tamamen temizle
        if (this.youtubeIntegration) {
            this.youtubeIntegration.destroy();
        }

        // Audio'yu durdur ve temizle
        if (this.audio) {
            this.audio.pause();
            this.audio.currentTime = 0;
            this.audio.src = '';
        }

        // Playing state'i sıfırla
        this.isPlaying = false;
        if (this.playBtn) {
            this.playBtn.innerHTML = '<i class="fas fa-play"></i>';
        }

        // Progress bar'ı sıfırla
        if (this.progressBar) {
            this.progressBar.style.width = '0%';
        }
        if (this.timeCursor) {
            this.timeCursor.style.left = '0%';
        }
        if (this.currentTime) {
            this.currentTime.textContent = '0:00';
        }
        if (this.totalTime) {
            this.totalTime.textContent = '0:00';
        }
    }

    togglePlay() {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }

    play() {
        if (this.currentTrack && this.currentTrack.source === 'youtube' && this.youtubeIntegration) {
            this.youTubeTogglePlayPause();
        } else {
            this.audio.play();
            this.isPlaying = true;
            this.playBtn.innerHTML = '<i class="fas fa-pause"></i>';
        }
    }

    pause() {
        if (this.currentTrack && this.currentTrack.source === 'youtube' && this.youtubeIntegration) {
            this.youTubeTogglePlayPause();
        } else {
            this.audio.pause();
            this.isPlaying = false;
            this.playBtn.innerHTML = '<i class="fas fa-play"></i>';
        }
    }

    seekBackward() {
        if (this.currentTrack && this.currentTrack.source === 'youtube' && this.youtubeIntegration) {
            this.youTubeSkipBackward(10);
        } else {
            this.audio.currentTime = Math.max(0, this.audio.currentTime - 10);
        }
    }

    seekForward() {
        if (this.currentTrack && this.currentTrack.source === 'youtube' && this.youtubeIntegration) {
            this.youTubeSkipForward(10);
        } else {
            this.audio.currentTime = Math.min(this.audio.duration, this.audio.currentTime + 10);
        }
    }

    onAudioLoaded() {
        this.totalTime.textContent = this.formatTime(this.audio.duration);
        this.drawWaveform();
        this.updateWaveformBookmarks();
    }

    updateProgress() {
        if (!this.audio.duration) return;

        const currentTime = this.audio.currentTime;
        const duration = this.audio.duration;

        // NaN kontrolü ekle
        if (isNaN(currentTime) || isNaN(duration) || duration <= 0) return;

        const percentage = Math.max(0, Math.min(100, (currentTime / duration) * 100));

        // Sadece değişiklik varsa güncelle (titreme önleme)
        const currentPercentage = parseFloat(this.progressBar.style.width) || 0;
        if (Math.abs(percentage - currentPercentage) > 0.1) {
            this.progressBar.style.width = `${percentage}%`;
            this.timeCursor.style.left = `${percentage}%`;
        }

        this.currentTime.textContent = this.formatTime(currentTime);

        if (this.currentTrack && Math.floor(currentTime) % 5 === 0) {
            this.saveCurrentTrackData();
        }
    }

    onAudioEnded() {
        this.isPlaying = false;
        this.playBtn.innerHTML = '<i class="fas fa-play"></i>';
        this.progressBar.style.width = '0%';
        this.timeCursor.style.left = '0%';
    }

    addQuickBookmark() {
        if (!this.getCurrentDuration()) return;
        const currentTime = this.getCurrentTime();
        const name = `Bayrak ${this.bookmarks.length + 1}`;
        this.addBookmark(currentTime, name);
    }

    addNamedBookmark() {
        if (!this.getCurrentDuration()) return;
        const name = this.bookmarkNameInput.value.trim();
        if (!name) {
            alert('Lütfen bayrak adı girin');
            return;
        }
        const currentTime = this.getCurrentTime();
        this.addBookmark(currentTime, name);
        this.bookmarkNameInput.value = '';
    }

    getCurrentTime() {
        if (this.currentTrack && this.currentTrack.source === 'youtube' && this.youtubeIntegration) {
            return this.youtubeIntegration.getCurrentTime();
        }
        return this.audio.currentTime || 0;
    }

    getCurrentDuration() {
        if (this.currentTrack && this.currentTrack.source === 'youtube' && this.youtubeIntegration) {
            return this.youtubeIntegration.getDuration();
        }
        return this.audio.duration || 0;
    }

    addBookmark(time, name) {
        const exists = this.bookmarks.some(b => Math.abs(b.time - time) < 1);
        if (exists) {
            alert('Bu konumda zaten bir bayrak var!');
            return;
        }

        const bookmark = {
            id: this.generateId(),
            time: time,
            name: name,
            timeLabel: this.formatTime(time)
        };

        this.bookmarks.push(bookmark);
        this.bookmarks.sort((a, b) => a.time - b.time);
        this.updateBookmarksList();
        this.updateWaveformBookmarks();
        this.saveCurrentTrackData();
    }

    updateBookmarksList() {
        this.bookmarksList.innerHTML = '';

        this.bookmarks.forEach((bookmark) => {
            const bookmarkElement = document.createElement('div');
            bookmarkElement.className = 'bookmark-item';
            bookmarkElement.innerHTML = `
                <div class="bookmark-info">
                    <i class="fas fa-flag"></i>
                    <span class="bookmark-name">${bookmark.name}</span>
                    <span class="bookmark-time">${bookmark.timeLabel}</span>
                </div>
                <div class="bookmark-actions">
                    <button type="button" class="remove-bookmark" data-id="${bookmark.id}">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;

            bookmarkElement.addEventListener('click', (e) => {
                if (!e.target.closest('.remove-bookmark')) {
                    if (this.currentTrack && this.currentTrack.source === 'youtube' && this.youtubeIntegration) {
                        this.youTubeSeekTo(bookmark.time);
                    } else {
                        this.audio.currentTime = bookmark.time;
                    }
                }
            });

            const removeBtn = bookmarkElement.querySelector('.remove-bookmark');
            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.removeBookmark(bookmark.id);
            });

            this.bookmarksList.appendChild(bookmarkElement);
        });
    }

    updateWaveformBookmarks() {
        // Container'ları temizle
        if (this.waveformBookmarks) {
            this.waveformBookmarks.innerHTML = '';
        }
        if (this.waveformBookmarkLabels) {
            this.waveformBookmarkLabels.innerHTML = '';
        }

        const duration = this.getCurrentDuration();
        if (!duration || this.bookmarks.length === 0) return;

        // Her bayrak için görsel element oluştur
        this.bookmarks.forEach((bookmark, index) => {
            this.createWaveformBookmark(bookmark, duration, index);
        });
    }

    createWaveformBookmark(bookmark, duration, index) {
        const percentage = (bookmark.time / duration) * 100;
        
        // 3 seviyeli basamak sistemi (0, 1, 2)
        const level = index % 3;
        const levelColors = ['#ff4757', '#2ed573', '#3742fa']; // Kırmızı, Yeşil, Mavi
        const levelTops = [5, 35, 65]; // Y pozisyonları
        const levelLabelTops = [20, 50, 80]; // Label pozisyonları
        
        const color = levelColors[level];
        const topPosition = levelTops[level];
        const labelTop = levelLabelTops[level];
        
        // Transform'u dinamik hesapla (sol/sağ kenar kontrolü)
        let transformX = '-50%'; // Varsayılan orta
        let leftAdjust = 0; // Sol kenar için ek margin
        
        if (percentage < 20) {
            transformX = '0%'; // Sol kenarda - sola yasla
            leftAdjust = 5; // 5px sağa kaydır
        } else if (percentage > 80) {
            transformX = '-100%'; // Sağ kenarda - sağa yasla
            leftAdjust = -5; // 5px sola kaydır
        }
        
        // Bayrak çizgisi (dikey çizgi)
        const bookmarkLine = document.createElement('div');
        bookmarkLine.className = 'waveform-bookmark-line';
        bookmarkLine.style.cssText = `
            position: absolute;
            left: ${percentage}%;
            top: 0;
            width: 2px;
            height: 100%;
            background: ${color};
            z-index: 18;
            cursor: pointer;
            transition: all 0.2s ease;
        `;
        bookmarkLine.dataset.bookmarkId = bookmark.id;
        bookmarkLine.dataset.level = level;
        bookmarkLine.title = `${bookmark.name} - ${this.formatTime(bookmark.time)}`;

        // Tek bayrak container (isim + X butonu birlikte)
        const bookmarkContainer = document.createElement('div');
        bookmarkContainer.className = 'waveform-bookmark-container';
        bookmarkContainer.style.cssText = `
            position: absolute;
            left: calc(${percentage}% + ${leftAdjust}px);
            top: ${topPosition}px;
            z-index: 9999;
            transform: translateX(${transformX});
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            height: 18px;
            background: ${color};
            border-radius: 9px;
            border: 1px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.4);
            overflow: visible;
            cursor: default;
            min-width: 60px;
            max-width: 120px;
        `;
        bookmarkContainer.dataset.bookmarkId = bookmark.id;
        bookmarkContainer.dataset.level = level;
        bookmarkContainer.title = `${bookmark.name} - ${this.formatTime(bookmark.time)}`;

        // Bayrak ismi (sol taraf)
        const bookmarkText = document.createElement('span');
        bookmarkText.className = 'waveform-bookmark-text';
        bookmarkText.style.cssText = `
            color: white;
            font-size: 8px;
            font-weight: bold;
            padding: 0 6px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 60px;
            flex: 1;
            cursor: pointer;
            user-select: none;
        `;
        bookmarkText.textContent = bookmark.name;
        bookmarkText.title = `${bookmark.name} - ${this.formatTime(bookmark.time)} saniyesine git`;

        // X butonu (sağ taraf)
        const deleteButton = document.createElement('span');
        deleteButton.className = 'waveform-bookmark-delete';
        deleteButton.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: center;
            width: 16px;
            height: 16px;
            background: #dc3545;
            color: white;
            font-size: 10px;
            font-weight: bold;
            cursor: pointer;
            margin: 1px;
            border-radius: 50%;
            transition: all 0.2s ease;
            flex-shrink: 0;
            z-index: 10001;
            position: relative;
        `;
        deleteButton.innerHTML = '×';
        deleteButton.dataset.bookmarkId = bookmark.id;
        deleteButton.title = `${bookmark.name} sil`;

        // Container'a ekle
        bookmarkContainer.appendChild(bookmarkText);
        bookmarkContainer.appendChild(deleteButton);



        // Event listener'lar
        const handleBookmarkClick = (e) => {
            console.log('Bayrak tıklandı, hedef saniye:', bookmark.time);
            e.stopPropagation(); // Waveform click'ini engelle
            e.preventDefault();
            
            if (this.currentTrack && this.currentTrack.source === 'youtube' && this.youtubeIntegration) {
                this.youTubeSeekTo(bookmark.time);
            } else {
                this.audio.currentTime = bookmark.time;
            }
        };

        const handleDeleteClick = (e) => {
            console.log('X butonu tıklandı:', bookmark.id);
            e.stopPropagation();
            e.preventDefault();
            this.removeBookmark(bookmark.id);
        };

        const hoverColors = ['#ff2e43', '#27ae60', '#2c3e50']; // Hover renkleri
        const handleBookmarkHover = () => {
            bookmarkLine.style.background = hoverColors[level];
            bookmarkLine.style.width = '3px';
            bookmarkContainer.style.background = hoverColors[level];
            bookmarkContainer.style.transform = `translateX(${transformX}) scale(1.05)`;
            bookmarkContainer.style.zIndex = '10000';
        };

        const handleBookmarkLeave = () => {
            bookmarkLine.style.background = color;
            bookmarkLine.style.width = '2px';
            bookmarkContainer.style.background = color;
            bookmarkContainer.style.transform = `translateX(${transformX}) scale(1)`;
            bookmarkContainer.style.zIndex = '9999';
        };

        const handleDeleteHover = () => {
            deleteButton.style.background = '#c82333';
            deleteButton.style.transform = 'scale(1.1)';
        };

        const handleDeleteLeave = () => {
            deleteButton.style.background = '#dc3545';
            deleteButton.style.transform = 'scale(1)';
        };

        // Event'leri ekle
        bookmarkLine.addEventListener('click', handleBookmarkClick);
        bookmarkLine.addEventListener('mouseenter', handleBookmarkHover);
        bookmarkLine.addEventListener('mouseleave', handleBookmarkLeave);

        // Bayrak text'ine tıklama - bayrak zamanına git
        bookmarkText.addEventListener('click', handleBookmarkClick);
        
        // Container hover (text kısmı için)
        bookmarkContainer.addEventListener('mouseenter', handleBookmarkHover);
        bookmarkContainer.addEventListener('mouseleave', handleBookmarkLeave);

        // X butonu - silme işlemi
        deleteButton.addEventListener('click', handleDeleteClick);
        deleteButton.addEventListener('mouseenter', handleDeleteHover);
        deleteButton.addEventListener('mouseleave', handleDeleteLeave);

        // DOM'a ekle
        if (this.waveformBookmarks) {
            this.waveformBookmarks.appendChild(bookmarkLine);
            this.waveformBookmarks.appendChild(bookmarkContainer);
        }
    }



    // calculateLabelPositions fonksiyonu kaldırıldı - artık gerekli değil

    removeBookmark(bookmarkId) {
        this.bookmarks = this.bookmarks.filter(b => b.id !== bookmarkId);
        this.updateBookmarksList();
        this.updateWaveformBookmarks();
        this.saveCurrentTrackData();
    }

    setupProgressBarDrag() {
        const progressOverlay = document.querySelector('.progress-overlay');
        const timeCursor = document.getElementById('time-cursor');
        let isDragging = false;
        let dragSource = null;
        let lastSeekTime = 0;
        const seekThrottle = 100; // 100ms throttle

        // Tooltip göster/gizle
        const showTooltip = (clientX) => {
            if (!this.timeTooltip || !progressOverlay) return;
            
            const rect = progressOverlay.getBoundingClientRect();
            const x = clientX - rect.left;
            const percentage = Math.max(0, Math.min(1, x / rect.width));
            const duration = this.getCurrentDuration();
            
            if (duration) {
                const time = percentage * duration;
                const currentTimeStr = this.formatTime(this.getCurrentTime());
                const targetTimeStr = this.formatTime(time);
                
                // Tooltip içeriği: mevcut zaman / hedef zaman
                this.timeTooltip.textContent = `${currentTimeStr} / ${targetTimeStr}`;
                this.timeTooltip.style.left = `${percentage * 100}%`;
                this.timeTooltip.classList.add('visible');
            }
        };

        const hideTooltip = () => {
            if (this.timeTooltip) {
                this.timeTooltip.classList.remove('visible');
            }
        };

        // Sadece görsel güncelleme - ses pozisyonu değişmez
        const updateCursorPosition = (clientX) => {
            if (!progressOverlay) return;
            
            const rect = progressOverlay.getBoundingClientRect();
            const x = clientX - rect.left;
            const percentage = Math.max(0, Math.min(1, x / rect.width));
            
            // Sadece time cursor pozisyonunu güncelle
            if (this.timeCursor) {
                this.timeCursor.style.left = `${percentage * 100}%`;
            }
            
            // Tooltip güncelle
            showTooltip(clientX);
            
            return percentage;
        };

        // Ses pozisyonunu güncelle
        const seekToPosition = (clientX) => {
            const duration = this.getCurrentDuration();
            if (!duration) return;
            
            const rect = progressOverlay.getBoundingClientRect();
            const x = clientX - rect.left;
            const percentage = Math.max(0, Math.min(1, x / rect.width));
            const newTime = percentage * duration;
            
            // Ses pozisyonunu güncelle
            if (this.currentTrack && this.currentTrack.source === 'youtube' && this.youtubeIntegration) {
                this.youtubeIntegration.seekTo(newTime);
            } else {
                this.audio.currentTime = newTime;
            }
        };

        const handleMouseMove = (e) => {
            if (!isDragging) return;
            
            if (dragSource === 'cursor') {
                // Time cursor sürükleniyorsa - gerçek zamanlı preview
                const percentage = updateCursorPosition(e.clientX);
                
                // YouTube için throttled gerçek zamanlı seek
                const now = Date.now();
                if (this.currentTrack && this.currentTrack.source === 'youtube' && this.youtubeIntegration && 
                    (now - lastSeekTime > seekThrottle)) {
                    const duration = this.getCurrentDuration();
                    if (duration) {
                        const newTime = percentage * duration;
                        this.youtubeIntegration.seekTo(newTime);
                        lastSeekTime = now;
                    }
                }
            } else {
                // Overlay sürükleniyorsa - hem görsel hem ses + tooltip
                showTooltip(e.clientX);
                seekToPosition(e.clientX);
            }
        };

        const handleMouseUp = (e) => {
            if (!isDragging) return;
            
            // Eğer cursor sürükleniyorsa, bırakma anında ses pozisyonunu güncelle
            if (dragSource === 'cursor') {
                seekToPosition(e.clientX);
            }
            
            isDragging = false;
            dragSource = null;
            
            // YouTube drag bitişini bildir
            if (this.currentTrack && this.currentTrack.source === 'youtube' && this.youtubeIntegration) {
                this.youtubeIntegration.setDragging(false);
            }
            
            // Tooltip gizle
            hideTooltip();
            
            // Cursor sınıfını temizle
            if (timeCursor) {
                timeCursor.classList.remove('dragging');
            }
            
            // Event listener'ları temizle
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            
            // Cursor stillerini sıfırla
            if (progressOverlay) {
                progressOverlay.style.cursor = 'pointer';
            }
        };

        // Progress overlay click - hızlı atlama
        if (progressOverlay) {
            progressOverlay.addEventListener('mousedown', (e) => {
                // Eğer time cursor'a tıklanmışsa, overlay drag'i başlatma
                if (e.target === timeCursor) return;
                
                // Bayrak elementlerine tıklanmışsa drag başlatma
                if (e.target.closest('.waveform-bookmark-container') || 
                    e.target.closest('.waveform-bookmark-line') ||
                    e.target.classList.contains('waveform-bookmark-text') ||
                    e.target.classList.contains('waveform-bookmark-delete')) {
                    return;
                }
                
                isDragging = true;
                dragSource = 'overlay';
                progressOverlay.style.cursor = 'grabbing';

                // Hemen ses pozisyonunu değiştir
                seekToPosition(e.clientX);

                document.addEventListener('mousemove', handleMouseMove);
                document.addEventListener('mouseup', handleMouseUp);
            });
        }

        // Time cursor drag - görsel sürükleme
        if (timeCursor) {
            timeCursor.addEventListener('mousedown', (e) => {
                e.stopPropagation(); // Overlay event'ini engelle
                
                isDragging = true;
                dragSource = 'cursor';
                timeCursor.classList.add('dragging');
                
                // YouTube drag başlangıcını bildir
                if (this.currentTrack && this.currentTrack.source === 'youtube' && this.youtubeIntegration) {
                    this.youtubeIntegration.setDragging(true);
                }
                
                // Tooltip göster
                showTooltip(e.clientX);

                document.addEventListener('mousemove', handleMouseMove);
                document.addEventListener('mouseup', handleMouseUp);
            });
        }

        // Hover tooltip sistemi - basit yaklaşım
        if (progressOverlay) {
            // Hover tooltip oluştur
            let hoverTooltip = document.getElementById('hover-tooltip');
            if (!hoverTooltip) {
                hoverTooltip = document.createElement('div');
                hoverTooltip.id = 'hover-tooltip';
                hoverTooltip.style.cssText = `
                    position: absolute;
                    top: -35px;
                    left: 50%;
                    background: rgba(102, 126, 234, 0.9);
                    color: white;
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 12px;
                    font-weight: bold;
                    z-index: 15;
                    transform: translateX(-50%);
                    opacity: 0;
                    pointer-events: none;
                    transition: opacity 0.2s ease;
                `;
                progressOverlay.appendChild(hoverTooltip);
            }

            // Hover event'leri
            progressOverlay.addEventListener('mousemove', (e) => {
                if (isDragging) return; // Drag sırasında hover gösterme
                
                // Bayrak elementleri üzerindeyse hover tooltip gösterme
                if (e.target.closest('.waveform-bookmark-container') || 
                    e.target.closest('.waveform-bookmark-line') ||
                    e.target.classList.contains('waveform-bookmark-text') ||
                    e.target.classList.contains('waveform-bookmark-delete')) {
                    hoverTooltip.style.opacity = '0';
                    return;
                }
                
                const duration = this.getCurrentDuration();
                if (!duration) return;

                const rect = progressOverlay.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const percentage = Math.max(0, Math.min(1, x / rect.width));
                const time = percentage * duration;

                hoverTooltip.textContent = this.formatTime(time);
                hoverTooltip.style.left = `${percentage * 100}%`;
                hoverTooltip.style.opacity = '1';
            });

            progressOverlay.addEventListener('mouseleave', () => {
                hoverTooltip.style.opacity = '0';
            });
        }
    }



    seekToPosition(event) {
        const duration = this.getCurrentDuration();
        if (!duration) return;

        const rect = this.waveformCanvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const percentage = Math.max(0, Math.min(1, x / rect.width));
        const newTime = percentage * duration;

        if (this.currentTrack && this.currentTrack.source === 'youtube' && this.youtubeIntegration) {
            this.youTubeSeekTo(newTime);
        } else {
            this.audio.currentTime = newTime;
        }
    }

    saveCurrentTrackData() {
        if (!this.currentTrack) return;

        this.currentTrack.bookmarks = [...this.bookmarks];
        this.currentTrack.volume = this.volumeSlider.value;
        this.currentTrack.lastPosition = this.getCurrentTime();
        this.currentTrack.lastPlayed = new Date().toISOString();
    }

    saveCurrentTrack() {
        if (!this.currentTrack) {
            alert('Kaydedilecek müzik yok');
            return;
        }

        try {
            this.saveCurrentTrackData();

            const trackToSave = { ...this.currentTrack };

            if (trackToSave.originalFile) {
                delete trackToSave.originalFile;
            }

            if (trackToSave.source === 'file') {
                delete trackToSave.url;
            }

            const existingIndex = this.savedTracks.findIndex(t => t.id === trackToSave.id);
            if (existingIndex >= 0) {
                this.savedTracks[existingIndex] = trackToSave;
            } else {
                this.savedTracks.push(trackToSave);
            }

            this.saveSavedTracks();
            this.loadSavedTracksList();
            alert('Müzik başarıyla kaydedildi!');

        } catch (error) {
            console.error('Kaydetme hatası:', error);
            alert('Müzik kaydedilirken hata oluştu. Lütfen tekrar deneyin.');
        }
    }

    delayedPlay() {
        const delay = parseInt(this.delayInput.value) || 0;

        if (delay === 0) {
            this.play();
            return;
        }

        this.cancelDelay();

        const delayBtn = document.getElementById('delayed-play');
        const cancelBtn = document.getElementById('cancel-delay');
        const originalText = delayBtn.innerHTML;

        let countdown = delay;
        delayBtn.innerHTML = `<i class="fas fa-clock"></i> ${countdown}s`;
        delayBtn.disabled = true;
        cancelBtn.classList.add('active');

        this.delayInterval = setInterval(() => {
            countdown--;
            if (countdown > 0) {
                delayBtn.innerHTML = `<i class="fas fa-clock"></i> ${countdown}s`;
            } else {
                this.cancelDelay();
                delayBtn.innerHTML = originalText;
                delayBtn.disabled = false;
                this.play();
            }
        }, 1000);

        this.delayTimeout = setTimeout(() => {
            this.cancelDelay();
            delayBtn.innerHTML = originalText;
            delayBtn.disabled = false;
            this.play();
        }, delay * 1000);
    }

    cancelDelay() {
        if (this.delayTimeout) {
            clearTimeout(this.delayTimeout);
            this.delayTimeout = null;
        }

        if (this.delayInterval) {
            clearInterval(this.delayInterval);
            this.delayInterval = null;
        }

        const delayBtn = document.getElementById('delayed-play');
        const cancelBtn = document.getElementById('cancel-delay');

        delayBtn.innerHTML = '<i class="fas fa-clock"></i> Gecikmeli Çal';
        delayBtn.disabled = false;
        cancelBtn.classList.remove('active');
    }
}

// Initialize player when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.player = new ModernMP3Player();
});

// Service Worker registration for PWA support
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}