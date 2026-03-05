'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import {
    Upload,
    Sparkles,
    Book,
    Wand2,
    Check,
    ChevronRight,
    ImageIcon,
    Loader2,
    Download,
    RefreshCw
} from 'lucide-react';

// Tipos
interface ChildFeatures {
    hairColor: string;
    hairType: string;
    skinTone: string;
    eyeColor: string;
    approximateAge: number;
    gender: 'niño' | 'niña' | 'neutral';
    distinctiveFeatures?: string;
}

interface BookOption {
    id: string;
    name: string;
    description: string;
    coverImage: string;
    sceneCount: number;
    style: string;
}

interface GeneratedScene {
    id: string;
    sceneNumber: number;
    description: string;
    imageUrl?: string;
    status: 'pending' | 'generating' | 'completed' | 'error';
}

// Libros disponibles (demo)
const AVAILABLE_BOOKS: BookOption[] = [
    {
        id: 'elefante-amigo',
        name: 'El Elefante y Su Amigo',
        description: 'Una tierna aventura en la selva donde tu hijo/a se hace amigo de un elefante mágico.',
        coverImage: '/books/elefante-cover.jpg',
        sceneCount: 8,
        style: 'Acuarela suave'
    },
    {
        id: 'astronauta-espacial',
        name: 'El Pequeño Astronauta',
        description: 'Un viaje espacial donde tu hijo/a explora planetas y conoce alienígenas amigables.',
        coverImage: '/books/astronauta-cover.jpg',
        sceneCount: 10,
        style: 'Digital moderno'
    },
    {
        id: 'bosque-magico',
        name: 'Aventuras en el Bosque Mágico',
        description: 'Tu hijo/a descubre un bosque encantado lleno de hadas y criaturas fantásticas.',
        coverImage: '/books/bosque-cover.jpg',
        sceneCount: 12,
        style: 'Fantasía etérea'
    },
    {
        id: 'libro-4',
        name: 'Libro por Definir #4',
        description: 'Próximamente - esperando contenido del cliente.',
        coverImage: '/books/placeholder.jpg',
        sceneCount: 0,
        style: 'Por definir'
    },
    {
        id: 'libro-5',
        name: 'Libro por Definir #5',
        description: 'Próximamente - esperando contenido del cliente.',
        coverImage: '/books/placeholder.jpg',
        sceneCount: 0,
        style: 'Por definir'
    }
];

