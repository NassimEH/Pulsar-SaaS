import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import WaveSurfer from "wavesurfer.js";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Section from "../components/Section";
import Heading from "../components/Heading";
import Button from "../components/Button";
import { Gradient } from "../components/design/Services";
import { formatKeyWithMinor } from "../utils/keyUtils";
import ButtonGradient from "../assets/svg/ButtonGradient";
import ButtonSvg from "../assets/svg/ButtonSvg";

// Dictionnaire des explications simples pour chaque métrique
// Les clés correspondent aux noms retournés par le backend (comp.name)
const metricExplanations = {
    'BPM': 'Le tempo en battements par minute.\n\nRéférences : 60-80 BPM (lent), 80-120 BPM (modéré), 120-160 BPM (rapide), 160+ BPM (très rapide).',
    'Stabilité du tempo': 'Indique si le tempo reste constant.\n\nValeur entre 0 et 1 : 0.9-1.0 = très stable, 0.7-0.9 = stable, 0.5-0.7 = instable, <0.5 = très instable.',
    'Tonalité': 'La tonalité musicale principale du morceau (ex: Do, Ré, Mi...). Correspond à la note fondamentale de la composition.',
    'Niveau RMS': 'Le volume moyen du morceau en décibels.\n\nRéférences : -20 à -12 dB (faible), -12 à -6 dB (modéré), -6 à 0 dB (fort), 0+ dB (très fort, risque de saturation).',
    'Niveau Peak': 'Le volume maximum atteint dans le morceau en décibels.\n\nRéférences : < -6 dB (prudent), -6 à 0 dB (normal), 0+ dB (saturation/clipping).',
    'Crest Factor': 'La différence entre les sons forts et moyens en décibels.\n\nRéférences : 4-6 dB (très compressé), 6-10 dB (compressé), 10-14 dB (dynamique), 14+ dB (très dynamique).',
    'Dynamic Range': 'L\'écart entre le son le plus fort et le plus faible en décibels.\n\nRéférences : <6 dB (faible dynamique), 6-10 dB (moyenne), 10-14 dB (bonne), 14+ dB (excellente dynamique).',
    'Centroïde spectral': 'La "brillance" du son en Hz.\n\nRéférences : <2000 Hz (sombre), 2000-4000 Hz (équilibré), 4000-6000 Hz (brillant), 6000+ Hz (très brillant).',
    'Bande passante spectrale': 'La largeur du spectre fréquentiel en Hz.\n\nRéférences : <3000 Hz (étroit), 3000-6000 Hz (moyen), 6000-10000 Hz (large), 10000+ Hz (très large).',
    'Spectral Rolloff': 'La fréquence où 85% de l\'énergie est concentrée en Hz.\n\nRéférences : <5000 Hz (peu d\'aigus), 5000-10000 Hz (équilibré), 10000-15000 Hz (présence d\'aigus), 15000+ Hz (beaucoup d\'aigus).',
    'Spectral Contrast': 'Le contraste entre les différentes fréquences.\n\nRéférences : <0.3 (faible contraste), 0.3-0.5 (moyen), 0.5-0.7 (élevé), 0.7+ (très élevé).',
    'Spectral Flatness': 'Indique si le son est plutôt tonal ou bruité.\n\nValeur entre 0 et 1 : 0-0.3 (tonal/musical), 0.3-0.6 (mixte), 0.6-0.9 (bruité), 0.9-1.0 (très bruité).',
    'Taux de passage par zéro': 'Le nombre de fois que le signal passe par zéro.\n\nRéférences : <0.05 (son lisse), 0.05-0.1 (équilibré), 0.1-0.15 (percussif), 0.15+ (très percussif).',
    'Énergie Basses': 'Le pourcentage d\'énergie dans les basses fréquences (20-250 Hz).\n\nRéférences : <15% (faible), 15-25% (moyen), 25-35% (élevé), 35%+ (très élevé).',
    'Énergie Bas-médiums': 'Le pourcentage d\'énergie dans les bas-médiums (250-500 Hz).\n\nRéférences : <10% (faible), 10-20% (moyen), 20-30% (élevé), 30%+ (très élevé).',
    'Énergie Médiums': 'Le pourcentage d\'énergie dans les médiums (500-2000 Hz).\n\nRéférences : <20% (faible), 20-35% (moyen), 35-50% (élevé), 50%+ (très élevé).',
    'Énergie Hauts-médiums': 'Le pourcentage d\'énergie dans les hauts-médiums (2000-4000 Hz).\n\nRéférences : <15% (faible), 15-25% (moyen), 25-35% (élevé), 35%+ (très élevé).',
    'Énergie Aigus': 'Le pourcentage d\'énergie dans les aigus (4000-20000 Hz).\n\nRéférences : <10% (faible), 10-20% (moyen), 20-30% (élevé), 30%+ (très élevé).',
    'Ratio harmonique': 'Le ratio entre les sons harmoniques (mélodiques) et percussifs.\n\nValeur entre 0 et 1 : 0.7-1.0 (très mélodique), 0.5-0.7 (mélodique), 0.3-0.5 (mixte), <0.3 (percussif).',
    'Ratio percussif': 'Le ratio entre les sons percussifs et harmoniques.\n\nValeur entre 0 et 1 : 0.7-1.0 (très percussif), 0.5-0.7 (percussif), 0.3-0.5 (mixte), <0.3 (mélodique).'
};

