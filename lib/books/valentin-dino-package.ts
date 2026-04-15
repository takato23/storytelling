import { BEDTIME_STORY_BOOK_THEME, type BookEditorialTheme } from "./editorial-theme.ts";

export const VALENTIN_DINO_STORY_ID = '3';
export const VALENTIN_DINO_SLUG = 'valentin-y-la-noche-de-los-dinosaurios';

export interface BookSceneDefinition {
  id:
    | 'cover'
    | 'spread-01-02'
    | 'spread-03-04'
    | 'spread-05-06'
    | 'spread-07-08'
    | 'spread-09-10'
    | 'spread-11-12'
    | 'spread-13-14'
    | 'spread-15-16'
    | 'spread-17-18'
    | 'spread-19-20';
  fileName: string;
  pageNumber: number;
  title: string;
  text: string;
  summary: string;
  prompt: string;
  pageType: 'cover' | 'story_page' | 'ending';
  assetKind: 'cover' | 'spread';
  storyPageRange: [number, number] | null;
  textPlacement?: {
    x: number;
    y: number;
    width: number;
    bodyTop: number;
    bodyHeight: number;
    align?: 'left' | 'center';
  };
}

export interface StoryPackageDefinition {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  fullDescription: string;
  coverImage: string;
  previewImages: string[];
  format: string;
  imageAspectRatio: string;
  renderTarget: string;
  printSpecs: {
    format: string;
    size: string;
    pages: number;
    paper: string;
  };
  editorialTheme: BookEditorialTheme;
  previewSceneIds: Array<BookSceneDefinition['id']>;
  scenes: BookSceneDefinition[];
}

const GLOBAL_STYLE_DIRECTION =
  'Premium cinematic 3D family-animation illustration for a children\'s bedtime storybook, warm emotional lighting, gentle facial expressions, highly polished animated feature look, child-friendly, soft textures, expressive eyes, believable depth, magical but safe atmosphere, consistent character design, no text, no watermark.';

const CHILD_LIKENESS_DIRECTION = [
  'Use the uploaded child photo as the identity reference for the protagonist.',
  'Preserve the real child\'s face, hair, skin tone, eye color, age range, and gentle child-safe proportions.',
  'Keep the same child identity across every scene.',
].join(' ');

const SPREAD_EDITORIAL_DIRECTION = [
  'Create a wide cinematic children\'s book spread intended for a final double-page layout.',
  'Place the key action and character focus slightly toward the left page.',
  'Keep the right page calmer and readable, with breathing room for later editorial text overlay.',
  'Keep important faces and hands away from the top and bottom edges because the final system will crop slightly to the print spread ratio.',
  'Do not add text, letters, speech bubbles, page numbers, or watermark.',
].join(' ');

const COVER_EDITORIAL_DIRECTION = [
  'Create a square premium children\'s book cover with breathing room for title placement.',
  'Do not add text, letters, page numbers, or watermark.',
].join(' ');

function buildPrompt(sceneDescription: string, assetKind: 'cover' | 'spread') {
  return [
    GLOBAL_STYLE_DIRECTION,
    CHILD_LIKENESS_DIRECTION,
    assetKind === 'spread' ? SPREAD_EDITORIAL_DIRECTION : COVER_EDITORIAL_DIRECTION,
    sceneDescription,
  ].join(' ');
}

const CHILD_NAME_TOKEN = '{{child_name}}';

function replaceChildNameToken(value: string, childName: string) {
  return value.replaceAll(CHILD_NAME_TOKEN, childName.trim() || 'Valentín');
}

