import React, { useRef } from 'react';
import { Outfit } from '../types';
import { CloseIcon } from './icons/CloseIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { UploadIcon } from './icons/UploadIcon';

interface VirtualTryOnProps {
  outfit: Outfit;
  userImage: string | null;
  onClearOutfit: () => void;
  isGenerating: boolean;
  generatedImage: string | null;
  onImageUpload: (imageDataUrl: string) => void;
}

const WORN_ITEMS_ORDER: (keyof Outfit)[] = ['outerwear', 'top', 'bottom'];

const VirtualTryOn: React.FC<VirtualTryOnProps> = ({ outfit, userImage, onClearOutfit, isGenerating, generatedImage, onImageUpload }) => {
  const wornItems = WORN_ITEMS_ORDER
    .map(category => outfit[category])
    .filter(Boolean);

  const displayImage = generatedImage || userImage;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveImage = () => {
    if (!generatedImage) return;
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `ai-stylist-look-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        onImageUpload(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const renderPlaceholder = () => {
    return (
        <div className="text-center text-gray-500 p-4 flex flex-col items-center">
            <p className="mb-4">Upload a photo for a personalized try-on experience!</p>
            <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors"
            >
               <UploadIcon className="w-5 h-5"/> Upload Your Photo
            </button>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageFileChange}
                accept="image/png, image/jpeg"
                className="hidden"
            />
        </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 flex flex-col h-full lg:max-h-[calc(100vh-7rem)]">
        <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">Virtual Try-On</h2>
        <div className="relative flex-grow w-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg overflow-hidden min-h-[300px] sm:min-h-[400px]">
            {displayImage ? (
                <img src={displayImage} alt="Virtual try on result" className="absolute inset-0 h-full w-full object-contain object-center z-10" />
            ) : (
                renderPlaceholder()
            )}
            
            {isGenerating && (
                 <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm transition-opacity">
                    <SparklesIcon className="w-10 h-10 text-white animate-pulse" />
                    <p className="text-white font-semibold mt-4 text-center">AI is creating your look...</p>
                 </div>
            )}
        </div>
        <div className="mt-4 flex-shrink-0 overflow-y-auto">
            <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-gray-700">Current Outfit:</h3>
                <div className="flex items-center gap-4">
                  {generatedImage && (
                     <button onClick={handleSaveImage} className="flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-800">
                        <DownloadIcon className="w-4 h-4" />
                        Save Look
                    </button>
                  )}
                  {wornItems.length > 0 && (
                      <button onClick={onClearOutfit} className="text-sm font-medium text-red-600 hover:text-red-800">
                          Clear Outfit
                      </button>
                  )}
                </div>
            </div>
            
            {wornItems.length > 0 ? (
                 <div className="space-y-2">
                    {wornItems.map(item => item && (
                         <div key={item.id} className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
                            <div className="flex items-center gap-2">
                                <img src={item.imageUrl} alt={item.name} className="w-10 h-10 object-contain rounded-md bg-white" />
                                <div>
                                    <p className="text-sm font-medium text-gray-800">{item.name}</p>
                                    <p className="text-xs text-gray-500">{item.category}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                 </div>
            ) : (
                <p className="text-sm text-gray-500 text-center py-4">Select an item to try on!</p>
            )}
        </div>
    </div>
  );
};

export default VirtualTryOn;