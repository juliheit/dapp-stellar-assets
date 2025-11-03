// src/components/CreateTrustline.jsx

'use client';

import { useState, useCallback } from 'react';
// SOLUCIÓN DEFINITIVA DE IMPORTACIÓN: Usamos el Namespace completo
import * as StellarSDK from 'stellar-sdk'; 
import { signTransaction } from '@stellar/freighter-api';
// Importamos las constantes necesarias
import { HORIZON_URLS, NETWORK_PASSPHRASES } from '../lib/constants';

// Valores límite para el Trustline
const MAX_LIMIT = '1000000000'; 

/**
 * Componente para crear y firmar una Trustline (línea de confianza)
 */
export default function CreateTrustline({ publicKey, asset, onSuccess }) {
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState('');
    const [error, setError] = useState('');

    const createTrustline = useCallback(async () => {
        if (!publicKey) {
            setError("Por favor, conecta tu wallet antes de crear la Trustline.");
            return;
        }

        setIsLoading(true);
        setStatus('Preparando transacción...');
        setError('');

        try {
            // Uso de StellarSDK.Server corregido
            const server = new StellarSDK.Server(HORIZON_URLS.testnet);
            
            // Activo definido usando el prop 'asset' (que es USDC_TESTNET)
            const stellarAsset = new StellarSDK.Asset(
                asset.code, 
                asset.issuer
            );

            // Cargar la cuenta de la red para obtener el sequence number
            const account = await server.loadAccount(publicKey);
            setStatus('Cuenta cargada, construyendo operación...');
            
            // Construir la operación para establecer la línea de confianza
            const trustlineOperation = StellarSDK.Operation.changeTrust({
                asset: stellarAsset,
                limit: MAX_LIMIT,
            });

            // Construir la Transacción
            let transaction = new StellarSDK.TransactionBuilder(account, {
                fee: '100',
                networkPassphrase: NETWORK_PASSPHRASES.testnet,
            })
                .addOperation(trustlineOperation)
                .setTimeout(30)
                .build();

            setStatus('Esperando la firma de Freighter...');

            // Firmar la transacción con Freighter
            const signedTransaction = await signTransaction({
                transactionXDR: transaction.toXDR(),
                network: 'TESTNET',
            });

            // Reconstruir la transacción firmada para enviarla
            const transactionToSend = StellarSDK.TransactionBuilder.fromXDR(
                signedTransaction,
                NETWORK_PASSPHRASES.testnet
            );

            setStatus('Enviando transacción a la red Stellar...');

            // Enviar la transacción a Horizon
            const transactionResult = await server.submitTransaction(transactionToSend);

            console.log("Trustline creada con éxito. Hash:", transactionResult.hash);
            setStatus(`✅ ¡Trustline creada con éxito! Hash: ${transactionResult.hash.substring(0, 10)}...`);
            
            // Notificamos al padre para que AssetBalance se actualice
            if (onSuccess) onSuccess(); 

        } catch (e) {
            console.error("Error al crear Trustline:", e);
            if (e.message && e.message.includes('op_no_change')) {
                 setError('La Trustline ya existe. No se realizó ningún cambio.');
            } else if (e.message && e.message.includes('tx_bad_auth')) {
                 setError('Error de autorización. Asegúrate de haber firmado la transacción.');
            }
            else {
                setError(`Error de Stellar: ${e.message}`);
            }
            setStatus('');

        } finally {
            setIsLoading(false);
        }
    }, [publicKey, asset, onSuccess]); // Dependencias del useCallback

    return (
        <div className="p-6 bg-white rounded-lg shadow-md border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">
                🤝 Establecer Trustline para {asset.code}
            </h3>

            <p className="text-sm text-gray-600 mb-4">
                Esto permite que tu cuenta reciba el activo emitido por la cuenta del Issuer. El límite de recepción será **{MAX_LIMIT}**.
            </p>

            <button
                onClick={createTrustline}
                disabled={!publicKey || isLoading}
                className={`w-full py-3 px-4 rounded-lg font-bold text-white transition duration-200 ${
                    !publicKey || isLoading 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-green-600 hover:bg-green-700'
                }`}
            >
                {isLoading ? 'Procesando...' : `Crear Trustline para ${asset.code}`}
            </button>

            {/* Mensajes de Estado y Error */}
            {status && <p className="mt-4 text-green-600 text-sm italic">{status}</p>}
            {error && <p className="mt-4 text-red-600 text-sm bg-red-100 p-2 rounded">❌ {error}</p>}
        </div>
    );
}