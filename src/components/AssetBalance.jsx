// src/components/AssetBalance.jsx

'use client';

import { useState, useEffect } from 'react';
import * as StellarSDK from '@stellar/stellar-sdk';
import { HORIZON_URLS } from '../lib/constants';

export default function AssetBalance({ publicKey, asset }) {
    const [balance, setBalance] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [hasTrustline, setHasTrustline] = useState(false);

    useEffect(() => {
        const fetchBalance = async () => {
            if (!publicKey || !asset) {
                return;
            }

            setLoading(true);
            setError('');

            try {
                console.log('Buscando balance para:', asset.code);
                
                const server = new StellarSDK.Horizon.Server(HORIZON_URLS.testnet);
                const account = await server.loadAccount(publicKey);

                console.log('Todos los balances:', account.balances);

                const assetBalance = account.balances.find(
                    (b) =>
                        b.asset_code === asset.code &&
                        b.asset_issuer === asset.issuer
                );

                console.log('Balance encontrado:', assetBalance);

                if (assetBalance) {
                    setBalance(assetBalance.balance);
                    setHasTrustline(true);
                    console.log(`Balance de ${asset.code}:`, assetBalance.balance);
                } else {
                    setBalance(null);
                    setHasTrustline(false);
                    setError(`No se encontró trustline para ${asset.code}. Créala primero.`);
                }

            } catch (err) {
                console.error('Error al obtener balance:', err);
                setError(`Error: ${err.message}`);
                setHasTrustline(false);
            } finally {
                setLoading(false);
            }
        };

        fetchBalance();
    }, [publicKey, asset]);

    if (!publicKey) {
        return (
            <div className="p-6 bg-white rounded-lg shadow-md border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Balance del Activo ({asset?.code || 'Asset'})
                </h3>
                <p className="text-gray-600 text-sm">
                    Conecta tu wallet para ver el balance de {asset?.code || 'este activo'}.
                </p>
            </div>
        );
    }

    return (
        <div className="p-6 bg-white rounded-lg shadow-md border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">
                Balance del Activo ({asset?.code || 'Asset'})
            </h3>

            {loading ? (
                <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="text-gray-600 text-sm mt-2">Cargando balance...</p>
                </div>
            ) : hasTrustline && balance !== null ? (
                <div>
                    <div className="text-center py-6">
                        <p className="text-5xl font-bold text-green-600 mb-2">
                            {parseFloat(balance).toFixed(2)}
                        </p>
                        <p className="text-gray-600 font-semibold text-lg">
                            {asset?.code || 'Asset'}
                        </p>
                    </div>
                    <div className="mt-4 p-3 bg-green-50 rounded border border-green-200">
                        <p className="text-xs text-green-800 text-center">
                            Balance actualizado correctamente
                        </p>
                    </div>
                </div>
            ) : (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-yellow-800 text-sm">
                        {error || `No tienes trustline para ${asset?.code}. Créala primero usando el botón de arriba.`}
                    </p>
                </div>
            )}
        </div>
    );
}