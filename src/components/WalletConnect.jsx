// src/components/WalletConnect.jsx

'use client'; // Necesario para Next.js App Router (componente del cliente)

import { useState, useEffect } from 'react';

/**
 * Componente WalletConnect
 * 
 * Propósito: Conectar la wallet Freighter del usuario
 * 
 * Props:
 * - onConnect: Función callback que se llama cuando la wallet se conecta
 *   Recibe la public key como argumento
 */
export default function WalletConnect({ onConnect }) {
  // Estado para guardar la public key del usuario
  const [publicKey, setPublicKey] = useState('');
  
  // Estado para mostrar loading
  const [loading, setLoading] = useState(false);
  
  // Estado para mostrar errores
  const [error, setError] = useState(null);

  // Estado para saber si Freighter está instalado
  const [isFreighterInstalled, setIsFreighterInstalled] = useState(false);

  /**
   * useEffect: Se ejecuta cuando el componente se monta
   * Verifica si Freighter está instalado (con delay)
   */
  useEffect(() => {
    const checkFreighter = async () => {
      // Esperar 500ms para que Freighter se inyecte
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (window.freighter) {
        setIsFreighterInstalled(true);
        
        // Intentar conectar automáticamente si ya dio permiso antes
        try {
          const key = await window.freighter.getPublicKey();
          if (key) {
            setPublicKey(key);
            onConnect(key);
          }
        } catch (err) {
          // No hacer nada si no está conectado
          console.log('Freighter instalado pero no conectado');
        }
      }
    };
    
    checkFreighter();
  }, [onConnect]);

  /**
   * Función para conectar la wallet manualmente
   * Se ejecuta cuando el usuario hace click en el botón
   */
  const connectWallet = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Esperar un poco más por si acaso
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Verificar que window.freighter existe (extensión instalada)
      if (!window.freighter) {
        throw new Error(
          'Freighter Wallet no está instalada. Descárgala desde https://freighter.app'
        );
      }
      
      // Solicitar acceso a la public key
      // Esto abre un popup de Freighter pidiendo permiso
      const key = await window.freighter.getPublicKey();
      
      if (!key) {
        throw new Error('No se pudo obtener la public key');
      }
      
      // Guardar public key en el estado
      setPublicKey(key);
      
      // Notificar al componente padre
      onConnect(key);
      
    } catch (err) {
      // Manejar error y mostrarlo al usuario
      setError(err.message);
      console.error('Error connecting wallet:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Función helper para formatear la public key
   * Muestra solo primeros 4 y últimos 4 caracteres
   * Ejemplo: GABC...XYZ9
   */
  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  // 🌟 MEJORA DE ORO #3: Copiar Public Key
  const copyToClipboard = () => {
    navigator.clipboard.writeText(publicKey);
    // Opcional: Mostrar mensaje de confirmación
    alert('Public key copiada al portapapeles!');
  };

  // ========== RENDER DEL COMPONENTE ==========
  
  return (
    <div className="p-6 bg-white rounded-lg shadow-md border border-gray-200">
      {/* Título */}
      <h2 className="text-2xl font-bold mb-4 text-gray-800">
        🔗 Conectar Wallet
      </h2>
      
      {/* Mostrar advertencia si Freighter NO está instalado */}
      {!isFreighterInstalled && !loading && (
        <div className="mb-4 p-3 bg-yellow-100 border border-yellow-400 rounded">
          <p className="text-yellow-800 text-sm">
            ⚠️ Freighter no detectado. Asegúrate de tenerlo instalado y recarga la página.
          </p>
        </div>
      )}
      
      {/* Mostrar error si existe */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 rounded">
          <p className="text-red-700 text-sm">❌ {error}</p>
        </div>
      )}
      
      {/* Condicional: ¿Ya está conectado? */}
      {!publicKey ? (
        /* NO conectado: Mostrar botón */
        <div>
          <button
            onClick={connectWallet}
            disabled={loading || !isFreighterInstalled}
            className="w-full px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg 
                       hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed
                       transition-colors"
          >
            {loading ? '⏳ Conectando...' : '🔗 Conectar Freighter'}
          </button>
          
          {/* Link para descargar Freighter si no la tiene */}
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
        /* SÍ conectado: Mostrar public key */
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
            {/* 🌟 MEJORA DE ORO #3: Botón Copiar */}
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
