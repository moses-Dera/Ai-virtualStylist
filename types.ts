import { User as SupabaseUser } from '@supabase/supabase-js';

export type ProductCategory = 'Tops' | 'Bottoms' | 'Outerwear';

export interface Product {
  id: number;
  name: string;
  category: ProductCategory;
  price: number;
  imageUrl: string;
  styleKeywords: string[];
  isCustom?: boolean;
}

// Represents the data structure in the 'profiles' table in Supabase
// And is used for forms
export interface UserProfile {
  name?: string | null;
  height?: number | null;
  weight?: number | null;
  chest?: number | null;
  waist?: number | null;
  hips?: number | null;
  userImage?: string | null;
  closet?: Product[];
}

// Represents the combined user object used throughout the application
export interface AppUser {
  id: string; // from Supabase auth
  email?: string; // from Supabase auth
  name?: string | null;
  height?: number | null;
  weight?: number | null;
  chest?: number | null;
  waist?: number | null;
  hips?: number | null;
  user_image_url?: string | null;
  closet: Product[];
}


export interface Outfit {
  top: Product | null;
  bottom: Product | null;
  outerwear: Product | null;
}

export interface ChatMessage {
  sender: 'user' | 'bot' | 'system';
  text: string;
}