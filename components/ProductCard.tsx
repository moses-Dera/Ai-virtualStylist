import React from 'react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  onTryOn: (product: Product) => void;
  onViewDetails: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onTryOn, onViewDetails }) => {
  return (
    <div className="group relative bg-gray-50 rounded-lg shadow-sm overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
      <button onClick={() => onViewDetails(product)} className="w-full">
        <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden xl:aspect-w-7 xl:aspect-h-8">
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-contain object-center p-2"
          />
        </div>
        <div className="p-3 text-left">
          <h3 className="text-sm font-semibold text-gray-800">{product.name}</h3>
          <p className="mt-1 text-lg font-medium text-gray-900">${product.price.toFixed(2)}</p>
        </div>
      </button>
      <div className="p-3 pt-0">
        <button
          onClick={() => onTryOn(product)}
          className="w-full bg-indigo-600 text-white text-sm font-semibold py-2 rounded-md hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Try On
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
