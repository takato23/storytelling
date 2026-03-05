/**
 * Integración con Gemini 3 Pro Image para Generación de Imágenes Personalizadas
 * ==============================================================================
 * 
 * Usa el modelo gemini-3-pro-image-preview con Identity Locking para:
 * 1. Analizar foto del niño y extraer características
 * 2. Generar imágenes consistentes del mismo niño en diferentes escenas
 * 3. Mantener identidad a través de todo el libro
 */

import { GoogleGenerativeAI, Part } from '@google/generative-ai';
import {
    ChildFeatures,
    SceneConfig,
    generateCompletePrompt,
    BOOK_STYLES
} from './prompt-system';

// ============================================
// CONFIGURACIÓN DE GEMINI 3
// ============================================

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Gemini 3 Pro Image Preview - Con Identity Locking
const imageModel = genAI.getGenerativeModel({
    model: 'gemini-3-pro-image-preview'
});

// Gemini 3 Pro para análisis de texto/multimodal
const analysisModel = genAI.getGenerativeModel({
    model: 'gemini-3-pro-preview'
});

// ============================================
// TIPOS PARA IDENTITY LOCKING
// ============================================

export interface IdentityLock {
    id: string;
    childFeatures: ChildFeatures;
    referenceImageBase64: string;
    createdAt: Date;
}

export interface GeneratedImage {
    sceneId: string;
    imageBase64: string;
    prompt: string;
    timestamp: Date;
}

// ============================================
// ANÁLISIS DE FOTO DEL NIÑO
// ============================================

const CHILD_ANALYSIS_PROMPT = `
Analiza esta foto de un niño/a y extrae características físicas detalladas.
Responde SOLO en JSON válido:

{
  "hairColor": "descripción detallada del color (ej: castaño oscuro con reflejos dorados)",
  "hairType": "tipo y largo (ej: ondulado hasta los hombros, corto con flequillo)",
  "skinTone": "tono específico (ej: claro rosado, medio oliváceo, oscuro cálido)",
  "eyeColor": "color detallado (ej: marrón chocolate, azul grisáceo)",
  "approximateAge": número entre 2-12,
  "gender": "niño" | "niña" | "neutral",
  "distinctiveFeatures": "rasgos únicos o null (ej: pecas, hoyuelos, gafas rojas)",
  "faceShape": "forma del rostro (ej: redondo, ovalado)",
  "expression": "expresión típica (ej: sonrisa amplia, mirada curiosa)"
}
`;

export async function analyzeChildPhoto(
    imageBase64: string,
    mimeType: string = 'image/jpeg'
): Promise<ChildFeatures> {
    try {
        const imagePart: Part = {
            inlineData: {
                data: imageBase64,
                mimeType: mimeType
            }
        };

        const result = await analysisModel.generateContent([
            CHILD_ANALYSIS_PROMPT,
            imagePart
        ]);

        const responseText = result.response.text();
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);

        if (!jsonMatch) {
            throw new Error('No se pudo extraer JSON de la respuesta');
        }

        return JSON.parse(jsonMatch[0]) as ChildFeatures;

    } catch (error) {
        console.error('Error analizando foto:', error);
        throw new Error('No se pudo analizar la foto del niño');
    }
}

// ============================================
// GENERACIÓN CON IDENTITY LOCKING
// ============================================

/**
 * Prompt base para Identity Locking
 * Instruye a Gemini 3 Pro Image a mantener la identidad del niño
 */
function createIdentityLockPrompt(features: ChildFeatures): string {
    return `
[IDENTITY LOCK - MANTENER ESTRICTAMENTE]
Estás generando imágenes de un personaje específico que DEBE mantener su identidad en todas las escenas.

CARACTERÍSTICAS BLOQUEADAS DEL PERSONAJE:
- Género: ${features.gender}  
- Edad: ${features.approximateAge} años
- Cabello: ${features.hairColor}, ${features.hairType}
- Piel: ${features.skinTone}
- Ojos: ${features.eyeColor}
${features.distinctiveFeatures ? `- Rasgos distintivos: ${features.distinctiveFeatures}` : ''}
${(features as any).faceShape ? `- Forma de rostro: ${(features as any).faceShape}` : ''}

REGLAS DE CONSISTENCIA:
1. El rostro DEBE ser reconocible como el mismo niño/a en cada imagen
2. Mantener proporciones faciales exactas
3. El color y estilo de cabello NO puede variar
4. Los rasgos distintivos DEBEN aparecer en cada imagen
5. Solo cambian: pose, expresión, ropa según la escena, entorno
`.trim();
}

/**
 * Genera una imagen personalizada usando Identity Locking
 */
