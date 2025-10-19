// types.ts

export type ProductCategory = 'Tops' | 'Bottoms' | 'Outerwear';

export interface Product {
  id: number;
  name: string;
  price: number;
  imageUrl: string;
  category: ProductCategory;
  styleKeywords: string[];
}

export interface Outfit {
  top?: Product;
  bottom?: Product;
  outerwear?: Product;
}

export interface ChatMessage {
  sender: 'user' | 'bot' | 'system';
  text: string;
}

// Represents the data structure for the user profile form/modal
export interface UserProfile {
    name?: string | null;
    height?: number | null;
    weight?: number | null;
    chest?: number | null;
    waist?: number | null;
    hips?: number | null;
    userImage?: string | null; // For base64 image from form/camera
}
