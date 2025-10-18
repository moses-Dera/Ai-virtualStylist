import React, { useState, useCallback, useEffect } from 'react';
import { Product, UserProfile, Outfit, ProductCategory, AppUser } from './types';
import { CATEGORIES } from './constants';
import Header from './components/Header';
import ProductGrid from './components/ProductGrid';
import VirtualTryOn from './components/VirtualTryOn';
import FashionAssistant from './components/FashionAssistant';
import UserProfileModal from './components/UserProfileModal';
import ProductDetailModal from './components/ProductDetailModal';
import UploadClothingModal from './components/UploadClothingModal';
import BrowseStoresModal from './components/BrowseStoresModal';
import LoginModal from './components/LoginModal';
import SignUpModal from './components/SignUpModal';
import { fetchProducts } from './services/productService';
import { generateTryOnImage } from './services/geminiService';
import * as authService from './services/authService';
import { supabase } from './supabaseClient';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  
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
  
  // Modal States
  const [isProfileModalOpen, setProfileModalOpen] = useState<boolean>(false);
  const [isAssistantOpen, setAssistantOpen] = useState<boolean>(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isUploadModalOpen, setUploadModalOpen] = useState<boolean>(false);
  const [isBrowseStoresModalOpen, setBrowseStoresModalOpen] = useState<boolean>(false);
  const [isLoginModalOpen, setLoginModalOpen] = useState<boolean>(false);
  const [isSignUpModalOpen, setSignUpModalOpen] = useState<boolean>(false);

  // Initial load and auth listener
  useEffect(() => {
    const loadAppData = async () => {
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
    loadAppData();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const sessionUser = session?.user;
        if (sessionUser) {
          const userProfile = await authService.getUserProfile(sessionUser);
          setCurrentUser(userProfile);
        } else {
          setCurrentUser(null);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);
  
  const handleLogout = async () => {
    await authService.logout();
    setCurrentUser(null);
    setOutfit({ top: null, bottom: null, outerwear: null });
    setTryOnResultImage(null);
    setSelectedCategory('All');
  };
  
  const handleSaveProfile = async (profileData: UserProfile) => {
    if (!currentUser) return;
    try {
      const updatedUser = await authService.updateUserProfile(currentUser.id, profileData);
      setCurrentUser(updatedUser);
      setProfileModalOpen(false);
    } catch(error) {
        console.error("Failed to save profile:", error);
        alert("There was an error saving your profile.");
    }
  };
  
  const handleAddCustomProduct = useCallback(async (file: File, category: ProductCategory, name: string) => {
    if (!currentUser) return;
    
    // This is now handled by Supabase storage, but for simplicity, we keep it client-side for now
    const reader = new FileReader();
    reader.onloadend = async () => {
        const newProduct: Product = {
            id: Date.now() * -1, // Negative ID for custom items
            name: name || `My ${category}`,
            category,
            price: 0,
            imageUrl: reader.result as string,
            styleKeywords: ['custom', 'user-upload'],
            isCustom: true,
        };
        const updatedCloset = [newProduct, ...currentUser.closet];
        
        try {
            const updatedUser = await authService.updateUserProfile(currentUser.id, { closet: updatedCloset });
            setCurrentUser(updatedUser);
            setUploadModalOpen(false);
            setSelectedCategory('My Closet');
        } catch(error) {
            console.error("Error adding to closet:", error);
            alert("Could not add item to your closet.");
        }
    };
    reader.onerror = () => {
      alert("Sorry, there was an error reading that file.");
    }
    reader.readAsDataURL(file);
  }, [currentUser]);

  const handleAddItemFromStore = useCallback(async (product: Product) => {
    if (!currentUser) {
      alert("Please log in to add items to your closet.");
      setLoginModalOpen(true);
      return;
    }
    
    const newItemInCloset: Product = {
      ...product,
      id: product.id + Math.random(),
      isCustom: true,
      styleKeywords: [...product.styleKeywords, 'imported'],
    };
    
    const updatedCloset = [newItemInCloset, ...currentUser.closet];
    
    try {
        const updatedUser = await authService.updateUserProfile(currentUser.id, { closet: updatedCloset });
        setCurrentUser(updatedUser);
    } catch(error) {
        console.error("Error adding item from store:", error);
        alert("Failed to add item to your closet.");
    }

  }, [currentUser]);


  const handleTryOn = useCallback(async (product: Product) => {
    if (!currentUser) {
        alert("Please log in to use the Virtual Try-On.");
        setLoginModalOpen(true);
        return;
    }
    if (!currentUser.user_image_url) {
        alert("Please upload a photo in 'My Profile' before trying on clothes.");
        setProfileModalOpen(true);
        return;
    }
    
    setIsGeneratingTryOn(true);
    try {
        const baseImage = tryOnResultImage || currentUser.user_image_url;
        const base64Image = baseImage.split(',')[1];

        const newImage = await generateTryOnImage(base64Image, product);
        
        setTryOnResultImage(newImage);
        
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
  }, [currentUser, tryOnResultImage]);

  const handleClearOutfit = useCallback(() => {
    setOutfit({ top: null, bottom: null, outerwear: null });
    setTryOnResultImage(null);
  }, []);

  const storeProducts = products.filter(p => !p.isCustom);
  const allAvailableProducts = [...storeProducts, ...(currentUser?.closet ?? [])];

  const filteredProducts = selectedCategory === 'All'
    ? storeProducts
    : selectedCategory === 'My Closet'
    ? currentUser?.closet ?? []
    : storeProducts.filter(p => p.category === selectedCategory);
    
  const categoriesToShow: (ProductCategory | 'My Closet')[] = currentUser ? [...CATEGORIES, 'My Closet'] : [...CATEGORIES];

  const userProfileForModals: UserProfile | undefined = currentUser ? {
      name: currentUser.name,
      height: currentUser.height,
      weight: currentUser.weight,
      chest: currentUser.chest,
      waist: currentUser.waist,
      hips: currentUser.hips,
      userImage: currentUser.user_image_url,
  } : undefined;

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      <Header
        currentUser={currentUser}
        onProfileClick={() => setProfileModalOpen(true)}
        onAssistantClick={() => setAssistantOpen(true)}
        onLoginClick={() => setLoginModalOpen(true)}
        onSignUpClick={() => setSignUpModalOpen(true)}
        onLogoutClick={handleLogout}
      />
      <main className="flex flex-col lg:flex-row p-4 lg:p-6 gap-6 max-w-screen-2xl mx-auto">
        <div className="w-full lg:w-3/5 xl:w-2/3 order-2 lg:order-1">
          <ProductGrid
            products={filteredProducts}
            categories={categoriesToShow}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            onTryOn={handleTryOn}
            onViewDetails={setSelectedProduct}
            isLoading={isLoading}
            error={error}
            onOpenUploadModal={() => setUploadModalOpen(true)}
            onOpenBrowseStoresModal={() => setBrowseStoresModalOpen(true)}
            isLoggedIn={!!currentUser}
          />
        </div>
        <div className="w-full lg:w-2/5 xl:w-1/3 order-1 lg:order-2 lg:sticky lg:top-24 h-[500px] lg:h-auto">
          <VirtualTryOn 
            outfit={outfit} 
            userImage={currentUser?.user_image_url ?? null} 
            onClearOutfit={handleClearOutfit}
            isGenerating={isGeneratingTryOn}
            generatedImage={tryOnResultImage}
            isLoggedIn={!!currentUser}
          />
        </div>
      </main>

      {isProfileModalOpen && currentUser && (
        <UserProfileModal
          profile={userProfileForModals!}
          onSave={handleSaveProfile}
          onClose={() => setProfileModalOpen(false)}
        />
      )}

      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          userProfile={userProfileForModals}
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
            allProducts={storeProducts}
            isLoading={isLoading}
            isLoggedIn={!!currentUser}
        />
      )}

      {isLoginModalOpen && (
        <LoginModal
          isOpen={isLoginModalOpen}
          onClose={() => setLoginModalOpen(false)}
          onLoginSuccess={() => setLoginModalOpen(false)}
          onSwitchToSignUp={() => { setLoginModalOpen(false); setSignUpModalOpen(true); }}
        />
      )}

      {isSignUpModalOpen && (
        <SignUpModal
          isOpen={isSignUpModalOpen}
          onClose={() => setSignUpModalOpen(false)}
          onSignUpSuccess={() => setSignUpModalOpen(false)}
          onSwitchToLogin={() => { setSignUpModalOpen(false); setLoginModalOpen(true); }}
        />
      )}
      
      <FashionAssistant
        isOpen={isAssistantOpen}
        onClose={() => setAssistantOpen(false)}
        userProfile={userProfileForModals}
        products={allAvailableProducts}
        isLoggedIn={!!currentUser}
      />
    </div>
  );
};

export default App;