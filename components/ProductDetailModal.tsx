import React, { useState, useEffect } from 'react';
import { Product, UserProfile } from '../types';
import { getFitAnalysis } from '../services/geminiService';
import { CloseIcon } from './icons/CloseIcon';
import { SparklesIcon } from './icons/SparklesIcon';

interface ProductDetailModalProps {
  product: Product;
  userProfile?: UserProfile;
  onClose: () => void;
  onTryOn: (product: Product) => void;
}

const ProductDetailModal: React.FC<ProductDetailModalProps> = ({ product, userProfile, onClose, onTryOn }) => {
  const [fitResult, setFitResult] = useState<{ size: string; analysis: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);

    const fetchAnalysis = async () => {
      if (!userProfile) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      const result = await getFitAnalysis(product, userProfile);
      setFitResult(result);
      setIsLoading(false);
    };

    fetchAnalysis();
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product, userProfile, onClose]);

  const handleTryOnClick = () => {
    onTryOn(product);
    onClose();
  };

  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
        onClose();
    }
  }
  
  const renderFitAnalysis = () => {
    if (!userProfile) {
      return <p className="text-sm text-indigo-700">Upload your photo and set measurements for a personalized AI size recommendation.</p>;
    }
     if (isLoading) {
        return (
          <div className="space-y-2 animate-pulse">
            <div className="h-4 bg-indigo-200 rounded w-1/3"></div>
            <div className="h-6 bg-indigo-200 rounded w-3/4"></div>
          </div>
        );
      }
      if (fitResult && fitResult.size !== 'N/A') {
          return (
              <div>
                <p className="text-sm text-indigo-700">
                  Recommended Size: <span className="font-bold text-lg">{fitResult.size}</span>
                </p>
                <p className="text-sm text-indigo-700 mt-1">{fitResult.analysis}</p>
              </div>
          );
      }
      return <p className="text-sm text-yellow-800 bg-yellow-100 p-3 rounded-md">AI analysis is unavailable. Please refer to our standard size chart.</p>;
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl flex flex-col md:flex-row overflow-hidden">
        <div className="w-full md:w-1/2 bg-gray-100 flex items-center justify-center p-6">
          <img src={product.imageUrl} alt={product.name} className="max-h-[400px] object-contain" />
        </div>
        <div className="w-full md:w-1/2 p-6 flex flex-col">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{product.name}</h2>
              <p className="text-gray-500">{product.category}</p>
            </div>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200">
              <CloseIcon className="w-6 h-6 text-gray-600" />
            </button>
          </div>
          
          <p className="text-3xl font-light text-gray-800 mb-6">${product.price.toFixed(2)}</p>

          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <SparklesIcon className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-indigo-800">AI Fit & Size Recommendation</h3>
            </div>
            {renderFitAnalysis()}
          </div>

          <div className="mt-auto">
            <button
              onClick={handleTryOnClick}
              className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-700 transition-colors text-lg"
            >
              Try On Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailModal;