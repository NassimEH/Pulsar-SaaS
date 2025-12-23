import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import WaveSurfer from "wavesurfer.js";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Section from "../components/Section";
import Heading from "../components/Heading";
import Button from "../components/Button";
import { Gradient } from "../components/design/Services";
import ClipPath from "../assets/svg/ClipPath";
import { formatKeyWithMinor } from "../utils/keyUtils";
import ButtonSvg from "../assets/svg/ButtonSvg";

// Web Audio API pour traitement en temps réel
let audioContext = null;
let audioSource = null;
let gainNode = null;
let biquadFilters = [];
let convolverNode = null;
let delayNode = null;
let delayGainNode = null;
let delayFeedbackNode = null;
let analyserNode = null;

const Custom = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const waveformRef = useRef(null);
    const wavesurfer = useRef(null);
    const [file, setFile] = useState(null);
    const [originalFile, setOriginalFile] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [downloadUrl, setDownloadUrl] = useState("");
    const [isPlaying, setIsPlaying] = useState(false);
    const [audioUrl, setAudioUrl] = useState(null);

    // Paramètres de traitement
    const [speed, setSpeed] = useState(1.0);
    const [pitch, setPitch] = useState(0.0);
    const [reverb, setReverb] = useState(0.0);
    const [gain, setGain] = useState(0.0); // dB
    const [lowPass, setLowPass] = useState(20000); // Hz
    const [highPass, setHighPass] = useState(20); // Hz
    const [delay, setDelay] = useState(0.0); // 0-1
    const [delayTime, setDelayTime] = useState(250); // ms
    const [delayFeedback, setDelayFeedback] = useState(0.3); // 0-1
    const [chorus, setChorus] = useState(0.0); // 0-1
    const [chorusRate, setChorusRate] = useState(1.5); // Hz
    const [chorusDepth, setChorusDepth] = useState(0.3); // 0-1
    const [flanger, setFlanger] = useState(0.0); // 0-1
    const [flangerRate, setFlangerRate] = useState(0.5); // Hz
    const [flangerDepth, setFlangerDepth] = useState(0.5); // 0-1
    const [phaser, setPhaser] = useState(0.0); // 0-1
    const [phaserRate, setPhaserRate] = useState(0.5); // Hz
    const [distortion, setDistortion] = useState(0.0); // 0-1
    const [compression, setCompression] = useState(0.0); // 0-1
    const [compressionRatio, setCompressionRatio] = useState(4.0); // ratio
    const [compressionThreshold, setCompressionThreshold] = useState(-12.0); // dB
    const [normalize, setNormalize] = useState(false);
    const [reverse, setReverse] = useState(false);
    const [fadeIn, setFadeIn] = useState(0.0); // secondes
    const [fadeOut, setFadeOut] = useState(0.0); // secondes
    const [pan, setPan] = useState(0.0); // -1 (gauche) à 1 (droite)
    const [eqBass, setEqBass] = useState(0.0); // dB
    const [eqLowMid, setEqLowMid] = useState(0.0); // dB
    const [eqMid, setEqMid] = useState(0.0); // dB
    const [eqHighMid, setEqHighMid] = useState(0.0); // dB
    const [eqTreble, setEqTreble] = useState(0.0); // dB

    useEffect(() => {
        let fileObj = location.state?.file;
        let filename = location.state?.filename;
        
        if (!filename) {
            const savedInfo = localStorage.getItem('audioUploadInfo');
            if (savedInfo) {
                try {
                    const info = JSON.parse(savedInfo);
                    filename = info.filename;
                    if (!fileObj) {
                        fileObj = { name: info.originalName || filename };
                    }
                } catch (e) {
                    console.error("Error parsing saved upload info:", e);
                }
            }
        }
        
        if (filename && fileObj) {
            setFile(fileObj);
            setOriginalFile(fileObj);
            
            if (fileObj instanceof File) {
                const url = URL.createObjectURL(fileObj);
                setAudioUrl(url);
                setTimeout(() => {
                    initializeWaveform(fileObj, url);
                }, 100);
            } else {
                loadAudioFromServer(filename);
            }
        } else {
            navigate("/studio");
        }

        return () => {
            if (wavesurfer.current) {
                try {
                    wavesurfer.current.unAll();
                    if (wavesurfer.current.isPlaying && wavesurfer.current.isPlaying()) {
                        wavesurfer.current.pause();
                    }
                    wavesurfer.current.destroy();
                } catch (error) {
                    if (error.name !== 'AbortError' && error.message !== 'signal is aborted without reason') {
                        console.log('WaveSurfer cleanup:', error.message);
                    }
                } finally {
                    wavesurfer.current = null;
                }
            }
            if (audioUrl) {
                URL.revokeObjectURL(audioUrl);
            }
        };
    }, [location, navigate]);

    const loadAudioFromServer = async (filename) => {
        try {
            const response = await fetch(`http://localhost:8000/api/download/${filename}`);
            if (!response.ok) {
                throw new Error("File not found");
            }
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            setAudioUrl(url);
            setTimeout(() => {
                initializeWaveform(file, url);
            }, 100);
        } catch (error) {
            console.error("Error loading audio from server:", error);
            alert("Impossible de charger le fichier audio depuis le serveur.");
            navigate("/studio");
        }
    };

    const initializeWaveform = async (audioFile, url) => {
        if (waveformRef.current && audioFile && url) {
            if (wavesurfer.current) {
                try {
                    wavesurfer.current.unAll();
                    if (wavesurfer.current.isPlaying && wavesurfer.current.isPlaying()) {
                        wavesurfer.current.pause();
                    }
                    wavesurfer.current.destroy();
                } catch (error) {
                    if (error.name !== 'AbortError' && error.message !== 'signal is aborted without reason') {
                        console.log('WaveSurfer cleanup:', error.message);
                    }
                } finally {
                    wavesurfer.current = null;
                }
            }

            try {
                wavesurfer.current = WaveSurfer.create({
                    container: waveformRef.current,
                    waveColor: '#AC6AFF',
                    progressColor: '#FFC876',
                    cursorColor: '#FFF',
                    barWidth: 2,
                    barRadius: 3,
                    cursorWidth: 1,
                    height: 150,
                    barGap: 2,
                    responsive: true,
                    normalize: true,
                    backend: 'WebAudio',
                });

                wavesurfer.current.load(url);

                wavesurfer.current.on('play', () => {
                    setIsPlaying(true);
                    setupLiveProcessing();
                });
                wavesurfer.current.on('pause', () => setIsPlaying(false));
                wavesurfer.current.on('finish', () => setIsPlaying(false));
                wavesurfer.current.on('ready', () => {
                    setupLiveProcessing();
                });
            } catch (error) {
                console.error('Error initializing WaveSurfer:', error);
            }
        }
    };

    const setupLiveProcessing = () => {
        if (!wavesurfer.current) return;
        
        try {
            const backend = wavesurfer.current.getBackend();
            if (backend && backend.ac && !audioContext) {
                audioContext = backend.ac;
                
                const mediaElement = wavesurfer.current.getMediaElement();
                if (mediaElement && !audioSource) {
                    audioSource = audioContext.createMediaElementSource(mediaElement);
                    
                    // Créer les nodes d'effets
                    gainNode = audioContext.createGain();
                    
                    // EQ nodes (5 bandes)
                    biquadFilters = [
                        audioContext.createBiquadFilter(), // Bass
                        audioContext.createBiquadFilter(), // Low Mid
                        audioContext.createBiquadFilter(), // Mid
                        audioContext.createBiquadFilter(), // High Mid
                        audioContext.createBiquadFilter(), // Treble
                    ];
                    
                    // Delay
                    delayNode = audioContext.createDelay(1.0);
                    delayGainNode = audioContext.createGain();
                    delayFeedbackNode = audioContext.createGain();
                    
                    // Connexion: source -> EQ -> gain -> delay -> destination
                    let currentNode = audioSource;
                    
                    // Connecter les filtres EQ en série
                    biquadFilters.forEach(filter => {
                        currentNode.connect(filter);
                        currentNode = filter;
                    });
                    
                    currentNode.connect(gainNode);
                    gainNode.connect(delayNode);
                    delayNode.connect(delayGainNode);
                    delayGainNode.connect(delayFeedbackNode);
                    delayFeedbackNode.connect(delayNode); // Feedback
                    delayGainNode.connect(audioContext.destination);
                }
            }
        } catch (error) {
            // Erreur normale si MediaElementSource existe déjà
            if (!error.message.includes('MediaElementSource')) {
                console.error('Error setting up live processing:', error);
            }
        }
    };

    // Mettre à jour les effets en temps réel
    useEffect(() => {
        if (!audioContext) return;

        // Gain
        if (gainNode) {
            gainNode.gain.value = Math.pow(10, gain / 20);
        }

        // EQ
        if (biquadFilters.length === 5) {
            // Bass (20-250 Hz)
            biquadFilters[0].type = 'lowshelf';
            biquadFilters[0].frequency.value = 250;
            biquadFilters[0].gain.value = eqBass;

            // Low Mid (250-500 Hz)
            biquadFilters[1].type = 'peaking';
            biquadFilters[1].frequency.value = 375;
            biquadFilters[1].Q.value = 1;
            biquadFilters[1].gain.value = eqLowMid;

            // Mid (500-2000 Hz)
            biquadFilters[2].type = 'peaking';
            biquadFilters[2].frequency.value = 1250;
            biquadFilters[2].Q.value = 1;
            biquadFilters[2].gain.value = eqMid;

            // High Mid (2000-4000 Hz)
            biquadFilters[3].type = 'peaking';
            biquadFilters[3].frequency.value = 3000;
            biquadFilters[3].Q.value = 1;
            biquadFilters[3].gain.value = eqHighMid;

            // Treble (4000-20000 Hz)
            biquadFilters[4].type = 'highshelf';
            biquadFilters[4].frequency.value = 4000;
            biquadFilters[4].gain.value = eqTreble;
        }

        // Delay
        if (delayNode && delayGainNode && delayFeedbackNode) {
            delayNode.delayTime.value = delayTime / 1000;
            delayGainNode.gain.value = delay;
            delayFeedbackNode.gain.value = delayFeedback;
        }
    }, [gain, eqBass, eqLowMid, eqMid, eqHighMid, eqTreble, delay, delayTime, delayFeedback]);

    const togglePlayPause = () => {
        if (wavesurfer.current) {
            wavesurfer.current.playPause();
        }
    };

    const handleProcess = async () => {
        if (!file) return;

        const filename = location.state?.filename || (() => {
            const savedInfo = localStorage.getItem('audioUploadInfo');
            if (savedInfo) {
                try {
                    return JSON.parse(savedInfo).filename;
                } catch (e) {
                    return null;
                }
            }
            return null;
        })();

        if (!filename) {
            alert("Fichier non trouvé.");
            return;
        }

        setProcessing(true);
        try {
            const response = await fetch("http://localhost:8000/api/process", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    filename: filename,
                    speed: speed,
                    pitch: pitch,
                    nightcore: false,
                    reverb: reverb,
                    gain: gain,
                    low_pass: lowPass,
                    high_pass: highPass,
                    delay: delay,
                    delay_time: delayTime,
                    delay_feedback: delayFeedback,
                    chorus: chorus,
                    chorus_rate: chorusRate,
                    chorus_depth: chorusDepth,
                    flanger: flanger,
                    flanger_rate: flangerRate,
                    flanger_depth: flangerDepth,
                    phaser: phaser,
                    phaser_rate: phaserRate,
                    distortion: distortion,
                    compression: compression,
                    compression_ratio: compressionRatio,
                    compression_threshold: compressionThreshold,
                    normalize: normalize,
                    reverse: reverse,
                    fade_in: fadeIn,
                    fade_out: fadeOut,
                    pan: pan,
                    eq_bass: eqBass,
                    eq_low_mid: eqLowMid,
                    eq_mid: eqMid,
                    eq_high_mid: eqHighMid,
                    eq_treble: eqTreble
                })
            });

            if (!response.ok) {
                throw new Error("Erreur lors du traitement");
            }

            const data = await response.json();
            const downloadUrl = `http://localhost:8000${data.download_url}`;
            setDownloadUrl(downloadUrl);

            // Charger le nouveau fichier pour l'écoute
            const audioResponse = await fetch(downloadUrl);
            const blob = await audioResponse.blob();
            const newUrl = URL.createObjectURL(blob);
            
            if (audioUrl) {
                URL.revokeObjectURL(audioUrl);
            }
            
            setAudioUrl(newUrl);
            
            setTimeout(() => {
                if (wavesurfer.current) {
                    wavesurfer.current.load(newUrl);
                }
            }, 100);

        } catch (error) {
            console.error("Processing Error:", error);
            alert("Erreur lors du traitement");
        } finally {
            setProcessing(false);
        }
    };

    const resetAll = () => {
        setSpeed(1.0);
        setPitch(0.0);
        setReverb(0.0);
        setGain(0.0);
        setLowPass(20000);
        setHighPass(20);
        setDelay(0.0);
        setDelayTime(250);
        setDelayFeedback(0.3);
        setChorus(0.0);
        setChorusRate(1.5);
        setChorusDepth(0.3);
        setFlanger(0.0);
        setFlangerRate(0.5);
        setFlangerDepth(0.5);
        setPhaser(0.0);
        setPhaserRate(0.5);
        setDistortion(0.0);
        setCompression(0.0);
        setCompressionRatio(4.0);
        setCompressionThreshold(-12.0);
        setNormalize(false);
        setReverse(false);
        setFadeIn(0.0);
        setFadeOut(0.0);
        setPan(0.0);
        setEqBass(0.0);
        setEqLowMid(0.0);
        setEqMid(0.0);
        setEqHighMid(0.0);
        setEqTreble(0.0);
    };

    if (!file) return null;

    const SliderControl = ({ label, value, setValue, min, max, step = 0.01, unit = "", showValue = true, marks = null }) => {
        // Calculer les graduations si non fournies
        const getMarks = () => {
            if (marks) return marks;
            
            const range = max - min;
            let numMarks = 5;
            
            // Ajuster le nombre de marques selon la plage
            if (range <= 1) numMarks = 5;
            else if (range <= 10) numMarks = 5;
            else if (range <= 24) numMarks = 5; // Pour pitch -12 à +12
            else if (range <= 100) numMarks = 5;
            else numMarks = 5;
            
            const markValues = [];
            for (let i = 0; i <= numMarks; i++) {
                const markValue = min + (range * i / numMarks);
                markValues.push(Math.round(markValue * 100) / 100);
            }
            return markValues;
        };
        
        const markValues = getMarks();
        const percentage = ((value - min) / (max - min)) * 100;
        
        return (
            <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-code text-n-3 uppercase tracking-wider">{label}</label>
                    {showValue && <span className="text-sm font-code text-n-1 font-semibold">{value.toFixed(step < 1 ? 2 : 0)}{unit}</span>}
                </div>
                <div className="relative">
                    {/* Slider avec style personnalisé */}
                    <input
                        type="range"
                        min={min}
                        max={max}
                        step={step}
                        value={value}
                        onChange={(e) => setValue(parseFloat(e.target.value))}
                        onMouseDown={(e) => {
                            // Permettre le glissement continu
                            const slider = e.target;
                            const handleMouseMove = (moveEvent) => {
                                const rect = slider.getBoundingClientRect();
                                const percent = Math.max(0, Math.min(1, (moveEvent.clientX - rect.left) / rect.width));
                                const newValue = min + percent * (max - min);
                                const steppedValue = Math.round(newValue / step) * step;
                                setValue(Math.max(min, Math.min(max, steppedValue)));
                            };
                            const handleMouseUp = () => {
                                document.removeEventListener('mousemove', handleMouseMove);
                                document.removeEventListener('mouseup', handleMouseUp);
                            };
                            document.addEventListener('mousemove', handleMouseMove);
                            document.addEventListener('mouseup', handleMouseUp);
                        }}
                        className="w-full h-3 bg-n-7 rounded-lg appearance-none cursor-grab active:cursor-grabbing focus:outline-none focus:ring-2 focus:ring-color-1/50"
                        style={{
                            background: `linear-gradient(to right, #AC6AFF 0%, #AC6AFF ${percentage}%, #1B1B2F ${percentage}%, #1B1B2F 100%)`
                        }}
                    />
                    
                    {/* Style personnalisé pour le thumb */}
                    <style>{`
                        input[type="range"]::-webkit-slider-thumb {
                            appearance: none;
                            width: 18px;
                            height: 18px;
                            border-radius: 50%;
                            background: linear-gradient(135deg, #AC6AFF, #FFC876);
                            border: 2px solid #FFF;
                            cursor: grab;
                            box-shadow: 0 2px 8px rgba(172, 106, 255, 0.5);
                            transition: transform 0.1s ease;
                        }
                        input[type="range"]::-webkit-slider-thumb:active {
                            cursor: grabbing;
                            transform: scale(1.2);
                            box-shadow: 0 4px 12px rgba(172, 106, 255, 0.8);
                        }
                        input[type="range"]::-moz-range-thumb {
                            width: 18px;
                            height: 18px;
                            border-radius: 50%;
                            background: linear-gradient(135deg, #AC6AFF, #FFC876);
                            border: 2px solid #FFF;
                            cursor: grab;
                            box-shadow: 0 2px 8px rgba(172, 106, 255, 0.5);
                            transition: transform 0.1s ease;
                        }
                        input[type="range"]::-moz-range-thumb:active {
                            cursor: grabbing;
                            transform: scale(1.2);
                            box-shadow: 0 4px 12px rgba(172, 106, 255, 0.8);
                        }
                    `}</style>
                    
                    {/* Graduations */}
                    <div className="relative mt-2 h-4">
                        {markValues.map((mark, index) => {
                            const markPercentage = ((mark - min) / (max - min)) * 100;
                            return (
                                <div
                                    key={index}
                                    className="absolute flex flex-col items-center"
                                    style={{ left: `${markPercentage}%`, transform: 'translateX(-50%)' }}
                                >
                                    <div className="w-0.5 h-2 bg-n-5"></div>
                                    <span className="text-xs font-code text-n-4 mt-1 whitespace-nowrap">
                                        {mark.toFixed(step < 1 ? (step < 0.1 ? 2 : 1) : 0)}{unit}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    };

    const ToggleControl = ({ label, value, setValue }) => (
        <div className="flex items-center justify-between mb-4">
            <label className="text-sm font-code text-n-3 uppercase tracking-wider">{label}</label>
            <button
                onClick={() => setValue(!value)}
                className={`relative w-12 h-6 rounded-full transition-colors ${value ? 'bg-color-1' : 'bg-n-6'}`}
            >
                <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${value ? 'translate-x-6' : 'translate-x-0'}`}></span>
            </button>
        </div>
    );

    return (
        <>
            <Header />
            <Section className="pt-[12rem] -mt-[5.25rem]" crosses crossesOffset="lg:translate-y-[5.25rem]">
                <div className="container relative z-2">
                    <Heading
                        className="md:max-w-md lg:max-w-2xl"
                        title="Traitement Personnalisé"
                        text={file.name}
                    />

                    {/* Lecteur Audio */}
                    <div className="relative mb-12 max-w-[77.5rem] mx-auto">
                        <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 rounded-3xl blur-lg opacity-20 animate-pulse"></div>
                        <div className="relative bg-n-8 rounded-3xl p-8 lg:p-12 border-2 border-n-6 shadow-2xl overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-500/10 via-transparent to-transparent"></div>
                            </div>

                            <div className="relative z-1">
                                <div className="flex items-center justify-between mb-8">
                                    <div>
                                        <h3 className="h3 mb-2">Lecteur Audio</h3>
                                        <p className="text-sm text-n-4">Écoutez votre fichier avant et après traitement</p>
                                    </div>
                                    <button
                                        onClick={togglePlayPause}
                                        disabled={processing}
                                        className="flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 transition-all duration-300 shadow-2xl hover:shadow-purple-500/50 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isPlaying ? (
                                            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                                            </svg>
                                        ) : (
                                            <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M8 5v14l11-7z" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                                <div ref={waveformRef} className="w-full mb-10" style={{ minHeight: '150px' }}></div>
                            </div>
                        </div>
                    </div>

                    {/* Tableau de bord de traitement */}
                    <div className="relative mb-12 max-w-[90rem] mx-auto">
                        <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 rounded-3xl blur-lg opacity-20 animate-pulse"></div>
                        <div className="relative bg-n-8 rounded-3xl p-8 lg:p-12 border-2 border-n-6 shadow-2xl overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-500/10 via-transparent to-transparent"></div>
                            </div>

                            <div className="relative z-1">
                                <div className="text-center mb-10">
                                    <h3 className="h3 mb-2 font-code bg-gradient-to-r from-color-1 to-color-2 bg-clip-text text-transparent">
                                        Tableau de Bord de Traitement
                                    </h3>
                                    <p className="text-sm text-n-4 font-code mb-4">Ajustements en temps réel pendant la lecture</p>
                                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-n-7/50 rounded-lg border border-n-6/50">
                                        <svg className="w-4 h-4 text-color-1" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0v4a1 1 0 102 0V6zm-1 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                                        </svg>
                                        <p className="text-xs font-code text-n-3">
                                            <span className="text-color-1 font-semibold">Temps réel :</span> EQ, Gain, Delay • 
                                            <span className="text-n-4"> Autres effets nécessitent le traitement backend</span>
                                        </p>
                                    </div>
                                </div>

                                {/* Sections organisées */}
                                <div className="space-y-8">
                                    {/* Section 1: Fondamentaux */}
                                    <div className="bg-gradient-to-br from-n-7/80 to-n-8/80 rounded-2xl p-6 border border-n-6/50 backdrop-blur-sm">
                                        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-n-6/30">
                                            <div className="w-1.5 h-8 bg-gradient-to-b from-color-1 to-color-2 rounded-full"></div>
                                            <h4 className="h5 font-code text-color-1">Fondamentaux</h4>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="bg-n-8/50 rounded-xl p-5 border border-n-6/30">
                                                <SliderControl label="Vitesse" value={speed} setValue={setSpeed} min={0.25} max={2.0} step={0.01} marks={[0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0]} />
                                                <SliderControl label="Transposition (semitones)" value={pitch} setValue={setPitch} min={-12} max={12} step={0.1} marks={[-12, -8, -4, 0, 4, 8, 12]} />
                                            </div>
                                            <div className="bg-n-8/50 rounded-xl p-5 border border-n-6/30">
                                                <SliderControl label="Gain" value={gain} setValue={setGain} min={-12} max={12} step={0.5} unit="dB" marks={[-12, -6, 0, 6, 12]} />
                                                <SliderControl label="Pan" value={pan} setValue={setPan} min={-1} max={1} step={0.01} marks={[-1, -0.5, 0, 0.5, 1]} />
                                                <div className="flex items-center justify-between mt-2">
                                                    <span className="text-xs text-n-4 font-code">Gauche</span>
                                                    <span className="text-xs text-n-4 font-code">Centre</span>
                                                    <span className="text-xs text-n-4 font-code">Droite</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Section 2: Égalisation */}
                                    <div className="bg-gradient-to-br from-n-7/80 to-n-8/80 rounded-2xl p-6 border border-n-6/50 backdrop-blur-sm">
                                        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-n-6/30">
                                            <div className="w-1.5 h-8 bg-gradient-to-b from-color-5 to-color-6 rounded-full"></div>
                                            <h4 className="h5 font-code text-color-5">Égalisation (EQ)</h4>
                                        </div>
                                        <div className="bg-n-8/50 rounded-xl p-5 border border-n-6/30">
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                <SliderControl label="Basses (20-250 Hz)" value={eqBass} setValue={setEqBass} min={-12} max={12} step={0.5} unit="dB" marks={[-12, -6, 0, 6, 12]} />
                                                <SliderControl label="Bas-médiums (250-500 Hz)" value={eqLowMid} setValue={setEqLowMid} min={-12} max={12} step={0.5} unit="dB" marks={[-12, -6, 0, 6, 12]} />
                                                <SliderControl label="Médiums (500-2000 Hz)" value={eqMid} setValue={setEqMid} min={-12} max={12} step={0.5} unit="dB" marks={[-12, -6, 0, 6, 12]} />
                                                <SliderControl label="Hauts-médiums (2000-4000 Hz)" value={eqHighMid} setValue={setEqHighMid} min={-12} max={12} step={0.5} unit="dB" marks={[-12, -6, 0, 6, 12]} />
                                                <SliderControl label="Aigus (4000-20000 Hz)" value={eqTreble} setValue={setEqTreble} min={-12} max={12} step={0.5} unit="dB" marks={[-12, -6, 0, 6, 12]} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Section 3: Espace & Réverbération */}
                                    <div className="bg-gradient-to-br from-n-7/80 to-n-8/80 rounded-2xl p-6 border border-n-6/50 backdrop-blur-sm">
                                        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-n-6/30">
                                            <div className="w-1.5 h-8 bg-gradient-to-b from-color-2 to-color-3 rounded-full"></div>
                                            <h4 className="h5 font-code text-color-2">Espace & Réverbération</h4>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="bg-n-8/50 rounded-xl p-5 border border-n-6/30">
                                                <SliderControl label="Reverb" value={reverb} setValue={setReverb} min={0} max={1} step={0.01} marks={[0, 0.25, 0.5, 0.75, 1]} />
                                            </div>
                                            <div className="bg-n-8/50 rounded-xl p-5 border border-n-6/30">
                                                <SliderControl label="Delay (Intensité)" value={delay} setValue={setDelay} min={0} max={1} step={0.01} marks={[0, 0.25, 0.5, 0.75, 1]} />
                                                {delay > 0 && (
                                                    <>
                                                        <SliderControl label="Delay Time (ms)" value={delayTime} setValue={setDelayTime} min={50} max={1000} step={10} unit="ms" marks={[50, 250, 500, 750, 1000]} />
                                                        <SliderControl label="Delay Feedback" value={delayFeedback} setValue={setDelayFeedback} min={0} max={0.9} step={0.01} marks={[0, 0.3, 0.6, 0.9]} />
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Section 4: Modulation */}
                                    <div className="bg-gradient-to-br from-n-7/80 to-n-8/80 rounded-2xl p-6 border border-n-6/50 backdrop-blur-sm">
                                        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-n-6/30">
                                            <div className="w-1.5 h-8 bg-gradient-to-b from-color-3 to-color-4 rounded-full"></div>
                                            <h4 className="h5 font-code text-color-3">Modulation</h4>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <div className="bg-n-8/50 rounded-xl p-5 border border-n-6/30">
                                                <SliderControl label="Chorus" value={chorus} setValue={setChorus} min={0} max={1} step={0.01} marks={[0, 0.25, 0.5, 0.75, 1]} />
                                                {chorus > 0 && (
                                                    <>
                                                        <SliderControl label="Chorus Rate (Hz)" value={chorusRate} setValue={setChorusRate} min={0.1} max={5} step={0.1} unit="Hz" marks={[0.1, 1.5, 3, 4.5, 5]} />
                                                        <SliderControl label="Chorus Depth" value={chorusDepth} setValue={setChorusDepth} min={0} max={1} step={0.01} marks={[0, 0.25, 0.5, 0.75, 1]} />
                                                    </>
                                                )}
                                            </div>
                                            <div className="bg-n-8/50 rounded-xl p-5 border border-n-6/30">
                                                <SliderControl label="Flanger" value={flanger} setValue={setFlanger} min={0} max={1} step={0.01} marks={[0, 0.25, 0.5, 0.75, 1]} />
                                                {flanger > 0 && (
                                                    <>
                                                        <SliderControl label="Flanger Rate (Hz)" value={flangerRate} setValue={setFlangerRate} min={0.1} max={5} step={0.1} unit="Hz" marks={[0.1, 1.5, 3, 4.5, 5]} />
                                                        <SliderControl label="Flanger Depth" value={flangerDepth} setValue={setFlangerDepth} min={0} max={1} step={0.01} marks={[0, 0.25, 0.5, 0.75, 1]} />
                                                    </>
                                                )}
                                            </div>
                                            <div className="bg-n-8/50 rounded-xl p-5 border border-n-6/30">
                                                <SliderControl label="Phaser" value={phaser} setValue={setPhaser} min={0} max={1} step={0.01} marks={[0, 0.25, 0.5, 0.75, 1]} />
                                                {phaser > 0 && (
                                                    <SliderControl label="Phaser Rate (Hz)" value={phaserRate} setValue={setPhaserRate} min={0.1} max={5} step={0.1} unit="Hz" marks={[0.1, 1.5, 3, 4.5, 5]} />
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Section 5: Dynamique & Filtres */}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        <div className="bg-gradient-to-br from-n-7/80 to-n-8/80 rounded-2xl p-6 border border-n-6/50 backdrop-blur-sm">
                                            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-n-6/30">
                                                <div className="w-1.5 h-8 bg-gradient-to-b from-color-4 to-color-5 rounded-full"></div>
                                                <h4 className="h5 font-code text-color-4">Dynamique</h4>
                                            </div>
                                            <div className="bg-n-8/50 rounded-xl p-5 border border-n-6/30">
                                                <SliderControl label="Distortion" value={distortion} setValue={setDistortion} min={0} max={1} step={0.01} marks={[0, 0.25, 0.5, 0.75, 1]} />
                                                <SliderControl label="Compression" value={compression} setValue={setCompression} min={0} max={1} step={0.01} marks={[0, 0.25, 0.5, 0.75, 1]} />
                                                {compression > 0 && (
                                                    <>
                                                        <SliderControl label="Ratio" value={compressionRatio} setValue={setCompressionRatio} min={1} max={20} step={0.1} marks={[1, 5, 10, 15, 20]} />
                                                        <SliderControl label="Threshold (dB)" value={compressionThreshold} setValue={setCompressionThreshold} min={-40} max={0} step={0.5} unit="dB" marks={[-40, -30, -20, -10, 0]} />
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        <div className="bg-gradient-to-br from-n-7/80 to-n-8/80 rounded-2xl p-6 border border-n-6/50 backdrop-blur-sm">
                                            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-n-6/30">
                                                <div className="w-1.5 h-8 bg-gradient-to-b from-color-6 to-color-1 rounded-full"></div>
                                                <h4 className="h5 font-code text-color-6">Filtres</h4>
                                            </div>
                                            <div className="bg-n-8/50 rounded-xl p-5 border border-n-6/30">
                                                <SliderControl label="Low Pass (Hz)" value={lowPass} setValue={setLowPass} min={20} max={20000} step={10} unit="Hz" marks={[20, 5000, 10000, 15000, 20000]} />
                                                <SliderControl label="High Pass (Hz)" value={highPass} setValue={setHighPass} min={20} max={20000} step={10} unit="Hz" marks={[20, 5000, 10000, 15000, 20000]} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Section 6: Fade & Options */}
                                    <div className="bg-gradient-to-br from-n-7/80 to-n-8/80 rounded-2xl p-6 border border-n-6/50 backdrop-blur-sm">
                                        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-n-6/30">
                                            <div className="w-1.5 h-8 bg-gradient-to-b from-color-2 to-color-3 rounded-full"></div>
                                            <h4 className="h5 font-code text-color-2">Fade & Options</h4>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="bg-n-8/50 rounded-xl p-5 border border-n-6/30">
                                                <SliderControl label="Fade In (s)" value={fadeIn} setValue={setFadeIn} min={0} max={5} step={0.1} unit="s" marks={[0, 1, 2, 3, 4, 5]} />
                                                <SliderControl label="Fade Out (s)" value={fadeOut} setValue={setFadeOut} min={0} max={5} step={0.1} unit="s" marks={[0, 1, 2, 3, 4, 5]} />
                                            </div>
                                            <div className="bg-n-8/50 rounded-xl p-5 border border-n-6/30">
                                                <ToggleControl label="Normaliser" value={normalize} setValue={setNormalize} />
                                                <ToggleControl label="Inverser" value={reverse} setValue={setReverse} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Boutons d'action */}
                    <div className="flex justify-center gap-4 mb-10">
                        <button
                            onClick={resetAll}
                            className="button relative inline-flex items-center justify-center h-11 transition-colors hover:text-color-1 px-7 text-n-1"
                        >
                            <span className="relative z-10">Réinitialiser</span>
                            {ButtonSvg(false)}
                        </button>
                        <button
                            onClick={handleProcess}
                            disabled={processing}
                            className={`button relative inline-flex items-center justify-center h-11 transition-colors hover:text-color-1 px-7 text-n-1 ${processing ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <span className="relative z-10 flex items-center gap-3">
                                {processing && (
                                    <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                                )}
                                {processing ? "Traitement..." : "Appliquer"}
                            </span>
                            {ButtonSvg(false)}
                        </button>
                    </div>

                    {/* Téléchargement */}
                    {downloadUrl && (
                        <div className="flex justify-center mb-10">
                            <div className="relative p-0.5 bg-gradient-to-r from-green-500 to-teal-500 rounded-3xl">
                                <div className="relative bg-n-8 rounded-[1.4375rem] p-8 text-center">
                                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-green-500 to-teal-500 mb-4">
                                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <h4 className="h5 mb-4">Traitement terminé !</h4>
                                    <Button href={downloadUrl} white className="mx-auto">
                                        Télécharger le fichier
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {processing && (
                        <div className="fixed inset-0 bg-n-8/90 backdrop-blur-sm z-50 flex items-center justify-center">
                            <div className="text-center">
                                <div className="inline-block relative">
                                    <div className="w-20 h-20 border-4 border-n-6 border-t-purple-500 rounded-full animate-spin"></div>
                                    <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-pink-500 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1s' }}></div>
                                </div>
                                <p className="text-n-1 text-xl mt-6">Traitement en cours...</p>
                                <p className="text-n-4 text-sm mt-2">Veuillez patienter</p>
                            </div>
                        </div>
                    )}

                    <Gradient />
                </div>
            </Section>
            <Footer />
        </>
    );
};

export default Custom;

