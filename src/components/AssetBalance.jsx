// src/components/AssetBalance.jsx

'use client';

import { useState, useEffect, useCallback } from 'react';
import * as StellarSDK from 'stellar-sdk'; 
import { getAddress } from '@stellar/freighter-api';
import { HORIZON_URLS, USDC_TESTNET } from '../lib/constants';
import Spinner from './Spinner';

/**
 * Componente para mostrar el balance del activo (Trustline) del usuario.
 */
export default function AssetBalance() {
    const [balance, setBalance] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isConnected, setIsConnected] = useState(false);
    const [publicKey, setPublicKey] = useState('');

    // Definición del Asset usando la clase corregida
    const asset = new StellarSDK.Asset(USDC_TESTNET.code, USDC_TESTNET.issuer);

    const fetchBalance = useCallback(async (walletPublicKey) => {
        setIsLoading(true);
        setError('');
        
        try {
            const server = new StellarSDK.Server(HORIZON_URLS.testnet); 
            
            const account = await server.loadAccount(walletPublicKey);
            
            const assetBalance = account.balances.find(b => 
                b.asset_code === asset.code && 
                b.asset_issuer === asset.issuer
            );

            if (assetBalance) {
                setBalance(assetBalance.balance);
            } else {
                setBalance("0.0000000"); // No tiene Trustline o balance es 0
            }
        } catch (e) {
            console.error("Error fetching balance:", e);
            
            if (e.name === 'NotFoundError') {
                setError("La cuenta no está fondeada o la Trustline no existe aún. Necesitas al menos 1 XLM.");
                setBalance("0.0000000");
            } else {
                setError(`Error al cargar el balance: ${e.message}`);
            }
        } finally {
            setIsLoading(false);
        }
    }, [asset]); // ✅ CORRECCIÓN FINAL: asset es una dependencia del callback

    // Efecto para verificar conexión y cargar balance
    useEffect(() => {
        const checkWalletAndFetch = async () => {
            if (typeof window !== 'undefined' && window.freighterApi) {
                try {
                    // Verificar la conexión primero
                    if (await window.freighterApi.isConnected()) {
                        const pubKey = await getAddress();
                        setPublicKey(pubKey);
                        setIsConnected(true);
                        // Llamar a fetchBalance solo si hay una clave pública
                        if (pubKey) {
                            fetchBalance(pubKey);
                        }
                    } else {
                        setPublicKey('');
                        setIsConnected(false);
                    }
                } catch (e) {
                    console.error("Error de conexión:", e);
                    setError("Error al obtener la clave pública de Freighter.");
                    setIsConnected(false);
                }
            }
        };

        checkWalletAndFetch();

        // Refrescar el balance cada 10 segundos
        const intervalId = setInterval(checkWalletAndFetch, 10000); 

        return () => clearInterval(intervalId);
    }, [fetchBalance]); // ✅ fetchBalance es la única dependencia externa aquí


    return (
        <div className="p-6 bg-white rounded-lg shadow-md border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">
                💰 Balance del Activo ({USDC_TESTNET.code})
            </h3>
            
            {/* Mostrar spinner si está cargando */}
            {isLoading && (
                <div className="flex justify-center py-4">
                    <Spinner />
                </div>
            )}

            {/* Mostrar error si ocurre */}
            {error && (
                <p className="text-red-600 text-sm mb-4 bg-red-100 p-2 rounded">
                    ❌ {error}
                </p>
            )}

            {/* Mostrar el balance */}
            {isConnected && !isLoading && !error && (
                <div>
                    <p className="text-sm font-medium text-gray-500">
                        Cuenta Conectada:
                    </p>
                    <p className="text-sm font-mono text-gray-700 break-all mb-4">
                        {publicKey}
                    </p>
                    
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200 text-center">
                        <p className="text-xl font-bold text-blue-800">
                            Balance: {balance} {USDC_TESTNET.code}
                        </p>
                    </div>
                </div>
            )}

            {/* Mensaje si no está conectado */}
            {!isConnected && !isLoading && (
                <p className="text-gray-500 italic">
                    Conecta tu wallet para ver el balance de {USDC_TESTNET.code}.
                </p>
            )}
        </div>
    );
}