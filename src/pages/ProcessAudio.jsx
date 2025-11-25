import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import WaveSurfer from "wavesurfer.js";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Section from "../components/Section";
import Button from "../components/Button";
import Heading from "../components/Heading";
import { Gradient } from "../components/design/Services";
import { GradientLight } from "../components/design/Benefits";
import ClipPath from "../assets/svg/ClipPath";

const ProcessAudio = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const waveformRef = useRef(null);
    const wavesurfer = useRef(null);
    const [file, setFile] = useState(null);
    const [analysis, setAnalysis] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [downloadUrl, setDownloadUrl] = useState("");
    const [isPlaying, setIsPlaying] = useState(false);

    useEffect(() => {
        if (location.state?.file && location.state?.filename) {
            setFile(location.state.file);
            analyzeFile(location.state.filename);
            setTimeout(() => {
                initializeWaveform(location.state.file);
            }, 100);
        } else {
            navigate("/studio");
        }

        return () => {
            if (wavesurfer.current) {
                try {
                    wavesurfer.current.destroy();
                } catch (error) {
                    console.log('WaveSurfer cleanup');
                }
            }
        };
    }, [location, navigate]);

    const initializeWaveform = (audioFile) => {
        if (waveformRef.current && audioFile) {
            if (wavesurfer.current) {
                try {
                    wavesurfer.current.destroy();
                } catch (error) {
                    console.log('WaveSurfer already destroyed');
                }
            }

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

            const url = URL.createObjectURL(audioFile);
            wavesurfer.current.load(url);

            wavesurfer.current.on('play', () => setIsPlaying(true));
            wavesurfer.current.on('pause', () => setIsPlaying(false));
            wavesurfer.current.on('finish', () => setIsPlaying(false));
        }
    };

    const togglePlayPause = () => {
        if (wavesurfer.current) {
            wavesurfer.current.playPause();
        }
    };

    const analyzeFile = async (filename) => {
        try {
            const response = await fetch(`http://localhost:8000/api/analyze?filename=${filename}`, {
                method: "POST"
            });
            const data = await response.json();
            setAnalysis(data.features);
        } catch (error) {
            console.error("Analysis error:", error);
            setAnalysis({
                bpm: 120,
                key: "C",
                rms_level: 0.5,
                spectral_centroid: 2000
            });
        }
    };

    const processingOptions = [
        {
            id: "analyze",
            title: "Analyse IA du Mix",
            description: "Obtenez un diagnostic professionnel de votre mixage avec des recommandations précises.",
            icon: "🎯",
            backgroundUrl: "./src/assets/benefits/card-1.svg",
            light: true,
        },
        {
            id: "transpose",
            title: "Transposer",
            description: "Changez la tonalité de votre piste sans affecter le tempo.",
            icon: "🎹",
            backgroundUrl: "./src/assets/benefits/card-2.svg",
            params: { pitch: 2 },
        },
        {
            id: "slowed",
            title: "Slowed Version",
            description: "Ralentissez votre track pour un effet chill et atmosphérique.",
            icon: "🐌",
            backgroundUrl: "./src/assets/benefits/card-3.svg",
            params: { speed: 0.8 },
        },
        {
            id: "nightcore",
            title: "Nightcore",
            description: "Accélérez et montez le pitch pour un effet énergique.",
            icon: "⚡",
            backgroundUrl: "./src/assets/benefits/card-4.svg",
            params: { speed: 1.25, pitch: 3, nightcore: true },
        },
        {
            id: "pitchup",
            title: "Pitch Up",
            description: "Augmentez la hauteur tonale sans modifier la vitesse.",
            icon: "⬆️",
            backgroundUrl: "./src/assets/benefits/card-5.svg",
            params: { pitch: 5 },
        },
        {
            id: "custom",
            title: "Personnalisé",
            description: "Contrôlez finement tous les paramètres audio.",
            icon: "🎛️",
            backgroundUrl: "./src/assets/benefits/card-6.svg",
        },
    ];

    const handleProcess = async (option) => {
        if (!file) return;

        if (option.id === "analyze") {
            navigate("/analyze-ai", {
                state: {
                    file: file,
                    filename: location.state.filename,
                    analysis: analysis
                }
            });
            return;
        }

        setProcessing(true);
        try {
            const response = await fetch("http://localhost:8000/api/process", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    filename: location.state.filename,
                    speed: option.params?.speed || 1.0,
                    pitch: option.params?.pitch || 0,
                    nightcore: option.params?.nightcore || false
                })
            });
            const data = await response.json();
            setDownloadUrl(`http://localhost:8000${data.download_url}`);
        } catch (error) {
            console.error("Processing Error:", error);
            alert("Erreur lors du traitement");
        } finally {
            setProcessing(false);
        }
    };

    if (!file) return null;

    const Arrow = () => (
        <svg className="ml-5 fill-n-1" width="24" height="24">
            <path d="M8.293 5.293a1 1 0 0 1 1.414 0l6 6a1 1 0 0 1 0 1.414l-6 6a1 1 0 0 1-1.414-1.414L13.586 12 8.293 6.707a1 1 0 0 1 0-1.414z" />
        </svg>
    );

    return (
        <>
            <Header />
            <Section className="pt-[12rem] -mt-[5.25rem]" crosses crossesOffset="lg:translate-y-[5.25rem]">
                <div className="container relative z-2">
                    <Heading
                        className="md:max-w-md lg:max-w-2xl"
                        title="Que voulez-vous faire ?"
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
                                        <p className="text-sm text-n-4">Écoutez votre fichier avant traitement</p>
                                    </div>
                                    <button
                                        onClick={togglePlayPause}
                                        className="flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 transition-all duration-300 shadow-2xl hover:shadow-purple-500/50 hover:scale-110"
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

                                {analysis && (
                                    <div className="pt-8 border-t border-n-6/30">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-1 h-6 bg-gradient-to-b from-blue-400 to-cyan-400 rounded-full"></div>
                                            <h4 className="h5">Analyse Audio</h4>
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <div className="relative group">
                                                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl opacity-0 group-hover:opacity-10 transition-opacity"></div>
                                                <div className="relative p-5 rounded-xl border border-n-6/30 text-center backdrop-blur-sm hover:border-purple-500/30 transition-all">
                                                    <div className="text-xs text-n-4 mb-2 uppercase tracking-wider font-semibold">Tempo</div>
                                                    <div className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">{analysis.bpm}</div>
                                                    <div className="text-xs text-n-4 mt-1">BPM</div>
                                                </div>
                                            </div>
                                            <div className="relative group">
                                                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl opacity-0 group-hover:opacity-10 transition-opacity"></div>
                                                <div className="relative p-5 rounded-xl border border-n-6/30 text-center backdrop-blur-sm hover:border-blue-500/30 transition-all">
                                                    <div className="text-xs text-n-4 mb-2 uppercase tracking-wider font-semibold">Tonalité</div>
                                                    <div className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">{analysis.key}</div>
                                                    <div className="text-xs text-n-4 mt-1">Clé</div>
                                                </div>
                                            </div>
                                            <div className="relative group">
                                                <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-teal-500 rounded-xl opacity-0 group-hover:opacity-10 transition-opacity"></div>
                                                <div className="relative p-5 rounded-xl border border-n-6/30 text-center backdrop-blur-sm hover:border-green-500/30 transition-all">
                                                    <div className="text-xs text-n-4 mb-2 uppercase tracking-wider font-semibold">Volume</div>
                                                    <div className="text-3xl font-bold bg-gradient-to-r from-green-400 to-teal-400 bg-clip-text text-transparent">{analysis.rms_level.toFixed(2)}</div>
                                                    <div className="text-xs text-n-4 mt-1">RMS</div>
                                                </div>
                                            </div>
                                            <div className="relative group">
                                                <div className="absolute inset-0 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl opacity-0 group-hover:opacity-10 transition-opacity"></div>
                                                <div className="relative p-5 rounded-xl border border-n-6/30 text-center backdrop-blur-sm hover:border-yellow-500/30 transition-all">
                                                    <div className="text-xs text-n-4 mb-2 uppercase tracking-wider font-semibold">Brillance</div>
                                                    <div className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">{Math.round(analysis.spectral_centroid)}</div>
                                                    <div className="text-xs text-n-4 mt-1">Hz</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="mb-6">
                        <div className="flex items-center gap-3 mb-8 max-w-[77.5rem] mx-auto">
                            <div className="w-1 h-8 bg-gradient-to-b from-color-1 to-color-2 rounded-full"></div>
                            <h3 className="h5">Options de Traitement</h3>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-10 mb-10 justify-center">
                        {processingOptions.map((option) => (
                            <div
                                key={option.id}
                                className="block relative p-0.5 bg-no-repeat bg-[length:100%_100%] md:max-w-[24rem] cursor-pointer transition-transform hover:scale-105"
                                style={{
                                    backgroundImage: `url(${option.backgroundUrl})`,
                                }}
                                onClick={() => handleProcess(option)}
                            >
                                <div className="relative z-2 flex flex-col min-h-[22rem] p-[2.4rem] pointer-events-none">
                                    <div className="text-6xl mb-5">{option.icon}</div>
                                    <h5 className="h5 mb-5">{option.title}</h5>
                                    <p className="body-2 mb-6 text-n-3">{option.description}</p>
                                    <div className="flex items-center mt-auto">
                                        <p className="ml-auto font-code text-xs font-bold text-n-1 uppercase tracking-wider pointer-events-auto">
                                            {option.id === "analyze" ? "Voir l'analyse" : "Appliquer"}
                                        </p>
                                        <Arrow />
                                    </div>
                                </div>

                                {option.light && <GradientLight />}

                                <div
                                    className="absolute inset-0.5 bg-n-8"
                                    style={{ clipPath: "url(#benefits)" }}
                                >
                                    <div className="absolute inset-0 opacity-0 transition-opacity hover:opacity-10">
                                        {option.id === "analyze" && <div className="absolute inset-0 bg-color-1"></div>}
                                        {option.id === "transpose" && <div className="absolute inset-0 bg-color-2"></div>}
                                        {option.id === "slowed" && <div className="absolute inset-0 bg-color-3"></div>}
                                        {option.id === "nightcore" && <div className="absolute inset-0 bg-color-4"></div>}
                                        {option.id === "pitchup" && <div className="absolute inset-0 bg-color-5"></div>}
                                        {option.id === "custom" && <div className="absolute inset-0 bg-color-6"></div>}
                                    </div>
                                </div>

                                <ClipPath />
                            </div>
                        ))}
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

export default ProcessAudio;
