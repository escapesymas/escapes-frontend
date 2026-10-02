export interface ProductImage {
  src: string;
  srcMobile?: string;
  srcCardDesktop?: string;
  srcCardMobile?: string;
  alt?: string;
}

export interface CategoryInfo {
  name: string;
  slug: string;
}

export interface ProductCompatibility {
  make?: string;
  model?: string;
  year?: string;
  sku?: string;
  brand?: string;
  cc?: string;
  code?: string;
  [key: string]: unknown;
}

export interface ProductAttribute {
  name?: string;
  value?: string;
  options?: string[];
}

export interface Product {
  /** En una promoción activa (precio DTO2 o descuento temporal). */
  onPromotion?: boolean;
  id: number;
  title: string;
  name: string;
  slug: string;
  price: number;
  regularPrice: number;
  salePrice: number | null;
  sku: string;
  image: string;
  images: ProductImage[];
  inStock: boolean;
  stock: number;
  category: string;
  categorySlug: string;
  categoryId: number;
  category2: string;
  category3: string;
  category2Id: number | null;
  category3Id: number | null;
  category2Name: string;
  category2Slug: string;
  category3Name: string;
  category3Slug: string;
  description: string;
  shortDescription: string;
  status: string;
  compatibility: ProductCompatibility[];
  /** Características visibles para el cliente, ya con etiqueta en español */
  attributes: Record<string, string>;
  parentCategory?: string;
  /** Ruta de categorías raíz → hoja (ficha de producto) */
  categoryPath?: { name: string; slug: string }[];
  parentCategorySlug?: string;
  brand: string;
  barcode: string;
  supplierCode: string;
  supplier_code?: string;
  oldPartNumber: string;   
  weight_g: number | null;
  length_mm: number | null;
  width_mm: number | null;
  height_mm: number | null;
  volume_cm3: number | null;
  dropshipping: boolean;
  ondemand: boolean;
  deliveryPlant: string;
  commodityCode: string;
  averageRating: number;
  ratingCount: number;
  source: string;
  isCompatible?: boolean;
  /** Ejes de esta variante, p. ej. { Talla: 'XL', Color: 'Negro' } */
  variantOptions?: Record<string, string> | null;
  /** Modelo al que pertenece (listados: resumen; ficha: variantes completas) */
  family?: ProductFamily | null;
}

export interface ProductVariant {
  id: number;
  sku: string;
  slug: string;
  name: string;
  price: number;
  salePrice: number | null;
  stock: number;
  inStock: boolean;
  image: string;
  options: Record<string, string>;
}

export interface ProductFamily {
  code: string;
  // Listados
  variantCount?: number;
  priceMin?: number;
  priceMax?: number;
  inStock?: boolean;
  options?: Record<string, string[]>;
  // Ficha de producto
  title?: string;
  axes?: Record<string, string[]>;
  variants?: ProductVariant[];
}

export interface Category3 {
  id: number;
  name: string;
  slug: string;
  parentId: number;
  parentName: string;
  parentSlug: string;
}

export interface ProductsResponse {
  products: Product[];
  total: number;
  totalPages: number;
}

export interface FilterOptions {
  brands: string[];
  price_min: number;
  price_max: number;
  attributes: Record<string, string[]>;
  brand_counts?: { value: string; count: number }[];
  attribute_counts?: Record<string, { value: string; count: number }[]>;
  fuzzy?: boolean;
}

export interface SelectedBike {
  brand: string;
  model: string;
  year: string;
  displayName: string;
}
