import { useEffect, useRef, useState } from "react";

const AudioStatsRealtime = ({ audioContext, audioSource, isPlaying }) => {
    const [stats, setStats] = useState({
        rms: 0,
        peak: 0,
        frequencyData: null,
        db: 0,
        peakDb: 0
    });
    
    const analyserRef = useRef(null);
    const animationFrameRef = useRef(null);
    const spectrumCanvasRef = useRef(null);
    const vuMeterCanvasRef = useRef(null);
    const localAudioContextRef = useRef(null);
    const initTimeoutRef = useRef(null);
    const [debugInfo, setDebugInfo] = useState({
        analyserConnected: false,
        hasData: false,
        error: null
    });

    useEffect(() => {
        // Ne pas initialiser si audioSource n'est pas disponible
        if (!audioSource) {
            console.log('AudioStatsRealtime: audioSource manquant, attente...');
            // Réessayer après un court délai au cas où audioSource serait chargé plus tard
            initTimeoutRef.current = setTimeout(() => {
                if (!audioSource) {
                    console.warn('AudioStatsRealtime: audioSource toujours manquant après délai');
                    setDebugInfo({ analyserConnected: false, hasData: false, error: 'audioSource manquant' });
                }
            }, 1000);
            return () => {
                if (initTimeoutRef.current) {
                    clearTimeout(initTimeoutRef.current);
                    initTimeoutRef.current = null;
                }
            };
        }

        // Fonction pour trouver l'élément audio HTML réel
        const findMediaElement = () => {
            // Méthode 1 : Via WaveSurfer getMediaElement() (le plus fiable)
            if (audioSource?.getMediaElement) {
                try {
                    const el = audioSource.getMediaElement();
                    if (el && (el instanceof HTMLAudioElement || el instanceof HTMLMediaElement)) {
                        console.log('✅ AudioStatsRealtime: Élément audio via getMediaElement()');
                        return el;
                    }
                } catch (e) {
                    // Ignorer
                }
            }
            
            // Méthode 2 : Via backend.mediaElement
            if (audioSource?.backend?.mediaElement) {
                const el = audioSource.backend.mediaElement;
                if (el && (el instanceof HTMLAudioElement || el instanceof HTMLMediaElement)) {
                    console.log('✅ AudioStatsRealtime: Élément audio via backend.mediaElement');
                    return el;
                }
            }
            
            // Méthode 3 : Via backend.media
            if (audioSource?.backend?.media) {
                const el = audioSource.backend.media;
                if (el && (el instanceof HTMLAudioElement || el instanceof HTMLMediaElement)) {
                    console.log('✅ AudioStatsRealtime: Élément audio via backend.media');
                    return el;
                }
            }
            
            // Méthode 4 : Chercher dans le DOM (dernier recours)
            const audioElements = document.querySelectorAll('audio');
            for (let audio of audioElements) {
                if (audio instanceof HTMLAudioElement || audio instanceof HTMLMediaElement) {
                    console.log('✅ AudioStatsRealtime: Élément audio trouvé dans le DOM');
                    return audio;
                }
            }
            
            return null;
        };

        // Attendre que WaveSurfer soit prêt avec plusieurs tentatives
        let attempts = 0;
        const maxAttempts = 30; // 30 tentatives = 6 secondes max
        
        const tryInit = () => {
            attempts++;
            
            // Vérifier que audioSource existe et est valide
            if (!audioSource) {
                if (attempts < maxAttempts) {
                    initTimeoutRef.current = setTimeout(tryInit, 200);
                    return;
                }
                console.warn('⚠️ AudioStatsRealtime: audioSource non disponible');
                setDebugInfo({ analyserConnected: false, hasData: false, error: 'audioSource non disponible' });
                return;
            }
            
            const mediaElement = findMediaElement();
            
            if (!mediaElement && attempts < maxAttempts) {
                // Réessayer après 200ms
                initTimeoutRef.current = setTimeout(tryInit, 200);
                return;
            }
            
            if (!mediaElement) {
                console.warn('⚠️ AudioStatsRealtime: Élément audio non trouvé après', attempts, 'tentatives');
                setDebugInfo({ analyserConnected: false, hasData: false, error: 'Élément audio non trouvé' });
                return;
            }
            
            console.log('✅ AudioStatsRealtime: Élément audio trouvé après', attempts, 'tentatives');

            // Utiliser l'analyser de WaveSurfer si disponible (MEILLEURE méthode)
            if (audioSource?.backend?.analyser) {
                console.log('✅ AudioStatsRealtime: Utilisation de l\'analyser WaveSurfer');
                analyserRef.current = audioSource.backend.analyser;
                setDebugInfo({ analyserConnected: true, hasData: false, error: null });
                startAnalysis();
                return;
            }

            // Sinon, créer notre propre connexion
            let ac = audioContext;
            if (!ac) {
                try {
                    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
                    if (AudioContextClass) {
                        ac = new AudioContextClass();
                        localAudioContextRef.current = ac;
                        console.log('✅ AudioStatsRealtime: AudioContext créé localement');
                    } else {
                        console.error('❌ AudioStatsRealtime: Web Audio API non supportée');
                        return;
                    }
                } catch (e) {
                    console.error('❌ AudioStatsRealtime: Erreur création AudioContext:', e);
                    return;
                }
            }

            // S'assurer que l'AudioContext est actif
            if (ac.state === 'suspended') {
                ac.resume().catch(e => console.warn('AudioContext resume failed:', e));
            }

            // Créer l'analyser
            const analyser = ac.createAnalyser();
            analyser.fftSize = 2048;
            analyser.smoothingTimeConstant = 0.8;
            analyserRef.current = analyser;

            // Essayer de créer un MediaElementSource
            try {
                const sourceNode = ac.createMediaElementSource(mediaElement);
                sourceNode.connect(analyser);
                analyser.connect(ac.destination);
                console.log('✅ AudioStatsRealtime: Connexion audio réussie');
                setDebugInfo({ analyserConnected: true, hasData: false, error: null });
                startAnalysis();
            } catch (error) {
                if (error.name === 'InvalidStateError' || error.message.includes('already connected')) {
                    console.warn('⚠️ AudioStatsRealtime: MediaElementSource déjà créé');
                    
                    // Essayer captureStream()
                    if (mediaElement.captureStream) {
                        try {
                            const stream = mediaElement.captureStream();
                            const streamSource = ac.createMediaStreamSource(stream);
                            streamSource.connect(analyser);
                            analyser.connect(ac.destination);
                            console.log('✅ AudioStatsRealtime: Connexion via captureStream()');
                            setDebugInfo({ analyserConnected: true, hasData: false, error: null });
                            startAnalysis();
                            return;
                        } catch (e) {
                            console.warn('⚠️ AudioStatsRealtime: captureStream() échoué:', e);
                        }
                    }
                    
                    console.error('❌ AudioStatsRealtime: Impossible de créer une connexion audio');
                    setDebugInfo({ analyserConnected: false, hasData: false, error: 'Connexion impossible' });
                } else {
                    console.error('❌ AudioStatsRealtime: Erreur:', error);
                    setDebugInfo({ analyserConnected: false, hasData: false, error: error.message });
                }
            }
        };
        
        // Démarrer après un court délai initial
        initTimeoutRef.current = setTimeout(tryInit, 300);

        // Fonction pour démarrer l'analyse
        const startAnalysis = () => {
            if (!analyserRef.current) return;

            const bufferLength = analyserRef.current.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            const timeDataArray = new Uint8Array(bufferLength);

            // Fonction pour dessiner le spectrum
            const drawSpectrum = (data) => {
                const canvas = spectrumCanvasRef.current;
                if (!canvas) return;
                const ctx = canvas.getContext('2d');
                const width = canvas.width;
                const height = canvas.height;

                ctx.fillStyle = '#0E0E23';
                ctx.fillRect(0, 0, width, height);

                const barWidth = width / data.length;
                let x = 0;
                for (let i = 0; i < data.length; i++) {
                    const barHeight = (data[i] / 255) * height;
                    const hue = (i / data.length) * 360;
                    const gradient = ctx.createLinearGradient(x, height, x, height - barHeight);
                    gradient.addColorStop(0, `hsl(${hue}, 100%, 50%)`);
                    gradient.addColorStop(1, `hsl(${hue}, 100%, 70%)`);
                    ctx.fillStyle = gradient;
                    ctx.fillRect(x, height - barHeight, barWidth - 1, barHeight);
                    x += barWidth;
                }
            };

            // Fonction pour dessiner le VU Meter
            const drawVUMeter = (rms, peak) => {
                const canvas = vuMeterCanvasRef.current;
                if (!canvas) return;
                const ctx = canvas.getContext('2d');
                const width = canvas.width;
                const height = canvas.height;

                ctx.fillStyle = '#0E0E23';
                ctx.fillRect(0, 0, width, height);

                const rmsWidth = Math.min(rms * width, width);
                const rmsGradient = ctx.createLinearGradient(0, 0, rmsWidth, 0);
                rmsGradient.addColorStop(0, '#10B981');
                rmsGradient.addColorStop(0.7, '#F59E0B');
                rmsGradient.addColorStop(1, '#EF4444');
                ctx.fillStyle = rmsGradient;
                ctx.fillRect(0, height / 2 - 10, rmsWidth, 20);

                const peakWidth = Math.min(peak * width, width);
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(Math.max(0, peakWidth - 2), height / 2 - 15, 2, 30);

                ctx.strokeStyle = '#4B5563';
                ctx.lineWidth = 1;
                const db12X = (1 - 12 / 60) * width;
                ctx.beginPath();
                ctx.moveTo(db12X, 0);
                ctx.lineTo(db12X, height);
                ctx.stroke();

                const db6X = (1 - 6 / 60) * width;
                ctx.beginPath();
                ctx.moveTo(db6X, 0);
                ctx.lineTo(db6X, height);
                ctx.stroke();

                ctx.strokeStyle = '#EF4444';
                ctx.beginPath();
                ctx.moveTo(width, 0);
                ctx.lineTo(width, height);
                ctx.stroke();
            };

            // Fonction de mise à jour
            const updateStats = () => {
                if (!analyserRef.current) {
                    animationFrameRef.current = requestAnimationFrame(updateStats);
                    return;
                }

                try {
                    analyserRef.current.getByteFrequencyData(dataArray);
                    analyserRef.current.getByteTimeDomainData(timeDataArray);

                    // Vérifier si on a des données
                    const hasData = dataArray.some(val => val > 0) || timeDataArray.some(val => val !== 128);
                    if (hasData) {
                        setDebugInfo(prev => ({ ...prev, hasData: true }));
                    }

                    // Calculer RMS
                    let sumSquares = 0;
                    for (let i = 0; i < timeDataArray.length; i++) {
                        const normalized = (timeDataArray[i] - 128) / 128;
                        sumSquares += normalized * normalized;
                    }
                    const rms = Math.sqrt(sumSquares / timeDataArray.length);
                    
                    // Calculer Peak
                    let max = 0;
                    for (let i = 0; i < timeDataArray.length; i++) {
                        const normalized = Math.abs((timeDataArray[i] - 128) / 128);
                        if (normalized > max) max = normalized;
                    }
                    const peak = max;

                    // Convertir en dB
                    const db = rms > 0 ? 20 * Math.log10(rms) : -60;
                    const peakDb = peak > 0 ? 20 * Math.log10(peak) : -60;

                    setStats({
                        rms: rms * 100,
                        peak: peak * 100,
                        frequencyData: Array.from(dataArray),
                        db: isFinite(db) ? db : -60,
                        peakDb: isFinite(peakDb) ? peakDb : -60
                    });

                    drawSpectrum(dataArray);
                    drawVUMeter(rms, peak);

                } catch (error) {
                    console.warn('AudioStatsRealtime: Erreur mise à jour:', error);
                }

                animationFrameRef.current = requestAnimationFrame(updateStats);
            };

            updateStats();
        };

        return () => {
            if (initTimeoutRef.current) {
                clearTimeout(initTimeoutRef.current);
                initTimeoutRef.current = null;
            }
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
                animationFrameRef.current = null;
            }
            if (localAudioContextRef.current && localAudioContextRef.current.state !== 'closed') {
                try {
                    localAudioContextRef.current.close();
                } catch (e) {
                    // Ignorer
                }
                localAudioContextRef.current = null;
            }
        };
    }, [audioContext, audioSource, isPlaying]);

    return (
        <div className="w-full space-y-4">
            {/* Debug info (temporaire) */}
            {process.env.NODE_ENV === 'development' && (
                <div className="p-2 bg-n-7/30 rounded text-xs text-n-4">
                    Debug: Analyser={debugInfo.analyserConnected ? '✅' : '❌'} | 
                    Données={debugInfo.hasData ? '✅' : '❌'} | 
                    Playing={isPlaying ? '✅' : '❌'}
                    {debugInfo.error && ` | Erreur: ${debugInfo.error}`}
                </div>
            )}
            
            {/* Métriques principales */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-n-7/50 rounded-xl border border-n-6/30">
                    <div className="text-xs text-n-4 mb-1 uppercase tracking-wider">RMS</div>
                    <div className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                        {stats.rms.toFixed(1)}%
                    </div>
                    <div className="text-xs text-n-4 mt-1">{stats.db.toFixed(1)} dB</div>
                </div>

                <div className="p-4 bg-n-7/50 rounded-xl border border-n-6/30">
                    <div className="text-xs text-n-4 mb-1 uppercase tracking-wider">Peak</div>
                    <div className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                        {stats.peak.toFixed(1)}%
                    </div>
                    <div className="text-xs text-n-4 mt-1">{stats.peakDb.toFixed(1)} dB</div>
                </div>

                <div className="p-4 bg-n-7/50 rounded-xl border border-n-6/30">
                    <div className="text-xs text-n-4 mb-1 uppercase tracking-wider">Dynamic</div>
                    <div className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                        {(stats.peakDb - stats.db).toFixed(1)}
                    </div>
                    <div className="text-xs text-n-4 mt-1">dB range</div>
                </div>

                <div className="p-4 bg-n-7/50 rounded-xl border border-n-6/30">
                    <div className="text-xs text-n-4 mb-1 uppercase tracking-wider">Status</div>
                    <div className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                        {isPlaying ? '▶️' : '⏸️'}
                    </div>
                    <div className="text-xs text-n-4 mt-1">{isPlaying ? 'Playing' : 'Paused'}</div>
                </div>
            </div>

            {/* VU Meter */}
            <div className="p-4 bg-n-7/50 rounded-xl border border-n-6/30">
                <div className="text-xs text-n-4 mb-2 uppercase tracking-wider">VU Meter</div>
                <canvas
                    ref={vuMeterCanvasRef}
                    width={600}
                    height={60}
                    className="w-full h-15 rounded-lg"
                />
                <div className="flex justify-between text-xs text-n-4 mt-1">
                    <span>-60dB</span>
                    <span>-12dB</span>
                    <span>-6dB</span>
                    <span>0dB</span>
                </div>
            </div>

            {/* Spectrum Analyzer */}
            <div className="p-4 bg-n-7/50 rounded-xl border border-n-6/30">
                <div className="text-xs text-n-4 mb-2 uppercase tracking-wider">Spectrum Analyzer</div>
                <canvas
                    ref={spectrumCanvasRef}
                    width={600}
                    height={200}
                    className="w-full h-48 rounded-lg"
                />
                <div className="flex justify-between text-xs text-n-4 mt-1">
                    <span>20Hz</span>
                    <span>500Hz</span>
                    <span>2kHz</span>
                    <span>8kHz</span>
                    <span>20kHz</span>
                </div>
            </div>
        </div>
    );
};

export default AudioStatsRealtime;
