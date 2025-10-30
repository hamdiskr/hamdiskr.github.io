/**
 * YouTube Integration for Modern MP3 Player
 * Based on YouTube IFrame Player API
 */

class YouTubeIntegration {
    constructor(player) {
        this.player = player;
        this.youtubePlayer = null;
        this.isYouTubeReady = false;
        this.currentVideoId = null;
        this.progressInterval = null;
        this.isDragging = false; // Drag sırasında progress tracking'i durdur
        
        this.initializeYouTubeAPI();
    }

    /**
     * Initialize YouTube IFrame API
     */
    initializeYouTubeAPI() {
        console.log('YouTube API yükleniyor...');
        
        // YouTube API script'i yükle
        if (!window.YT) {
            const script = document.createElement('script');
            script.src = 'https://www.youtube.com/iframe_api';
            document.head.appendChild(script);
        }
        
        // Global callback fonksiyonunu tanımla
        window.onYouTubeIframeAPIReady = () => {
            console.log('YouTube IFrame API hazır');
            this.isYouTubeReady = true;
        };
        
        // Eğer API zaten yüklüyse
        if (window.YT && window.YT.Player) {
            this.isYouTubeReady = true;
            console.log('YouTube API zaten yüklü');
        }
    }

    /**
     * Extract video ID from YouTube URL
     */
    extractVideoId(url) {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    }

    /**
     * Create YouTube player
     */
    createPlayer(videoId) {
        console.log('YouTube player oluşturuluyor:', videoId);
        
        if (!this.isYouTubeReady) {
            console.log('YouTube API henüz hazır değil, bekleniyor...');
            setTimeout(() => this.createPlayer(videoId), 1000);
            return;
        }
        
        try {
            const playerContainer = document.getElementById('youtube-player');
            if (!playerContainer) {
                console.error('YouTube player container bulunamadı');
                return;
            }

            // Mevcut player'ı temizle
            if (this.youtubePlayer && this.youtubePlayer.destroy) {
                this.youtubePlayer.destroy();
            }
            
            // Container'ı temizle
            playerContainer.innerHTML = '';
            
            // YouTube IFrame API Player oluştur
            this.youtubePlayer = new YT.Player('youtube-player', {
                height: '250',
                width: '100%',
                videoId: videoId,
                events: {
                    'onReady': (event) => this.onPlayerReady(event),
                    'onStateChange': (event) => this.onPlayerStateChange(event)
                },
                playerVars: {
                    'playsinline': 1,
                    'controls': 0, // Kendi kontrollerimizi kullanacağız
                    'rel': 0,
                    'showinfo': 0,
                    'modestbranding': 1
                }
            });
            
            this.currentVideoId = videoId;
            
            // Container'ı göster
            const container = document.getElementById('youtube-player-container');
            if (container) {
                container.style.display = 'block';
            }
            
            console.log('YouTube player başarıyla oluşturuldu');
            
        } catch (error) {
            console.error('YouTube player oluşturma hatası:', error);
            this.handleError('creation_error');
        }
    }

    /**
     * Player ready event handler
     */
    onPlayerReady(event) {
        console.log('YouTube player hazır');
        
        // Duration'ı al
        const duration = this.youtubePlayer.getDuration();
        console.log('YouTube player duration:', duration);
        
        if (this.player.totalTime) {
            this.player.totalTime.textContent = this.player.formatTime(duration);
        }
        
        // Progress tracking başlat
        this.startProgressTracking();
        
        // Waveform'u güncelle
        if (this.player.updateWaveformBookmarks) {
            this.player.updateWaveformBookmarks();
        }
        if (this.player.drawWaveform) {
            this.player.drawWaveform();
        }
        
        console.log('YouTube player kurulumu tamamlandı, duration:', duration);
    }

    /**
     * Player state change event handler
     */
    onPlayerStateChange(event) {
        console.log('YouTube player durumu değişti:', event.data);
        
        if (event.data === YT.PlayerState.PLAYING) {
            this.player.isPlaying = true;
            if (this.player.playBtn) {
                this.player.playBtn.innerHTML = '<i class="fas fa-pause"></i>';
            }
        } else if (event.data === YT.PlayerState.PAUSED) {
            this.player.isPlaying = false;
            if (this.player.playBtn) {
                this.player.playBtn.innerHTML = '<i class="fas fa-play"></i>';
            }
        } else if (event.data === YT.PlayerState.ENDED) {
            if (this.player.onAudioEnded) {
                this.player.onAudioEnded();
            }
        }
    }

