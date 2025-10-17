import React, { useState, useEffect, useMemo } from 'react';
import { Product, ProductCategory } from '../types';
import { CloseIcon } from './icons/CloseIcon';
import { CATEGORIES } from '../constants';

interface BrowseCardProps {
  product: Product;
  onAddItem: (product: Product) => void;
  added: boolean;
}

const BrowseCard: React.FC<BrowseCardProps> = ({ product, onAddItem, added }) => {
  return (
    <div className="group relative bg-gray-50 rounded-lg shadow-sm overflow-hidden">
      <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden xl:aspect-w-7 xl:aspect-h-8">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-contain object-center p-2"
        />
      </div>
      <div className="p-3 text-left">
        <h3 className="text-sm font-semibold text-gray-800 truncate">{product.name}</h3>
        <p className="mt-1 text-lg font-medium text-gray-900">${product.price.toFixed(2)}</p>
      </div>
      <div className="p-3 pt-0">
        <button
          onClick={() => onAddItem(product)}
          disabled={added}
          className="w-full bg-indigo-600 text-white text-sm font-semibold py-2 rounded-md hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-green-600 disabled:cursor-not-allowed"
        >
          {added ? 'Added to Closet' : 'Add to Closet'}
        </button>
      </div>
    </div>
  );
};


interface BrowseStoresModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddItem: (product: Product) => void;
  allProducts: Product[];
  isLoading: boolean;
}

const BrowseStoresModal: React.FC<BrowseStoresModalProps> = ({ isOpen, onClose, onAddItem, allProducts, isLoading }) => {
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'All'>('All');
  const [addedProductIds, setAddedProductIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!isOpen) {
        // Reset category when modal is closed
        setTimeout(() => setSelectedCategory('All'), 300);
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
        document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleAddItem = (product: Product) => {
    onAddItem(product);
    setAddedProductIds(prev => new Set(prev).add(product.id));
  };
  
  const filteredProducts = useMemo(() => {
    return selectedCategory === 'All' 
        ? allProducts
        : allProducts.filter(p => p.category === selectedCategory);
  }, [allProducts, selectedCategory]);
  

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-4xl flex flex-col h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="p-4 sm:p-6 border-b flex justify-between items-center flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Browse Partner Stores</h2>
            <p className="text-sm text-gray-500 mt-1">Found something you like? Add it to your closet instantly.</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200">
            <CloseIcon className="w-6 h-6 text-gray-600" />
          </button>
        </header>

        <nav className="p-4 border-b flex-shrink-0">
            <div className="flex flex-wrap items-center gap-2">
                <button
                onClick={() => setSelectedCategory('All')}
                className={`px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 ${
                    selectedCategory === 'All' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                >
                All
                </button>
                {CATEGORIES.map(category => (
                <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 ${
                    selectedCategory === category ? 'bg-indigo-600 text-white shadow-sm' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                >
                    {category}
                </button>
                ))}
            </div>
        </nav>

        <main className="p-4 sm:p-6 overflow-y-auto bg-gray-50 flex-grow">
            {isLoading && filteredProducts.length === 0 ? (
                <p className="text-center text-gray-500">Loading products...</p>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {filteredProducts.map(product => (
                        <BrowseCard 
                            key={product.id}
                            product={product}
                            onAddItem={handleAddItem}
                            added={addedProductIds.has(product.id)}
                        />
                    ))}
                </div>
            )}
        </main>
        
        <footer className="p-4 bg-white rounded-b-xl flex justify-end gap-4 flex-shrink-0 border-t">
            <button onClick={onClose} className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700">
              Done
            </button>
        </footer>
      </div>
    </div>
  );
};

export default BrowseStoresModal;
