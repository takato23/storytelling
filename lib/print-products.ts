export type PrintProductId = "photo_book_21x14_8_hard" | "photo_book_27_9x21_6_hard";

export interface PrintProductDefinition {
  id: PrintProductId;
  title: string;
  shortTitle: string;
  sizeCm: string;
  cover: "hard";
  orientation: "landscape";
  basePages: number;
  baseCostArs: number;
  extraPageCostArs: number;
  recommendedResolution: {
    width: number;
    height: number;
  };
  aspectRatio: string;
  description: string;
  launchTier: "launch" | "premium";
}

export const PRINT_PRODUCTS: Record<PrintProductId, PrintProductDefinition> = {
  photo_book_21x14_8_hard: {
    id: "photo_book_21x14_8_hard",
    title: "Fotolibro 21 x 14,8 cm Tapa Dura",
    shortTitle: "21 x 14,8 cm",
    sizeCm: "21 x 14,8 cm",
    cover: "hard",
    orientation: "landscape",
    basePages: 22,
    baseCostArs: 21500,
    extraPageCostArs: 350,
    recommendedResolution: {
      width: 3000,
      height: 2115,
    },
    aspectRatio: "1.42:1",
    description: "Formato recomendado para lanzamiento. Buen equilibrio entre costo, lectura y calidad.",
    launchTier: "launch",
  },
  photo_book_27_9x21_6_hard: {
    id: "photo_book_27_9x21_6_hard",
    title: "Fotolibro 27,9 x 21,6 cm Tapa Dura",
    shortTitle: "27,9 x 21,6 cm",
    sizeCm: "27,9 x 21,6 cm",
    cover: "hard",
    orientation: "landscape",
    basePages: 22,
    baseCostArs: 30000,
    extraPageCostArs: 650,
    recommendedResolution: {
      width: 3600,
      height: 2785,
    },
    aspectRatio: "1.29:1",
    description: "Versión premium con páginas más grandes para ilustraciones más protagonistas.",
    launchTier: "premium",
  },
};

export const DEFAULT_PRINT_PRODUCT_ID: PrintProductId = "photo_book_21x14_8_hard";
export const STORYTELLING_PRINT_MARGIN_ARS = 8490;
export const GIFT_WRAP_PRICE_ARS = 5990;

export function getPrintProduct(productId: PrintProductId | null | undefined): PrintProductDefinition {
  if (productId && productId in PRINT_PRODUCTS) {
    return PRINT_PRODUCTS[productId];
  }

  return PRINT_PRODUCTS[DEFAULT_PRINT_PRODUCT_ID];
}
