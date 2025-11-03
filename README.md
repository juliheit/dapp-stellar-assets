# 🚀 dApp: Stellar Assets

Este proyecto implementa una dApp básica para interactuar con la Testnet de Stellar, enfocada en la gestión de Assets Nativos. El objetivo principal es conectar una wallet (Freighter), establecer una Trustline (línea de confianza) para el activo USDC, y mostrar el balance.

## 🛠️ Stack Tecnológico

- **Framework**: Next.js 16.0.1 (App Router)
- **Blockchain**: Stellar Network (Testnet)
- **SDK**: `stellar-sdk` v12+
- **Wallet**: Freighter (`@stellar/freighter-api`)
- **Base de Datos**: Supabase
- **Styling**: Tailwind CSS
- **Deploy**: Vercel (con problemas críticos)

## ⚙️ Estado Funcional y de Despliegue

| Componente/Función | Estado Actual | Observaciones |
|-------------------|---------------|---------------|
| Conexión Wallet (Freighter) | ✅ Funcional | Conexión y obtención de clave pública estables. |
| Lógica Stellar (SDK) | ✅ Código Corregido | Todos los errores de `constructor` e `Issuer` de `stellar-sdk` fueron resueltos. |
| Visualización (Hydration) | ✅ Solucionado | La interfaz carga correctamente en el navegador (usando estado `mounted`). |
| Despliegue (Vercel) | ❌ FALLO DE COMPILACIÓN | Problemas de entorno en Vercel (ver errores críticos abajo). |

## 🚧 Historial de Errores Críticos (Build vs. Runtime)

El desarrollo requirió dos fases de depuración: problemas de build (en Vercel) y problemas de runtime (ejecución local).

---

### 📦 Fase 1: Errores Persistentes en Despliegue (Vercel)

El proyecto no pudo completar el proceso de compilación (`npm run build`) en la plataforma Vercel.

#### 1. Fallo de Dependencia (`stellar-sdk`) - Error de Retorno

| Mensaje de Error | Acciones Tomadas | Conclusión |
|-----------------|------------------|------------|
| `Module not found: Can't resolve 'stellar-sdk'` | Verificación exhaustiva y corrección de `package.json` y `package-lock.json`. Limpieza de caché local (`rm -rf node_modules`, `rm package-lock.json`). Múltiples `npm install` y pushes a GitHub. | Sugiere un problema de caché, conflicto de versiones en el `package-lock.json` o un problema específico del entorno Vercel/Next.js que no se pudo replicar ni solucionar con el proceso estándar. |

#### 2. Conflicto de Rutas (Sensibilidad a Mayúsculas/Minúsculas)

| Mensaje de Error | Acciones Tomadas | Conclusión |
|-----------------|------------------|------------|
| `Module not found: Can't resolve '../lib/constants'` | Identificación de un posible error de case-sensitivity (singular/plural) en el nombre del archivo `constants.js`. Corrección de las rutas de importación en todos los componentes (`AssetBalance.jsx`, `CreateTrustline.jsx`). Intentos de forzar el renombre del archivo en Git (`git mv`). Última Acción: Se eliminó y recreó el archivo `constants.js` para forzar a Git a registrar el nombre limpio. | Aunque la corrección se implementó en el código, el error de `stellar-sdk` reapareció antes de confirmar si la solución a este error funcionó. |

---

### 🐛 Fase 2: Debugging de Errores de Runtime y Lógica (Local)

Una vez que el proyecto se estabilizó localmente, se encontraron y resolvieron errores críticos de módulos y frontend, esenciales para la funcionalidad de Stellar.

---

#### 🎯 1. Solución de Bugs de Freighter API 

**Este fue el error más crítico y frecuente**.

| Error Reportado | Archivos Afectados | Solución Definitiva |
|----------------|-------------------|---------------------|
| `window.freighter is undefined` | `WalletConnect.jsx` | **Error en la documentación**: Freighter NO inyecta un objeto `window.freighter`. Se debe usar `@stellar/freighter-api` importando las funciones directamente: `import { isConnected, requestAccess, getAddress } from '@stellar/freighter-api'` |
| `getPublicKey is not a function` | `CreateTrustline.jsx`, `WalletConnect.jsx` | **API incorrecta**: La función `getPublicKey()` no existe en Freighter API. La función correcta es `getAddress()` que retorna un objeto `{ address: "GAB..." }` |
| Intentos de conexión fallidos en loop (20 intentos buscando Freighter) | `WalletConnect.jsx` | Se eliminó la lógica de polling que buscaba `window.freighter` y se reemplazó por verificación directa con `isConnected()` |
| `Freighter Wallet no está instalada` (error falso positivo) | `WalletConnect.jsx` | Se corrigió la verificación usando `const connected = await isConnected()` y luego verificando `connected.isConnected` |

