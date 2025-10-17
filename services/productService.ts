import { Product, ProductCategory } from '../types';

// Fake Store API product structure
interface FakeStoreProduct {
    id: number;
    title: string;
    price: number;
    description: string;
    category: string; // "men's clothing", "women's clothing", etc.
    image: string;
}


// --- UTILITY FUNCTIONS ---

// Intelligently assigns a category based on keywords in the product title
const assignCategory = (title: string): ProductCategory => {
  const lowerTitle = title.toLowerCase();
  if (lowerTitle.includes('jacket') || lowerTitle.includes('coat') || lowerTitle.includes('blazer') || lowerTitle.includes('vest')) {
    return 'Outerwear';
  }
  if (lowerTitle.includes('pant') || lowerTitle.includes('jeans') || lowerTitle.includes('trousers') || lowerTitle.includes('shorts') || lowerTitle.includes('skirt')) {
    return 'Bottoms';
  }
  // Default to 'Tops' for shirts, tees, hoodies, sweaters, etc.
  return 'Tops';
};

// Generates simple style keywords from the product title
const assignKeywords = (title: string): string[] => {
  const commonWords = new Set(['a', 'the', 'and', 'for', 'in', 'with', 'new']);
  const keywords = title.toLowerCase().split(' ').filter(word => word.length > 3 && !commonWords.has(word));
  return ['fashion', 'style', ...new Set(keywords)];
};


// --- MAIN EXPORTED FETCHER ---

// Fetches products from the fakestoreapi.com
export const fetchProducts = async (): Promise<Product[]> => {
    console.log("Fetching products from fakestoreapi.com...");
    
    try {
        const response = await fetch('https://fakestoreapi.com/products');
        if (!response.ok) {
            throw new Error('Network response from Fake Store API was not ok');
        }
        const data: FakeStoreProduct[] = await response.json();

        // Filter for clothing categories
        const clothingProducts = data
            .filter(p => p.category === "men's clothing" || p.category === "women's clothing")
            .map((p): Product => {
                return {
                    id: p.id, 
                    name: p.title,
                    price: p.price,
                    imageUrl: p.image,
                    category: assignCategory(p.title),
                    styleKeywords: assignKeywords(p.title),
                };
            });
        
        console.log(`Successfully fetched and filtered ${clothingProducts.length} clothing products.`);
        return clothingProducts;

    } catch (error) {
        console.error(`Failed to fetch from Fake Store API:`, error);
        // In case of an error, return an empty array to prevent the app from crashing.
        return [];
    }
};