export const VALENTIN_DINO_BOOK: StoryPackageDefinition = {
  id: VALENTIN_DINO_STORY_ID,
  slug: VALENTIN_DINO_SLUG,
  title: 'Valentín y la noche de los dinosaurios',
  shortDescription: 'Un cuento tierno para acompañar el miedo a dormir solo.',
  fullDescription:
    'A veces, cuando llega la noche, todo se siente más silencioso y un poquito más difícil. Junto a su amigo Dino, Valentín descubre que ser valiente no es dejar de sentir miedo, sino animarse incluso cuando el miedo está.',
  coverImage: '/stories/valentin-noche-dinosaurios/cover.png',
  previewImages: [
    '/stories/valentin-noche-dinosaurios/spread-01-02.png',
    '/stories/valentin-noche-dinosaurios/spread-09-10.png',
    '/stories/valentin-noche-dinosaurios/spread-19-20.png',
  ],
  format: '21x21',
  imageAspectRatio: 'cover 1:1 · interiores generate 16:9 -> compose 2:1',
  renderTarget: 'cover 3000x3000 · spreads generate 16:9 then crop/compose to 6000x3000',
  printSpecs: {
    format: 'Tapa dura',
    size: '21 x 21 cm',
    pages: 22,
    paper: 'Satinado color',
  },
  editorialTheme: BEDTIME_STORY_BOOK_THEME,
  previewSceneIds: ['cover'],
  scenes: [
    {
      id: 'cover',
      fileName: 'cover.png',
      pageNumber: 1,
      title: 'Portada',
      text: '{{child_name}} y la noche de los dinosaurios. Un cuento personalizado para acompañar el miedo a dormir solo.',
      summary: 'Composición hero cálida y mágica con Valentín y Dino.',
      prompt: buildPrompt(
        'The child stands close to his gentle green dinosaur friend Dino in a warm magical nighttime scene. Keep the composition clear and centered, with breathing room for future title placement at the top. The mood is tender, brave, comforting, and full of wonder.',
        'cover',
      ),
      pageType: 'cover',
      assetKind: 'cover',
      storyPageRange: null,
    },
    {
      id: 'spread-01-02',
      fileName: 'spread-01-02.png',
      pageNumber: 2,
      title: 'La hora de dormir',
      text: 'Esa noche, mamá y papá ayudaron a {{child_name}} a meterse en la cama, le acomodaron la manta de dinosaurios y encendieron su lamparita favorita. Todo estaba tibio, tranquilo y lleno de amor.',
      summary: 'Rutina nocturna en el cuarto con padres, cama, manta de dinosaurios y lamparita huevo dino.',
      prompt: buildPrompt(
        'Illustrate bedtime routine in a cozy dinosaur-themed bedroom. The parents are helping the child into bed, tucking him in with a dinosaur blanket and turning on his favorite egg-shaped dinosaur lamp. Do not show the parents\' faces clearly. The room feels warm, safe, and loved.',
        'spread',
      ),
      pageType: 'story_page',
      assetKind: 'spread',
      storyPageRange: [1, 2],
      textPlacement: {
        x: 860,
        y: 260,
        width: 1320,
        bodyTop: 700,
        bodyHeight: 1500,
        align: 'left',
      },
    },
    {
      id: 'spread-03-04',
      fileName: 'spread-03-04.png',
      pageNumber: 3,
      title: 'Abrazado a Dino',
      text: 'Cuando la puerta se cerró, {{child_name}} apretó fuerte a su peluche verde. La luna entraba despacito por la ventana y el cuarto estaba en silencio. No daba miedo, pero sí se sentía un poquito solo.',
      summary: 'Valen solo abraza su peluche verde bajo luz de luna.',
      prompt: buildPrompt(
        'Illustrate the child alone in his room at night, hugging a soft green baby dinosaur plush tightly. Moonlight enters gently, the room is quiet and calm, and the feeling is a little lonely but never scary.',
        'spread',
      ),
      pageType: 'story_page',
      assetKind: 'spread',
      storyPageRange: [3, 4],
      textPlacement: {
        x: 900,
        y: 250,
        width: 1500,
        bodyTop: 620,
        bodyHeight: 1220,
        align: 'center',
      },
    },
    {
      id: 'spread-05-06',
      fileName: 'spread-05-06.png',
      pageNumber: 4,
      title: 'Un brillo inesperado',
      text: 'Entonces {{child_name}} respiró hondo y abrazó a Dino todavía más fuerte. De a poquito, el peluche comenzó a brillar con una luz suave, como si quisiera decirle que todo iba a estar bien.',
      summary: 'El peluche comienza a brillar.',
      prompt: buildPrompt(
        'Illustrate the child sitting in bed breathing slowly while hugging his green dinosaur plush so tightly that the plush begins to glow softly. The room is dark but cozy, with magical light starting to appear.',
        'spread',
      ),
      pageType: 'story_page',
      assetKind: 'spread',
      storyPageRange: [5, 6],
      textPlacement: {
        x: 760,
        y: 220,
        width: 1640,
        bodyTop: 560,
        bodyHeight: 980,
        align: 'center',
      },
    },
    {
      id: 'spread-07-08',
      fileName: 'spread-07-08.png',
      pageNumber: 5,
      title: 'Dino despierta',
      text: 'El pequeño dinosaurio abrió los ojos y sonrió con ternura. {{child_name}} se sorprendió, pero enseguida sintió calma. Dino no había venido a asustarlo: había venido a acompañarlo.',
      summary: 'Dino cobra vida y se muestra amable.',
      prompt: buildPrompt(
        'Illustrate the glowing green dinosaur plush opening its eyes and becoming a gentle magical friend named Dino. Dino should look soft, friendly, reassuring, and never frightening. The child looks surprised but comforted.',
        'spread',
      ),
      pageType: 'story_page',
      assetKind: 'spread',
      storyPageRange: [7, 8],
      textPlacement: {
        x: 620,
        y: 220,
        width: 1800,
        bodyTop: 560,
        bodyHeight: 1180,
        align: 'center',
      },
    },
    {
      id: 'spread-09-10',
      fileName: 'spread-09-10.png',
      pageNumber: 6,
      title: 'La puerta mágica',
      text: 'En la pared del cuarto apareció una puerta de luz. Detrás se veía un mundo lleno de estrellas, plantas brillantes y sombras amables. {{child_name}} miró a Dino, y juntos dieron un paso hacia la aventura.',
      summary: 'Puerta mágica del cuarto al mundo de dinosaurios.',
      prompt: buildPrompt(
        'Illustrate a magical doorway appearing in the bedroom wall, opening into a beautiful dinosaur world at night. The child and Dino stand together at the threshold in awe. Add stars, soft bioluminescent jungle lights, and a sense of adventure that still feels safe and tender.',
        'spread',
      ),
      pageType: 'story_page',
      assetKind: 'spread',
      storyPageRange: [9, 10],
      textPlacement: {
        x: 1080,
        y: 250,
        width: 1400,
        bodyTop: 620,
        bodyHeight: 1220,
        align: 'left',
      },
    },
    {
      id: 'spread-11-12',
      fileName: 'spread-11-12.png',
      pageNumber: 7,
      title: 'La selva tranquila',
      text: 'Caminaron por una selva nocturna llena de luciérnagas y plantas luminosas. {{child_name}} se quedó cerquita de Dino y entendió que los sonidos de la noche podían ser suaves, curiosos y hasta hermosos.',
      summary: 'Selva nocturna con luciérnagas.',
      prompt: buildPrompt(
        'Illustrate the child and Dino walking through a nocturnal dinosaur jungle full of fireflies and gentle glowing plants. The child stays close to Dino, learning that the sounds of night are natural and safe.',
        'spread',
      ),
      pageType: 'story_page',
      assetKind: 'spread',
      storyPageRange: [11, 12],
      textPlacement: {
        x: 620,
        y: 220,
        width: 1760,
        bodyTop: 560,
        bodyHeight: 1120,
        align: 'center',
      },
    },
    {
      id: 'spread-13-14',
      fileName: 'spread-13-14.png',
      pageNumber: 8,
      title: 'Cuevas dormidas',
      text: 'Más adelante encontraron unas cuevas tibias donde dormían bebés dinosaurio, enroscados en sus nidos. Algunos abrían un ojito y volvían a dormirse enseguida. Todo allí se sentía sereno y seguro.',
      summary: 'Cuevas cálidas con dinos bebés dormidos.',
      prompt: buildPrompt(
        'Illustrate warm caves where baby dinosaurs sleep curled up in nests. Some tiny dinosaurs open one eye and then fall asleep again. The whole scene must feel peaceful, safe, and tender.',
        'spread',
      ),
      pageType: 'story_page',
      assetKind: 'spread',
      storyPageRange: [13, 14],
      textPlacement: {
        x: 520,
        y: 200,
        width: 1960,
        bodyTop: 520,
        bodyHeight: 980,
        align: 'center',
      },
    },
    {
      id: 'spread-15-16',
      fileName: 'spread-15-16.png',
      pageNumber: 9,
      title: 'El nido de Dino',
      text: 'Dino llevó a {{child_name}} hasta su cueva favorita y le mostró su nido. Allí también dormía solo cada noche. {{child_name}} lo miró con atención y pensó que quizá él también podía aprender a hacerlo.',
      summary: 'Interior acogedor de la cueva de Dino.',
      prompt: buildPrompt(
        'Illustrate Dino\'s cozy cave-nest. Dino proudly shows the child where he sleeps alone each night. The cave is soft, warm, comforting, and child-friendly.',
        'spread',
      ),
      pageType: 'story_page',
      assetKind: 'spread',
      storyPageRange: [15, 16],
      textPlacement: {
        x: 520,
        y: 220,
        width: 1960,
        bodyTop: 520,
        bodyHeight: 980,
        align: 'center',
      },
    },
    {
      id: 'spread-17-18',
      fileName: 'spread-17-18.png',
      pageNumber: 10,
      title: 'Cerca, aunque no se vean',
      text: 'Muy cerquita, en otra cueva, se adivinaban las sombras suaves de los papás de Dino. {{child_name}} entendió que dormir solo no era estar lejos: el cariño seguía ahí, acompañándolo incluso en la oscuridad.',
      summary: 'Cuevas cercanas y sombra de los papás dinos.',
      prompt: buildPrompt(
        'Illustrate Dino showing the child that his parents sleep nearby in another cave. The nearby cave should show only soft silhouettes or shadows of the parent dinosaurs. The scene should communicate closeness, reassurance, and nighttime safety.',
        'spread',
      ),
      pageType: 'story_page',
      assetKind: 'spread',
      storyPageRange: [17, 18],
      textPlacement: {
        x: 340,
        y: 180,
        width: 1880,
        bodyTop: 520,
        bodyHeight: 980,
        align: 'center',
      },
    },
    {
      id: 'spread-19-20',
      fileName: 'spread-19-20.png',
      pageNumber: 11,
      title: 'Una noche más valiente',
      text: 'Cuando volvió a su cama, {{child_name}} abrazó a su pequeño Dino de peluche y se quedó dormido en paz. La noche seguía siendo noche, pero ahora también podía sentirse cálida, tranquila y valiente.',
      summary: 'Valen dormido abrazando su peluche con calma.',
      prompt: buildPrompt(
        'Illustrate the child peacefully asleep back in his bed, hugging his small green dinosaur plush. The room feels calm, warm, and safe, with a sense that he is a little braver now.',
        'spread',
      ),
      pageType: 'ending',
      assetKind: 'spread',
      storyPageRange: [19, 20],
      textPlacement: {
        x: 1140,
        y: 200,
        width: 1320,
        bodyTop: 520,
        bodyHeight: 1120,
        align: 'left',
      },
    },
  ],
};

export function isValentinDinoStoryId(storyId: string | null | undefined) {
  return storyId === VALENTIN_DINO_STORY_ID;
}

export function getValentinDinoPreviewScenes() {
  const previewSceneIds = new Set(VALENTIN_DINO_BOOK.previewSceneIds);
  return VALENTIN_DINO_BOOK.scenes.filter((scene) => previewSceneIds.has(scene.id));
}

export function getValentinDinoSceneById(sceneId: BookSceneDefinition['id']) {
  return VALENTIN_DINO_BOOK.scenes.find((scene) => scene.id === sceneId) ?? null;
}

export function getValentinDinoSceneAssetUrl(sceneId: BookSceneDefinition['id']) {
  const scene = getValentinDinoSceneById(sceneId);
  if (!scene) return null;
  return `/stories/valentin-noche-dinosaurios/${scene.fileName}`;
}

export function getValentinDinoPersonalizedTitle(childName: string) {
  const safeName = childName.trim() || 'Valentín';
  return `${safeName} y la noche de los dinosaurios`;
}

export function getValentinDinoSceneText(scene: Pick<BookSceneDefinition, 'text'>, childName: string) {
  return replaceChildNameToken(scene.text, childName);
}
