import React, { useState } from 'react';
import { KeyIcon } from './icons/KeyIcon';
import { ClipboardIcon } from './icons/ClipboardIcon';

const ConfigInstruction: React.FC<{ varName: string }> = ({ varName }) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(varName);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center justify-between bg-gray-200 p-3 rounded-lg">
      <code className="text-sm text-gray-800 font-mono">{varName}</code>
      <button onClick={copyToClipboard} className="text-gray-500 hover:text-indigo-600 focus:outline-none">
        {copied ? (
          <span className="text-sm text-indigo-600 font-semibold">Copied!</span>
        ) : (
          <ClipboardIcon className="w-5 h-5" />
        )}
      </button>
    </div>
  );
};

const SupabaseConfigModal: React.FC = () => {
  return (
    <div className="h-screen w-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-2xl p-8 border border-gray-200">
        <div className="flex flex-col items-center text-center">
            <div className="p-4 bg-red-100 rounded-full mb-4">
                <KeyIcon className="w-10 h-10 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Supabase Configuration Missing</h1>
            <p className="mt-2 text-gray-600 max-w-lg">
                Your application can't connect to the backend because the Supabase credentials are not set. To fix this, you need to add your Supabase URL and Anon Key as environment variables.
            </p>
        </div>

        <div className="mt-8 space-y-6">
            <div>
                <h2 className="font-semibold text-gray-700 mb-2">Step 1: Find your Supabase Keys</h2>
                <p className="text-sm text-gray-600">
                    Log in to your <a href="https://supabase.com/" target="_blank" rel="noopener noreferrer" className="text-indigo-600 font-medium hover:underline">Supabase account</a>, navigate to your project, and find your API keys in <span className="font-mono bg-gray-200 px-1.5 py-0.5 rounded">Project Settings &gt; API</span>.
                </p>
            </div>
            
            <div>
                 <h2 className="font-semibold text-gray-700 mb-3">Step 2: Set the Environment Variables</h2>
                 <p className="text-sm text-gray-600 mb-3">
                    In your development environment, create a <code className="font-mono bg-gray-200 px-1.5 py-0.5 rounded">.env</code> file (or use your platform's secret manager) and add the following variables:
                 </p>
                 <div className="space-y-3">
                    <ConfigInstruction varName="REACT_APP_SUPABASE_URL" />
                    <ConfigInstruction varName="REACT_APP_SUPABASE_ANON_KEY" />
                 </div>
            </div>

            <div className="text-center mt-8 pt-6 border-t">
                <p className="text-gray-500">
                    After setting the variables, <span className="font-semibold">restart your application's server</span> for the changes to take effect.
                </p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default SupabaseConfigModal;