const Compare = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [showInfo, setShowInfo] = useState({});
    const waveformOriginalRef = useRef(null);
    const waveformReferenceRef = useRef(null);
    const wavesurferOriginal = useRef(null);
    const wavesurferReference = useRef(null);
    
    const [originalFile, setOriginalFile] = useState(null);
    const [referenceFile, setReferenceFile] = useState(null);
    const [originalFilename, setOriginalFilename] = useState(null);
    const [referenceFilename, setReferenceFilename] = useState(null);
    const [uploadingReference, setUploadingReference] = useState(false);
    const [comparing, setComparing] = useState(false);
    const [comparisonResult, setComparisonResult] = useState(null);
    const [isPlayingOriginal, setIsPlayingOriginal] = useState(false);
    const [isPlayingReference, setIsPlayingReference] = useState(false);

    useEffect(() => {
        // Récupérer les données du fichier original
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
            setOriginalFile(fileObj);
            setOriginalFilename(filename);
            
            if (fileObj instanceof File) {
                const url = URL.createObjectURL(fileObj);
                setTimeout(() => {
                    initializeWaveform(waveformOriginalRef, wavesurferOriginal, fileObj, url, setIsPlayingOriginal);
                }, 100);
            }
        } else {
            navigate("/studio");
        }

        return () => {
            [wavesurferOriginal, wavesurferReference].forEach(wavesurfer => {
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
            });
        };
    }, [location, navigate]);

    const initializeWaveform = (waveformRef, wavesurferRef, audioFile, url, setIsPlaying) => {
        if (waveformRef.current && audioFile && url) {
            if (wavesurferRef.current) {
                try {
                    wavesurferRef.current.unAll();
                    wavesurferRef.current.destroy();
                } catch (error) {
                    console.log('WaveSurfer cleanup:', error.message);
                } finally {
                    wavesurferRef.current = null;
                }
            }

            try {
                wavesurferRef.current = WaveSurfer.create({
                    container: waveformRef.current,
                    waveColor: '#AC6AFF',
                    progressColor: '#FFC876',
                    cursorColor: '#FFF',
                    barWidth: 2,
                    barRadius: 3,
                    cursorWidth: 1,
                    height: 120,
                    barGap: 2,
                    responsive: true,
                    normalize: true,
                });

                wavesurferRef.current.load(url);

                wavesurferRef.current.on('play', () => setIsPlaying(true));
                wavesurferRef.current.on('pause', () => setIsPlaying(false));
                wavesurferRef.current.on('finish', () => setIsPlaying(false));
            } catch (error) {
                console.error('Error initializing WaveSurfer:', error);
            }
        }
    };

    const togglePlayPause = (wavesurferRef, setIsPlaying) => {
        if (wavesurferRef.current) {
            wavesurferRef.current.playPause();
        }
    };

    const handleReferenceUpload = async (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;

        // Validate file size (50MB max)
        const maxSize = 50 * 1024 * 1024;
        if (selectedFile.size > maxSize) {
            alert("Le fichier est trop volumineux. Taille maximum : 50MB");
            e.target.value = "";
            return;
        }

        setUploadingReference(true);
        const formData = new FormData();
        formData.append("file", selectedFile);

        try {
            const uploadResponse = await fetch("http://localhost:8000/api/upload", {
                method: "POST",
                body: formData,
            });

            if (!uploadResponse.ok) {
                const errorData = await uploadResponse.json().catch(() => ({ detail: "Upload failed" }));
                throw new Error(errorData.detail || `Upload failed with status ${uploadResponse.status}`);
            }

            const uploadData = await uploadResponse.json();
            setReferenceFile(selectedFile);
            setReferenceFilename(uploadData.filename);

            // Initialiser le waveform pour la référence
            const url = URL.createObjectURL(selectedFile);
            setTimeout(() => {
                initializeWaveform(waveformReferenceRef, wavesurferReference, selectedFile, url, setIsPlayingReference);
            }, 100);

        } catch (error) {
            console.error("Error:", error);
            alert(`Erreur lors de l'upload: ${error.message}`);
            e.target.value = "";
        } finally {
            setUploadingReference(false);
        }
    };

    const handleCompare = async () => {
        if (!originalFilename || !referenceFilename) {
            alert("Veuillez uploader un fichier de référence.");
            return;
        }

        setComparing(true);
        try {
            const response = await fetch("http://localhost:8000/api/compare", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    original_filename: originalFilename,
                    reference_filename: referenceFilename
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ detail: "Comparison failed" }));
                throw new Error(errorData.detail || `Comparison failed with status ${response.status}`);
            }

            const data = await response.json();
            setComparisonResult(data);
        } catch (error) {
            console.error("Comparison Error:", error);
            alert(`Erreur lors de la comparaison: ${error.message}`);
        } finally {
            setComparing(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "identique":
                return "from-green-500 to-emerald-500";
            case "très_proche":
                return "from-green-500 to-emerald-500";
            case "proche":
                return "from-blue-500 to-cyan-500";
            case "moyen":
                return "from-yellow-500 to-orange-500";
            case "éloigné":
                return "from-orange-500 to-red-500";
            case "très_éloigné":
                return "from-red-500 to-rose-500";
            default:
                return "from-gray-500 to-gray-600";
        }
    };

    const getStatusBgColor = (status) => {
        switch (status) {
            case "très_proche":
                return "bg-green-500/10 border-green-500/30";
            case "proche":
                return "bg-blue-500/10 border-blue-500/30";
            case "moyen":
                return "bg-yellow-500/10 border-yellow-500/30";
            case "éloigné":
                return "bg-orange-500/10 border-orange-500/30";
            case "très_éloigné":
                return "bg-red-500/10 border-red-500/30";
            default:
                return "bg-gray-500/10 border-gray-500/30";
        }
    };

    if (!originalFile) return null;

    return (
        <>
            <Header />
            <Section className="pt-[12rem] -mt-[5.25rem]" crosses crossesOffset="lg:translate-y-[5.25rem]">
                <div className="container relative z-2">
                    <Heading
                        className="md:max-w-md lg:max-w-2xl"
                        title="Comparaison avec Référence"
                        text="Comparez votre mix avec un morceau de référence professionnel"
                    />

                    {/* Section des deux fichiers audio */}
                    <div className="grid md:grid-cols-2 gap-6 mb-10 max-w-[77.5rem] mx-auto">
                        {/* Fichier Original */}
                        <div className="relative bg-n-8 rounded-3xl p-6 border-2 border-n-6 shadow-xl">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-1 h-6 bg-gradient-to-b from-purple-400 to-pink-400 rounded-full"></div>
                                <h3 className="h6">Votre Morceau</h3>
                            </div>
                            <p className="text-sm text-n-4 mb-4">{originalFile.name}</p>
                            <div ref={waveformOriginalRef} className="w-full mb-4" style={{ minHeight: '120px' }}></div>
                            <button
                                onClick={() => togglePlayPause(wavesurferOriginal, setIsPlayingOriginal)}
                                className="button relative inline-flex items-center justify-center h-11 w-full transition-colors hover:text-color-1 px-7 text-n-1"
                            >
                                <span className="relative z-10">{isPlayingOriginal ? "Pause" : "Play"}</span>
                                {ButtonSvg(false)}
                            </button>
                        </div>

                        {/* Fichier de Référence */}
                        <div className="relative bg-n-8 rounded-3xl p-6 border-2 border-n-6 shadow-xl">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-1 h-6 bg-gradient-to-b from-blue-400 to-cyan-400 rounded-full"></div>
                                <h3 className="h6">Morceau de Référence</h3>
                            </div>
                            {!referenceFile ? (
                                <>
                                    <input
                                        type="file"
                                        accept=".mp3,.wav,.ogg,.flac"
                                        onChange={handleReferenceUpload}
                                        id="reference-upload"
                                        className="hidden"
                                        disabled={uploadingReference}
                                    />
                                    <label
                                        htmlFor="reference-upload"
                                        className={`flex flex-col items-center justify-center w-full h-40 border-2 border-n-6 border-dashed rounded-2xl cursor-pointer bg-n-7/50 hover:bg-n-7 transition-colors ${uploadingReference ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        {uploadingReference ? (
                                            <div className="flex flex-col items-center justify-center">
                                                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-color-1 mb-2"></div>
                                                <p className="text-n-3 text-sm">Upload en cours...</p>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center">
                                                <svg className="w-10 h-10 mb-2 text-n-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                                </svg>
                                                <p className="text-sm text-n-3">Cliquez pour uploader</p>
                                                <p className="text-xs text-n-4">MP3, WAV, OGG ou FLAC</p>
                                            </div>
                                        )}
                                    </label>
                                </>
                            ) : (
                                <>
                                    <p className="text-sm text-n-4 mb-4">{referenceFile.name}</p>
                                    <div ref={waveformReferenceRef} className="w-full mb-4" style={{ minHeight: '120px' }}></div>
                                    <button
                                        onClick={() => togglePlayPause(wavesurferReference, setIsPlayingReference)}
                                        className="button relative inline-flex items-center justify-center h-11 w-full transition-colors hover:text-color-1 px-7 text-n-1"
                                    >
                                        <span className="relative z-10">{isPlayingReference ? "Pause" : "Play"}</span>
                                        {ButtonSvg(false)}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Bouton de comparaison */}
                    {referenceFile && (
                        <div className="flex justify-center mb-10">
                            <button
                                onClick={handleCompare}
                                disabled={comparing}
                                className={`button relative inline-flex items-center justify-center h-11 transition-colors hover:text-color-1 px-7 text-n-1 ${comparing ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                <span className="relative z-10 flex items-center gap-3">
                                    {comparing && (
                                        <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                                    )}
                                    {comparing ? "Comparaison en cours..." : "Lancer la Comparaison"}
                                </span>
                                {ButtonSvg(false)}
                            </button>
                        </div>
                    )}

                    {/* Résultats de la comparaison */}
                    {comparisonResult && (
                        <div className="mb-10 max-w-[77.5rem] mx-auto">
                            <div className="relative bg-n-8 rounded-3xl p-8 lg:p-12 border-2 border-n-6 shadow-2xl overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-500/5 via-transparent to-transparent"></div>
                                </div>

                                <div className="relative z-1">
                                    {/* Score global */}
                                    <div className="text-center mb-10">
                                        <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 mb-6 shadow-2xl">
                                            <div className="text-center">
                                                <div className="text-5xl font-code font-bold text-white">
                                                    {comparisonResult.global_score}%
                                                </div>
                                                <div className="text-sm text-white/90 mt-1 font-code">Ressemblance</div>
                                            </div>
                                        </div>
                                        <h3 className={`h4 mb-2 bg-gradient-to-r ${getStatusColor(comparisonResult.global_status)} bg-clip-text text-transparent font-code`}>
                                            {comparisonResult.global_score === 100 ? 'Identique' : comparisonResult.global_status_label}
                                        </h3>
                                        <p className="text-n-4 font-code">
                                            {comparisonResult.original_key && comparisonResult.reference_key && (
                                                `Clés: ${formatKeyWithMinor(comparisonResult.original_key)} vs ${formatKeyWithMinor(comparisonResult.reference_key)}`
                                            )}
                                        </p>
                                    </div>

                                    {/* Détails des métriques */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-1 h-6 bg-gradient-to-b from-color-1 to-color-2 rounded-full"></div>
                                            <h4 className="h6 font-code">Détails par Métrique</h4>
                                        </div>
                                        
                                        {Object.entries(comparisonResult.comparisons).map(([key, comp]) => {
                                            return (
                                                <div
                                                    key={key}
                                                    className="button relative inline-flex items-center justify-center w-full transition-colors hover:text-color-1"
                                                    style={{ minHeight: 'auto', height: 'auto' }}
                                                >
                                                    <span className="relative z-10 w-full px-7 py-5">
                                                        <div className="flex items-center justify-between mb-4">
                                                            <div className="flex items-center gap-2">
                                                                <h5 className="font-code text-n-1 text-base font-semibold">{comp.name}</h5>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setShowInfo(prev => ({ ...prev, [key]: !prev[key] }));
                                                                    }}
                                                                    className="relative group"
                                                                    onMouseEnter={() => setShowInfo(prev => ({ ...prev, [key]: true }))}
                                                                    onMouseLeave={() => setShowInfo(prev => ({ ...prev, [key]: false }))}
                                                                >
                                                                    <svg className="w-4 h-4 text-n-4 hover:text-color-1 transition-colors" fill="currentColor" viewBox="0 0 24 24">
                                                                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
                                                                    </svg>
                                                                    {showInfo[key] && (
                                                                        <div className="absolute left-1/2 -translate-x-1/2 top-6 w-72 p-4 bg-n-8 border-2 border-n-6 rounded-xl shadow-2xl z-50 pointer-events-none">
                                                                            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-n-8 border-l-2 border-t-2 border-n-6 rotate-45"></div>
                                                                            <p className="text-xs text-n-2 font-code leading-relaxed whitespace-pre-line">
                                                                                {metricExplanations[comp.name] || `Explication pour "${comp.name}" non disponible.`}
                                                                            </p>
                                                                        </div>
                                                                    )}
                                                                </button>
                                                            </div>
                                                            <div className={`px-3 py-1 rounded-full text-xs font-code font-semibold bg-gradient-to-r ${getStatusColor(comp.status)} text-white`}>
                                                                {comp.status_label}
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-3 gap-4 mb-4">
                                                            <div>
                                                                <div className="text-n-4 text-xs mb-1.5 uppercase tracking-wider font-code">Votre morceau</div>
                                                                <div className="font-code font-bold text-n-1 text-lg">{comp.original_value}</div>
                                                            </div>
                                                            <div>
                                                                <div className="text-n-4 text-xs mb-1.5 uppercase tracking-wider font-code">Référence</div>
                                                                <div className="font-code font-bold text-n-1 text-lg">{comp.reference_value}</div>
                                                            </div>
                                                            <div>
                                                                <div className="text-n-4 text-xs mb-1.5 uppercase tracking-wider font-code">Différence</div>
                                                                <div className={`font-code font-bold text-lg ${comp.difference_pct > 20 ? 'text-yellow-400' : comp.difference_pct > 10 ? 'text-yellow-300' : 'text-green-400'}`}>
                                                                    {comp.difference_pct > 0 ? '+' : ''}{comp.difference_pct}%
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="mt-4 pt-4 border-t border-n-6/30">
                                                            <div className="flex items-center justify-between text-xs text-n-4 mb-2 font-code">
                                                                <span className="uppercase tracking-wider">Score de ressemblance</span>
                                                                <span className="text-n-3">
                                                                    {comp.score}%
                                                                </span>
                                                            </div>
                                                            <div className="w-full h-2.5 bg-n-7/50 rounded-full overflow-hidden">
                                                                <div
                                                                    className={`h-full bg-gradient-to-r ${getStatusColor(comp.status)} transition-all duration-500`}
                                                                    style={{ width: `${comp.score}%` }}
                                                                ></div>
                                                            </div>
                                                        </div>
                                                    </span>
                                                    {/* SVG adaptatif pour entourer toute la carte - version avec hauteur 100% */}
                                                    <div className="absolute inset-0 pointer-events-none" style={{ height: '100%', width: '100%' }}>
                                                        <svg className="absolute top-0 left-0" width="21" style={{ height: '100%' }} viewBox="0 0 21 44" preserveAspectRatio="none">
                                                            <path
                                                                fill="none"
                                                                stroke="url(#btn-left)"
                                                                strokeWidth="2"
                                                                vectorEffect="non-scaling-stroke"
                                                                d="M21,43.00005 L8.11111,43.00005 C4.18375,43.00005 1,39.58105 1,35.36365 L1,8.63637 C1,4.41892 4.18375,1 8.11111,1 L21,1"
                                                            />
                                                        </svg>
                                                        {/* Lignes du haut et du bas avec hauteur fixe en pixels */}
                                                        <div className="absolute top-0 left-[1.3125rem] w-[calc(100%-2.625rem)] h-[2px]">
                                                            <svg className="w-full h-full" viewBox="0 0 100 2" preserveAspectRatio="none">
                                                                <rect x="0" y="0" width="100" height="2" fill="url(#btn-top)" />
                                                            </svg>
                                                        </div>
                                                        <div className="absolute bottom-0 left-[1.3125rem] w-[calc(100%-2.625rem)] h-[2px]">
                                                            <svg className="w-full h-full" viewBox="0 0 100 2" preserveAspectRatio="none">
                                                                <rect x="0" y="0" width="100" height="2" fill="url(#btn-bottom)" />
                                                            </svg>
                                                        </div>
                                                        <svg className="absolute top-0 right-0" width="21" style={{ height: '100%' }} viewBox="0 0 21 44" preserveAspectRatio="none">
                                                            <path
                                                                fill="none"
                                                                stroke="url(#btn-right)"
                                                                strokeWidth="2"
                                                                vectorEffect="non-scaling-stroke"
                                                                d="M0,43.00005 L5.028,43.00005 L12.24,43.00005 C16.526,43.00005 20,39.58105 20,35.36365 L20,16.85855 C20,14.59295 18.978,12.44425 17.209,10.99335 L7.187,2.77111 C5.792,1.62675 4.034,1 2.217,1 L0,1"
                                                            />
                                                        </svg>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-center mt-8">
                        <button
                            onClick={() => navigate("/process", { state: location.state })}
                            className="button relative inline-flex items-center justify-center h-11 transition-colors hover:text-color-1 px-7 text-n-1"
                        >
                            <span className="relative z-10">Retour aux options</span>
                            {ButtonSvg(false)}
                        </button>
                    </div>

                    <Gradient />
                    <ButtonGradient />
                </div>
            </Section>
            <Footer />
        </>
    );
};

export default Compare;

