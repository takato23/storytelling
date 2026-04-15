export type PrintProductId = "photo_book_21x21_soft" | "photo_book_21x21_hard";

export interface PrintProductDefinition {
  id: PrintProductId;
  title: string;
  shortTitle: string;
  sizeCm: string;
  cover: "soft" | "hard";
  orientation: "square";
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
  photo_book_21x21_soft: {
    id: "photo_book_21x21_soft",
    title: "Fotolibro 21 x 21 cm Tapa Blanda",
    shortTitle: "21 x 21 cm",
    sizeCm: "21 x 21 cm",
    cover: "soft",
    orientation: "square",
    basePages: 22,
    baseCostArs: 18500,
    extraPageCostArs: 300,
    recommendedResolution: {
      width: 3000,
      height: 3000,
    },
    aspectRatio: "1:1",
    description: "Formato único de lanzamiento. La opción más accesible dentro del libro físico 21 x 21 cm.",
    launchTier: "launch",
  },
  photo_book_21x21_hard: {
    id: "photo_book_21x21_hard",
    title: "Fotolibro 21 x 21 cm Tapa Dura",
    shortTitle: "21 x 21 cm",
    sizeCm: "21 x 21 cm",
    cover: "hard",
    orientation: "square",
    basePages: 22,
    baseCostArs: 23500,
    extraPageCostArs: 380,
    recommendedResolution: {
      width: 3000,
      height: 3000,
    },
    aspectRatio: "1:1",
    description: "Mismo formato 21 x 21 cm con una terminación más firme y premium.",
    launchTier: "premium",
  },
};

export const DEFAULT_PRINT_PRODUCT_ID: PrintProductId = "photo_book_21x21_hard";
export const STORYTELLING_PRINT_MARGIN_ARS = 8490;
export const GIFT_WRAP_PRICE_ARS = 5990;

export function getPrintProduct(productId: PrintProductId | null | undefined): PrintProductDefinition {
  if (productId && productId in PRINT_PRODUCTS) {
    return PRINT_PRODUCTS[productId];
  }

  return PRINT_PRODUCTS[DEFAULT_PRINT_PRODUCT_ID];
}
