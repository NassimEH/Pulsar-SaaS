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

const Transpose = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const waveformRef = useRef(null);
    const wavesurfer = useRef(null);
    const [file, setFile] = useState(null);
    const [originalFile, setOriginalFile] = useState(null);
    const [originalKey, setOriginalKey] = useState(null); // Clé originale du morceau
    const [currentPitch, setCurrentPitch] = useState(0); // en cents
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
            // Charger depuis le serveur (cherche dans processed puis uploads)
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

    // Conversion: 100 cents = 1 semitone
    const centsToSemitones = (cents) => cents / 100;

    const handleTranspose = async (cents) => {
        if (!file) return;

        // Si 0 cents, réinitialiser à l'original
        if (cents === 0) {
            setCurrentPitch(0);
            setDownloadUrl("");
            
            // Recharger l'audio original
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
            
            if (filename && originalFile instanceof File) {
                // Nettoyer l'ancienne URL
                if (audioUrl) {
                    URL.revokeObjectURL(audioUrl);
                }
                
                const url = URL.createObjectURL(originalFile);
                setAudioUrl(url);
                
                setTimeout(() => {
                    if (wavesurfer.current) {
                        wavesurfer.current.load(url);
                    }
                }, 100);
            }
            return;
        }

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
            const semitones = centsToSemitones(cents);
            const response = await fetch("http://localhost:8000/api/process", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    filename: filename,
                    speed: 1.0, // Pas de changement de vitesse
                    pitch: semitones, // Conversion en semitones
                    nightcore: false
                })
            });

            if (!response.ok) {
                throw new Error("Erreur lors de la transposition");
            }

            const data = await response.json();
            const downloadUrl = `http://localhost:8000${data.download_url}`;
            setDownloadUrl(downloadUrl);
            setCurrentPitch(cents);

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
            console.error("Transpose Error:", error);
            alert("Erreur lors de la transposition");
        } finally {
            setProcessing(false);
        }
    };

    if (!file) return null;

    // Options de transposition en cents - séparées en descente et montée
    const transposeDown = [
        { label: "-1200", cents: -1200, description: "-1 octave", semitones: -12 },
        { label: "-600", cents: -600, description: "-1/2 octave", semitones: -6 },
        { label: "-500", cents: -500, description: "-500 cents", semitones: -5 },
        { label: "-400", cents: -400, description: "-400 cents", semitones: -4 },
        { label: "-300", cents: -300, description: "-300 cents", semitones: -3 },
        { label: "-200", cents: -200, description: "-200 cents", semitones: -2 },
        { label: "-100", cents: -100, description: "-100 cents", semitones: -1 },
    ];

    const transposeUp = [
        { label: "+100", cents: 100, description: "+100 cents", semitones: 1 },
        { label: "+200", cents: 200, description: "+200 cents", semitones: 2 },
        { label: "+300", cents: 300, description: "+300 cents", semitones: 3 },
        { label: "+400", cents: 400, description: "+400 cents", semitones: 4 },
        { label: "+500", cents: 500, description: "+500 cents", semitones: 5 },
        { label: "+600", cents: 600, description: "+1/2 octave", semitones: 6 },
        { label: "+1200", cents: 1200, description: "+1 octave", semitones: 12 },
    ];

    return (
        <>
            <Header />
            <Section className="pt-[12rem] -mt-[5.25rem]" crosses crossesOffset="lg:translate-y-[5.25rem]">
                <div className="container relative z-2">
                    <Heading
                        className="md:max-w-md lg:max-w-2xl"
                        title="Transposer l'Audio"
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
                                            {currentPitch !== 0 
                                                ? (() => {
                                                    const newKeys = calculateNewKey(originalKey, centsToSemitones(currentPitch));
                                                    return `Transposé de ${currentPitch > 0 ? '+' : ''}${currentPitch} cents ${originalKey ? `(${originalKey}/${getRelativeMinor(originalKey)}m → ${newKeys.major}/${newKeys.minor}m)` : ''}`;
                                                })()
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
                                    <div className="w-1 h-8 bg-gradient-to-b from-color-2 to-color-3 rounded-full"></div>
                                    <h3 className="h5">Options de Transposition</h3>
                                    <div className="w-1 h-8 bg-gradient-to-b from-color-2 to-color-3 rounded-full"></div>
                                </div>

                                {/* Bouton central pour réinitialiser */}
                                <div className="flex justify-center mb-8">
                                    <button
                                        onClick={() => handleTranspose(0)}
                                        disabled={processing}
                                        className={`px-8 py-4 rounded-xl font-semibold text-base transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
                                            currentPitch === 0
                                                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white ring-4 ring-purple-500/50'
                                                : 'bg-n-7 text-n-1 border-2 border-purple-500/50 hover:border-purple-500 hover:bg-n-6'
                                        }`}
                                    >
                                        <div className="font-bold text-xl mb-1">Original</div>
                                        <div className="text-xs opacity-90 font-normal">
                                            {originalKey ? `0 cents (${originalKey}/${getRelativeMinor(originalKey)}m)` : '0 cents'}
                                        </div>
                                    </button>
                                </div>

                                {/* Conteneur pour les deux colonnes */}
                                <div className="grid md:grid-cols-2 gap-8 relative">
                                    {/* Colonne gauche - Descendre */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-1 h-6 bg-gradient-to-b from-blue-400 to-cyan-400 rounded-full"></div>
                                            <h4 className="h6 text-n-2">Descendre</h4>
                                        </div>
                                        {transposeDown.map((option) => (
                                            <button
                                                key={option.cents}
                                                onClick={() => handleTranspose(option.cents)}
                                                disabled={processing}
                                                className={`w-full relative p-0.5 bg-no-repeat bg-[length:100%_100%] transition-transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
                                                    currentPitch === option.cents ? 'opacity-100' : 'opacity-90'
                                                }`}
                                                style={{
                                                    backgroundImage: `url(./src/assets/benefits/card-2.svg)`,
                                                }}
                                            >
                                                <div className={`relative z-2 flex items-center justify-between p-5 ${
                                                    currentPitch === option.cents
                                                        ? 'bg-gradient-to-r from-blue-500 to-cyan-500'
                                                        : 'bg-n-8'
                                                }`}
                                                style={{ clipPath: "url(#benefits)" }}
                                                >
                                                    <div className="text-left flex-1">
                                                        <div className={`font-bold text-lg mb-1 ${
                                                            currentPitch === option.cents ? 'text-white' : 'text-n-1'
                                                        }`}>
                                                            {option.label} cents
                                                        </div>
                                                        <div className={`text-xs mb-1 ${
                                                            currentPitch === option.cents ? 'text-white/90' : 'text-n-4'
                                                        }`}>
                                                            {option.description}
                                                        </div>
                                                        {originalKey && (() => {
                                                            const newKeys = calculateNewKey(originalKey, option.semitones);
                                                            return (
                                                                <div className={`text-xs font-semibold ${
                                                                    currentPitch === option.cents ? 'text-white' : 'text-color-2'
                                                                }`}>
                                                                    → {newKeys.major}/{newKeys.minor}m
                                                                </div>
                                                            );
                                                        })()}
                                                    </div>
                                                    {currentPitch === option.cents && (
                                                        <div className="w-3 h-3 rounded-full bg-white ml-2"></div>
                                                    )}
                                                </div>
                                                <div className="absolute inset-0 opacity-0 transition-opacity hover:opacity-10">
                                                    <div className="absolute inset-0 bg-color-2"></div>
                                                </div>
                                                <ClipPath />
                                            </button>
                                        ))}
                                    </div>

                                    {/* Ligne de séparation verticale */}
                                    <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-transparent via-purple-500/50 to-transparent transform -translate-x-1/2"></div>

                                    {/* Colonne droite - Monter */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-1 h-6 bg-gradient-to-b from-yellow-400 to-orange-400 rounded-full"></div>
                                            <h4 className="h6 text-n-2">Monter</h4>
                                        </div>
                                        {transposeUp.map((option) => (
                                            <button
                                                key={option.cents}
                                                onClick={() => handleTranspose(option.cents)}
                                                disabled={processing}
                                                className={`w-full relative p-0.5 bg-no-repeat bg-[length:100%_100%] transition-transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
                                                    currentPitch === option.cents ? 'opacity-100' : 'opacity-90'
                                                }`}
                                                style={{
                                                    backgroundImage: `url(./src/assets/benefits/card-2.svg)`,
                                                }}
                                            >
                                                <div className={`relative z-2 flex items-center justify-between p-5 ${
                                                    currentPitch === option.cents
                                                        ? 'bg-gradient-to-r from-yellow-500 to-orange-500'
                                                        : 'bg-n-8'
                                                }`}
                                                style={{ clipPath: "url(#benefits)" }}
                                                >
                                                    <div className="text-left flex-1">
                                                        <div className={`font-bold text-lg mb-1 ${
                                                            currentPitch === option.cents ? 'text-white' : 'text-n-1'
                                                        }`}>
                                                            {option.label} cents
                                                        </div>
                                                        <div className={`text-xs mb-1 ${
                                                            currentPitch === option.cents ? 'text-white/90' : 'text-n-4'
                                                        }`}>
                                                            {option.description}
                                                        </div>
                                                        {originalKey && (() => {
                                                            const newKeys = calculateNewKey(originalKey, option.semitones);
                                                            return (
                                                                <div className={`text-xs font-semibold ${
                                                                    currentPitch === option.cents ? 'text-white' : 'text-color-5'
                                                                }`}>
                                                                    → {newKeys.major}/{newKeys.minor}m
                                                                </div>
                                                            );
                                                        })()}
                                                    </div>
                                                    {currentPitch === option.cents && (
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
                                    <h4 className="h5 mb-4">Transposition terminée !</h4>
                                    <p className="text-n-3 mb-4">
                                        Transposé de {currentPitch > 0 ? '+' : ''}{currentPitch} cents
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
                                <p className="text-n-1 text-xl mt-6">Transposition en cours...</p>
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

export default Transpose;