export async function generatePersonalizedImage(
    childFeatures: ChildFeatures,
    bookId: string,
    scene: SceneConfig,
    referenceImage?: string // Imagen de referencia del niño
): Promise<GeneratedImage> {

    // Construir el prompt completo con Identity Lock
    const identityPrompt = createIdentityLockPrompt(childFeatures);
    const scenePrompt = generateCompletePrompt(childFeatures, bookId, scene);

    const fullPrompt = `
${identityPrompt}

---

${scenePrompt}

---

Genera una ilustración donde este niño/a específico aparece en la escena descrita.
La identidad facial y características físicas DEBEN coincidir exactamente con las especificaciones.
`.trim();

    try {
        const parts: Part[] = [{ text: fullPrompt }];

        // Si tenemos imagen de referencia, incluirla
        if (referenceImage) {
            parts.push({
                inlineData: {
                    data: referenceImage,
                    mimeType: 'image/jpeg'
                }
            });
            parts.push({
                text: 'Usa esta imagen como referencia para el rostro y características del niño/a. Mantén EXACTA la identidad.'
            });
        }

        const result = await imageModel.generateContent(parts);

        // Extraer la imagen generada de la respuesta
        const response = result.response;

        // Buscar la imagen en los candidates
        let generatedImageBase64 = '';

        if (response.candidates && response.candidates[0]) {
            const candidate = response.candidates[0];
            if (candidate.content && candidate.content.parts) {
                for (const part of candidate.content.parts) {
                    if ('inlineData' in part && part.inlineData) {
                        generatedImageBase64 = part.inlineData.data || '';
                        break;
                    }
                }
            }
        }

        return {
            sceneId: scene.id,
            imageBase64: generatedImageBase64,
            prompt: fullPrompt,
            timestamp: new Date()
        };

    } catch (error) {
        console.error('Error generando imagen:', error);
        throw new Error(`No se pudo generar la imagen para escena ${scene.id}`);
    }
}

// ============================================
// GENERACIÓN COMPLETA DE LIBRO
// ============================================

export interface BookGenerationProgress {
    bookId: string;
    totalScenes: number;
    completedScenes: number;
    currentScene: string;
    status: 'preparing' | 'analyzing' | 'generating' | 'completed' | 'error';
    error?: string;
}

export interface GeneratedBook {
    bookId: string;
    bookName: string;
    childFeatures: ChildFeatures;
    images: GeneratedImage[];
    generatedAt: Date;
}

/**
 * Genera todas las imágenes de un libro completo
 * Mantiene la identidad del niño consistente a través de todas las escenas
 */
export async function generateCompleteBook(
    childPhotoBase64: string,
    bookId: string,
    scenes: SceneConfig[],
    onProgress?: (progress: BookGenerationProgress) => void
): Promise<GeneratedBook> {

    const bookStyle = BOOK_STYLES[bookId];
    if (!bookStyle) {
        throw new Error(`Libro no encontrado: ${bookId}`);
    }

    // Reportar progreso inicial
    onProgress?.({
        bookId,
        totalScenes: scenes.length,
        completedScenes: 0,
        currentScene: 'Analizando foto...',
        status: 'analyzing'
    });

    // 1. Analizar la foto y extraer características
    const childFeatures = await analyzeChildPhoto(childPhotoBase64);

    // 2. Generar cada escena secuencialmente (para mantener consistencia)
    const generatedImages: GeneratedImage[] = [];

    for (let i = 0; i < scenes.length; i++) {
        const scene = scenes[i];

        onProgress?.({
            bookId,
            totalScenes: scenes.length,
            completedScenes: i,
            currentScene: `Generando escena ${scene.sceneNumber}: ${scene.description.slice(0, 50)}...`,
            status: 'generating'
        });

        try {
            const image = await generatePersonalizedImage(
                childFeatures,
                bookId,
                scene,
                childPhotoBase64 // Usar foto original como referencia
            );

            generatedImages.push(image);

            // Pequeña pausa entre generaciones para evitar rate limits
            await new Promise(resolve => setTimeout(resolve, 1000));

        } catch (error) {
            console.error(`Error en escena ${scene.id}:`, error);
            // Continuar con las demás escenas
        }
    }

    onProgress?.({
        bookId,
        totalScenes: scenes.length,
        completedScenes: scenes.length,
        currentScene: '¡Libro completado!',
        status: 'completed'
    });

    return {
        bookId,
        bookName: bookStyle.name,
        childFeatures,
        images: generatedImages,
        generatedAt: new Date()
    };
}

// ============================================
// EJEMPLO DE USO
// ============================================

export const USAGE_EXAMPLE = `
// Ejemplo de cómo usar el sistema:

import { generateCompleteBook, SCENES_ELEFANTE } from './gemini-integration';

async function createPersonalizedBook(childPhotoFile: File) {
  // 1. Convertir foto a base64
  const photoBase64 = await fileToBase64(childPhotoFile);
  
  // 2. Generar libro completo
  const book = await generateCompleteBook(
    photoBase64,
    'elefante-amigo',
    SCENES_ELEFANTE,
    (progress) => {
      console.log(\`Progreso: \${progress.completedScenes}/\${progress.totalScenes}\`);
      console.log(\`Estado: \${progress.currentScene}\`);
    }
  );
  
  // 3. Mostrar resultados
  console.log(\`Libro generado: \${book.bookName}\`);
  console.log(\`Imágenes: \${book.images.length}\`);
  
  // 4. Las imágenes están en book.images[].imageBase64
  return book;
}
`;
