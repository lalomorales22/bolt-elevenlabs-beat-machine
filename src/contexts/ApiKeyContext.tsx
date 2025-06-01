import React, { createContext, useContext, useState, useEffect } from 'react';

interface ApiKeyContextProps {
  apiKey: string | null;
  setApiKey: (key: string) => void;
  isKeyConfigured: boolean;
}

const ApiKeyContext = createContext<ApiKeyContextProps | undefined>(undefined);

export const useApiKey = () => {
  const context = useContext(ApiKeyContext);
  if (context === undefined) {
    throw new Error('useApiKey must be used within an ApiKeyProvider');
  }
  return context;
};

export const ApiKeyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [apiKey, setApiKeyState] = useState<string | null>(null);
  const [isKeyConfigured, setIsKeyConfigured] = useState<boolean>(false);

  useEffect(() => {
    // Load API key from localStorage if available
    const savedKey = localStorage.getItem('elevenlabs_api_key');
    if (savedKey) {
      setApiKeyState(savedKey);
      setIsKeyConfigured(true);
    }
  }, []);

  const setApiKey = (key: string) => {
    localStorage.setItem('elevenlabs_api_key', key);
    setApiKeyState(key);
    setIsKeyConfigured(true);
  };

  return (
    <ApiKeyContext.Provider value={{
      apiKey,
      setApiKey,
      isKeyConfigured
    }}>
      {children}
    </ApiKeyContext.Provider>
  );
};