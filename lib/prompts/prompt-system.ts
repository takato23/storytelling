/**
 * Sistema de Prompts para Personalización de Imágenes
 * ====================================================
 * 
 * Arquitectura de 3 capas:
 * 1. BASE: Instrucciones universales de reemplazo
 * 2. LIBRO: Estilo artístico específico de cada cuento
 * 3. ESCENA: Descripción de la escena particular
 */

// ============================================
// TIPOS Y CONFIGURACIONES
// ============================================

export interface ChildFeatures {
    hairColor: string;        // "castaño oscuro", "rubio", "negro", etc.
    hairType: string;         // "lacio", "ondulado", "rizado"
    skinTone: string;         // "claro", "medio", "oscuro"
    eyeColor: string;         // "marrón", "azul", "verde"
    approximateAge: number;   // 3-12 años
    gender: 'niño' | 'niña' | 'neutral';
    distinctiveFeatures?: string; // "pecas", "gafas", "coletas"
}

export interface BookStyle {
    id: string;
    name: string;
    artStyle: string;         // Estilo artístico principal
    colorPalette: string;     // Paleta de colores
    mood: string;             // Tono/ambiente
    characterStyle: string;   // Cómo se dibujan los personajes
}

export interface SceneConfig {
    id: string;
    bookId: string;
    sceneNumber: number;
    description: string;      // Descripción de la escena
    childPosition: string;    // Dónde está el niño en la escena
    childAction: string;      // Qué está haciendo el niño
    otherElements: string;    // Elementos importantes a preservar
}

// ============================================
// CONFIGURACIÓN DE LIBROS
// ============================================

// ============================================
// CONFIGURACIÓN DE LIBROS
// ============================================

export const BOOK_STYLES: Record<string, BookStyle> = {
    '1': { // El Explorador Espacial
        id: '1',
        name: 'El Explorador Espacial',
        artStyle: 'Pixar-style 3D animation, vibrant colors',
        colorPalette: 'deep blues, cosmic purples, glowing golds',
        mood: 'adventurous, wondrous, kinematic',
        characterStyle: '3D animated character, expressive, cute proportions, wearing space gear'
    },

    '2': { // El Reino del Bosque Mágico
        id: '2',
        name: 'El Reino del Bosque Mágico',
        artStyle: 'soft watercolor illustration, dreamy texture',
        colorPalette: 'nature greens, soft pastels, magical glow',
        mood: 'magical, serene, enchanting',
        characterStyle: 'hand-painted watercolor style, gentle features, soft outlines'
    },

    '3': { // El Domador de Dinosaurios
        id: '3',
        name: 'El Domador de Dinosaurios',
        artStyle: 'modern 2D cartoon, bold clean lines',
        colorPalette: 'bright earth tones, vibrant greens and oranges',
        mood: 'playful, energetic, fun',
        characterStyle: 'cartoon style, dynamic poses, expressive face'
    },

    '4': { // La Estrella del Fútbol
        id: '4',
        name: 'La Estrella del Fútbol',
        artStyle: 'artistic colored pencil sketch, dynamic strokes',
        colorPalette: 'grass greens, sports jersey colors, energetic white streaks',
        mood: 'inspirational, dynamic, triumphant',
        characterStyle: 'sketch style character, athletic pose, determination'
    },

    '5': { // El Castillo en las Nubes
        id: '5',
        name: 'El Castillo en las Nubes',
        artStyle: 'dreamy fantasy digital art, soft glowing lighting',
        colorPalette: 'pastels, violet, soft pink, sky blue, gold',
        mood: 'whimsical, ethereal, peaceful',
        characterStyle: 'cute fantasy prince/princess style, soft features, wearing comfortable adventurous clothes'
    }
};

// ============================================
// CONFIGURACIÓN DE ESCENAS
// ============================================

// Mapa de escenas por ID de libro
export const SCENES_BY_BOOK: Record<string, SceneConfig[]> = {
    '1': [
        {
            id: 'space-1', bookId: '1', sceneNumber: 1,
            description: 'The child standing on a glowing launchpad looking at a massive friendly rocket ship',
            childPosition: 'center foreground, looking up in awe',
            childAction: 'holding a space helmet under one arm, waving',
            otherElements: 'giant silver rocket, starry night sky, futuristic lights'
        },
        {
            id: 'space-5', bookId: '1', sceneNumber: 5,
            description: 'Floating in zero gravity inside the spaceship looking out a large window',
            childPosition: 'floating in mid-air near the window',
            childAction: 'pointing excitedly at a colorful planet outside',
            otherElements: 'spaceship control panel, distant colorful planet, stars'
        }
    ],
    '2': [
        {
            id: 'forest-1', bookId: '2', sceneNumber: 1,
            description: 'Standing at the entrance of a magical glowing forest',
            childPosition: 'walking into the scene from the left',
            childAction: 'reaching out to touch a glowing butterfly',
            otherElements: 'ancient trees with glowing moss, fireflies, soft sunbeams'
        },
        {
            id: 'forest-5', bookId: '2', sceneNumber: 5,
            description: 'Sitting on a giant mushroom having tea with a fairy',
            childPosition: 'sitting comfortably on a red mushroom cap',
            childAction: 'holding a tiny teacup, smiling',
            otherElements: 'friendly glowing fairy, oversized flowers, magical sparkles'
        }
    ],
    '3': [
        {
            id: 'dino-1', bookId: '3', sceneNumber: 1,
            description: 'Finding a large mysterious egg in a prehistoric jungle',
            childPosition: 'crouched down next to a large spotted egg',
            childAction: 'examining the egg with a magnifying glass',
            otherElements: 'large ferns, volcano in background, prehistoric dragonflies'
        },
        {
            id: 'dino-5', bookId: '3', sceneNumber: 5,
            description: 'Riding on the back of a friendly Triceratops',
            childPosition: 'sitting safely on the dinosaur back',
            childAction: 'cheering with arms raised',
            otherElements: 'friendly purple Triceratops, gentle prehistoric landscape'
        }
    ],
    '4': [
        {
            id: 'soccer-1', bookId: '4', sceneNumber: 1,
            description: 'Walking onto a large professional soccer field with spotlights',
            childPosition: 'center, walking towards camera',
            childAction: 'carrying a soccer ball under arm, confident expression',
            otherElements: 'stadium lights, crowd in background (blurred), green grass'
        },
        {
            id: 'soccer-9', bookId: '4', sceneNumber: 9,
            description: 'Scoring the winning goal with a powerful kick',
            childPosition: 'mid-air, kicking the ball dynamically',
            childAction: 'kicking the ball towards the net',
            otherElements: 'soccer ball with motion blur, goal net, cheering atmosphere'
        }
    ],
    '5': [
        {
            id: 'castle-1', bookId: '5', sceneNumber: 1,
            description: 'Climbing a giant magical beanstalk that goes up into the clouds',
            childPosition: 'climbing up the green stalk, looking up',
            childAction: 'reaching for a higher leaf, brave expression',
            otherElements: 'massive green leaves, blue sky context, white clouds above'
        },
        {
            id: 'castle-5', bookId: '5', sceneNumber: 5,
            description: 'Standing in front of a magnificent floating castle made of clouds and gold',
            childPosition: 'standing on a cloud path',
            childAction: 'looking at the castle in amazement',
            otherElements: 'golden castle towers, fluffy cloud floor, rainbow in background'
        }
    ]
};

