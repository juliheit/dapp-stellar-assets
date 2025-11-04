// src/components/WalletConnect.jsx
'use client';

import { useState, useEffect } from 'react';
import { get  } from '@stellar/freighter-api'; // Revisa si tu importación es correcta. Debería ser 'getPublicKey' o 'getAddress'.
import { getAddress } from '@stellar/freighter-api'; // Asumiendo que usas getAddress
import Spinner from './Spinner';

// Función auxiliar para formatear la dirección
const formatAddress = (address) => {
    //  CORRECCIÓN: Verifica que address sea una cadena de texto y que exista
    if (typeof address === 'string' && address.length > 8) { 
        return `${address.slice(0, 4)}...${address.slice(-4)}`;
    }
    // Si no es un string o es demasiado corto, devuelve un valor por defecto
    return 'Wallet desconectada';
};

/**
 * Componente que gestiona la conexión con la wallet Freighter.
 * Llama a onConnect(publicKey) al conectar exitosamente.
 */
export default function WalletConnect({ onConnect }) {
    const [publicKey, setPublicKey] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Función para conectar la wallet
    const connectWallet = async () => {
        setIsLoading(true);
        setError('');
        
        try {
            // Utilizamos getAddress() para obtener la clave pública
            const result = await getAddress();
            console.log("🔍 Resultado de Freighter:", result);

            const pubKey = result.address; // Extraer solo el string
            setPublicKey(pubKey);
            setIsConnected(true);

            // Notificamos al componente padre
            if (onConnect) {
                onConnect(pubKey);
            }
        } catch (e) {
            console.error("Error al conectar Freighter:", e);
            setError("Error al conectar la wallet. Asegúrate de que Freighter está instalado y funcionando.");
            setPublicKey(null);
            setIsConnected(false);
        } finally {
            setIsLoading(false);
        }
    };
    
    // Efecto para verificar la conexión inicial y establecer el estado
    useEffect(() => {
        const checkConnection = async () => {
            if (typeof window.freighterApi !== 'undefined') {
                try {
                    // Si Freighter está instalado, verifica si ya está conectado
                    const connected = await window.freighterApi.isConnected();
                    setIsConnected(connected);

                    if (connected) {
                         const result = await getAddress();
                         const pubKey = result.address; // Extraer solo el string
                         setPublicKey(pubKey);
                         if (onConnect) {
                            onConnect(pubKey);
                        }
                    } else {
                        setPublicKey(null);
                    }
                } catch (e) {
                    console.error("Error verificando la conexión inicial:", e);
                    // No hacemos nada, solo mantenemos el estado desconectado
                }
            } else {
                 setError('Freighter no detectado. Instala la extensión.');
            }
        };

        checkConnection();
    }, [onConnect]); // onConnect es una dependencia estable (prop del padre)

    return (
        <div className="p-6 bg-white rounded-lg shadow-md border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">
                Conexión de Wallet
            </h3>
            
            {error && (
                <p className="text-red-600 text-sm mb-4 bg-red-100 p-2 rounded">
                    ❌ {error}
                </p>
            )}

            {!isConnected ? (
                <button
                    onClick={connectWallet}
                    disabled={isLoading}
                    className={`w-full py-3 px-4 rounded-lg font-bold text-white transition duration-200 flex items-center justify-center ${
                        isLoading || error 
                            ? 'bg-gray-400 cursor-not-allowed' 
                            : 'bg-indigo-600 hover:bg-indigo-700'
                    }`}
                >
                    {isLoading ? (
                        <>
                            <Spinner />
                            <span className="ml-2">Conectando...</span>
                        </>
                    ) : (
                        "Conectar con Freighter"
                    )}
                </button>
            ) : (
                <div className="mt-2 p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="font-semibold text-green-800">✅ Wallet Conectada</p>
                    <p className="text-sm font-mono text-gray-700 break-all mt-1">
                        {formatAddress(publicKey)}
                    </p>
                    {/* Botón opcional para desconectar o simplemente mostrar el estado */}
                </div>
            )}
        </div>
    );
}