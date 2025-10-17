import React from 'react';
import { Product, ProductCategory } from '../types';
import ProductCard from './ProductCard';
import { UploadCloudIcon } from './icons/UploadCloudIcon';
import { ShoppingBagIcon } from './icons/ShoppingBagIcon';

interface ProductGridProps {
  products: Product[];
  categories: (ProductCategory | 'My Closet')[];
  selectedCategory: ProductCategory | 'All' | 'My Closet';
  onSelectCategory: (category: ProductCategory | 'All' | 'My Closet') => void;
  onTryOn: (product: Product) => void;
  onViewDetails: (product: Product) => void;
  isLoading: boolean;
  error: string | null;
  onOpenUploadModal: () => void;
  onOpenBrowseStoresModal: () => void;
}

const ProductCardSkeleton: React.FC = () => (
  <div className="bg-white rounded-lg shadow-sm overflow-hidden animate-pulse">
    <div className="aspect-w-1 aspect-h-1 bg-gray-200"></div>
    <div className="p-3">
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
      <div className="h-6 bg-gray-200 rounded w-1/2"></div>
    </div>
    <div className="p-3 pt-0">
      <div className="h-9 bg-gray-200 rounded-md w-full"></div>
    </div>
  </div>
);

const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  categories,
  selectedCategory,
  onSelectCategory,
  onTryOn,
  onViewDetails,
  isLoading,
  error,
  onOpenUploadModal,
  onOpenBrowseStoresModal,
}) => {
  const renderContent = () => {
    if (isLoading && products.length === 0) {
      return Array.from({ length: 8 }).map((_, index) => <ProductCardSkeleton key={index} />);
    }

    if (error) {
      return (
        <div className="col-span-full text-center py-16 px-4 bg-red-50 rounded-lg">
          <h3 className="text-xl font-semibold text-red-700">Oops! Something went wrong.</h3>
          <p className="text-red-600 mt-2">{error}</p>
        </div>
      );
    }

    if (products.length === 0 && !isLoading) {
        const message = selectedCategory === 'My Closet'
        ? "Your closet is empty. Upload your own clothes or browse stores to add items!"
        : "No products found in this category.";
      return (
        <div className="col-span-full text-center py-16 px-4">
          <h3 className="text-xl font-semibold text-gray-700">No Products Found</h3>
          <p className="text-gray-500 mt-2">{message}</p>
        </div>
      );
    }

    return products.map(product => (
      <ProductCard
        key={product.id}
        product={product}
        onTryOn={onTryOn}
        onViewDetails={onViewDetails}
      />
    ));
  };

  return (
    <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg">
      <div className="mb-6 flex flex-wrap justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-1">Explore Collection</h2>
          <p className="text-gray-500">Select an item to see details or try it on instantly.</p>
        </div>
        <div className="flex items-center gap-2 mt-4 sm:mt-0">
          <button
            onClick={onOpenBrowseStoresModal}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-indigo-600 border border-indigo-300 rounded-full hover:bg-indigo-50 transition-colors"
          >
            <ShoppingBagIcon className="w-5 h-5" />
            Browse Stores
          </button>
          <button
            onClick={onOpenUploadModal}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-indigo-600 border border-indigo-300 rounded-full hover:bg-indigo-50 transition-colors"
          >
            <UploadCloudIcon className="w-5 h-5" />
            Upload
          </button>
        </div>
      </div>
      
      <div className="flex flex-wrap items-center gap-2 mb-6 border-b border-gray-200 pb-4">
        <button
          onClick={() => onSelectCategory('All')}
          className={`px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 ${
            selectedCategory === 'All'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          All
        </button>
        {categories.map(category => (
          <button
            key={category}
            onClick={() => onSelectCategory(category)}
            className={`px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 ${
              selectedCategory === category
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {category}
          </button>
        ))}
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {renderContent()}
      </div>
    </div>
  );
};

export default ProductGrid;