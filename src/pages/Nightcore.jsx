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
import { calculateNewKey, getRelativeMinor, formatKeyWithMinor } from "../utils/keyUtils";

const Nightcore = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const waveformRef = useRef(null);
    const wavesurfer = useRef(null);
    const [file, setFile] = useState(null);
    const [originalFile, setOriginalFile] = useState(null);
    const [originalKey, setOriginalKey] = useState(null);
    const [currentSpeed, setCurrentSpeed] = useState(1.0);
    const [currentPitch, setCurrentPitch] = useState(0); // en semitones
    const [processing, setProcessing] = useState(false);
    const [downloadUrl, setDownloadUrl] = useState("");
    const [isPlaying, setIsPlaying] = useState(false);
    const [audioUrl, setAudioUrl] = useState(null);

    useEffect(() => {
        // Récupérer les données depuis location.state ou localStorage
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
        
        // Charger l'analyse pour obtenir la clé originale
        const loadAnalysis = async () => {
            let foundKey = null;
            
            // Essayer d'abord depuis localStorage
            const savedAnalysis = localStorage.getItem('audioAnalysis');
            if (savedAnalysis) {
                try {
                    const analysis = JSON.parse(savedAnalysis);
                    if (analysis.key) {
                        foundKey = analysis.key;
                        setOriginalKey(analysis.key);
                    }
                } catch (e) {
                    console.error("Error parsing saved analysis:", e);
                }
            }
            
            // Si pas d'analyse sauvegardée, la charger depuis le serveur
            if (!foundKey && filename) {
                try {
                    const response = await fetch(`http://localhost:8000/api/analyze?filename=${filename}`, {
                        method: "POST"
                    });
                    if (response.ok) {
                        const data = await response.json();
                        if (data.features && data.features.key) {
                            setOriginalKey(data.features.key);
                            localStorage.setItem('audioAnalysis', JSON.stringify(data.features));
                        }
                    }
                } catch (error) {
                    console.error("Error loading analysis:", error);
                }
            }
        };
        
        if (filename && fileObj) {
            setFile(fileObj);
            setOriginalFile(fileObj);
            loadAnalysis();
            // Créer l'URL pour l'audio original
            if (fileObj instanceof File) {
                const url = URL.createObjectURL(fileObj);
                setAudioUrl(url);
                setTimeout(() => {
                    initializeWaveform(fileObj, url);
                }, 100);
            } else {
                // Si c'est juste un objet avec un nom, charger depuis le serveur
                loadAudioFromServer(filename);
            }
        } else {
            navigate("/studio");
        }

        return () => {
            if (wavesurfer.current) {
                try {
                    wavesurfer.current.unAll();
                    wavesurfer.current.destroy();
                } catch (error) {
                    console.log('WaveSurfer cleanup:', error.message);
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
            const audioFile = new File([blob], filename, { type: 'audio/wav' });
            setTimeout(() => {
                initializeWaveform(audioFile, url);
            }, 100);
        } catch (error) {
            console.error("Error loading audio from server:", error);
            alert("Impossible de charger l'audio. Veuillez réessayer.");
        }
    };

    const initializeWaveform = (audioFile, url) => {
        if (waveformRef.current && audioFile && url) {
            if (wavesurfer.current) {
                try {
                    wavesurfer.current.unAll();
                    wavesurfer.current.destroy();
                } catch (error) {
                    console.log('WaveSurfer cleanup:', error.message);
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
                });

                wavesurfer.current.load(url);

                wavesurfer.current.on('play', () => setIsPlaying(true));
                wavesurfer.current.on('pause', () => setIsPlaying(false));
                wavesurfer.current.on('finish', () => setIsPlaying(false));
            } catch (error) {
                console.error('Error initializing WaveSurfer:', error);
            }
        }
    };

    const togglePlayPause = () => {
        if (wavesurfer.current) {
            wavesurfer.current.playPause();
        }
    };

    const handleProcess = async (speed, pitch) => {
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
                    pitch: pitch, // en semitones
                    nightcore: false // On gère manuellement speed et pitch
                })
            });

            if (!response.ok) {
                throw new Error("Erreur lors du traitement");
            }

            const data = await response.json();
            const downloadUrl = `http://localhost:8000${data.download_url}`;
            setDownloadUrl(downloadUrl);
            setCurrentSpeed(speed);
            setCurrentPitch(pitch);

            // Charger le nouveau fichier pour l'écoute
            const audioResponse = await fetch(downloadUrl);
            const blob = await audioResponse.blob();
            const newUrl = URL.createObjectURL(blob);
            
            // Nettoyer l'ancienne URL
            if (audioUrl) {
                URL.revokeObjectURL(audioUrl);
            }
            
            setAudioUrl(newUrl);
            
            // Mettre à jour le waveform
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

    if (!file) return null;

    // Options de vitesse (accélération)
    const speedOptions = [
        { label: "Original", speed: 1.0, description: "Vitesse normale" },
        { label: "1.1x", speed: 1.1, description: "Légèrement accéléré" },
        { label: "1.25x", speed: 1.25, description: "Accélération modérée" },
        { label: "1.5x", speed: 1.5, description: "Accélération forte" },
        { label: "2x", speed: 2.0, description: "Double vitesse" },
    ];

    // Options de pitch (montée en semitones)
    const pitchOptions = [
        { label: "+0", pitch: 0, description: "Pitch original", semitones: 0 },
        { label: "+1", pitch: 1, description: "+1 semitone", semitones: 1 },
        { label: "+2", pitch: 2, description: "+2 semitones", semitones: 2 },
        { label: "+3", pitch: 3, description: "+3 semitones", semitones: 3 },
        { label: "+4", pitch: 4, description: "+4 semitones", semitones: 4 },
        { label: "+5", pitch: 5, description: "+5 semitones", semitones: 5 },
        { label: "+6", pitch: 6, description: "+6 semitones", semitones: 6 },
        { label: "+7", pitch: 7, description: "+7 semitones", semitones: 7 },
    ];

    return (
        <>
            <Header />
            <Section className="pt-[12rem] -mt-[5.25rem]" crosses crossesOffset="lg:translate-y-[5.25rem]">
                <div className="container relative z-2">
                    <Heading
                        className="md:max-w-md lg:max-w-2xl"
                        title="Nightcore"
                        text={file.name}
                    />

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
                                        <p className="text-sm text-n-4">
                                            {currentSpeed !== 1.0 || currentPitch !== 0
                                                ? `${currentSpeed !== 1.0 ? `Vitesse: ${currentSpeed}x` : 'Vitesse: normale'}${currentPitch !== 0 ? ` • Pitch: +${currentPitch} semitones${originalKey ? ` (${originalKey}/${getRelativeMinor(originalKey)}m → ${calculateNewKey(originalKey, currentPitch).major}/${calculateNewKey(originalKey, currentPitch).minor}m)` : ''}` : ''}`
                                                : originalKey 
                                                    ? `Audio original (${originalKey}/${getRelativeMinor(originalKey)}m)`
                                                    : "Audio original"
                                            }
                                        </p>
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

                    <div className="mb-10 max-w-[77.5rem] mx-auto">
                        <div className="relative bg-n-8 rounded-3xl p-8 lg:p-12 border-2 border-n-6 shadow-2xl overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-500/5 via-transparent to-transparent"></div>
                            </div>
                            
                            <div className="relative z-1">
                                {/* Titre principal */}
                                <div className="flex items-center gap-3 mb-8 justify-center">
                                    <div className="w-1 h-8 bg-gradient-to-b from-color-4 to-color-5 rounded-full"></div>
                                    <h3 className="h5">Options Nightcore</h3>
                                    <div className="w-1 h-8 bg-gradient-to-b from-color-4 to-color-5 rounded-full"></div>
                                </div>

                                {/* Section Vitesse */}
                                <div className="mb-10">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-1 h-6 bg-gradient-to-b from-yellow-400 to-orange-400 rounded-full"></div>
                                        <h4 className="h6 text-n-2">Vitesse (Accélération)</h4>
                                    </div>
                                    <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-4">
                                        {speedOptions.map((option) => (
                                            <button
                                                key={option.speed}
                                                onClick={() => handleProcess(option.speed, currentPitch)}
                                                disabled={processing}
                                                className={`w-full relative p-0.5 bg-no-repeat bg-[length:100%_100%] transition-transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
                                                    currentSpeed === option.speed ? 'opacity-100' : 'opacity-90'
                                                }`}
                                                style={{
                                                    backgroundImage: `url(./src/assets/benefits/card-4.svg)`,
                                                }}
                                            >
                                                <div className={`relative z-2 flex items-center justify-between p-5 ${
                                                    currentSpeed === option.speed
                                                        ? 'bg-gradient-to-r from-yellow-500 to-orange-500'
                                                        : 'bg-n-8'
                                                }`}
                                                style={{ clipPath: "url(#benefits)" }}
                                                >
                                                    <div className="text-left flex-1">
                                                        <div className={`font-bold text-lg mb-1 ${
                                                            currentSpeed === option.speed ? 'text-white' : 'text-n-1'
                                                        }`}>
                                                            {option.label}
                                                        </div>
                                                        <div className={`text-xs ${
                                                            currentSpeed === option.speed ? 'text-white/90' : 'text-n-4'
                                                        }`}>
                                                            {option.description}
                                                        </div>
                                                    </div>
                                                    {currentSpeed === option.speed && (
                                                        <div className="w-3 h-3 rounded-full bg-white ml-2"></div>
                                                    )}
                                                </div>
                                                <div className="absolute inset-0 opacity-0 transition-opacity hover:opacity-10">
                                                    <div className="absolute inset-0 bg-color-4"></div>
                                                </div>
                                                <ClipPath />
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Ligne de séparation */}
                                <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent mb-10"></div>

                                {/* Section Pitch */}
                                <div>
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-1 h-6 bg-gradient-to-b from-purple-400 to-pink-400 rounded-full"></div>
                                        <h4 className="h6 text-n-2">Pitch (Montée)</h4>
                                    </div>
                                    <div className="grid md:grid-cols-4 lg:grid-cols-8 gap-4">
                                        {pitchOptions.map((option) => (
                                            <button
                                                key={option.pitch}
                                                onClick={() => handleProcess(currentSpeed, option.pitch)}
                                                disabled={processing}
                                                className={`w-full relative p-0.5 bg-no-repeat bg-[length:100%_100%] transition-transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
                                                    currentPitch === option.pitch ? 'opacity-100' : 'opacity-90'
                                                }`}
                                                style={{
                                                    backgroundImage: `url(./src/assets/benefits/card-4.svg)`,
                                                }}
                                            >
                                                <div className={`relative z-2 flex items-center justify-between p-5 ${
                                                    currentPitch === option.pitch
                                                        ? 'bg-gradient-to-r from-purple-500 to-pink-500'
                                                        : 'bg-n-8'
                                                }`}
                                                style={{ clipPath: "url(#benefits)" }}
                                                >
                                                    <div className="text-left flex-1">
                                                        <div className={`font-bold text-lg mb-1 ${
                                                            currentPitch === option.pitch ? 'text-white' : 'text-n-1'
                                                        }`}>
                                                            {option.label}
                                                        </div>
                                                        <div className={`text-xs mb-1 ${
                                                            currentPitch === option.pitch ? 'text-white/90' : 'text-n-4'
                                                        }`}>
                                                            {option.description}
                                                        </div>
                                                        {originalKey && option.pitch > 0 && (
                                                            <div className={`text-xs font-semibold ${
                                                                currentPitch === option.pitch ? 'text-white' : 'text-color-4'
                                                            }`}>
                                                                → {calculateNewKey(originalKey, option.semitones).major}/{calculateNewKey(originalKey, option.semitones).minor}m
                                                            </div>
                                                        )}
                                                    </div>
                                                    {currentPitch === option.pitch && (
                                                        <div className="w-3 h-3 rounded-full bg-white ml-2"></div>
                                                    )}
                                                </div>
                                                <div className="absolute inset-0 opacity-0 transition-opacity hover:opacity-10">
                                                    <div className="absolute inset-0 bg-color-5"></div>
                                                </div>
                                                <ClipPath />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

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
                                    <p className="text-n-3 mb-4">
                                        Vitesse: {currentSpeed}x • Pitch: +{currentPitch} semitones
                                    </p>
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

                    <div className="flex justify-center mt-8">
                        <button
                            onClick={() => navigate("/process", { state: location.state })}
                            className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-xl font-semibold text-white transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
                        >
                            Retour aux options
                        </button>
                    </div>

                    <Gradient />
                </div>
            </Section>
            <Footer />
        </>
    );
};

export default Nightcore;


