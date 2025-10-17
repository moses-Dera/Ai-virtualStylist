import React, { useState, useRef, useCallback, useEffect } from 'react';
import { ProductCategory } from '../types';
import { CloseIcon } from './icons/CloseIcon';
import { UploadCloudIcon } from './icons/UploadCloudIcon';

interface UploadClothingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File, category: ProductCategory, name: string) => void;
}

const UPLOAD_CATEGORIES: ProductCategory[] = ['Tops', 'Bottoms', 'Outerwear'];

const UploadClothingModal: React.FC<UploadClothingModalProps> = ({ isOpen, onClose, onUpload }) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | null>(null);
  const [itemName, setItemName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = useCallback(() => {
    setFile(null);
    setPreview(null);
    setSelectedCategory(null);
    setItemName('');
    setError(null);
  }, []);

  const handleClose = () => {
    resetState();
    onClose();
  };
  
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    };
    if (isOpen) {
        document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleClose]);


  const handleFileChange = (selectedFile: File | null) => {
    setError(null);
    if (selectedFile) {
        if (!selectedFile.type.startsWith('image/')) {
            setError('Please select an image file (e.g., JPG, PNG, WEBP).');
            return;
        }
        if (selectedFile.size > 5 * 1024 * 1024) { // 5 MB limit
            setError('Image size should be less than 5MB.');
            return;
        }
        setFile(selectedFile);
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreview(reader.result as string);
        };
        reader.readAsDataURL(selectedFile);
        setItemName(selectedFile.name.split('.').slice(0, -1).join('.'));
    }
  };
  
  const handleDragEvents = (e: React.DragEvent<HTMLDivElement>, isEntering: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(isEntering);
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    handleDragEvents(e, false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
      e.dataTransfer.clearData();
    }
  };

  const handleUploadClick = () => {
    if (!file) {
      setError("Please select an image file first.");
      return;
    }
    if (!itemName.trim()) {
        setError("Please enter a name for your item.");
        return;
    }
    if (!selectedCategory) {
      setError("Please select a category for your item.");
      return;
    }
    onUpload(file, selectedCategory, itemName);
    handleClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="p-6 border-b flex justify-between items-center flex-shrink-0">
          <h2 className="text-xl font-bold text-gray-800">Upload Your Clothing</h2>
          <button onClick={handleClose} className="p-1 rounded-full hover:bg-gray-200">
            <CloseIcon className="w-6 h-6 text-gray-600" />
          </button>
        </header>

        <main className="p-6 overflow-y-auto">
          {!preview ? (
            <div 
              onDragEnter={(e) => handleDragEvents(e, true)}
              onDragLeave={(e) => handleDragEvents(e, false)}
              onDragOver={(e) => handleDragEvents(e, true)}
              onDrop={handleDrop}
              className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors ${isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 bg-gray-50 hover:border-indigo-400'}`}
              onClick={() => fileInputRef.current?.click()}
            >
              <UploadCloudIcon className="w-12 h-12 text-gray-400 mb-3" />
              <p className="font-semibold text-gray-700">Drag & drop your image here</p>
              <p className="text-sm text-gray-500 mt-1">or click to browse</p>
              <p className="text-xs text-gray-400 mt-4">PNG, JPG, WEBP up to 5MB</p>
            </div>
          ) : (
            <div className="space-y-6">
                <div className="flex justify-center">
                    <img src={preview} alt="Preview" className="max-h-52 rounded-lg object-contain bg-gray-100" />
                </div>
                 <div>
                  <label htmlFor="itemName" className="block text-sm font-medium text-gray-700">Item Name</label>
                  <input type="text" id="itemName" value={itemName} onChange={(e) => setItemName(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                </div>
                <div>
                    <h3 className="block text-sm font-medium text-gray-700 mb-2">Select a Category</h3>
                    <div className="grid grid-cols-3 gap-3">
                        {UPLOAD_CATEGORIES.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-4 py-3 text-sm font-semibold rounded-md border-2 transition-all ${selectedCategory === cat ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-800 border-gray-200 hover:border-indigo-400 hover:bg-indigo-50'}`}
                            >{cat}</button>
                        ))}
                    </div>
                </div>
            </div>
          )}
          <input type="file" ref={fileInputRef} onChange={e => handleFileChange(e.target.files ? e.target.files[0] : null)} accept="image/*" className="hidden" />
          {error && <p className="text-red-500 text-sm mt-4 text-center">{error}</p>}
        </main>
        
        <footer className="p-6 bg-gray-50 rounded-b-xl flex justify-end gap-4 flex-shrink-0">
            <button onClick={handleClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
              Cancel
            </button>
            <button 
              onClick={handleUploadClick} 
              disabled={!file || !itemName || !selectedCategory}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed"
            >
              Add to Closet
            </button>
        </footer>
      </div>
    </div>
  );
};

export default UploadClothingModal;