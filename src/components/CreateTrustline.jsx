// src/components/CreateTrustline.jsx

'use client';

import { useState, useCallback } from 'react';
import * as StellarSDK from '@stellar/stellar-sdk';
import { signTransaction } from '@stellar/freighter-api';
import { HORIZON_URLS, NETWORK_PASSPHRASES } from '../lib/constants';

const MAX_LIMIT = '1000000000'; 

export default function CreateTrustline({ publicKey, asset, onSuccess }) {
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState('');
    const [error, setError] = useState('');

    const createTrustline = useCallback(async () => {
        if (!publicKey) {
            setError('Por favor conecta tu wallet primero');
            return;
        }

        if (!asset || !asset.code || !asset.issuer) {
            setError('Información del asset incompleta');
            return;
        }

        setIsLoading(true);
        setError('');
        setStatus('Creando trustline...');

        try {
            console.log('🚀 Iniciando creación de trustline para:', asset.code);
            console.log('📍 Issuer:', asset.issuer);
            
            const server = new StellarSDK.Horizon.Server(HORIZON_URLS.testnet);
            const account = await server.loadAccount(publicKey);

            console.log('📊 Balance actual:', account.balances);

            // Crear el asset de Stellar
            const stellarAsset = new StellarSDK.Asset(asset.code, asset.issuer);

            // Construir la transacción
            const transaction = new StellarSDK.TransactionBuilder(account, {
                fee: StellarSDK.BASE_FEE,
                networkPassphrase: NETWORK_PASSPHRASES.testnet,
            })
                .addOperation(
                    StellarSDK.Operation.changeTrust({
                        asset: stellarAsset,
                        limit: MAX_LIMIT,
                    })
                )
                .setTimeout(180)
                .build();

            const xdr = transaction.toXDR();
            console.log('📤 XDR creado, longitud:', xdr.length);
            
            setStatus('Esperando firma de Freighter...');

            // 🔥 SOLUCIÓN: Usar solo el string XDR sin objeto wrapper
            let signedXDR;
            
            try {
                // Intento 1: Forma simple (solo string)
                console.log('🧪 Intentando firma - Método 1: string directo');
                const result = await signTransaction(xdr, {
                    network: 'TESTNET',
                    networkPassphrase: NETWORK_PASSPHRASES.testnet,
                });
                
                console.log("🔍 Resultado método 1:", result);
                signedXDR = result.signedTxXdr || result;
                
            } catch (error1) {
                console.log('❌ Método 1 falló, intentando método 2...');
                
                try {
                    // Intento 2: Forma con objeto (tu forma actual)
                    console.log('🧪 Intentando firma - Método 2: objeto con transactionXDR');
                    const result2 = await signTransaction({
                        transactionXDR: xdr,
                        network: 'TESTNET',
                    });
                    
                    console.log("🔍 Resultado método 2:", result2);
                    signedXDR = result2.signedTxXdr || result2;
                    
                } catch (error2) {
                    console.log('❌ Método 2 falló, intentando método 3...');
                    
                    // Intento 3: Forma más simple sin networkPassphrase
                    console.log('🧪 Intentando firma - Método 3: mínimo');
                    const result3 = await signTransaction(xdr, 'TESTNET');
                    
                    console.log("🔍 Resultado método 3:", result3);
                    signedXDR = result3.signedTxXdr || result3;
                }
            }

            console.log("🔍 XDR firmado:", signedXDR ? 'Recibido ✅' : 'Vacío ❌');

            if (!signedXDR || signedXDR === '') {
                throw new Error('No se pudo obtener la transacción firmada de Freighter');
            }

            console.log("✅ Transacción firmada correctamente");

            setStatus('Enviando transacción a la red Stellar...');

            // Reconstruir la transacción desde el XDR firmado
            const transactionToSend = StellarSDK.TransactionBuilder.fromXDR(
                signedXDR,
                NETWORK_PASSPHRASES.testnet
            );

            console.log('📡 Enviando a Horizon...');

            // Enviar la transacción
            const response = await server.submitTransaction(transactionToSend);
            
            console.log('✅ Trustline creada exitosamente!');
            console.log('🔗 Hash:', response.hash);

            setStatus(`✅ Trustline creada exitosamente!`);
            setError('');
            
            if (onSuccess) {
                setTimeout(() => {
                    onSuccess(response);
                }, 1000);
            }

        } catch (err) {
            console.error('❌ Error completo:', err);
            console.error('❌ Mensaje:', err.message);
            console.error('❌ Stack:', err.stack);
            
            let errorMessage = err.message;
            
            if (err.message.includes('User declined')) {
                errorMessage = 'Rechazaste la firma en Freighter';
            } else if (err.message.includes('internal error')) {
                errorMessage = 'Error interno de Freighter. Intenta: 1) Actualizar Freighter, 2) Recargar la página, 3) Desconectar y reconectar la wallet';
            } else if (err.message.includes('op_no_trust')) {
                errorMessage = 'La cuenta del issuer no existe';
            } else if (err.message.includes('op_low_reserve')) {
                errorMessage = 'Fondos insuficientes (necesitas ~1.5 XLM adicionales)';
            }
            
            setError(errorMessage);
            setStatus('');
        } finally {
            setIsLoading(false);
        }
    }, [publicKey, asset, onSuccess]);

    return (
        <div className="p-6 bg-white rounded-lg shadow-md border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">
                🤝 Establecer Trustline para {asset?.code || 'Asset'}
            </h3>

            <p className="text-sm text-gray-600 mb-4">
                Esto permite que tu cuenta reciba el activo <strong>{asset?.code}</strong> emitido por la cuenta del Issuer. 
                El límite de recepción será <strong>{MAX_LIMIT}</strong>.
            </p>

            <div className="mb-4 p-3 bg-gray-50 rounded border border-gray-200">
                <p className="text-xs text-gray-600">
                    <strong>Issuer:</strong>
                </p>
                <p className="text-xs text-gray-800 font-mono break-all mt-1">
                    {asset?.issuer || 'No definido'}
                </p>
            </div>

            <button
                onClick={createTrustline}
                disabled={!publicKey || isLoading}
                className={`w-full py-3 px-4 rounded-lg font-bold text-white transition duration-200 ${
                    !publicKey || isLoading 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-green-600 hover:bg-green-700 active:bg-green-800'
                }`}
            >
                {isLoading ? '⏳ Procesando...' : `✅ Crear Trustline para ${asset?.code || 'Asset'}`}
            </button>

            {status && (
                <div className="mt-4 p-3 bg-green-50 rounded border border-green-200">
                    <p className="text-sm text-green-800">{status}</p>
                </div>
            )}

            {error && (
                <div className="mt-4 p-3 bg-red-50 rounded border border-red-200">
                    <p className="text-sm text-red-800">❌ {error}</p>
                    <p className="text-xs text-red-600 mt-2">
                        Si el error persiste, intenta actualizar Freighter o usar otra wallet
                    </p>
                </div>
            )}

            {!publicKey && (
                <div className="mt-4 p-3 bg-yellow-50 rounded border border-yellow-200">
                    <p className="text-xs text-yellow-800">
                        ⚠️ Primero debes conectar tu wallet
                    </p>
                </div>
            )}
        </div>
    );
}