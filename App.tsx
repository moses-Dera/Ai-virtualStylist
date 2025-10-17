import React, { useState, useCallback, useEffect } from 'react';
import { Product, UserProfile, Outfit, ProductCategory } from './types';
import { CATEGORIES } from './constants';
import Header from './components/Header';
import ProductGrid from './components/ProductGrid';
import VirtualTryOn from './components/VirtualTryOn';
import FashionAssistant from './components/FashionAssistant';
import UserProfileModal from './components/UserProfileModal';
import ProductDetailModal from './components/ProductDetailModal';
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

  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'All'>('All');
  const [isProfileModalOpen, setProfileModalOpen] = useState<boolean>(false);
  const [isAssistantOpen, setAssistantOpen] = useState<boolean>(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

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
    ? products
    : products.filter(p => p.category === selectedCategory);

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
            categories={CATEGORIES}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            onTryOn={handleTryOn}
            onViewDetails={setSelectedProduct}
            isLoading={isLoading}
            error={error}
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
