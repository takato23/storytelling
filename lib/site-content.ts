import { BookOpen, Heart, Shield, Smile, Star, Zap, type LucideIcon } from "lucide-react"

export type StoryMockStatus = "example"
export type StoryCtaMode = "direct_personalization"
export type StoryFormatAvailability = "digital" | "print"

interface StoryThemeContent {
  icon: LucideIcon
  label: string
  description: string
}

interface StoryEducationalContent {
  vocabulary: Array<{ term: string; definition: string }>
  textByLevel: {
    basic: string
    intermediate: string
    advanced: string
  }
}

export interface StoryMockContent {
  id: string
  slug: string
  title: string
  shortDescription: string
  fullDescription: string
  coverColor: string
  style: string
  ages: string
  pages: number
  price: number
  targetGender: "niña" | "niño" | "unisex"
  digitalPriceArs: number
  printPriceArs: number
  printSpecs: {
    format: string
    size: string
    pages: number
    paper: string
  }
  icon: string
  coverImage: string
  previewImages: string[]
  themes: StoryThemeContent[]
  specs: {
    dimensions: string
    paper: string
    binding: string
  }
  reviews: Array<{
    user: string
    rating: number
    comment: string
    date: string
  }>
  educational?: StoryEducationalContent
  mockStatus: StoryMockStatus
  mockLabel: string
  priceDisplay: {
    digital: string
    print: string
  }
  formatAvailability: StoryFormatAvailability[]
  ctaMode: StoryCtaMode
  purchaseNote: string
  previewPromise: string
}

