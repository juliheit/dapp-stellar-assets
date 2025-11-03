// src/components/WalletConnect.jsx

'use client';

import { useState, useEffect } from 'react';

export default function WalletConnect({ onConnect }) {
  const [publicKey, setPublicKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [checkingFreighter, setCheckingFreighter] = useState(true);

  /**
   * useEffect: Detectar Freighter con reintentos
   */
  useEffect(() => {
    let attempts = 0;
    const maxAttempts = 10;
    
    const checkFreighter = async () => {
      if (window.freighter) {
        setCheckingFreighter(false);
        
        // Intentar conexión automática
        try {
          const key = await window.freighter.getPublicKey();
          if (key) {
            setPublicKey(key);
            onConnect(key);
          }
        } catch (err) {
          console.log('Freighter disponible pero no conectado');
        }
        return;
      }
      
      attempts++;
      if (attempts < maxAttempts) {
        setTimeout(checkFreighter, 300);
      } else {
        setCheckingFreighter(false);
      }
    };
    
    checkFreighter();
  }, [onConnect]);

  const connectWallet = async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (!window.freighter) {
        throw new Error('Freighter Wallet no está instalada');
      }
      
      const key = await window.freighter.getPublicKey();
      
      if (!key) {
        throw new Error('No se pudo obtener la public key');
      }
      
      setPublicKey(key);
      onConnect(key);
      
    } catch (err) {
      setError(err.message);
      console.error('Error connecting wallet:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(publicKey);
    alert('Public key copiada al portapapeles!');
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md border border-gray-200">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">
        🔗 Conectar Wallet
      </h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 rounded">
          <p className="text-red-700 text-sm">❌ {error}</p>
        </div>
      )}
      
      {!publicKey ? (
        <div>
          <button
            onClick={connectWallet}
            disabled={loading || checkingFreighter}
            className="w-full px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg 
                       hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed
                       transition-colors"
          >
            {checkingFreighter ? '🔍 Detectando Freighter...' : 
             loading ? '⏳ Conectando...' : 
             '🔗 Conectar Freighter'}
          </button>
          
          <p className="text-sm text-gray-500 mt-3 text-center">
            ¿No tienes Freighter?{' '}
            <a 
              href="https://www.freighter.app" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              Descárgala aquí
            </a>
          </p>
        </div>
      ) : (
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <p className="text-green-800 font-bold mb-2">
            ✅ Wallet Conectada
          </p>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-mono break-all">
                {formatAddress(publicKey)}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Public Key: {publicKey}
              </p>
            </div>
            <button
              onClick={copyToClipboard}
              className="ml-2 px-3 py-1 text-xs text-blue-600 hover:bg-blue-100 rounded"
              title="Copiar public key"
            >
              📋 Copiar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}