// ============================================
// GENERADORES DE PROMPTS
// ============================================

/**
 * CAPA 1: Prompt Base Universal
 * Instrucciones fundamentales para el reemplazo de personaje
 */
export function generateBasePrompt(features: ChildFeatures): string {
    return `
INSTRUCCIONES CRÍTICAS DE PRESERVACIÓN:
- Mantén EXACTAMENTE la misma composición, perspectiva y encuadre de la imagen original
- Preserva TODOS los elementos del fondo y otros personajes sin modificación
- Solo modifica al personaje infantil principal

CARACTERÍSTICAS DEL NIÑO/A A GENERAR:
- Género: ${features.gender}
- Edad aproximada: ${features.approximateAge} años
- Cabello: ${features.hairColor}, ${features.hairType}
- Tono de piel: ${features.skinTone}
- Ojos: ${features.eyeColor}
${features.distinctiveFeatures ? `- Rasgos distintivos: ${features.distinctiveFeatures}` : ''}

IMPORTANTE: El rostro debe verse natural y expresivo, manteniendo estas características de manera consistente.
`.trim();
}

/**
 * CAPA 2: Prompt de Estilo del Libro
 * Define el estilo artístico específico
 */
export function generateBookStylePrompt(bookId: string): string {
    const style = BOOK_STYLES[bookId];

    if (!style) {
        throw new Error(`Libro no encontrado: ${bookId}`);
    }

    return `
ESTILO ARTÍSTICO - "${style.name}":
- Técnica: ${style.artStyle}
- Paleta de colores: ${style.colorPalette}
- Ambiente/tono: ${style.mood}
- Estilo de personajes: ${style.characterStyle}

El niño/a debe dibujarse siguiendo EXACTAMENTE este estilo artístico para mantener coherencia con el libro.
`.trim();
}

/**
 * CAPA 3: Prompt de Escena
 * Descripción específica de la escena
 */
export function generateScenePrompt(scene: SceneConfig): string {
    return `
ESCENA ${scene.sceneNumber}:
${scene.description}

POSICIÓN DEL NIÑO/A: ${scene.childPosition}
ACCIÓN: ${scene.childAction}

ELEMENTOS A PRESERVAR (no modificar):
${scene.otherElements}
`.trim();
}

/**
 * GENERADOR PRINCIPAL
 * Combina las 3 capas en un prompt completo
 */
export function generateCompletePrompt(
    childFeatures: ChildFeatures,
    bookId: string,
    scene: SceneConfig
): string {
    const basePrompt = generateBasePrompt(childFeatures);
    const stylePrompt = generateBookStylePrompt(bookId);
    const scenePrompt = generateScenePrompt(scene);

    return `
=== PROMPT DE GENERACIÓN DE IMAGEN PERSONALIZADA ===

${basePrompt}

---

${stylePrompt}

---

${scenePrompt}

=== FIN DEL PROMPT ===

Genera una ilustración que integre al niño/a descrito en esta escena, 
manteniendo perfecta coherencia con el estilo artístico del libro 
y preservando todos los elementos originales de la composición.
`.trim();
}

// ============================================
// EJEMPLO DE USO
// ============================================

export function exampleUsage() {
    // Características extraídas de la foto del niño
    const childFeatures: ChildFeatures = {
        hairColor: 'castaño oscuro',
        hairType: 'ondulado',
        skinTone: 'medio',
        eyeColor: 'marrón',
        approximateAge: 5,
        gender: 'niño',
        distinctiveFeatures: 'pecas en las mejillas'
    };


    // Generar prompt para la escena 1 del libro espacial (ID "1")
    const scene = SCENES_BY_BOOK["1"][0];
    const fullPrompt = generateCompletePrompt(
        childFeatures,
        '1',
        scene
    );

    console.log(fullPrompt);
    return fullPrompt;
}
