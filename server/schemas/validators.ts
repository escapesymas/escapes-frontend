/**
 * Zod validation schemas for escapesymas.com backend API
 *
 * Covers: product queries, order creation, auth login, cart recover,
 * Bihr orders, review submission, stock notifications.
 *
 * @module validators
 */

import { z } from 'zod';

// =============================================================================
// SHARED / RE-USEABLE FRAGMENTS
// =============================================================================

/** ISO 3166-1 alpha-2 country code, e.g. "ES", "FR" */
export const CountryCodeSchema = z.string().length(2);

/** Phone: optional +, then 7-15 digits */
export const PhoneSchema = z
  .string()
  .regex(/^\+?[0-9]{7,15}$/, 'Must be 7–15 digits, optionally prefixed with +');

/** Shipping / billing address shared between order schemas */
export const AddressSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  company: z.string().max(200).optional(),
  street: z.string().min(1, 'Street address is required').max(300),
  city: z.string().min(1, 'City is required').max(100),
  postcode: z.string().min(1, 'Postcode is required').max(20),
  countryCode: CountryCodeSchema,
  phone: PhoneSchema,
  email: z.string().email('Invalid email address'),
});

// =============================================================================
// 1. PRODUCT QUERY  —  GET /api/catalog/products
// =============================================================================

export const SortSchema = z.enum(['price_asc', 'price_desc', 'name_asc', 'newest']);

export const ProductQuerySchema = z.object({
  /** Search term — matches name, sku, description, supplier_code, barcode, old_part_number */
  search: z.string().optional(),
  /** Numeric category ID (numeric_id, not slug) */
  category_id: z.string().regex(/^\d+$/, 'category_id must be numeric').optional(),
  /** Category slug fallback when no category_id */
  category_slug: z.string().optional(),
  /** Page number (1-based) */
  page: z.string().regex(/^\d+$/).optional().default('1'),
  /** Results per page, capped at 50 */
  per_page: z.string().regex(/^\d+$/).optional().default('20'),
  /** "true" = universal/universal articles only */
  universal: z.string().optional(),
  /** Brand exact-match filter */
  brand: z.string().optional(),
  /** Minimum price in EUR (converted to cents internally) */
  min_price: z.string().regex(/^\d+$/).optional(),
  /** Maximum price in EUR (converted to cents internally) */
  max_price: z.string().regex(/^\d+$/).optional(),
  /** "true" = only items with stock > 0 */
  in_stock: z.string().optional(),
  /** JSON-encoded attribute filter, e.g. {"Talla":"XL"} */
  attrs: z.string().optional(),
  // Legacy / alternative names accepted but not used in the actual endpoint:
  /** Alias for per_page */
  limit: z.string().regex(/^\d+$/).optional(),
  /** Alias for in_stock */
  stock: z.string().optional(),
  /** Alias for universal */
  universales: z.string().optional(),
  /** Sort order */
  sort: SortSchema.optional(),
  /** Product type filter (not used in current endpoint but accepted) */
  type: z.string().optional(),
});

export type ProductQuery = z.infer<typeof ProductQuerySchema>;

/**
 * Parse and validate product catalog query parameters.
 *
 * @example
 * ```ts
 * // .parse() — throws ZodError on failure
 * const q = parseProductQuery(req.query);
 *
 * // .safeParse() — returns { success, data or error }
 * const result = ProductQuerySchema.safeParse(req.query);
 * if (!result.success) {
 *   return res.status(400).json({ errors: result.error.flatten() });
 * }
 * ```
 */
export function parseProductQuery(raw: unknown): ProductQuery {
  return ProductQuerySchema.parse(raw);
}

// =============================================================================
// 2. ORDER CREATION  —  POST /api/orders/create
// =============================================================================

/** A single line item inside the order cart */
export const OrderCartItemSchema = z.object({
  /** Product database ID (stored as string in cart but parsed to int) */
  id: z.string().min(1, 'Product ID is required'),
  quantity: z.union([z.string(), z.number()]).transform((v) =>
    typeof v === 'string' ? parseInt(v, 10) : v
  ).refine((v) => v > 0 && Number.isInteger(v), {
    message: 'Quantity must be a positive integer',
  }),
  /** Optional price override accepted by the endpoint (in cents) */
  price: z.number().int().positive().optional(),
});

export const OrderCreateSchema = z.object({
  /** User email for guest checkout or existing customer lookup */
  userEmail: z.string().email().optional(),
  /** Cart line items */
  cart: z.array(OrderCartItemSchema).min(1, 'Cart cannot be empty'),
  /** Shipping / delivery address */
  shippingData: AddressSchema,
  /** Stripe payment method ID (e.g. "pm_xxx") */
  paymentMethod: z.string().optional(),
  /** Optional promo / coupon code */
  promoCode: z.string().optional(),
});

export type OrderCreate = z.infer<typeof OrderCreateSchema>;

/**
 * Parse and validate order creation payload.
 *
 * @example
 * ```ts
 * const data = parseOrderCreate(req.body);
 * // data.cart is already transformed: quantity is integer, id is string
 * ```
 */
export function parseOrderCreate(raw: unknown): OrderCreate {
  return OrderCreateSchema.parse(raw);
}

// =============================================================================
// 3. AUTH LOGIN  —  POST /api/auth?action=login
// =============================================================================

export const LoginSchema = z.object({
  /** Email or username (the endpoint accepts either) */
  username: z.string().min(1, 'Email or username is required'),
  password: z.string().min(1, 'Password is required'),
  /** Present when doing a social login (Skips password verification) */
  provider: z.string().optional(),
  /** OAuth token for social login */
  token: z.string().optional(),
});

