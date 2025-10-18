import React, { useState, useEffect } from 'react';
import { CloseIcon } from './icons/CloseIcon';
import * as authService from '../services/authService';
import GoogleAuthButton from './GoogleAuthButton';

interface SignUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignUpSuccess: () => void;
  onSwitchToLogin: () => void;
}

const SignUpModal: React.FC<SignUpModalProps> = ({ isOpen, onClose, onSignUpSuccess, onSwitchToLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      setIsSuccess(false); // Reset on open
      setError(null);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);
  
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSuccess(false);

    if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
    }
    if (password.length < 6) {
        setError('Password must be at least 6 characters long.');
        return;
    }

    setIsLoading(true);
    const { error } = await authService.signUp(email, password);
    if (error) {
        setError(error.message);
    } else {
        setIsSuccess(true);
    }
    setIsLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-sm flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="p-6 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">Create Your Account</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200">
            <CloseIcon className="w-6 h-6 text-gray-600" />
          </button>
        </header>

        <main className="p-6">
            {isSuccess ? (
                <div className="text-center">
                    <h3 className="text-lg font-semibold text-green-700">Success!</h3>
                    <p className="mt-2 text-sm text-gray-600">Please check your email <strong className="text-gray-800">{email}</strong> for a confirmation link to complete your registration.</p>
                    <button 
                        onClick={onClose}
                        className="mt-6 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                        Close
                    </button>
                </div>
            ) : (
                <>
                    <div className="w-full flex justify-center mb-4">
                        <GoogleAuthButton
                            onAuthError={(msg) => setError(msg)}
                        />
                    </div>
                    <div className="relative my-4">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-300" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white text-gray-500">OR</span>
                        </div>
                    </div>
                    <form onSubmit={handleSignUp} className="space-y-4">
                        <div>
                        <label htmlFor="signup-email" className="block text-sm font-medium text-gray-700">Email Address</label>
                        <input 
                            type="email" 
                            id="signup-email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" 
                        />
                        </div>
                        <div>
                        <label htmlFor="signup-password" className="block text-sm font-medium text-gray-700">Password</label>
                        <input 
                            type="password" 
                            id="signup-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" 
                        />
                        </div>
                        <div>
                        <label htmlFor="signup-confirm-password" className="block text-sm font-medium text-gray-700">Confirm Password</label>
                        <input 
                            type="password" 
                            id="signup-confirm-password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" 
                        />
                        </div>
                        {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md text-center">{error}</p>}
                        <div>
                        <button 
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
                        >
                            {isLoading ? 'Creating Account...' : 'Sign Up with Email'}
                        </button>
                        </div>
                    </form>
                    <p className="mt-6 text-center text-sm text-gray-500">
                        Already have an account?{' '}
                        <button onClick={onSwitchToLogin} className="font-medium text-indigo-600 hover:text-indigo-500">
                        Log in
                        </button>
                    </p>
                </>
            )}
        </main>
      </div>
    </div>
  );
};

export default SignUpModal;