// Componente principal
export default function PersonalizarPage() {
    const [step, setStep] = useState<'upload' | 'select-book' | 'preview' | 'generating' | 'complete'>('upload');
    const [uploadedPhoto, setUploadedPhoto] = useState<string | null>(null);
    const [childFeatures, setChildFeatures] = useState<ChildFeatures | null>(null);
    const [selectedBook, setSelectedBook] = useState<BookOption | null>(null);
    const [generatedScenes, setGeneratedScenes] = useState<GeneratedScene[]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [generationProgress, setGenerationProgress] = useState(0);

    // Manejar upload de foto
    const handlePhotoUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Convertir a base64 para preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setUploadedPhoto(reader.result as string);
        };
        reader.readAsDataURL(file);
    }, []);

    // Analizar foto con Gemini
    const analyzePhoto = async () => {
        if (!uploadedPhoto) return;

        setIsAnalyzing(true);

        // Simular análisis (en producción llamaría a la API)
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Datos simulados de análisis
        setChildFeatures({
            hairColor: 'castaño oscuro',
            hairType: 'ondulado',
            skinTone: 'medio',
            eyeColor: 'marrón',
            approximateAge: 5,
            gender: 'niño',
            distinctiveFeatures: 'pecas en las mejillas'
        });

        setIsAnalyzing(false);
        setStep('select-book');
    };

    // Seleccionar libro
    const handleSelectBook = (book: BookOption) => {
        if (book.sceneCount === 0) return; // Libro no disponible
        setSelectedBook(book);

        // Crear escenas iniciales
        const scenes: GeneratedScene[] = Array.from({ length: book.sceneCount }, (_, i) => ({
            id: `scene-${i + 1}`,
            sceneNumber: i + 1,
            description: `Escena ${i + 1} del libro`,
            status: 'pending'
        }));
        setGeneratedScenes(scenes);
        setStep('preview');
    };

    // Iniciar generación
    const startGeneration = async () => {
        setStep('generating');

        // Simular generación de cada escena
        for (let i = 0; i < generatedScenes.length; i++) {
            setGeneratedScenes(prev => prev.map((scene, idx) =>
                idx === i ? { ...scene, status: 'generating' } : scene
            ));

            await new Promise(resolve => setTimeout(resolve, 1500));

            setGeneratedScenes(prev => prev.map((scene, idx) =>
                idx === i ? {
                    ...scene,
                    status: 'completed',
                    imageUrl: `https://picsum.photos/400/300?random=${i}` // Placeholder
                } : scene
            ));

            setGenerationProgress(((i + 1) / generatedScenes.length) * 100);
        }

        setStep('complete');
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-purple-950 via-purple-900 to-indigo-950">
            {/* Header */}
            <header className="px-6 py-8 text-center">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-center gap-3 mb-4"
                >
                    <Wand2 className="w-8 h-8 text-amber-400" />
                    <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-400 bg-clip-text text-transparent">
                        Personaliza tu Libro Mágico
                    </h1>
                </motion.div>
                <p className="text-purple-200/70 max-w-2xl mx-auto">
                    Sube una foto de tu hijo/a y la IA creará un libro único donde ellos son los protagonistas
                </p>
            </header>

            {/* Progress Steps */}
            <div className="px-6 mb-8">
                <div className="max-w-3xl mx-auto flex items-center justify-center gap-4">
                    {['Foto', 'Libro', 'Preview', 'Generar'].map((label, idx) => {
                        const steps = ['upload', 'select-book', 'preview', 'generating'];
                        const currentIdx = steps.indexOf(step);
                        const isActive = idx <= currentIdx;
                        const isCurrent = idx === currentIdx;

                        return (
                            <div key={label} className="flex items-center gap-2">
                                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm
                  transition-all duration-300
                  ${isActive
                                        ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-purple-950'
                                        : 'bg-purple-800/50 text-purple-400 border border-purple-700'}
                  ${isCurrent ? 'ring-4 ring-amber-400/30 scale-110' : ''}
                `}>
                                    {idx < currentIdx ? <Check className="w-5 h-5" /> : idx + 1}
                                </div>
                                <span className={`hidden sm:block text-sm ${isActive ? 'text-amber-300' : 'text-purple-500'}`}>
                                    {label}
                                </span>
                                {idx < 3 && (
                                    <ChevronRight className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-purple-700'}`} />
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Main Content */}
            <main className="px-6 pb-12">
                <AnimatePresence mode="wait">
                    {/* Step 1: Upload Photo */}
                    {step === 'upload' && (
                        <motion.div
                            key="upload"
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -50 }}
                            className="max-w-2xl mx-auto"
                        >
                            <div className="bg-purple-900/40 backdrop-blur-xl rounded-3xl p-8 border border-purple-700/30">
                                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                                    <Upload className="w-6 h-6 text-amber-400" />
                                    Sube una foto de tu hijo/a
                                </h2>

                                {!uploadedPhoto ? (
                                    <label className="block cursor-pointer">
                                        <div className="border-2 border-dashed border-purple-600/50 rounded-2xl p-12 text-center hover:border-amber-400/50 hover:bg-purple-800/20 transition-all">
                                            <ImageIcon className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                                            <p className="text-purple-200 mb-2">
                                                Arrastra una foto aquí o haz clic para seleccionar
                                            </p>
                                            <p className="text-purple-400 text-sm">
                                                Recomendación: Foto frontal con buena iluminación
                                            </p>
                                        </div>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handlePhotoUpload}
                                            className="hidden"
                                        />
                                    </label>
                                ) : (
                                    <div className="space-y-6">
                                        <div className="relative aspect-square max-w-sm mx-auto rounded-2xl overflow-hidden">
                                            <Image
                                                src={uploadedPhoto}
                                                alt="Foto subida"
                                                fill
                                                className="object-cover"
                                            />
                                        </div>

                                        {childFeatures && (
                                            <div className="bg-purple-800/30 rounded-xl p-4 border border-purple-600/30">
                                                <h3 className="text-amber-300 font-semibold mb-3 flex items-center gap-2">
                                                    <Sparkles className="w-4 h-4" />
                                                    Características detectadas
                                                </h3>
                                                <div className="grid grid-cols-2 gap-2 text-sm">
                                                    <div><span className="text-purple-400">Cabello:</span> <span className="text-white">{childFeatures.hairColor}, {childFeatures.hairType}</span></div>
                                                    <div><span className="text-purple-400">Ojos:</span> <span className="text-white">{childFeatures.eyeColor}</span></div>
                                                    <div><span className="text-purple-400">Edad aprox:</span> <span className="text-white">{childFeatures.approximateAge} años</span></div>
                                                    <div><span className="text-purple-400">Género:</span> <span className="text-white">{childFeatures.gender}</span></div>
                                                    {childFeatures.distinctiveFeatures && (
                                                        <div className="col-span-2"><span className="text-purple-400">Rasgos:</span> <span className="text-white">{childFeatures.distinctiveFeatures}</span></div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex gap-4">
                                            <button
                                                onClick={() => setUploadedPhoto(null)}
                                                className="flex-1 py-3 rounded-xl border border-purple-600 text-purple-300 hover:bg-purple-800/50 transition-colors"
                                            >
                                                Cambiar foto
                                            </button>
                                            <button
                                                onClick={analyzePhoto}
                                                disabled={isAnalyzing}
                                                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-purple-950 font-bold hover:from-amber-400 hover:to-yellow-400 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                            >
                                                {isAnalyzing ? (
                                                    <>
                                                        <Loader2 className="w-5 h-5 animate-spin" />
                                                        Analizando...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Wand2 className="w-5 h-5" />
                                                        Analizar con IA
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {/* Step 2: Select Book */}
                    {step === 'select-book' && (
                        <motion.div
                            key="select-book"
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -50 }}
                            className="max-w-5xl mx-auto"
                        >
                            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                                <Book className="w-6 h-6 text-amber-400" />
                                Elige un libro para personalizar
                            </h2>

                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {AVAILABLE_BOOKS.map((book, idx) => (
                                    <motion.button
                                        key={book.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        onClick={() => handleSelectBook(book)}
                                        disabled={book.sceneCount === 0}
                                        className={`
                      text-left bg-purple-900/40 backdrop-blur-xl rounded-2xl overflow-hidden
                      border border-purple-700/30 transition-all group
                      ${book.sceneCount > 0
                                                ? 'hover:border-amber-400/50 hover:scale-105 cursor-pointer'
                                                : 'opacity-50 cursor-not-allowed'}
                    `}
                                    >
                                        <div className="aspect-[4/3] bg-purple-800/50 relative">
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <Book className="w-16 h-16 text-purple-600" />
                                            </div>
                                            {book.sceneCount === 0 && (
                                                <div className="absolute inset-0 bg-purple-950/80 flex items-center justify-center">
                                                    <span className="text-purple-300 text-sm">Próximamente</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-4">
                                            <h3 className="text-lg font-bold text-white mb-1 group-hover:text-amber-300 transition-colors">
                                                {book.name}
                                            </h3>
                                            <p className="text-purple-300 text-sm mb-3 line-clamp-2">
                                                {book.description}
                                            </p>
                                            <div className="flex justify-between text-xs text-purple-400">
                                                <span>{book.sceneCount} escenas</span>
                                                <span>{book.style}</span>
                                            </div>
                                        </div>
                                    </motion.button>
                                ))}
                            </div>

                            <button
                                onClick={() => setStep('upload')}
                                className="mt-6 text-purple-400 hover:text-purple-300 flex items-center gap-2"
                            >
                                ← Volver a cambiar foto
                            </button>
                        </motion.div>
                    )}

                    {/* Step 3: Preview */}
                    {step === 'preview' && selectedBook && (
                        <motion.div
                            key="preview"
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -50 }}
                            className="max-w-4xl mx-auto"
                        >
                            <div className="bg-purple-900/40 backdrop-blur-xl rounded-3xl p-8 border border-purple-700/30">
                                <h2 className="text-2xl font-bold text-white mb-2">
                                    Listo para crear tu libro personalizado
                                </h2>
                                <p className="text-purple-300 mb-6">
                                    Se generarán {selectedBook.sceneCount} ilustraciones únicas con tu hijo/a como protagonista
                                </p>

                                <div className="grid md:grid-cols-2 gap-6 mb-6">
                                    {/* Child Preview */}
                                    <div className="bg-purple-800/30 rounded-xl p-4">
                                        <h3 className="text-amber-300 font-semibold mb-3">Protagonista</h3>
                                        <div className="flex items-center gap-4">
                                            {uploadedPhoto && (
                                                <div className="w-20 h-20 rounded-full overflow-hidden relative">
                                                    <Image src={uploadedPhoto} alt="Foto" fill className="object-cover" />
                                                </div>
                                            )}
                                            <div className="text-sm text-purple-200">
                                                <p>{childFeatures?.gender}, {childFeatures?.approximateAge} años</p>
                                                <p className="text-purple-400">Cabello {childFeatures?.hairColor}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Book Preview */}
                                    <div className="bg-purple-800/30 rounded-xl p-4">
                                        <h3 className="text-amber-300 font-semibold mb-3">Libro seleccionado</h3>
                                        <p className="text-white font-medium">{selectedBook.name}</p>
                                        <p className="text-purple-400 text-sm">{selectedBook.sceneCount} escenas • {selectedBook.style}</p>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <button
                                        onClick={() => setStep('select-book')}
                                        className="flex-1 py-3 rounded-xl border border-purple-600 text-purple-300 hover:bg-purple-800/50 transition-colors"
                                    >
                                        Cambiar libro
                                    </button>
                                    <button
                                        onClick={startGeneration}
                                        className="flex-1 py-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-purple-950 font-bold text-lg hover:from-amber-400 hover:to-yellow-400 transition-all flex items-center justify-center gap-2"
                                    >
                                        <Sparkles className="w-5 h-5" />
                                        ¡Crear mi libro mágico!
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Step 4: Generating */}
                    {step === 'generating' && (
                        <motion.div
                            key="generating"
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -50 }}
                            className="max-w-4xl mx-auto"
                        >
                            <div className="bg-purple-900/40 backdrop-blur-xl rounded-3xl p-8 border border-purple-700/30 text-center">
                                <Wand2 className="w-16 h-16 text-amber-400 mx-auto mb-4 animate-pulse" />
                                <h2 className="text-2xl font-bold text-white mb-2">
                                    Creando tu libro mágico...
                                </h2>
                                <p className="text-purple-300 mb-8">
                                    La IA está generando ilustraciones personalizadas
                                </p>

                                {/* Progress Bar */}
                                <div className="max-w-md mx-auto mb-8">
                                    <div className="h-4 bg-purple-800 rounded-full overflow-hidden">
                                        <motion.div
                                            className="h-full bg-gradient-to-r from-amber-400 to-yellow-500"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${generationProgress}%` }}
                                            transition={{ duration: 0.5 }}
                                        />
                                    </div>
                                    <p className="text-amber-300 mt-2">{Math.round(generationProgress)}% completado</p>
                                </div>

                                {/* Scene Progress */}
                                <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
                                    {generatedScenes.map((scene) => (
                                        <div
                                            key={scene.id}
                                            className={`
                        aspect-square rounded-lg flex items-center justify-center
                        ${scene.status === 'completed' ? 'bg-green-500/20 border border-green-500/50' : ''}
                        ${scene.status === 'generating' ? 'bg-amber-500/20 border border-amber-500/50 animate-pulse' : ''}
                        ${scene.status === 'pending' ? 'bg-purple-800/30 border border-purple-700/30' : ''}
                      `}
                                        >
                                            {scene.status === 'completed' && <Check className="w-6 h-6 text-green-400" />}
                                            {scene.status === 'generating' && <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />}
                                            {scene.status === 'pending' && <span className="text-purple-500 text-sm">{scene.sceneNumber}</span>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Step 5: Complete */}
                    {step === 'complete' && (
                        <motion.div
                            key="complete"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="max-w-5xl mx-auto"
                        >
                            <div className="text-center mb-8">
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: 'spring', delay: 0.2 }}
                                    className="w-20 h-20 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4"
                                >
                                    <Check className="w-10 h-10 text-purple-950" />
                                </motion.div>
                                <h2 className="text-3xl font-bold text-white mb-2">
                                    ¡Tu libro está listo! ✨
                                </h2>
                                <p className="text-purple-300">
                                    {selectedBook?.name} - {generatedScenes.length} ilustraciones personalizadas
                                </p>
                            </div>

                            {/* Generated Images Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                                {generatedScenes.map((scene, idx) => (
                                    <motion.div
                                        key={scene.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        className="aspect-[4/3] rounded-xl overflow-hidden relative bg-purple-800/30"
                                    >
                                        {scene.imageUrl && (
                                            <Image
                                                src={scene.imageUrl}
                                                alt={`Escena ${scene.sceneNumber}`}
                                                fill
                                                className="object-cover"
                                            />
                                        )}
                                        <div className="absolute bottom-2 left-2 bg-purple-950/80 px-2 py-1 rounded text-xs text-white">
                                            Escena {scene.sceneNumber}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <button className="flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-amber-500 to-yellow-500 text-purple-950 font-bold rounded-xl hover:from-amber-400 hover:to-yellow-400 transition-all">
                                    <Download className="w-5 h-5" />
                                    Descargar libro completo
                                </button>
                                <button
                                    onClick={() => {
                                        setStep('upload');
                                        setUploadedPhoto(null);
                                        setChildFeatures(null);
                                        setSelectedBook(null);
                                        setGeneratedScenes([]);
                                        setGenerationProgress(0);
                                    }}
                                    className="flex items-center justify-center gap-2 px-8 py-4 border border-purple-600 text-purple-300 rounded-xl hover:bg-purple-800/50 transition-colors"
                                >
                                    <RefreshCw className="w-5 h-5" />
                                    Crear otro libro
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}
