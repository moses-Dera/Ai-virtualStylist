import React, { useState, useEffect, useCallback } from 'react';
import { Product, Outfit, UserProfile, ProductCategory } from './types';
import * as productService from './services/productService';
import * as geminiService from './services/geminiService';
import { isGeminiConfigured } from './services/geminiService';

// Import Components
import Header from './components/Header';
import ProductGrid from './components/ProductGrid';
import VirtualTryOn from './components/VirtualTryOn';
import ProductDetailModal from './components/ProductDetailModal';
import FashionAssistant from './components/FashionAssistant';
import ApiConfigModal from './components/SupabaseConfigModal';

const App: React.FC = () => {
    // --- CONFIG CHECK ---
    if (!isGeminiConfigured) {
        return <ApiConfigModal />;
    }
    
    // --- STATE MANAGEMENT ---
    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const [isLoadingProducts, setIsLoadingProducts] = useState(true);
    const [productError, setProductError] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'All'>('All');

    // Virtual Try-On
    const [currentOutfit, setCurrentOutfit] = useState<Outfit>({});
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    // A placeholder for user image, managed client-side
    const [userImageUrl, setUserImageUrl] = useState<string | null>(null); 
    const [userProfile, setUserProfile] = useState<UserProfile>({});


    // Modal Visibility
    const [isAssistantOpen, setIsAssistantOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

    // --- DATA FETCHING ---

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


    // --- EVENT HANDLERS ---

    const handleTryOn = useCallback(async (product: Product) => {
        if (!userImageUrl) {
            alert("Please set a profile picture before using the try-on feature.");
            // In a real app, you might open a profile settings modal here
            // For now, we'll just log to console.
            console.log("User image not set. Cannot perform try-on.");
            return;
        }

        const newOutfit: Outfit = { ...currentOutfit, [product.category.toLowerCase()]: product };
        setCurrentOutfit(newOutfit);
        setGeneratedImage(null);
        setIsGenerating(true);

        try {
            const clothingImage = product.imageUrl;
            
            const base64ClothingImage = await toBase64(clothingImage);
            const base64UserImage = await toBase64(userImageUrl);

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
    }, [userImageUrl, currentOutfit]);

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

    // Example of how a user image could be set from a file input (conceptual)
    const handleUserImageUpload = (imageDataUrl: string) => {
        setUserImageUrl(imageDataUrl);
        setUserProfile(prev => ({ ...prev, userImage: imageDataUrl }));
    };

    const displayedProducts = selectedCategory === 'All' ? allProducts :
                              allProducts.filter(p => p.category === selectedCategory);
    
    const allCategories = ['Tops', 'Bottoms', 'Outerwear'] as ProductCategory[];


    return (
        <div className="min-h-screen bg-gray-100 flex flex-col">
            <Header
                onAssistantClick={() => setIsAssistantOpen(true)}
            />
            <main className="flex-grow container mx-auto p-4 lg:p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                    <div className="lg:col-span-1 lg:sticky lg:top-20">
                        <VirtualTryOn
                           outfit={currentOutfit}
                           userImage={userImageUrl}
                           onClearOutfit={() => { setCurrentOutfit({}); setGeneratedImage(null); }}
                           isGenerating={isGenerating}
                           generatedImage={generatedImage}
                           onImageUpload={handleUserImageUpload} // Simple way to let user set their image
                        />
                    </div>
                    <div className="lg:col-span-2">
                        <ProductGrid
                            products={displayedProducts}
                            categories={allCategories}
                            selectedCategory={selectedCategory}
                            onSelectCategory={setSelectedCategory}
                            onTryOn={handleTryOn}
                            onViewDetails={(p) => { setSelectedProduct(p); setIsDetailModalOpen(true); }}
                            isLoading={isLoadingProducts}
                            error={productError}
                        />
                    </div>
                </div>
            </main>

            {/* --- MODALS --- */}
            {isDetailModalOpen && selectedProduct && (
                 <ProductDetailModal
                    product={selectedProduct}
                    userProfile={userProfile}
                    onClose={() => setIsDetailModalOpen(false)}
                    onTryOn={handleTryOn}
                 />
            )}
            {isAssistantOpen && (
                <FashionAssistant 
                    isOpen={isAssistantOpen}
                    onClose={() => setIsAssistantOpen(false)}
                    userProfile={userProfile}
                    products={allProducts}
                />
            )}
        </div>
    );
};

export default App;