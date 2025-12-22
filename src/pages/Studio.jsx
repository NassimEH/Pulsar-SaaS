import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Section from "../components/Section";
import Heading from "../components/Heading";
import { Gradient } from "../components/design/Services";

const Studio = () => {
    const navigate = useNavigate();
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleUpload = async (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;
        setFile(selectedFile);

        // Validate file size (50MB max)
        const maxSize = 50 * 1024 * 1024; // 50MB
        if (selectedFile.size > maxSize) {
            alert("Le fichier est trop volumineux. Taille maximum : 50MB");
            e.target.value = ""; // Reset input
            return;
        }

        // Nettoyer les anciennes données avant le nouvel upload
        localStorage.removeItem('audioUploadInfo');
        localStorage.removeItem('audioAnalysis');

        const formData = new FormData();
        formData.append("file", selectedFile);

        setLoading(true);
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
            
            // Sauvegarder les données dans localStorage pour persistance
            const uploadInfo = {
                filename: uploadData.filename,
                originalName: selectedFile.name,
                uploadTime: Date.now()
            };
            localStorage.setItem('audioUploadInfo', JSON.stringify(uploadInfo));
            
            // Reset loading before navigation
            setLoading(false);

            // Navigate to process page
            navigate("/process", {
                state: {
                    file: selectedFile,
                    filename: uploadData.filename
                }
            });

        } catch (error) {
            console.error("Upload error:", error);
            alert(`Erreur lors de l'upload: ${error.message}\n\nVérifiez que le backend est démarré sur http://localhost:8000`);
            setLoading(false);
            // Reset file input
            e.target.value = "";
            setFile(null);
        }
    };

    return (
        <>
            <Header />
            <Section className="pt-[12rem] -mt-[5.25rem]" crosses crossesOffset="lg:translate-y-[5.25rem]" id="studio">
                <div className="container relative">
                    <Heading
                        className="md:max-w-md lg:max-w-2xl"
                        title="Studio Audio IA"
                        text="Analysez et transformez vos sons avec l'intelligence artificielle."
                    />

                    <div className="relative z-1 max-w-[77.5rem] mx-auto">
                        <div className="relative p-0.5 bg-conic-gradient rounded-3xl mb-5">
                            <div className="relative bg-n-8 rounded-[1.4375rem] p-8 lg:p-12">
                                <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-color-1/10 via-transparent to-transparent"></div>
                                </div>

                                <div className="relative z-1">
                                    <h3 className="h4 mb-6 text-center">Importez votre fichier audio</h3>

                                    <div className="relative">
                                        <input
                                            type="file"
                                            accept=".mp3,.wav,.ogg,.flac"
                                            onChange={handleUpload}
                                            id="file-upload"
                                            className="hidden"
                                            disabled={loading}
                                        />
                                        <label
                                            htmlFor="file-upload"
                                            className={`flex flex-col items-center justify-center w-full h-64 border-2 border-n-6 border-dashed rounded-2xl cursor-pointer bg-n-7/50 hover:bg-n-7 transition-colors ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            {loading ? (
                                                <div className="flex flex-col items-center justify-center">
                                                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-color-1 mb-4"></div>
                                                    <p className="text-n-3">Upload en cours...</p>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                    <svg className="w-12 h-12 mb-4 text-n-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                                    </svg>
                                                    <p className="mb-2 text-sm text-n-3">
                                                        <span className="font-semibold">Cliquez pour uploader</span> ou glissez-déposez
                                                    </p>
                                                    <p className="text-xs text-n-4">MP3, WAV, OGG ou FLAC (MAX. 50MB)</p>
                                                </div>
                                            )}
                                        </label>
                                    </div>

                                    {file && !loading && (
                                        <div className="mt-4 p-4 bg-n-7 rounded-xl border border-n-6">
                                            <p className="text-sm text-n-3">Fichier sélectionné : <span className="text-n-1 font-semibold">{file.name}</span></p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <Gradient />
                </div>
            </Section>
            <Footer />
        </>
    );
};

export default Studio;
