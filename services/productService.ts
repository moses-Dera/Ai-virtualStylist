import { Product, ProductCategory } from '../types';

// --- TYPE DEFINITIONS for APIs ---

// Platzi Fake Store API product structure
interface PlatziApiProduct {
  id: number;
  title: string;
  price: number;
  description: string;
  images: string[];
  category: {
    id: number;
    name: string;
    image: string;
  };
}

// fakestoreapi.com product structure
interface FakeStoreApiProduct {
    id: number;
    title: string;
    price: number;
    description: string;
    category: string;
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


// --- INDIVIDUAL API FETCHERS ---

// Fetches from Platzi Fake Store API
const fetchProductsFromPlatzi = async (): Promise<Product[]> => {
  const response = await fetch('https://api.escuelajs.co/api/v1/products?offset=0&limit=50');
  if (!response.ok) {
    throw new Error('Network response from Platzi API was not ok');
  }
  const data: PlatziApiProduct[] = await response.json();

  return data
    .filter(p => p.category.name === 'Clothes' && p.images.length > 0 && p.images[0].startsWith('https://'))
    .map((p): Product => {
        const category = assignCategory(p.title);
        return {
            id: p.id,
            name: p.title,
            price: p.price,
            imageUrl: p.images[0],
            category: category,
            styleKeywords: assignKeywords(p.title),
        };
    });
};

// Fetches from fakestoreapi.com
const fetchProductsFromFakeStore = async (): Promise<Product[]> => {
    const response = await fetch('https://fakestoreapi.com/products');
    if (!response.ok) {
        throw new Error('Network response from FakeStoreAPI was not ok');
    }
    const data: FakeStoreApiProduct[] = await response.json();

    const clothingCategories = ["men's clothing", "women's clothing"];
    return data
        .filter(p => clothingCategories.includes(p.category) && p.image)
        .map((p): Product => {
            const category = assignCategory(p.title);
            return {
                // Add a prefix to avoid ID collisions with the other API
                id: p.id + 1000, 
                name: p.title,
                price: p.price,
                imageUrl: p.image,
                category: category,
                styleKeywords: assignKeywords(p.title),
            };
        });
}


// --- MAIN EXPORTED FETCHER ---

// Fetches from all sources and merges the results
export const fetchProducts = async (): Promise<Product[]> => {
    console.log("Fetching products from multiple APIs...");
    
    // Fetch from all sources in parallel and wait for them all to complete
    const results = await Promise.allSettled([
        fetchProductsFromPlatzi(),
        fetchProductsFromFakeStore(),
    ]);

    const allProducts: Product[] = [];

    // Process the results, adding successful fetches to our product list
    results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
            allProducts.push(...result.value);
        } else {
            // Log any errors from APIs that failed
            const apiName = index === 0 ? 'Platzi API' : 'FakeStoreAPI';
            console.error(`Failed to fetch from ${apiName}:`, result.reason);
        }
    });
    
    console.log(`Successfully fetched a total of ${allProducts.length} products.`);
    return allProducts;
};
