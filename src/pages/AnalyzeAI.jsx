import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Section from "../components/Section";
import Heading from "../components/Heading";
import { Gradient } from "../components/design/Services";

const AnalyzeAI = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [file, setFile] = useState(null);
    const [analysis, setAnalysis] = useState(null);
    const [aiReport, setAiReport] = useState("");
    const [loading, setLoading] = useState(true);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        if (location.state?.file && location.state?.filename && location.state?.analysis) {
            setFile(location.state.file);
            setAnalysis(location.state.analysis);
            generateAiReport(location.state.analysis);
        } else {
            navigate("/studio");
        }
    }, [location, navigate]);

    const generateAiReport = async (features) => {
        setLoading(true);
        setProgress(0);

        const progressInterval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 90) {
                    clearInterval(progressInterval);
                    return 90;
                }
                return prev + 10;
            });
        }, 300);

        try {
            const prompt = `Tu es un ingénieur du son professionnel et critique musical exigeant. Analyse ces données audio techniques :

BPM: ${features.bpm}
Tonalité: ${features.key}
Niveau RMS: ${features.rms_level}
Centroïde spectral: ${features.spectral_centroid} Hz

CONSIGNES :
- Sois TRÈS critique et honnête
- Identifie les problèmes de mixage, de mastering, d'équilibre fréquentiel
- Donne des recommandations PRÉCISES et techniques
- Compare aux standards professionnels de l'industrie musicale
- Mentionne les points forts ET les faiblesses
- Utilise un ton professionnel mais direct
- Sois concis (maximum 300 mots)

Format ta réponse en sections claires :
1. Vue d'ensemble
2. Points forts
3. Points à améliorer
4. Recommandations techniques`;

            const resp = await window.puter.ai.chat(prompt);

            clearInterval(progressInterval);
            setProgress(100);
            setAiReport(resp.content || resp.message || JSON.stringify(resp));
        } catch (error) {
            console.error("Puter AI Error:", error);
            clearInterval(progressInterval);
            setProgress(100);
            setAiReport(`Erreur lors de la génération de l'analyse IA.

Détails techniques analysés :
- Tempo : ${features.bpm} BPM
- Tonalité : ${features.key}
- Niveau RMS : ${features.rms_level.toFixed(2)}
- Centroïde spectral : ${Math.round(features.spectral_centroid)} Hz

L'analyse IA nécessite une connexion à Puter.js. Veuillez vérifier que le service est disponible.`);
        } finally {
            setLoading(false);
        }
    };

    if (!file || !analysis) return null;

    return (
        <>
            <Header />
            <Section className="pt-[12rem] -mt-[5.25rem]" crosses crossesOffset="lg:translate-y-[5.25rem]">
                <div className="container relative z-2">
                    <Heading
                        className="md:max-w-md lg:max-w-2xl"
                        title="Analyse IA Professionnelle"
                        text={file.name}
                    />

                    <div className="relative mb-10 max-w-[77.5rem] mx-auto">
                        <div className="relative bg-n-8/50 backdrop-blur-sm rounded-2xl p-6 border border-n-6/50">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-1 h-8 bg-gradient-to-b from-purple-400 to-pink-400 rounded-full"></div>
                                <h3 className="h5">Données Techniques</h3>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="p-4 bg-n-7/50 rounded-xl border border-n-6/30 text-center">
                                    <div className="text-xs text-n-4 mb-1 uppercase tracking-wider">Tempo</div>
                                    <div className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">{analysis.bpm}</div>
                                    <div className="text-xs text-n-4 mt-1">BPM</div>
                                </div>
                                <div className="p-4 bg-n-7/50 rounded-xl border border-n-6/30 text-center">
                                    <div className="text-xs text-n-4 mb-1 uppercase tracking-wider">Tonalité</div>
                                    <div className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">{analysis.key}</div>
                                    <div className="text-xs text-n-4 mt-1">Clé</div>
                                </div>
                                <div className="p-4 bg-n-7/50 rounded-xl border border-n-6/30 text-center">
                                    <div className="text-xs text-n-4 mb-1 uppercase tracking-wider">Volume</div>
                                    <div className="text-2xl font-bold bg-gradient-to-r from-green-400 to-teal-400 bg-clip-text text-transparent">{analysis.rms_level.toFixed(2)}</div>
                                    <div className="text-xs text-n-4 mt-1">RMS</div>
                                </div>
                                <div className="p-4 bg-n-7/50 rounded-xl border border-n-6/30 text-center">
                                    <div className="text-xs text-n-4 mb-1 uppercase tracking-wider">Brillance</div>
                                    <div className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">{Math.round(analysis.spectral_centroid)}</div>
                                    <div className="text-xs text-n-4 mt-1">Hz</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="relative mb-10 max-w-[77.5rem] mx-auto">
                        <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-3xl blur-lg opacity-20"></div>
                        <div className="relative bg-n-8 rounded-3xl p-8 lg:p-12 border-2 border-n-6 shadow-2xl">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                    </svg>
                                </div>
                                <h3 className="h4">Rapport d'Analyse IA</h3>
                            </div>

                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-20">
                                    <div className="inline-block relative mb-6">
                                        <div className="w-16 h-16 border-4 border-n-6 border-t-blue-500 rounded-full animate-spin"></div>
                                        <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-purple-500 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
                                    </div>
                                    <p className="text-n-3 text-lg mb-4">Analyse en cours...</p>
                                    <div className="w-full max-w-md">
                                        <div className="flex justify-between text-xs text-n-4 mb-2">
                                            <span>Progression</span>
                                            <span>{progress}%</span>
                                        </div>
                                        <div className="h-2 bg-n-6 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300 ease-out"
                                                style={{ width: `${progress}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                    <p className="text-n-4 text-sm mt-4">L'IA examine votre audio en détail</p>
                                </div>
                            ) : (
                                <div className="prose prose-invert max-w-none">
                                    <div className="p-6 bg-n-7/30 rounded-xl border border-n-6/30 whitespace-pre-wrap text-n-2 leading-relaxed">
                                        {aiReport}
                                    </div>
                                </div>
                            )}

                            {!loading && (
                                <div className="mt-8 flex justify-center">
                                    <button
                                        onClick={() => navigate("/process", { state: location.state })}
                                        className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-xl font-semibold text-white transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
                                    >
                                        Retour aux options
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <Gradient />
                </div>
            </Section>
            <Footer />
        </>
    );
};

export default AnalyzeAI;
