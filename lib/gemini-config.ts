// Gemini API Configuration
// This file prepares the structure for Google's Gemini API integration

export const GEMINI_CONFIG = {
    // Models available through Gemini API
    models: {
        // For text generation and understanding
        text: "gemini-2.5-flash",
        // For image generation (Imagen 3)
        image: "imagen-3.0-generate-001",
        // For vision tasks (understanding images)
        vision: "gemini-2.5-flash",
    },

    // Default generation parameters
    textGeneration: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
    },

    // Image generation parameters
    imageGeneration: {
        numberOfImages: 1,
        aspectRatio: "3:4", // Book page aspect ratio
        safetyFilterLevel: "block_medium_and_above",
        personGeneration: "allow_adult", // For generating children's faces
    },

    // Story generation prompts
    storyPrompts: {
        systemPrompt: `Eres un escritor de cuentos infantiles experto. Tu objetivo es crear historias 
    mágicas, educativas y emocionantes para niños. Cada historia debe:
    - Tener un mensaje positivo
    - Ser apropiada para niños de 3-10 años
    - Incluir momentos de aventura y alegría
    - Personalizar la historia con el nombre del niño protagonista
    - Descripciones visuales detalladas para cada escena`,

        pagePromptTemplate: (storyId: string, pageNumber: number, childName: string) => {
            const stories: Record<string, string> = {
                "1": `Crear la página ${pageNumber} de "El Explorador Espacial" donde ${childName} es el capitán de la nave Voyager.`,
                "2": `Crear la página ${pageNumber} de "El Reino del Bosque Mágico" donde ${childName} descubre criaturas fantásticas.`,
                "3": `Crear la página ${pageNumber} de "El Domador de Dinosaurios" donde ${childName} hace amistad con dinosaurios.`,
                "4": `Crear la página ${pageNumber} de "La Estrella del Fútbol" donde ${childName} juega el partido más importante.`,
            }
            return stories[storyId] || `Crear una página de cuento para ${childName}.`
        }
    },

    // Art styles for image generation
    artStyles: {
        "1": {
            name: "pixar",
            prompt: "Pixar-style 3D animation, vibrant colors, expressive characters, detailed lighting, cinematic quality, child-friendly, magical atmosphere",
        },
        "2": {
            name: "watercolor",
            prompt: "Watercolor illustration style, soft pastel colors, dreamy atmosphere, gentle brush strokes, children's book illustration, whimsical and magical",
        },
        "3": {
            name: "cartoon",
            prompt: "Modern cartoon style, bright bold colors, clean lines, playful design, dynamic poses, friendly characters, high energy",
        },
        "4": {
            name: "sketch",
            prompt: "Artistic pencil sketch style, hand-drawn quality, expressive lines, warm earth tones, storybook illustration, nostalgic feel",
        },
    }
}

