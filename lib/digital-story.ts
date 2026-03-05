interface StoryInput {
  childName: string;
  storyTitle: string;
  readingLevel?: string | null;
  familyMembers?: Array<{ name?: string }>;
}

interface StoryPage {
  pageNumber: number;
  title: string;
  text: string;
  imageUrl?: string | null;
}

function levelDescriptor(level?: string | null) {
  if (level === "basic") return "frases simples y directas";
  if (level === "advanced") return "lenguaje más rico y descriptivo";
  return "equilibrio entre aventura y claridad";
}

export function buildPersonalizedStory(input: StoryInput): StoryPage[] {
  const protagonist = input.childName || "Nuestro héroe";
  const levelHint = levelDescriptor(input.readingLevel);
  const companions =
    (input.familyMembers ?? [])
      .map((member) => member?.name?.trim())
      .filter((value): value is string => Boolean(value))
      .slice(0, 2) || [];

  const companionText =
    companions.length > 0
      ? `Junto a ${companions.join(" y ")}, `
      : "";

  return [
    {
      pageNumber: 1,
      title: "Comienza la aventura",
      text: `${protagonist} abrió el libro de ${input.storyTitle} y encontró una puerta brillante. ${companionText}decidió cruzarla con valentía.`,
    },
    {
      pageNumber: 2,
      title: "El primer desafío",
      text: `Del otro lado apareció un camino misterioso. ${protagonist} recordó que esta historia usa ${levelHint}, así que avanzó con calma y curiosidad.`,
    },
    {
      pageNumber: 3,
      title: "Pista mágica",
      text: `Una brújula dorada marcó el norte. ${protagonist} siguió la señal, resolvió un acertijo y descubrió que su mejor poder era la perseverancia.`,
    },
    {
      pageNumber: 4,
      title: "Gran momento",
      text: `Cuando parecía imposible, ${protagonist} dio un paso más y transformó el miedo en energía. El paisaje cambió y todo empezó a encajar.`,
    },
    {
      pageNumber: 5,
      title: "Final feliz",
      text: `La misión terminó con éxito. ${protagonist} volvió a casa con una sonrisa y una nueva certeza: cada historia puede ser el inicio de un gran sueño.`,
    },
  ];
}

export function storyToPdfLines(pages: StoryPage[]) {
  const lines: string[] = [];
  for (const page of pages) {
    lines.push(`Pagina ${page.pageNumber}: ${page.title}`);
    lines.push(page.text);
    lines.push("");
  }
  return lines;
}
