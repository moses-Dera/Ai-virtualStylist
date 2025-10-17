import React from 'react';

export type ProductCategory = 'Tops' | 'Bottoms' | 'Outerwear';

export interface Product {
  id: number;
  name: string;
  category: ProductCategory;
  price: number;
  imageUrl: string; // Used for both display and try-on generation
  styleKeywords: string[];
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

// Add a declaration for the 'model-viewer' custom element
declare global {
    namespace JSX {
        interface IntrinsicElements {
            'model-viewer': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
                src?: string;
                alt?: string;
                'camera-controls'?: boolean;
                'auto-rotate'?: boolean;
            };
        }
    }
}
