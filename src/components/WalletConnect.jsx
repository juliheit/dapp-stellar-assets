// src/components/WalletConnect.jsx

'use client';

import { useState, useEffect } from 'react';

export default function WalletConnect({ onConnect }) {
  const [publicKey, setPublicKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [freighterReady, setFreighterReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    let checkCount = 0;
    
    const waitForFreighter = () => {
      checkCount++;
      
      if (window.freighter) {
        if (mounted) {
          console.log('✅ Freighter detectado!');
          setFreighterReady(true);
        }
        return;
      }
      
      if (checkCount < 20) {
        console.log(`Intento ${checkCount}/20: Buscando Freighter...`);
        setTimeout(waitForFreighter, 500);
      } else {
        console.log('❌ Freighter no encontrado después de 10 segundos');
        if (mounted) {
          setFreighterReady(false);
        }
      }
    };
    
    // Iniciar detección
    waitForFreighter();
    
    return () => {
      mounted = false;
    };
  }, []);

  const connectWallet = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Intentando conectar...');
      console.log('window.freighter:', window.freighter);
      
      if (!window.freighter) {
        throw new Error('Freighter Wallet no está instalada');
      }
      
      console.log('Llamando a getPublicKey...');
      const key = await window.freighter.getPublicKey();
      console.log('Public key obtenida:', key);
      
      if (!key) {
        throw new Error('No se pudo obtener la public key');
      }
      
      setPublicKey(key);
      onConnect(key);
      
    } catch (err) {
      console.error('Error completo:', err);
      setError(err.message);
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
      
      {!freighterReady && (
        <div className="mb-4 p-3 bg-yellow-100 border border-yellow-400 rounded">
          <p className="text-yellow-800 text-sm">
            🔍 Buscando Freighter... Si este mensaje persiste, asegúrate de que Freighter esté instalado y habilitado.
          </p>
        </div>
      )}
      
      {!publicKey ? (
        <div>
          <button
            onClick={connectWallet}
            disabled={loading}
            className="w-full px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg 
                       hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed
                       transition-colors"
          >
            {loading ? '⏳ Conectando...' : '🔗 Conectar Freighter'}
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
      
      {/* Debug info */}
      <div className="mt-4 p-2 bg-gray-50 rounded text-xs text-gray-600">
        Debug: Freighter {freighterReady ? '✅ Detectado' : '❌ No detectado'}
      </div>
    </div>
  );
}