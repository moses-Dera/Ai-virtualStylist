import React, { useState, useCallback, useEffect } from 'react';
import { Product, UserProfile, Outfit, ProductCategory } from './types';
import { CATEGORIES } from './constants';
import Header from './components/Header';
import ProductGrid from './components/ProductGrid';
import VirtualTryOn from './components/VirtualTryOn';
import FashionAssistant from './components/FashionAssistant';
import UserProfileModal from './components/UserProfileModal';
import ProductDetailModal from './components/ProductDetailModal';
import UploadClothingModal from './components/UploadClothingModal';
import BrowseStoresModal from './components/BrowseStoresModal';
import { fetchProducts } from './services/productService';
import { generateTryOnImage } from './services/geminiService';

const App: React.FC = () => {
  const [userProfile, setUserProfile] = useState<UserProfile>({
    height: 175,
    weight: 70,
    chest: 98,
    waist: 82,
    hips: 96,
    userImage: null,
  });
  
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [outfit, setOutfit] = useState<Outfit>({
    top: null,
    bottom: null,
    outerwear: null,
  });
  
  const [tryOnResultImage, setTryOnResultImage] = useState<string | null>(null);
  const [isGeneratingTryOn, setIsGeneratingTryOn] = useState<boolean>(false);

  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'All' | 'My Closet'>('All');
  const [isProfileModalOpen, setProfileModalOpen] = useState<boolean>(false);
  const [isAssistantOpen, setAssistantOpen] = useState<boolean>(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isUploadModalOpen, setUploadModalOpen] = useState<boolean>(false);
  const [isBrowseStoresModalOpen, setBrowseStoresModalOpen] = useState<boolean>(false);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const fetchedProducts = await fetchProducts();
        setProducts(fetchedProducts);
      } catch (err) {
        setError("Failed to load products. Please try again later.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    loadProducts();
  }, []);
  
  const handleAddCustomProduct = useCallback((file: File, category: ProductCategory, name: string) => {
    const reader = new FileReader();
    reader.onloadend = () => {
        const newProduct: Product = {
            id: Date.now() * -1, // Negative timestamp for unique ID
            name: name || `My ${category}`,
            category,
            price: 0,
            imageUrl: reader.result as string,
            styleKeywords: ['custom', 'user-upload'],
            isCustom: true,
        };
        setProducts(prev => [newProduct, ...prev]);
        setUploadModalOpen(false);
        setSelectedCategory('My Closet');
    };
    reader.onerror = () => {
      alert("Sorry, there was an error reading that file.");
    }
    reader.readAsDataURL(file);
  }, []);

  const handleAddItemFromStore = useCallback((product: Product) => {
    // Create a copy so we don't mutate the original product in the main list
    const newItem: Product = {
      ...product,
      id: product.id + Math.random() * 1000, // Make ID unique to avoid key conflicts
      isCustom: true,
      styleKeywords: [...product.styleKeywords, 'imported'],
    };
    setProducts(prev => [newItem, ...prev]);
    // Optional: a little toast notification could be nice here in a real app
  }, []);


  const handleTryOn = useCallback(async (product: Product) => {
    if (!userProfile.userImage) {
        alert("Please upload a photo in 'My Profile' before trying on clothes.");
        setProfileModalOpen(true);
        return;
    }
    
    setIsGeneratingTryOn(true);
    try {
        // The base image for generation is the previous result, or the original user photo
        const baseImage = tryOnResultImage || userProfile.userImage;
        const base64Image = baseImage.split(',')[1]; // Remove data URL prefix

        const newImage = await generateTryOnImage(base64Image, product);
        
        setTryOnResultImage(newImage);
        
        // Update the outfit state to reflect the added item
        setOutfit(prevOutfit => ({
            ...prevOutfit,
            [product.category.toLowerCase()]: product,
        }));
    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
        alert(`Error: ${errorMessage}`);
    } finally {
        setIsGeneratingTryOn(false);
    }
  }, [userProfile.userImage, tryOnResultImage]);

  const handleClearOutfit = useCallback(() => {
    setOutfit({ top: null, bottom: null, outerwear: null });
    setTryOnResultImage(null);
  }, []);

  const filteredProducts = selectedCategory === 'All'
    ? products.filter(p => !p.isCustom)
    : selectedCategory === 'My Closet'
    ? products.filter(p => p.isCustom)
    : products.filter(p => p.category === selectedCategory && !p.isCustom);

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      <Header
        onProfileClick={() => setProfileModalOpen(true)}
        onAssistantClick={() => setAssistantOpen(true)}
      />
      <main className="flex flex-col lg:flex-row p-4 lg:p-6 gap-6 max-w-screen-2xl mx-auto">
        {/* Product Grid - Main content */}
        <div className="w-full lg:w-3/5 xl:w-2/3 order-2 lg:order-1">
          <ProductGrid
            products={filteredProducts}
            categories={[...CATEGORIES, 'My Closet']}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            onTryOn={handleTryOn}
            onViewDetails={setSelectedProduct}
            isLoading={isLoading}
            error={error}
            onOpenUploadModal={() => setUploadModalOpen(true)}
            onOpenBrowseStoresModal={() => setBrowseStoresModalOpen(true)}
          />
        </div>
        {/* Virtual Try-On - Sidebar */}
        <div className="w-full lg:w-2/5 xl:w-1/3 order-1 lg:order-2 lg:sticky lg:top-24 h-[500px] lg:h-auto">
          <VirtualTryOn 
            outfit={outfit} 
            userImage={userProfile.userImage} 
            onClearOutfit={handleClearOutfit}
            isGenerating={isGeneratingTryOn}
            generatedImage={tryOnResultImage}
          />
        </div>
      </main>

      {isProfileModalOpen && (
        <UserProfileModal
          profile={userProfile}
          onSave={setUserProfile}
          onClose={() => setProfileModalOpen(false)}
        />
      )}

      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          userProfile={userProfile}
          onClose={() => setSelectedProduct(null)}
          onTryOn={handleTryOn}
        />
      )}

      {isUploadModalOpen && (
        <UploadClothingModal 
            isOpen={isUploadModalOpen}
            onClose={() => setUploadModalOpen(false)}
            onUpload={handleAddCustomProduct}
        />
      )}
      
      {isBrowseStoresModalOpen && (
        <BrowseStoresModal 
            isOpen={isBrowseStoresModalOpen}
            onClose={() => setBrowseStoresModalOpen(false)}
            onAddItem={handleAddItemFromStore}
            allProducts={products.filter(p => !p.isCustom)} // Pass only non-custom products
            isLoading={isLoading}
        />
      )}

      <FashionAssistant
        isOpen={isAssistantOpen}
        onClose={() => setAssistantOpen(false)}
        userProfile={userProfile}
        products={products}
      />
    </div>
  );
};

export default App;