export const siteContent = {
  brand: {
    name: "cuento.nido",
    tagline: "donde nacen historias",
    navbarTagline: "donde nacen historias",
    mobileTagline: "historias hechas para regalar",
    footerTagline: "cuentos personalizados para leer, regalar y guardar",
    footerDescription:
      "Una biblioteca suave, ilustrada y personal. Subís una foto, elegís una aventura y recibís un cuento listo para personalizar.",
  },
  navigation: {
    publicLinks: [
      { name: "Inicio", href: "/" },
      { name: "Cómo funciona", href: "/#como-funciona" },
      { name: "Stickers", href: "/stickers" },
      { name: "Catálogo", href: "/nuestros-libros" },
      { name: "Mis cuentos", href: "/cuenta/pedidos" },
    ],
    footerProductLinks: [
      { name: "Cómo funciona", href: "/#como-funciona" },
      { name: "Catálogo", href: "/nuestros-libros" },
      { name: "Stickers", href: "/stickers" },
      { name: "Crear cuento", href: "/crear" },
    ],
    footerSupportLinks: [
      { name: "Soporte", href: "/soporte" },
      { name: "Envíos", href: "/envios" },
      { name: "Devoluciones", href: "/devoluciones" },
      { name: "Mis cuentos", href: "/cuenta/pedidos" },
    ],
  },
  home: {
    featuredStoryIds: ["1", "2", "3"],
    libraryStoryIds: ["2", "3", "4", "5"],
    hero: {
      kicker: "Cuentos personalizados",
      title: "Un cuento donde tu hijo es el protagonista.",
      copy:
        "Personalizalo con su nombre, su apariencia y una historia mágica que se sienta propia desde la primera página.",
      primaryCtaLabel: "Subir su foto",
      secondaryCtaLabel: "Ver catálogo",
      beforeLabel: "Antes",
      afterLabel: "Después",
      comparisonInstruction: "Deslizá para ver antes y después",
      mobileHelper: "Deslizá y mirá cómo su foto se transforma en una ilustración del cuento.",
      notes: {
        processTitle: "Cómo empieza",
        processCopy: "Subís una foto, elegís el cuento y te mostramos una muestra previa antes de pagar.",
        keepTitle: "Para guardar",
        keepCopy: "Un recuerdo para leer juntos hoy y conservar por mucho tiempo.",
      },
      highlights: [
        {
          value: "Preview guiada",
          detail: "Ves una muestra antes de pagar.",
        },
        {
          value: "Digital o impreso",
          detail: "Elegís el formato que mejor te sirva.",
        },
        {
          value: "Hecho con su foto",
          detail: "Nombre, cara y cuento en una sola experiencia.",
        },
      ],
    },
    featured: {
      eyebrow: "Historias destacadas",
      title: "Elegí una historia que le va a encantar.",
      copy:
        "Estas son algunas de las aventuras favoritas de familias que buscan un regalo original, emotivo y personalizado.",
      actionLabel: "Ver todo",
    },
    library: {
      featureEyebrow: "Un regalo especial",
      featureTitle: "Un libro pensado para emocionar de verdad.",
      featureCopy:
        "Cada cuento está hecho para que se reconozca en la historia y sienta que ese libro fue creado especialmente para él o para ella.",
      featureActionLabel: "Empezar ahora",
      eyebrow: "Más opciones",
      title: "Hay una aventura para cada chico.",
      copy:
        "Desde historias tiernas hasta aventuras llenas de acción, podés elegir la que mejor combine con su edad y su personalidad.",
    },
    process: {
      eyebrow: "Así funciona",
      title: "Crear su cuento lleva solo unos minutos.",
      copy: "Subís la foto, elegís la historia y revisás la muestra antes de confirmar la compra.",
      steps: [
        {
          title: "Subí tu foto",
          description: "Con una foto clara ya podemos empezar a crear su personaje dentro del cuento.",
          tone: "sky",
        },
        {
          title: "Elegí la aventura",
          description: "Elegí la historia que más le guste, según su edad, su personalidad y lo que lo entusiasma.",
          tone: "rose",
        },
        {
          title: "Te mostramos la muestra",
          description: "La revisás antes de pagar para asegurarte de que el camino visual va como esperás.",
          tone: "sage",
        },
        {
          title: "Recibilo como prefieras",
          description: "Elegí versión digital, impresa o ambas, según cómo quieras regalarlo o guardarlo.",
          tone: "peach",
        },
      ],
    },
    finalCta: {
      eyebrow: "Listo para regalar",
      title: "Un regalo personalizado que queda para siempre.",
      copy:
        "Lo personalizás en minutos y elegís si querés recibirlo en digital, impreso o en ambos formatos.",
      primaryCtaLabel: "Crear mi cuento",
      secondaryCtaLabel: "Explorar historias",
      benefits: [
        "Con preview antes de pagar",
        "Disponible en digital o impreso",
        "Historias para distintas edades",
        "Personalizado con su foto y su nombre",
      ],
    },
  },
  catalog: {
    kicker: "Colección completa",
    title: "Nuestros libros para personalizar",
    copy:
      "Estos cuentos funcionan hoy como ejemplos comerciales del tipo de aventura que se puede personalizar. El catálogo final todavía puede cambiar.",
    mockNote:
      "Los universos, portadas y textos actuales sirven como ejemplo vendible mientras se define el catálogo final con la clienta.",
  },
  storySelection: {
    eyebrow: "Paso 3 de 4",
    title: "Elegí la aventura perfecta",
    copy: "Cada cuento funciona hoy como universo comercial de referencia para personalizar.",
    mockNote: "Catálogo ejemplo en validación comercial.",
  },
  preview: {
    eyebrow: "Paso final",
    title: "Resumen de tu pedido",
    copy: "Revisá la muestra, el formato y el total antes de ir a Mercado Pago.",
    previewTitle: "Muestra previa del cuento",
    digitalCardTitle: "Versión digital",
    digitalCardCopy:
      "Incluye PDF descargable y lectura web. La entrega final se libera cuando el pedido queda listo.",
    sampleNote: "La vista previa es una muestra comercial del resultado; no representa todavía el libro final completo.",
    checkoutCtaPrint: "Pagar con Mercado Pago",
    checkoutCtaDigital: "Pagar con Mercado Pago",
  },
  storyDetail: {
    backLabel: "Regresar al catálogo",
    mockBadge: "Universo de ejemplo",
    digitalLabel: "Versión digital",
    printLabel: "Libro físico",
    ctaLabel: "Comenzar personalización",
    mockNote:
      "Esta ficha muestra un universo comercial de referencia. El catálogo y la muestra final todavía pueden ajustarse con la clienta.",
    crossSellTitle: "Más historias para descubrir",
    crossSellCopy: "Aventuras personalizadas de referencia para distintas edades.",
  },
} as const

