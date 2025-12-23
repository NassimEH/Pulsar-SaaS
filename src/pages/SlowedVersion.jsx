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

const SlowedVersion = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const waveformRef = useRef(null);
    const wavesurfer = useRef(null);
    const [file, setFile] = useState(null);
    const [originalFile, setOriginalFile] = useState(null);
    const [currentSpeed, setCurrentSpeed] = useState(1.0);
    const [currentReverb, setCurrentReverb] = useState(0.0);
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
        
        if (filename && fileObj) {
            setFile(fileObj);
            setOriginalFile(fileObj);
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

    const handleProcess = async (speed, reverb) => {
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
                    pitch: 0.0, // Pas de changement de pitch
                    nightcore: false,
                    reverb: reverb
                })
            });

            if (!response.ok) {
                throw new Error("Erreur lors du traitement");
            }

            const data = await response.json();
            const downloadUrl = `http://localhost:8000${data.download_url}`;
            setDownloadUrl(downloadUrl);
            setCurrentSpeed(speed);
            setCurrentReverb(reverb);

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

    // Options de vitesse
    const speedOptions = [
        { label: "Original", speed: 1.0, description: "Vitesse normale" },
        { label: "3/4", speed: 0.75, description: "Légèrement ralenti" },
        { label: "1/2", speed: 0.5, description: "Ralenti de moitié" },
        { label: "1/4", speed: 0.25, description: "Ralenti au quart" },
    ];

    // Options de reverb
    const reverbOptions = [
        { label: "Aucune", reverb: 0.0, description: "Pas de reverb" },
        { label: "Légère", reverb: 0.3, description: "Reverb subtile" },
        { label: "Modérée", reverb: 0.6, description: "Reverb moyenne" },
        { label: "Forte", reverb: 1.0, description: "Reverb intense" },
    ];

    return (
        <>
            <Header />
            <Section className="pt-[12rem] -mt-[5.25rem]" crosses crossesOffset="lg:translate-y-[5.25rem]">
                <div className="container relative z-2">
                    <Heading
                        className="md:max-w-md lg:max-w-2xl"
                        title="Slowed Version"
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
                                            {currentSpeed !== 1.0 || currentReverb > 0
                                                ? `${currentSpeed !== 1.0 ? `Vitesse: ${currentSpeed}x` : 'Vitesse: normale'}${currentReverb > 0 ? ` • Reverb: ${reverbOptions.find(r => r.reverb === currentReverb)?.label || 'Activée'}` : ''}`
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
                                    <div className="w-1 h-8 bg-gradient-to-b from-color-3 to-color-4 rounded-full"></div>
                                    <h3 className="h5">Options de Traitement</h3>
                                    <div className="w-1 h-8 bg-gradient-to-b from-color-3 to-color-4 rounded-full"></div>
                                </div>

                                {/* Section Vitesse */}
                                <div className="mb-10">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-1 h-6 bg-gradient-to-b from-blue-400 to-cyan-400 rounded-full"></div>
                                        <h4 className="h6 text-n-2">Vitesse</h4>
                                    </div>
                                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                                        {speedOptions.map((option) => (
                                            <button
                                                key={option.speed}
                                                onClick={() => handleProcess(option.speed, currentReverb)}
                                                disabled={processing}
                                                className={`w-full relative p-0.5 bg-no-repeat bg-[length:100%_100%] transition-transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
                                                    currentSpeed === option.speed ? 'opacity-100' : 'opacity-90'
                                                }`}
                                                style={{
                                                    backgroundImage: `url(./src/assets/benefits/card-3.svg)`,
                                                }}
                                            >
                                                <div className={`relative z-2 flex items-center justify-between p-5 ${
                                                    currentSpeed === option.speed
                                                        ? 'bg-gradient-to-r from-blue-500 to-cyan-500'
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
                                                        <div className={`text-xs mb-1 ${
                                                            currentSpeed === option.speed ? 'text-white/90' : 'text-n-4'
                                                        }`}>
                                                            {option.description}
                                                        </div>
                                                        {option.speed !== 1.0 && (
                                                            <div className={`text-xs font-semibold ${
                                                                currentSpeed === option.speed ? 'text-white' : 'text-color-3'
                                                            }`}>
                                                                {option.speed}x
                                                            </div>
                                                        )}
                                                    </div>
                                                    {currentSpeed === option.speed && (
                                                        <div className="w-3 h-3 rounded-full bg-white ml-2"></div>
                                                    )}
                                                </div>
                                                <div className="absolute inset-0 opacity-0 transition-opacity hover:opacity-10">
                                                    <div className="absolute inset-0 bg-color-3"></div>
                                                </div>
                                                <ClipPath />
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Ligne de séparation */}
                                <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent mb-10"></div>

                                {/* Section Reverb */}
                                <div>
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-1 h-6 bg-gradient-to-b from-purple-400 to-pink-400 rounded-full"></div>
                                        <h4 className="h6 text-n-2">Reverb</h4>
                                    </div>
                                    <div className="grid md:grid-cols-4 gap-4">
                                        {reverbOptions.map((option) => (
                                            <button
                                                key={option.reverb}
                                                onClick={() => handleProcess(currentSpeed, option.reverb)}
                                                disabled={processing}
                                                className={`w-full relative p-0.5 bg-no-repeat bg-[length:100%_100%] transition-transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
                                                    currentReverb === option.reverb ? 'opacity-100' : 'opacity-90'
                                                }`}
                                                style={{
                                                    backgroundImage: `url(./src/assets/benefits/card-3.svg)`,
                                                }}
                                            >
                                                <div className={`relative z-2 flex items-center justify-between p-5 ${
                                                    currentReverb === option.reverb
                                                        ? 'bg-gradient-to-r from-purple-500 to-pink-500'
                                                        : 'bg-n-8'
                                                }`}
                                                style={{ clipPath: "url(#benefits)" }}
                                                >
                                                    <div className="text-left flex-1">
                                                        <div className={`font-bold text-lg mb-1 ${
                                                            currentReverb === option.reverb ? 'text-white' : 'text-n-1'
                                                        }`}>
                                                            {option.label}
                                                        </div>
                                                        <div className={`text-xs ${
                                                            currentReverb === option.reverb ? 'text-white/90' : 'text-n-4'
                                                        }`}>
                                                            {option.description}
                                                        </div>
                                                    </div>
                                                    {currentReverb === option.reverb && (
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
                                        Vitesse: {currentSpeed}x {currentReverb > 0 && `• Reverb: ${reverbOptions.find(r => r.reverb === currentReverb)?.label || 'Activée'}`}
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

export default SlowedVersion;

