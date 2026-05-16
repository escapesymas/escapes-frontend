export interface Product {
  id: number;
  title: string;
  slug?: string; // Added: official product slug for SEO URLs
  price: number;
  regularPrice: number; // Added: Original price before discount
  sku: string; // Added: Product reference
  image: string;
  images: { src: string; alt: string }[]; // All product images
  inStock: boolean;
  category: string;
  categorySlug?: string; // Added: URL safe category name
  categoryId?: number; // For related products query
  permalink?: string;
  attributes: { name: string; options: string[] }[]; // New field for dynamic filters
  description?: string;
  shortDescription?: string;
  brand?: string; // Added for Schema.org
  averageRating?: number; // Added for SEO stars
  ratingCount?: number; // Added for SEO stars
}

export interface CartItem extends Product {
  quantity: number;
}

export interface BikeSelection {
  id?: number; // DB ID
  brand: string;
  model: string;
  year: string;
}

export interface TireSelection {
  width: string;
  profile: string;
  rim: string;
}

export interface BikeDataStructure {
  brands: string[];
  models: Record<string, string[]>;
  years: string[];
}

// User & Auth
export interface User {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  token?: string; // JWT Token
  avatarUrl?: string;
  garage?: BikeSelection[];
  billing?: {
    address_1: string;
    city: string;
    postcode: string;
    phone: string;
  }
}

// WooCommerce specific types (subset)
export interface WooProduct {
  id: number;
  name: string;
  slug: string; // Added for SEO URLs
  price: string;
  regular_price: string;
  sku: string; // Added
  stock_status: string;
  categories: { id: number; name: string; slug: string }[];
  images: { id: number; src: string; alt: string }[];
  attributes: { id: number; name: string; options: string[] }[];
  permalink: string;
  description: string;
  short_description: string;
  average_rating: string;
  rating_count: number;
}

export interface WooCategory {
  id: number;
  name: string;
  slug: string; // Added for URL matching
  parent: number;
  description: string;
  image: { src: string } | null;
  count: number;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  parent: number;
  description: string;
  image: string;
  count: number;
  children?: Category[];
}

// Order History Types
export interface Order {
  id: number;
  status: string;
  date_created: string;
  total: string;
  line_items: Array<{
    id: number;
    name: string;
    quantity: number;
    total: string;
  }>;
}

// Order Creation Types
export interface OrderPayload {
  payment_method: string;
  payment_method_title: string;
  set_paid: boolean;
  customer_id?: number; // Added for logged in users
  billing: {
    first_name: string;
    last_name: string;
    address_1: string;
    city: string;
    postcode: string;
    country: string;
    email: string;
    phone: string;
  };
  shipping: {
    first_name: string;
    last_name: string;
    address_1: string;
    city: string;
    postcode: string;
    country: string;
  };
  line_items: Array<{
    product_id: number;
    quantity: number;
  }>;
}

// --- FORUM TYPES ---
export interface ForumCategory {
  id: string;
  title: string;
  description: string;
  icon: any; // Lucide Icon
  topicCount: number;
}

export interface UserRank {
  level: number;
  title: string;
  xp: number;
  xpToNext: number;
  discount: number; // Percentage (0-10)
  color: string;
  icon: string; // Emoji or icon name
}

export interface ForumTopic {
  id: number;
  categoryId: string;
  title: string;
  author: string;
  authorId: number; // For permissions
  authorAvatar: string;
  authorRank?: UserRank; // User's rank/level
  date: string;
  views: number;
  replies: number;
  likes: number; // Total likes count
  likedBy: number[]; // Array of user IDs who liked
  isPinned?: boolean;
  tags?: string[];
  content?: string;
}

export interface ForumReply {
  id: number;
  topicId: number;
  author: string;
  authorId: number; // For permissions
  authorAvatar: string;
  authorRole?: string; // e.g., 'Admin', 'Moderator', 'Pro Racer'
  authorRank?: UserRank; // User's rank/level
  content: string;
  date: string;
  likes: number; // Total likes count
  likedBy: number[]; // Array of user IDs who liked
}

// --- GLOBAL DECLARATIONS ---
declare global {
  interface Window {
    gtag: (command: string, ...args: any[]) => void;
    dataLayer: any[];
  }
}
