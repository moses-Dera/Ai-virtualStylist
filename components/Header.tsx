import React, { useState, useRef, useEffect } from 'react';
import { AppUser } from '../types';
import { UserIcon } from './icons/UserIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { LogoutIcon } from './icons/LogoutIcon';

interface HeaderProps {
  currentUser: AppUser | null;
  onProfileClick: () => void;
  onAssistantClick: () => void;
  onLoginClick: () => void;
  onSignUpClick: () => void;
  onLogoutClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
  currentUser,
  onProfileClick, 
  onAssistantClick,
  onLoginClick,
  onSignUpClick,
  onLogoutClick,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const getInitials = (email?: string, name?: string | null) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    if (email) {
      return email.charAt(0).toUpperCase();
    }
    return '?';
  }

  const renderUserActions = () => {
    if (currentUser) {
      const displayName = currentUser.name || currentUser.email;
      return (
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="w-9 h-9 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            {currentUser.user_image_url ? (
              <img src={currentUser.user_image_url} alt="User" className="w-full h-full object-cover rounded-full" />
            ) : (
              getInitials(currentUser.email, currentUser.name)
            )}
          </button>
          {isMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg py-1 z-50 ring-1 ring-black ring-opacity-5">
              <div className="px-4 py-2 text-sm text-gray-700 border-b">
                Signed in as<br/>
                <strong className="truncate block" title={displayName}>{displayName}</strong>
              </div>
              <button
                onClick={() => { onProfileClick(); setIsMenuOpen(false); }}
                className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <UserIcon className="w-4 h-4" /> My Profile
              </button>
              <button
                onClick={() => { onLogoutClick(); setIsMenuOpen(false); }}
                className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <LogoutIcon className="w-4 h-4" /> Logout
              </button>
            </div>
          )}
        </div>
      );
    } else {
      return (
        <div className="flex items-center gap-2">
          <button
            onClick={onLoginClick}
            className="text-sm font-medium text-gray-600 hover:text-indigo-600 px-3 py-2 rounded-md"
          >
            Log In
          </button>
          <button
            onClick={onSignUpClick}
            className="text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-2 rounded-md shadow-sm"
          >
            Sign Up
          </button>
        </div>
      );
    }
  }

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
          <div className="h-6 w-px bg-gray-200"></div>
          {renderUserActions()}
        </div>
      </div>
    </header>
  );
};

export default Header;