// Story template definitions
export const STORY_TEMPLATES = [
    {
        id: "1",
        title: "El Explorador Espacial",
        description: "Una aventura intergaláctica donde tu pequeño se convierte en capitán espacial",
        pageCount: 10,
        ageRange: "4-8",
        themes: ["aventura", "ciencia", "valentía"],
        pages: [
            { pageNumber: 1, sceneDescription: "El día que {childName} recibió la invitación para ser astronauta" },
            { pageNumber: 2, sceneDescription: "{childName} entrando en la nave espacial Voyager" },
            { pageNumber: 3, sceneDescription: "El despegue hacia las estrellas" },
            { pageNumber: 4, sceneDescription: "Navegando entre asteroides" },
            { pageNumber: 5, sceneDescription: "Descubriendo un planeta nuevo" },
            { pageNumber: 6, sceneDescription: "Conociendo a amigables alienígenas" },
            { pageNumber: 7, sceneDescription: "Una misión de rescate espacial" },
            { pageNumber: 8, sceneDescription: "Celebración en la estación espacial" },
            { pageNumber: 9, sceneDescription: "El viaje de regreso a casa" },
            { pageNumber: 10, sceneDescription: "{childName} recibe una medalla de héroe espacial" },
        ]
    },
    {
        id: "2",
        title: "El Reino del Bosque Mágico",
        description: "Un viaje mágico por un bosque encantado lleno de criaturas fantásticas",
        pageCount: 10,
        ageRange: "3-7",
        themes: ["naturaleza", "amistad", "magia"],
        pages: [
            { pageNumber: 1, sceneDescription: "{childName} encuentra una puerta mágica en el jardín" },
            { pageNumber: 2, sceneDescription: "Entrando al bosque encantado" },
            { pageNumber: 3, sceneDescription: "Conociendo a una hada guardiana" },
            { pageNumber: 4, sceneDescription: "Cruzando el río brillante sobre un puente de cristal" },
            { pageNumber: 5, sceneDescription: "Encontrando un unicornio bebé perdido" },
            { pageNumber: 6, sceneDescription: "Buscando pistas con ayuda de ardillas parlantes" },
            { pageNumber: 7, sceneDescription: "Descubriendo el claro de las flores luminosas" },
            { pageNumber: 8, sceneDescription: "Reuniendo al unicornio con su familia" },
            { pageNumber: 9, sceneDescription: "Una fiesta en el castillo del bosque" },
            { pageNumber: 10, sceneDescription: "{childName} recibe una vara mágica como regalo" },
        ]
    },
    {
        id: "3",
        title: "El Domador de Dinosaurios",
        description: "Una aventura prehistórica con dinosaurios amigables",
        pageCount: 10,
        ageRange: "4-8",
        themes: ["prehistoria", "valentía", "amistad"],
        pages: [
            { pageNumber: 1, sceneDescription: "{childName} encuentra un huevo de dinosaurio en el patio" },
            { pageNumber: 2, sceneDescription: "El huevo eclosiona y nace un pequeño T-Rex" },
            { pageNumber: 3, sceneDescription: "Enseñando trucos al dinosaurio bebé" },
            { pageNumber: 4, sceneDescription: "Un portal mágico los lleva a la era de los dinosaurios" },
            { pageNumber: 5, sceneDescription: "Volando sobre un Pterodáctilo amigable" },
            { pageNumber: 6, sceneDescription: "Conociendo una manada de Triceratops" },
            { pageNumber: 7, sceneDescription: "Ayudando a un Brontosaurio a encontrar su hogar" },
            { pageNumber: 8, sceneDescription: "Una competencia de carreras con Velociraptores" },
            { pageNumber: 9, sceneDescription: "La despedida de los amigos dinosaurios" },
            { pageNumber: 10, sceneDescription: "{childName} regresa a casa con un diente de dinosaurio mágico" },
        ]
    },
    {
        id: "4",
        title: "La Estrella del Fútbol",
        description: "El camino hacia marcar el gol más importante",
        pageCount: 10,
        ageRange: "5-10",
        themes: ["deporte", "trabajo en equipo", "perseverancia"],
        pages: [
            { pageNumber: 1, sceneDescription: "{childName} sueña con ser futbolista profesional" },
            { pageNumber: 2, sceneDescription: "El primer día de entrenamiento en el equipo" },
            { pageNumber: 3, sceneDescription: "Practicando tiros al arco en el jardín" },
            { pageNumber: 4, sceneDescription: "Haciendo nuevos amigos en el equipo" },
            { pageNumber: 5, sceneDescription: "Superando un momento difícil después de perder un partido" },
            { pageNumber: 6, sceneDescription: "Entrenando con dedicación cada día" },
            { pageNumber: 7, sceneDescription: "La final del campeonato comienza" },
            { pageNumber: 8, sceneDescription: "Un momento de tensión: penalty en el último minuto" },
            { pageNumber: 9, sceneDescription: "{childName} marca el gol de la victoria" },
            { pageNumber: 10, sceneDescription: "Celebrando con el equipo y recibiendo el trofeo" },
        ]
    }
]

export type StoryTemplate = typeof STORY_TEMPLATES[0]
export type ArtStyle = typeof GEMINI_CONFIG.artStyles[keyof typeof GEMINI_CONFIG.artStyles]