**Código Incorrecto:**
```javascript
// ❌ INCORRECTO - Este código NO funciona
if (!window.freighter) {
  throw new Error('Freighter Wallet no está instalada');
}
const key = await getPublicKey();
```

**Código Correcto:**
```javascript
// ✅ CORRECTO - Este código funciona
import { isConnected, requestAccess, getAddress } from '@stellar/freighter-api';

// Para verificar si está instalado:
const connected = await isConnected();
if (!connected.isConnected) {
  throw new Error('Freighter Wallet no está instalada');
}

// Para solicitar permisos por primera vez:
const access = await requestAccess();
if (access.error) {
  throw new Error(access.error);
}
const publicKey = access.address;

// Para obtener la dirección si ya está autorizado:
const addressObj = await getAddress();
if (addressObj.error || !addressObj.address) {
  throw new Error('No se pudo obtener la public key');
}
const publicKey = addressObj.address;
```

---

#### 🎯 2. Solución de Bugs de Módulos (`stellar-sdk` y Webpack)

Este fue el problema más persistente en el desarrollo local, donde el compilador de Next.js no reconocía las clases del SDK.

| Error Reportado | Archivos Afectados | Solución Definitiva |
|----------------|-------------------|---------------------|
| `TypeError: stellar_sdk__WEBPACK_IMPORTED_MODULE_2__.Server is not a constructor` | `AssetBalance.jsx`, `CreateTrustline.jsx` | Se implementó el patrón de **Namespace Completo** para cargar todas las clases bajo el objeto `StellarSdk`, forzando al compilador a reconocer la estructura de la librería: `import * as StellarSdk from 'stellar-sdk';` y usar `new StellarSdk.Horizon.Server()` |
| `Error: Issuer is invalid` | `AssetBalance.jsx`, `CreateTrustline.jsx` | Se corrigió el Issuer utilizando la constante `USDC_TESTNET` con el issuer correcto: `GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5` para asegurar un activo válido en la Testnet. |
| `Cannot read properties of undefined (reading 'testnet')` | `AssetBalance.jsx`, `CreateTrustline.jsx` | Se eliminó la dependencia de `HORIZON_URLS` del archivo `constants.js` y se pusieron las URLs directamente en el código: `'https://horizon-testnet.stellar.org'` |

**Código Incorrecto:**
```javascript
// ❌ INCORRECTO - No funciona con webpack de Next.js
import { Server, TransactionBuilder, Operation, Asset, Networks } from 'stellar-sdk';
const server = new Server('https://horizon-testnet.stellar.org');
```

**Código Correcto:**
```javascript
// ✅ CORRECTO - Funciona correctamente
import * as StellarSdk from 'stellar-sdk';

const server = new StellarSdk.Horizon.Server('https://horizon-testnet.stellar.org');
const asset = new StellarSdk.Asset(code, issuer);
const transaction = new StellarSdk.TransactionBuilder(account, {
  fee: '100',
  networkPassphrase: StellarSdk.Networks.TESTNET
})
  .addOperation(
    StellarSdk.Operation.changeTrust({
      asset: stellarAsset,
      limit: '10000'
    })
  )
  .setTimeout(30)
  .build();
```

---

#### 🎯 3. Solución de Bugs de Interfaz (Next.js Hydration)

| Error Reportado | Archivos Afectados | Solución Definitiva |
|----------------|-------------------|---------------------|
| `Hydration Mismatch` (y `bis_skin_checked`) | `page.jsx`, `WalletConnect.jsx` | Se creó el componente `<ClientOnly>` y se usó para envolver el contenido dinámico. Esto fuerza que la interfaz se renderice exclusivamente en el cliente, eliminando la interferencia de extensiones de navegador y los errores de Server-Side Rendering. |
| `address.slice is not a function` | `WalletConnect.jsx` | Se añadió validación de tipo (`if (!address \|\| typeof address !== 'string')`) a la función `formatAddress` para evitar la manipulación de valores no-string. |

---

#### 🎯 4. Errores de Sintaxis JSX

