import React from 'react';
import { SparklesIcon } from './icons/SparklesIcon';

interface HeaderProps {
  onAssistantClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
  onAssistantClick,
}) => {
  return (
    <header className="bg-white shadow-md sticky top-0 z-40">
      <div className="max-w-screen-2xl mx-auto px-4 lg:px-6 py-3 flex justify-between items-center">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800 tracking-tight">
          AI Virtual<span className="text-indigo-600">Stylist</span>
        </h1>
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={onAssistantClick}
            className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors p-2 rounded-lg hover:bg-gray-100"
            aria-label="AI Fashion Assistant"
          >
            <SparklesIcon className="w-5 h-5" />
            <span className="hidden sm:inline">AI Assistant</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;