export type Login = z.infer<typeof LoginSchema>;

/**
 * Parse and validate login payload.
 *
 * @example
 * ```ts
 * const { username, password, provider, token } = parseLogin(req.body);
 * ```
 */
export function parseLogin(raw: unknown): Login {
  return LoginSchema.parse(raw);
}

// =============================================================================
// 4. CART RECOVER  —  POST /api/cart/recover/:token
// =============================================================================

/** UUID-formatted recovery token extracted from URL params by the endpoint */
export const CartRecoverSchema = z.object({
  /** UUID token — the endpoint validates via regex, not the body */
  token: z.string().regex(/^[0-9a-f-]{36}$/i, 'Invalid recovery token format'),
});

export type CartRecover = z.infer<typeof CartRecoverSchema>;

/**
 * Parse cart recovery token (normally extracted from URL params, not body).
 *
 * @example
 * ```ts
 * const { token } = parseCartRecover({ token: req.params.token });
 * ```
 */
export function parseCartRecover(raw: unknown): CartRecover {
  return CartRecoverSchema.parse(raw);
}

// =============================================================================
// 5. BIHR ORDER  —  POST /api/bihr/order
// =============================================================================

/** Line item for Bihr orders — uses productCode (Bihr SKU), not internal id */
export const BihrOrderItemSchema = z.object({
  productCode: z.string().min(1, 'productCode is required'),
  quantity: z.number().int().positive('Quantity must be a positive integer'),
});

export const BihrOrderSchema = z.object({
  items: z.array(BihrOrderItemSchema).min(1, 'At least one item is required'),
  /** Delivery address (same shape as OrderCreate.shippingData) */
  deliveryAddress: AddressSchema,
  /** Customer's own order reference number */
  customerOrderReference: z.string().min(1, 'customerOrderReference is required'),
  /** Whether this is a dropshipment directly to the end customer */
  isDropshipping: z.boolean().default(false),
});

export type BihrOrder = z.infer<typeof BihrOrderSchema>;

/**
 * Parse and validate Bihr order payload.
 *
 * @example
 * ```ts
 * const data = parseBihrOrder(req.body);
 * const result = await createBihrOrder({
 *   deliveryAddress: data.deliveryAddress,
 *   items: data.items,
 *   customerOrderReference: data.customerOrderReference,
 *   isDropshipping: data.isDropshipping,
 * });
 * ```
 */
export function parseBihrOrder(raw: unknown): BihrOrder {
  return BihrOrderSchema.parse(raw);
}

// =============================================================================
// 6. REVIEW SUBMISSION  —  POST /api/reviews
// =============================================================================

export const ReviewSubmitSchema = z.object({
  /** Product database ID (the endpoint uses product_id, stored as string) */
  product_id: z.union([z.string(), z.number()]).transform((v) =>
    typeof v === 'string' ? parseInt(v, 10) : v
  ).refine((v) => v > 0, { message: 'Invalid product_id' }),
  /** Rating 1–5 */
  rating: z.union([z.string(), z.number()]).transform((v) =>
    typeof v === 'string' ? parseInt(v, 10) : v
  ).refine((v) => v >= 1 && v <= 5 && Number.isInteger(v), {
    message: 'Rating must be an integer between 1 and 5',
  }),
  /** Optional review title */
  title: z.string().max(200).optional(),
  /** Optional review body */
  content: z.string().max(2000).optional(),
});

export type ReviewSubmit = z.infer<typeof ReviewSubmitSchema>;

/**
 * Parse and validate review submission payload.
 *
 * @example
 * ```ts
 * const { product_id, rating, title, content } = parseReviewSubmit(req.body);
 * // product_id and rating are already coerced to integers
 * ```
 */
export function parseReviewSubmit(raw: unknown): ReviewSubmit {
  return ReviewSubmitSchema.parse(raw);
}

// =============================================================================
// 7. STOCK NOTIFICATION  —  POST /api/stock-notify
// =============================================================================

export const StockNotifySchema = z.object({
  /** Email to notify when product is back in stock */
  email: z.string().email('Invalid email address'),
  /** Internal product database ID (the endpoint uses productId, stored as string) */
  productId: z.union([z.string(), z.number()]).transform((v) =>
    typeof v === 'string' ? parseInt(v, 10) : v
  ).refine((v) => v > 0, { message: 'Invalid productId' }),
});

export type StockNotify = z.infer<typeof StockNotifySchema>;

/**
 * Parse and validate stock notification payload.
 *
 * @example
 * ```ts
 * const { email, productId } = parseStockNotify(req.body);
 * ```
 */
export function parseStockNotify(raw: unknown): StockNotify {
  return StockNotifySchema.parse(raw);
}

// =============================================================================
// UTILITIES
// =============================================================================

/**
 * Wraps Zod safeParse and returns a typed result or throws a descriptive error.
 * Use this in Express handlers to get typed data without try/catch around .parse().
 *
 * @example
 * ```ts
 * // Instead of:
 * // try { const q = ProductQuerySchema.parse(req.query); } catch(e) { ... }
 * // Use:
 * const q = safeParse(ProductQuerySchema, req.query);
 * // q is ProductQuery | ZodError
 * ```
 */
export function safeParse<S extends z.ZodTypeAny>(
  schema: S,
  data: unknown
): { success: true; data: z.infer<S> } | { success: false; error: z.ZodError } {
  return schema.safeParse(data) as any;
}