| Error Reportado | Archivos Afectados | Solución Definitiva |
|----------------|-------------------|---------------------|
| `Unexpected token. Did you mean '{'>'}' or '&gt;'?` | `WalletConnect.jsx`, `CreateTrustline.jsx` | Caracteres erroneos, mal tipeados. Se borró el archivo completo y se creó desde cero. |
| `Expected corresponding JSX closing tag for 'div'` | `WalletConnect.jsx`, `CreateTrustline.jsx` | Errores de cierre de tags causados por caracteres mal tipeados. |

---

## 📚 Funcionalidades Implementadas

La lógica del código está completada y depurada para estas funcionalidades:

✅ **Conectar Wallet (Freighter)**
- Verifica instalación de Freighter usando `isConnected()`
- Solicita permisos al usuario con `requestAccess()`
- Obtiene y muestra la public key usando `getAddress()`
- Permite copiar la dirección al portapapeles
- Maneja estado `mounted` para evitar hydration errors

✅ **Mostrar Balance**
- Consulta el balance de USDC/EURC en la red Stellar Testnet
- Filtra correctamente assets nativos vs. XLM (`asset_type !== 'native'`)
- Maneja errores de cuenta no encontrada (404)
- Botón de refresh manual
- Muestra instrucciones para obtener assets de prueba

✅ **Crear Trustline**
- Verifica si la trustline ya existe antes de crearla (evita duplicados)
- Verifica tanto en blockchain como en base de datos
- Construye transacción usando `TransactionBuilder` con `ChangeTrust` operation
- Firma transacción con Freighter usando `signTransaction()`
- Envía transacción a Stellar Horizon
- Guarda metadata en Supabase
- Muestra link a Stellar Expert para verificar la transacción

✅ **Integración de Supabase**
- Tabla `trustlines` para guardar metadata de trustlines creadas
- Campos: `user_id`, `asset_code`, `asset_issuer`, `trust_limit`, `tx_hash`, `status`, `created_at`
- RLS (Row Level Security) configurado para privacidad
- Manejo correcto de errores de base de datos

---

## 🔧 Instalación y Uso Local

### Prerrequisitos

1. **Node.js** (v18 o superior)
2. **npm** o **yarn**
3. **Freighter Wallet** instalada en el navegador
4. **Cuenta de Supabase** (para guardar trustlines)

### Pasos de Instalación

```bash
# 1. Clonar el repositorio
git clone https://github.com/juliheit/dapp-stellar-assets.git
cd dapp-stellar-assets

# 2. Instalar dependencias
npm install

# 3. Crear archivo .env.local con tus credenciales de Supabase
echo "NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key" > .env.local

# 4. Ejecutar en modo desarrollo
npm run dev

# 5. Abrir en el navegador
# http://localhost:3000
```

### Configurar Freighter para Testnet

