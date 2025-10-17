import React from 'react';

export type ProductCategory = 'Tops' | 'Bottoms' | 'Outerwear';

export interface Product {
  id: number;
  name: string;
  category: ProductCategory;
  price: number;
  imageUrl: string; // Used for both display and try-on generation
  styleKeywords: string[];
  isCustom?: boolean;
}

export interface UserProfile {
  height: number;
  weight: number;
  chest: number;
  waist: number;
  hips: number;
  userImage: string | null;
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

// FIX: Removed the global JSX.IntrinsicElements declaration that was here.
// It was overriding React's default types for all HTML elements, causing widespread errors.
// The 'model-viewer' custom element it defined was not being used.