    /**
     * Start progress tracking
     */
    startProgressTracking() {
        // Mevcut interval'ı temizle
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
        }

        // Progress tracking başlat - daha smooth için 250ms
        this.progressInterval = setInterval(() => {
            // Drag sırasında progress tracking'i durdur
            if (this.isDragging || !this.youtubePlayer || !this.youtubePlayer.getCurrentTime) {
                return;
            }
            
            const currentTime = this.youtubePlayer.getCurrentTime();
            const duration = this.youtubePlayer.getDuration();
            
            // UI'yi güncelle
            if (this.player.currentTime) {
                this.player.currentTime.textContent = this.player.formatTime(currentTime);
            }
            
            if (duration > 0 && this.player.progressBar && this.player.timeCursor) {
                const progress = (currentTime / duration) * 100;
                this.player.progressBar.style.width = progress + '%';
                this.player.timeCursor.style.left = progress + '%';
            }
            
            // Kaydetme işlemi (her 10 saniyede bir)
            if (this.player.currentTrack && Math.floor(currentTime) % 10 === 0) {
                this.player.currentTrack.lastPosition = currentTime;
                if (this.player.saveCurrentTrackData) {
                    this.player.saveCurrentTrackData();
                }
            }
        }, 250);
    }

    /**
     * Control functions
     */
    togglePlayPause() {
        if (!this.youtubePlayer) return;
        
        if (this.player.isPlaying) {
            this.youtubePlayer.pauseVideo();
        } else {
            this.youtubePlayer.playVideo();
        }
    }

    setVolume(volume) {
        if (!this.youtubePlayer) return;
        
        this.youtubePlayer.setVolume(volume);
    }

    seekTo(seconds) {
        if (!this.youtubePlayer) return;
        
        // Smooth seek için allowSeekAhead = true
        this.youtubePlayer.seekTo(seconds, true);
    }

    skipForward(seconds = 10) {
        if (!this.youtubePlayer) return;
        
        const currentTime = this.youtubePlayer.getCurrentTime();
        this.youtubePlayer.seekTo(currentTime + seconds, true);
    }

    skipBackward(seconds = 10) {
        if (!this.youtubePlayer) return;
        
        const currentTime = this.youtubePlayer.getCurrentTime();
        this.youtubePlayer.seekTo(Math.max(0, currentTime - seconds), true);
    }

    /**
     * Handle errors
     */
    handleError(errorType) {
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
        const container = document.getElementById('youtube-player-container');
        if (container) {
            container.style.display = 'block';
        }
    }

    /**
     * Get current time
     */
    getCurrentTime() {
        if (this.youtubePlayer && this.youtubePlayer.getCurrentTime) {
            return this.youtubePlayer.getCurrentTime();
        }
        return 0;
    }

    /**
     * Get duration
     */
    getDuration() {
        if (this.youtubePlayer && this.youtubePlayer.getDuration) {
            return this.youtubePlayer.getDuration();
        }
        return 0;
    }

    /**
     * Drag başladığında çağrıl
     */
    setDragging(isDragging) {
        this.isDragging = isDragging;
    }

    /**
     * Test function - YouTube player durumunu kontrol et
     */
    testPlayerStatus() {
        console.log('=== YouTube Player Status ===');
        console.log('youtubePlayer:', this.youtubePlayer);
        console.log('isYouTubeReady:', this.isYouTubeReady);
        console.log('currentVideoId:', this.currentVideoId);
        
        if (this.youtubePlayer) {
            console.log('getCurrentTime:', this.youtubePlayer.getCurrentTime());
            console.log('getDuration:', this.youtubePlayer.getDuration());
            console.log('getPlayerState:', this.youtubePlayer.getPlayerState());
        }
        console.log('=============================');
    }

    /**
     * Cleanup
     */
    destroy() {
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
            this.progressInterval = null;
        }
        
        if (this.youtubePlayer && this.youtubePlayer.destroy) {
            this.youtubePlayer.destroy();
            this.youtubePlayer = null;
        }
    }
}