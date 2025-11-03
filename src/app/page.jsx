// src/app/page.jsx

'use client';

import { useState } from 'react';
import WalletConnect from '../components/WalletConnect';
import AssetBalance from '../components/AssetBalance';
import CreateTrustline from '../components/CreateTrustline';
import ClientOnly from '../components/ClientOnly'; // 👈 Se importa aquí

export default function Home() {
  const [publicKey, setPublicKey] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  // IMPORTANTE: Definir el asset AQUI, no dentro del JSX
  const USDC_TESTNET = {
    code: 'USDC',
    issuer: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5'
  };

  const handleWalletConnect = (key) => {
    setPublicKey(key);
    console.log('Wallet conectada:', key);
  };

  const handleTrustlineSuccess = () => {
    console.log('Trustline creada, actualizando balance...');
    setRefreshKey(prev => prev + 1);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Assets Nativos en Stellar
          </h1>
          <p className="text-gray-600">
            Tu primera dApp de stablecoins en blockchain
          </p>
        </div>
      </div>

      {/* Main Content */}
      <ClientOnly> {/*  Se usa para envolver el contenido dinámico */}
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="space-y-6">
            {/* Componente 1: Conectar Wallet */}
            <WalletConnect onConnect={handleWalletConnect} />

            {/* Componentes 2 y 3: Solo mostrar si hay wallet conectada */}
            {publicKey && (
              <>
                {/* Componente 2: Crear Trustline */}
                <CreateTrustline
                  asset={USDC_TESTNET}
                  publicKey={publicKey}
                  onSuccess={handleTrustlineSuccess}
                />

                {/* Componente 3: Ver Balance */}
                <AssetBalance
                  key={refreshKey}
                  publicKey={publicKey}
                  asset={USDC_TESTNET}
                />
              </>
            )}
          </div>
          
          {/* Instrucciones */}
          <div className="mt-8 p-6 bg-yellow-50 rounded-lg border-2 border-yellow-200">
            <h3 className="font-bold text-lg mb-3 text-gray-800">
              Instrucciones:
            </h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
              <li>
                <strong>Instala Freighter:</strong>{' '}
                <a
                  href="https://www.freighter.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  https://www.freighter.app
                </a>
              </li>
              <li>
                <strong>Configura Freighter en testnet</strong> (Settings - Network - Testnet)
              </li>
              <li>
                <strong>Obten XLM gratis:</strong>{' '}
                <a
                  href="https://laboratory.stellar.org/#account-creator"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  https://laboratory.stellar.org/#account-creator
                </a>
              </li>
              <li><strong>Conecta tu wallet</strong> con el boton de arriba</li>
              <li><strong>Crea una trustline</strong> para USDC</li>
              <li><strong>Verifica tu balance</strong> (deberia aparecer 0 USDC)</li>
            </ol>

            <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
              <p className="text-xs text-blue-800">
                Tip: Puedes usar{' '}
                <a
                  href="https://laboratory.stellar.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  Stellar Laboratory
                </a>
                {' '}para enviar USDC de testnet a tu cuenta y probar que funciona.
              </p>
            </div>
          </div>
        </div>
      </ClientOnly>

      {/* Footer */}
      <div className="max-w-4xl mx-auto px-6 py-8 text-center text-sm text-gray-500">
        <p>Construido con Stellar</p>
        <p className="mt-2">Clase 8: Assets Nativos en Stellar</p>
      </div>
    </main>
  );
}