export const storyMocks: StoryMockContent[] = [
  {
    id: "1",
    slug: "el-explorador-espacial",
    title: "El Explorador Espacial",
    shortDescription: "Viaja por las estrellas en una aventura intergaláctica.",
    fullDescription:
      "¿Alguna vez soñaste con viajar a las estrellas? En esta aventura, tu pequeño se convierte en el valiente capitán de la nave Voyager. Juntos explorarán planetas desconocidos, conocerán alienígenas amigables y descubrirán que el universo es tan grande como su imaginación. Una historia sobre la curiosidad, el coraje y la importancia de soñar en grande.",
    coverColor: "#4F46E5",
    style: "pixar",
    ages: "4-8 años",
    pages: 24,
    price: 29.99,
    targetGender: "niño",
    digitalPriceArs: 9990,
    printPriceArs: 29990,
    printSpecs: {
      format: "Tapa blanda",
      size: "21 x 14 cm",
      pages: 32,
      paper: "Satinado color",
    },
    icon: "🚀",
    coverImage: "/stories/space-1.jpg",
    previewImages: ["/stories/space-1.jpg", "/stories/space-1.jpg", "/stories/space-1.jpg"],
    themes: [
      { icon: Zap, label: "Valentía", description: "Enfrentar lo desconocido con coraje" },
      { icon: Star, label: "Curiosidad", description: "Aprender sobre el universo" },
      { icon: BookOpen, label: "Imaginación", description: "Soñar sin límites" },
    ],
    specs: {
      dimensions: "21 x 21 cm",
      paper: "Premium 170g",
      binding: "Tapa dura acolchada",
    },
    reviews: [
      { user: "María G.", rating: 5, comment: "¡A mi hijo le encantó verse de astronauta!", date: "Hace 2 días" },
      { user: "Carlos R.", rating: 5, comment: "La calidad de impresión es increíble.", date: "Hace 1 semana" },
    ],
    educational: {
      vocabulary: [
        { term: "Galaxia", definition: "Un conjunto enorme de estrellas, polvo y gas." },
        { term: "Gravedad", definition: "La fuerza que nos mantiene con los pies en la Tierra." },
      ],
      textByLevel: {
        basic: "Lucas sube al cohete. ¡3, 2, 1, despegue! El cohete vuela rápido hacia la Luna.",
        intermediate:
          "El Capitán Lucas ajusta su casco y se prepara para el lanzamiento. Los motores rugen mientras la nave Voyager despega hacia el espacio infinito.",
        advanced:
          "Con destreza y valentía, el Comandante Lucas inicia la secuencia de ignición del propulsor de hipervelocidad, listo para atravesar la exosfera y navegar el cosmos.",
      },
    },
    mockStatus: "example",
    mockLabel: "Ejemplo comercial",
    priceDisplay: {
      digital: "Versión digital desde ARS 9.990",
      print: "Libro físico desde ARS 29.990",
    },
    formatAvailability: ["digital", "print"],
    ctaMode: "direct_personalization",
    purchaseNote: "Universo comercial de referencia para personalizar.",
    previewPromise: "Muestra previa del estilo y la portada antes de pagar.",
  },
  {
    id: "2",
    slug: "el-bosque-magico",
    title: "El Reino del Bosque Mágico",
    shortDescription: "Descubre hadas y criaturas fantásticas.",
    fullDescription:
      "Adéntrate en el corazón del Bosque Encantado, donde los árboles susurran secretos y las hadas bailan con la luz de la luna. Tu peque descubrirá que la verdadera magia reside en la amistad y el cuidado de la naturaleza. Un viaje lleno de color, maravillas y criaturas que jamás olvidará.",
    coverColor: "#059669",
    style: "watercolor",
    ages: "3-7 años",
    pages: 20,
    price: 29.99,
    targetGender: "niña",
    digitalPriceArs: 9990,
    printPriceArs: 29990,
    printSpecs: {
      format: "Tapa blanda",
      size: "21 x 14 cm",
      pages: 32,
      paper: "Satinado color",
    },
    icon: "🦄",
    coverImage: "/stories/forest-1.jpg",
    previewImages: ["/stories/forest-1.jpg", "/stories/forest-1.jpg", "/stories/forest-1.jpg"],
    themes: [
      { icon: Heart, label: "Amistad", description: "El valor de los amigos" },
      { icon: Shield, label: "Naturaleza", description: "Cuidar nuestro planeta" },
      { icon: Star, label: "Magia", description: "Creer en lo imposible" },
    ],
    specs: {
      dimensions: "21 x 21 cm",
      paper: "Premium 170g",
      binding: "Tapa dura acolchada",
    },
    reviews: [
      { user: "Laura P.", rating: 5, comment: "Las ilustraciones son preciosas.", date: "Hace 3 días" },
      { user: "Juan D.", rating: 4, comment: "Muy bonita historia.", date: "Hace 2 semanas" },
    ],
    educational: {
      vocabulary: [
        { term: "Ecosistema", definition: "Comunidad de seres vivos que interactúan entre sí." },
        { term: "Biodiversidad", definition: "Variedad de vida en un lugar." },
      ],
      textByLevel: {
        basic: "El bosque es verde y bonito. Los pájaros cantan. Las flores huelen bien.",
        intermediate:
          "El bosque mágico está lleno de vida. Las ardillas juegan en los robles y los conejos saltan entre las flores silvestres.",
        advanced:
          "El antiguo bosque resplandece bajo el sol de la mañana, un santuario de biodiversidad donde cada criatura, desde la más pequeña hormiga hasta el gran ciervo, juega un papel vital.",
      },
    },
    mockStatus: "example",
    mockLabel: "Ejemplo comercial",
    priceDisplay: {
      digital: "Versión digital desde ARS 9.990",
      print: "Libro físico desde ARS 29.990",
    },
    formatAvailability: ["digital", "print"],
    ctaMode: "direct_personalization",
    purchaseNote: "Universo comercial de referencia para personalizar.",
    previewPromise: "Muestra previa del estilo y la portada antes de pagar.",
  },
  {
    id: "3",
    slug: "el-domador-de-dinosaurios",
    title: "El Domador de Dinosaurios",
    shortDescription: "Una aventura prehistórica con amigos gigantes.",
    fullDescription:
      "¡ROAAAAR! Viaja millones de años al pasado y conoce a los dinosaurios más divertidos. Tu pequeño aprenderá que incluso los gigantes T-Rex pueden necesitar un abrazo. Una historia llena de risas, aventuras y lecciones sobre la empatía y la convivencia.",
    coverColor: "#DC2626",
    style: "cartoon",
    ages: "4-8 años",
    pages: 22,
    price: 29.99,
    targetGender: "niño",
    digitalPriceArs: 9990,
    printPriceArs: 29990,
    printSpecs: {
      format: "Tapa blanda",
      size: "21 x 14 cm",
      pages: 32,
      paper: "Satinado color",
    },
    icon: "🦕",
    coverImage: "/stories/dino-1.jpg",
    previewImages: ["/stories/dino-1.jpg", "/stories/dino-1.jpg", "/stories/dino-1.jpg"],
    themes: [
      { icon: Smile, label: "Diversión", description: "Aprender jugando" },
      { icon: Heart, label: "Empatía", description: "Entender a los demás" },
      { icon: Shield, label: "Aventura", description: "Explorar mundos nuevos" },
    ],
    specs: {
      dimensions: "21 x 21 cm",
      paper: "Premium 170g",
      binding: "Tapa dura acolchada",
    },
    reviews: [{ user: "Pedro S.", rating: 5, comment: "Mi nieto no lo suelta.", date: "Hace 1 día" }],
    educational: {
      vocabulary: [
        { term: "Paleontólogo", definition: "Científico que estudia los fósiles." },
        { term: "Prehistórico", definition: "De una época muy, muy antigua." },
      ],
      textByLevel: {
        basic: "¡Mira, un dinosaurio! Es muy grande y hace Roar. Es amigo de Juan.",
        intermediate:
          "En la tierra de los dinosaurios, Juan encuentra a un T-Rex. No da miedo, ¡solo quiere jugar al escondite!",
        advanced:
          "Viajando a través de las eras hasta el período Cretácico, nuestro intrépido explorador descubre que la convivencia con los saurios gigantes requiere paciencia y comprensión.",
      },
    },
    mockStatus: "example",
    mockLabel: "Ejemplo comercial",
    priceDisplay: {
      digital: "Versión digital desde ARS 9.990",
      print: "Libro físico desde ARS 29.990",
    },
    formatAvailability: ["digital", "print"],
    ctaMode: "direct_personalization",
    purchaseNote: "Universo comercial de referencia para personalizar.",
    previewPromise: "Muestra previa del estilo y la portada antes de pagar.",
  },
  {
    id: "4",
    slug: "la-estrella-del-futbol",
    title: "La Estrella del Fútbol",
    shortDescription: "Marca el gol de la victoria en el gran estadio.",
    fullDescription:
      "El estadio ruge, el partido está empatado y queda un minuto... ¡Es el momento de tu pequeño campeón! Una historia emocionante sobre el esfuerzo, el trabajo en equipo y la gloria de perseguir tus sueños. Perfecto para los amantes del deporte.",
    coverColor: "#16A34A",
    style: "sketch",
    ages: "5-10 años",
    pages: 24,
    price: 29.99,
    targetGender: "unisex",
    digitalPriceArs: 9990,
    printPriceArs: 29990,
    printSpecs: {
      format: "Tapa blanda",
      size: "21 x 14 cm",
      pages: 32,
      paper: "Satinado color",
    },
    icon: "⚽",
    coverImage: "/stories/soccer-1.jpg",
    previewImages: ["/stories/soccer-1.jpg", "/stories/soccer-1.jpg", "/stories/soccer-1.jpg"],
    themes: [
      { icon: Zap, label: "Esfuerzo", description: "Persistir hasta lograrlo" },
      { icon: Star, label: "Éxito", description: "Alcanzar tus metas" },
      { icon: Shield, label: "Equipo", description: "Ganamos juntos" },
    ],
    specs: {
      dimensions: "21 x 21 cm",
      paper: "Premium 170g",
      binding: "Tapa dura acolchada",
    },
    reviews: [{ user: "Ana M.", rating: 5, comment: "El mejor regalo para mi futbolista.", date: "Hace 5 días" }],
    educational: {
      vocabulary: [
        { term: "Estrategia", definition: "Plan para lograr un objetivo." },
        { term: "Perseverancia", definition: "Seguir intentando sin rendirse." },
      ],
      textByLevel: {
        basic: "Ana chuta el balón. ¡Gol! Todo el mundo aplaude.",
        intermediate:
          "Con el marcador empatado, Ana corre por la banda. Regatea a uno, a dos... ¡y dispara con fuerza a la portería!",
        advanced:
          "En los últimos segundos del campeonato, con la presión palpable en el aire, la jugada maestra de Ana demuestra que la estrategia y la perseverancia son la clave de la victoria.",
      },
    },
    mockStatus: "example",
    mockLabel: "Ejemplo comercial",
    priceDisplay: {
      digital: "Versión digital desde ARS 9.990",
      print: "Libro físico desde ARS 29.990",
    },
    formatAvailability: ["digital", "print"],
    ctaMode: "direct_personalization",
    purchaseNote: "Universo comercial de referencia para personalizar.",
    previewPromise: "Muestra previa del estilo y la portada antes de pagar.",
  },
  {
    id: "5",
    slug: "el-castillo-en-las-nubes",
    title: "El Castillo en las Nubes",
    shortDescription: "Sube por el tallo de frijoles a un mundo de gigantes amables.",
    fullDescription:
      "¡Más alto que los pájaros! Tu pequeño escalará hasta alcanzar un reino flotante donde las nubes son de algodón de azúcar y los gigantes invitan a merendar. Una historia mágica sobre la imaginación, la generosidad y el descubrimiento de nuevos horizontes.",
    coverColor: "#8B5CF6",
    style: "fantasy",
    ages: "4-9 años",
    pages: 26,
    price: 29.99,
    targetGender: "niña",
    digitalPriceArs: 9990,
    printPriceArs: 29990,
    printSpecs: {
      format: "Tapa blanda",
      size: "21 x 14 cm",
      pages: 32,
      paper: "Satinado color",
    },
    icon: "🏰",
    coverImage: "/stories/castle-1.jpg",
    previewImages: ["/stories/castle-1.jpg", "/stories/castle-1.jpg", "/stories/castle-1.jpg"],
    themes: [
      { icon: BookOpen, label: "Fantasía", description: "Mundos imaginarios" },
      { icon: Heart, label: "Generosidad", description: "Compartir con otros" },
      { icon: Star, label: "Sueños", description: "Creer en ti mismo" },
    ],
    specs: {
      dimensions: "21 x 21 cm",
      paper: "Premium 170g",
      binding: "Tapa dura acolchada",
    },
    reviews: [{ user: "Elena T.", rating: 5, comment: "Un cuento muy dulce y soñador.", date: "Hace 1 semana" }],
    educational: {
      vocabulary: [
        { term: "Cúmulo", definition: "Un tipo de nube grande y esponjosa." },
        { term: "Horizonte", definition: "Línea donde se juntan el cielo y la tierra." },
      ],
      textByLevel: {
        basic: "Juan sube muy alto. Las nubes son blancas y suaves. ¡Mira, un castillo!",
        intermediate:
          "Trepando por la planta mágica, Juan llega a un mundo flotante. Un castillo brillante se alza sobre las nubes de algodón.",
        advanced:
          "Al cruzar el umbral de las nubes estratosféricas, Juan descubre un reino etéreo donde la gravedad juega al escondite y la arquitectura desafía a la imaginación.",
      },
    },
    mockStatus: "example",
    mockLabel: "Ejemplo comercial",
    priceDisplay: {
      digital: "Versión digital desde ARS 9.990",
      print: "Libro físico desde ARS 29.990",
    },
    formatAvailability: ["digital", "print"],
    ctaMode: "direct_personalization",
    purchaseNote: "Universo comercial de referencia para personalizar.",
    previewPromise: "Muestra previa del estilo y la portada antes de pagar.",
  },
]

export function findStoryMockByIdOrSlug(value: string | null | undefined): StoryMockContent | null {
  if (!value) return null

  const normalizedValue = value.trim()
  if (!normalizedValue) return null

  return storyMocks.find((story) => story.id === normalizedValue || story.slug === normalizedValue) ?? null
}

export function resolveStoryMockId(value: string | null | undefined): string | null {
  return findStoryMockByIdOrSlug(value)?.id ?? null
}

export function getStoryMocksByIds(ids: readonly string[]): StoryMockContent[] {
  const idSet = new Set(ids)
  return storyMocks.filter((story) => idSet.has(story.id))
}