1. **Instalar** extensión desde [freighter.app](https://freighter.app)
2. **Configurar red TESTNET**:
   - Abrir Freighter
   - Ir a Settings (⚙️)
   - Network → Seleccionar **TESTNET**
3. **Crear o importar cuenta**
4. **Obtener XLM gratis** en testnet:
   - Ir a [Stellar Laboratory](https://laboratory.stellar.org/#account-creator)
   - Hacer clic en "Generate keypair"
   - Copiar Public Key
   - Hacer clic en "Get test network lumens"
   - Importar cuenta en Freighter usando la Secret Key

### Configurar Supabase

1. Crear proyecto en [supabase.com](https://supabase.com)
2. Ir a SQL Editor
3. Ejecutar el siguiente script para crear las tablas:

```sql
-- Tabla para guardar trustlines creadas
CREATE TABLE trustlines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(56) NOT NULL,
  asset_code VARCHAR(12) NOT NULL,
  asset_issuer VARCHAR(56) NOT NULL,
  trust_limit DECIMAL DEFAULT 10000,
  tx_hash VARCHAR(64),
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_trustlines_user ON trustlines(user_id);
CREATE INDEX idx_asset_code ON trustlines(asset_code);
CREATE INDEX idx_status ON trustlines(status);

-- Habilitar RLS
ALTER TABLE trustlines ENABLE ROW LEVEL SECURITY;

-- Políticas (opcional - para autenticación de usuarios)
CREATE POLICY "Users can view own trustlines"
  ON trustlines FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own trustlines"
  ON trustlines FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);
```

4. Copiar URL y Anon Key desde Project Settings → API
5. Pegarlos en `.env.local`

---

## 📊 Estructura del Proyecto

```
dapp-stellar-assets/
├── src/
│   ├── app/
│   │   ├── layout.js          # Layout principal de Next.js
│   │   ├── page.jsx            # Página principal (coordina componentes)
│   │   └── globals.css         # Estilos globales de Tailwind
│   ├── components/
│   │   ├── WalletConnect.jsx   # Conexión con Freighter
│   │   ├── AssetBalance.jsx    # Mostrar balance de USDC
│   │   ├── CreateTrustline.jsx # Crear trustline
│   │   ├── Spinner.jsx         # Loading spinner
│   │   └── ClientOnly.jsx      # Componente para evitar hydration errors
│   └── lib/
│       ├── supabase.js         # Cliente de Supabase
│       └── constants.js        # Constantes (assets, URLs)
├── public/                     # Archivos estáticos
├── .env.local                  # Variables de entorno (NO en Git)
├── .gitignore
├── package.json
├── package-lock.json
├── next.config.js
├── tailwind.config.js
└── README.md
```

---

## 🚀 Deploy en Vercel (Estado: Fallido)

### Problemas Encontrados

#### 1. Error de resolución de `stellar-sdk`
- **Error**: `Module not found: Can't resolve 'stellar-sdk'`
- **Contexto**: Vercel no pudo resolver la dependencia a pesar de estar correctamente listada en `package.json`
- **Teoría**: Posible conflicto con caché de Vercel, versiones específicas de Node.js, o problema con `package-lock.json`
- **Estado**: No resuelto

#### 2. Sensibilidad a mayúsculas/minúsculas en rutas
- **Error**: `Module not found: Can't resolve '../lib/constants'`
- **Contexto**: Sistema de archivos de Vercel (Linux) es case-sensitive
- **Problema**: Git en Windows/Mac puede no detectar cambios de capitalización en nombres de archivos
- **Solución parcial**: Forzar renombre con `git mv` y recrear archivo

### Soluciones Intentadas (Sin Éxito)

- ✅ Limpieza de caché local: `rm -rf node_modules`, `rm package-lock.json`
- ✅ Reinstalación completa: `npm install`
- ✅ Verificación de `package.json` y dependencias
- ✅ Corrección de rutas de importación
- ✅ Múltiples redeploys en Vercel
- ✅ Forzar recreación de `package-lock.json`
- ❌ El problema persiste en el entorno de Vercel

---

## 🐛 Debugging Tips

### Si Freighter no conecta:

Abrir consola del navegador (F12) y ejecutar:

```javascript
// Verificar si Freighter está instalado
import('@stellar/freighter-api').then(api => api.isConnected()).then(console.log)
// Debería mostrar: {isConnected: true}

// Si no funciona, verificar que la extensión esté habilitada
// y que estés en TESTNET
```

### Si hay error con Stellar SDK:

```javascript
// Verificar que StellarSdk se cargó correctamente
import('stellar-sdk').then(StellarSdk => {
  console.log(StellarSdk.Horizon);
  console.log(StellarSdk.Networks.TESTNET);
});
// Debería mostrar los objetos correctamente
```

### Si Hydration error persiste:

1. Verifica que todos los componentes que usan `window` o browser APIs tengan `'use client'` al inicio
2. Agrega estado `mounted` para renderizado condicional en TODOS los componentes que interactúan con el navegador
3. Desactiva TODAS las extensiones del navegador temporalmente
4. Limpia caché del navegador (Ctrl+Shift+Delete)

---

## 📖 Lecciones Aprendidas

### 1. Documentación Incorrecta
 **Errores** al usar Freighter API:
- ❌ `window.freighter` (no existe)
- ❌ `getPublicKey()` (función inexistente)
- ✅ Usar `isConnected()`, `requestAccess()`, `getAddress()`

### 2. Importaciones de Módulos en Next.js
`stellar-sdk` cambió su estructura de exportación en versiones recientes. Next.js con webpack requiere importación como namespace:
- ❌ `import { Server } from 'stellar-sdk'`
- ✅ `import * as StellarSdk from 'stellar-sdk'`

### 3. Next.js App Router y Hydration
Cualquier código que use APIs del navegador necesita:
- Directiva `'use client'` al inicio del archivo
- Estado `mounted` para evitar render antes de hidratación
- Guard clause para no renderizar hasta que esté listo

### 4. Vercel vs. Local - Diferencias de Entorno
Los entornos de deploy pueden tener problemas que NO aparecen localmente:
- Case-sensitivity en sistemas de archivos
- Versiones de Node.js diferentes
- Caché de dependencias
- Network policies

---

**Deploy** (último intento con fallos): https://dapp-stellar-assets-beta.vercel.app/
                                        https://vercel.com/julietas-projects-eceadff3/dapp-stellar-assets/deployments
