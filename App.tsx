import React, { useState, useEffect, useCallback } from 'react';
import { Product, Outfit, AppUser, UserProfile, ProductCategory } from './types';
import * as authService from './services/authService';
import * as productService from './services/productService';
import * as geminiService from './services/geminiService';
import { isSupabaseConfigured, supabase } from './supabaseClient';

// Import Components
import Header from './components/Header';
import ProductGrid from './components/ProductGrid';
import VirtualTryOn from './components/VirtualTryOn';
import LoginModal from './components/LoginModal';
import SignUpModal from './components/SignUpModal';
import UserProfileModal from './components/UserProfileModal';
import ProductDetailModal from './components/ProductDetailModal';
import FashionAssistant from './components/FashionAssistant';
import UploadClothingModal from './components/UploadClothingModal';
import BrowseStoresModal from './components/BrowseStoresModal';
import SupabaseConfigModal from './components/SupabaseConfigModal';

const App: React.FC = () => {
    // --- CONFIG CHECK ---
    if (!isSupabaseConfigured) {
        return <SupabaseConfigModal />;
    }
    
    // --- STATE MANAGEMENT ---

    // Auth & User
    const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
    const [isAuthLoading, setIsAuthLoading] = useState(true);

    // Products & Closet
    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const [closetProducts, setClosetProducts] = useState<Product[]>([]);
    const [isLoadingProducts, setIsLoadingProducts] = useState(true);
    const [productError, setProductError] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'All' | 'My Closet'>('All');

    // Virtual Try-On
    const [currentOutfit, setCurrentOutfit] = useState<Outfit>({});
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    // Modal Visibility
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [isSignUpModalOpen, setIsSignUpModalOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [isAssistantOpen, setIsAssistantOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isBrowseStoresModalOpen, setIsBrowseStoresModalOpen] = useState(false);
    
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

    // --- DATA FETCHING & AUTH ---

    useEffect(() => {
        const fetchAllProducts = async () => {
            setIsLoadingProducts(true);
            try {
                const products = await productService.fetchProducts();
                setAllProducts(products);
            } catch (error) {
                setProductError('Could not fetch products. Please try again later.');
            } finally {
                setIsLoadingProducts(false);
            }
        };
        fetchAllProducts();
    }, []);

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            setIsAuthLoading(true);
            if (session?.user) {
                try {
                    const profile = await authService.getUserProfile(session.user);
                    setCurrentUser(profile);
                    setClosetProducts(profile.closet || []);
                } catch (error) {
                    console.error("Error fetching user profile:", error);
                    setCurrentUser(null);
                }
            } else {
                setCurrentUser(null);
                setClosetProducts([]);
            }
            setIsAuthLoading(false);
        });

        // Initial check
        const checkInitialSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
             if (session?.user) {
                try {
                    const profile = await authService.getUserProfile(session.user);
                    setCurrentUser(profile);
                    setClosetProducts(profile.closet || []);
                } catch (error) {
                    console.error("Error fetching initial user profile:", error);
                    setCurrentUser(null);
                }
            }
            setIsAuthLoading(false);
        };
        checkInitialSession();

        return () => subscription.unsubscribe();
    }, []);

    // --- EVENT HANDLERS ---

    const handleTryOn = useCallback(async (product: Product) => {
        if (!currentUser?.user_image_url) {
            alert("Please set a profile picture in 'My Profile' before using the try-on feature.");
            setIsProfileModalOpen(true);
            return;
        }

        const newOutfit: Outfit = { ...currentOutfit, [product.category.toLowerCase()]: product };
        setCurrentOutfit(newOutfit);
        setGeneratedImage(null);
        setIsGenerating(true);

        try {
            const clothingImage = product.imageUrl;
            const userImage = currentUser.user_image_url;
            
            const base64ClothingImage = await toBase64(clothingImage);
            const base64UserImage = await toBase64(userImage);

            if(!base64ClothingImage || !base64UserImage) {
                 throw new Error("Could not convert images for AI processing.");
            }

            const resultImage = await geminiService.generateTryOnImage(base64UserImage, base64ClothingImage);
            setGeneratedImage(resultImage);

        } catch (error) {
            console.error("Error generating try-on image:", error);
            alert("Sorry, the virtual try-on failed. Please try again.");
        } finally {
            setIsGenerating(false);
        }
    }, [currentUser, currentOutfit]);

    const toBase64 = (url: string) =>
        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Failed to fetch image: ${response.statusText}`);
                }
                return response.blob();
            })
            .then(blob => new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            }));

    const handleSaveProfile = async (profileData: UserProfile) => {
        if (!currentUser) return;
        try {
            const updatedUser = await authService.updateUserProfile(currentUser.id, profileData);
            setCurrentUser(updatedUser);
        } catch (error) {
            console.error("Failed to update profile", error);
        }
    };
    
    const handleLogout = () => {
        authService.logout();
        setCurrentUser(null);
        setClosetProducts([]);
        setCurrentOutfit({});
        setGeneratedImage(null);
    };

    const handleAddItemToCloset = async (product: Product) => {
        if (!currentUser) return;
        // Avoid duplicates
        if (closetProducts.some(p => p.id === product.id)) return;
        const newCloset = [...closetProducts, product];
        setClosetProducts(newCloset);
        await authService.updateUserProfile(currentUser.id, { closet: newCloset });
    };

    const handleUploadClothing = async (file: File, category: ProductCategory, name: string) => {
       const reader = new FileReader();
       reader.onloadend = async () => {
           const newProduct: Product = {
               id: Date.now(), // Simulate a unique ID
               name: name,
               price: 0, // Not applicable for user uploads
               imageUrl: reader.result as string,
               category: category,
               styleKeywords: [category.toLowerCase()],
           };
           await handleAddItemToCloset(newProduct);
       };
       reader.readAsDataURL(file);
    };

    const displayedProducts = selectedCategory === 'My Closet' ? closetProducts : 
                              selectedCategory === 'All' ? allProducts :
                              allProducts.filter(p => p.category === selectedCategory);
    
    const allCategories = ['Tops', 'Bottoms', 'Outerwear'] as ProductCategory[];

    if (isAuthLoading) {
        return <div className="h-screen w-screen flex items-center justify-center bg-gray-100"><p>Loading Stylist...</p></div>;
    }

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col">
            <Header
                currentUser={currentUser}
                onProfileClick={() => setIsProfileModalOpen(true)}
                onAssistantClick={() => setIsAssistantOpen(true)}
                onLoginClick={() => setIsLoginModalOpen(true)}
                onSignUpClick={() => setIsSignUpModalOpen(true)}
                onLogoutClick={handleLogout}
            />
            <main className="flex-grow container mx-auto p-4 lg:p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                    <div className="lg:col-span-1 lg:sticky lg:top-20">
                        <VirtualTryOn
                           outfit={currentOutfit}
                           userImage={currentUser?.user_image_url || null}
                           onClearOutfit={() => { setCurrentOutfit({}); setGeneratedImage(null); }}
                           isGenerating={isGenerating}
                           generatedImage={generatedImage}
                           isLoggedIn={!!currentUser}
                        />
                    </div>
                    <div className="lg:col-span-2">
                        <ProductGrid
                            products={displayedProducts}
                            categories={currentUser ? ['My Closet', ...allCategories] : allCategories}
                            selectedCategory={selectedCategory}
                            onSelectCategory={setSelectedCategory}
                            onTryOn={handleTryOn}
                            onViewDetails={(p) => { setSelectedProduct(p); setIsDetailModalOpen(true); }}
                            isLoading={isLoadingProducts}
                            error={productError}
                            onOpenUploadModal={() => setIsUploadModalOpen(true)}
                            onOpenBrowseStoresModal={() => setIsBrowseStoresModalOpen(true)}
                            isLoggedIn={!!currentUser}
                        />
                    </div>
                </div>
            </main>

            {/* --- MODALS --- */}
            {isLoginModalOpen && (
                <LoginModal
                    isOpen={isLoginModalOpen}
                    onClose={() => setIsLoginModalOpen(false)}
                    onLoginSuccess={() => setIsLoginModalOpen(false)}
                    onSwitchToSignUp={() => { setIsLoginModalOpen(false); setIsSignUpModalOpen(true); }}
                />
            )}
            {isSignUpModalOpen && (
                <SignUpModal
                    isOpen={isSignUpModalOpen}
                    onClose={() => setIsSignUpModalOpen(false)}
                    onSignUpSuccess={() => { /* User confirms via email */ }}
                    onSwitchToLogin={() => { setIsSignUpModalOpen(false); setIsLoginModalOpen(true); }}
                />
            )}
            {isProfileModalOpen && currentUser && (
                <UserProfileModal
                    profile={{...currentUser, userImage: currentUser.user_image_url}}
                    onSave={handleSaveProfile}
                    onClose={() => setIsProfileModalOpen(false)}
                />
            )}
            {isDetailModalOpen && selectedProduct && (
                 <ProductDetailModal
                    product={selectedProduct}
                    userProfile={currentUser || undefined}
                    onClose={() => setIsDetailModalOpen(false)}
                    onTryOn={handleTryOn}
                 />
            )}
            {isAssistantOpen && (
                <FashionAssistant 
                    isOpen={isAssistantOpen}
                    onClose={() => setIsAssistantOpen(false)}
                    userProfile={currentUser || undefined}
                    products={allProducts}
                    isLoggedIn={!!currentUser}
                />
            )}
            {isUploadModalOpen && (
                <UploadClothingModal 
                    isOpen={isUploadModalOpen}
                    onClose={() => setIsUploadModalOpen(false)}
                    onUpload={handleUploadClothing}
                />
            )}
             {isBrowseStoresModalOpen && (
                <BrowseStoresModal 
                    isOpen={isBrowseStoresModalOpen}
                    onClose={() => setIsBrowseStoresModalOpen(false)}
                    onAddItem={handleAddItemToCloset}
                    allProducts={allProducts}
                    isLoading={isLoadingProducts}
                    isLoggedIn={!!currentUser}
                />
            )}
        </div>
    );
};

export default App;