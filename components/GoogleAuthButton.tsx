import React from 'react';
import * as authService from '../services/authService';

interface GoogleAuthButtonProps {
    onAuthError: (message: string) => void;
}

const GoogleAuthButton: React.FC<GoogleAuthButtonProps> = ({ onAuthError }) => {
    
    const handleGoogleLogin = async () => {
        const { error } = await authService.loginWithGoogle();
        if (error) {
            onAuthError(error.message);
            console.error("Google Auth Error:", error);
        }
        // On success, Supabase handles the redirect.
    };
    
    return (
        <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
        >
            <span className="sr-only">Sign in with Google</span>
            <svg className="w-5 h-5" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                <path fill="currentColor" d="M488 261.8C488 403.3 381.5 512 244 512S0 403.3 0 261.8 106.5 11.8 244 11.8S488 120.3 488 261.8zm-252.3 86.2c-54.1 0-98.1-44-98.1-98.1s44-98.1 98.1-98.1 98.1 44 98.1 98.1-44 98.1-98.1 98.1zm212.4-1.2c-5.6-18.3-15.5-34.9-28.8-49.3-13.4-14.4-29.4-25.3-47.5-33.1v-.2c18-7.8 33.9-18.7 47.3-33.1 13.3-14.4 23.2-31 28.8-49.3H454c-11.4 33.9-29.4 64-53.1 88.7s-52.9 41.5-84.8 48.2v.2c32 6.7 60.9 20.9 84.8 48.2 23.7 24.7 41.7 54.8 53.1 88.7H448.1z"></path>
            </svg>
            <span className="ml-3">Sign in with Google</span>
        </button>
    );
};

export default GoogleAuthButton;
