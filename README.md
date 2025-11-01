# 🚀 dApp: Stellar Assets Manager (Clase 8)

## 🚧 Estado del Proyecto

**Estado:** FALLO DE COMPILACIÓN (BUILD FAILED)
**Última Versión Subida a Vercel:** https://dapp-stellar-assets-7qYgVgrH5B5Yyeb9tgczaz5DuVVG.vercel.app/

---

## ❌ Errores Críticos Encontrados

El proyecto no pudo completar el proceso de compilación (`npm run build`) en la plataforma Vercel debido a dos errores persistentes. El código fuente local funciona correctamente (asumiendo que las dependencias están instaladas).

### 1. Fallo de Dependencia (`stellar-sdk`) - Error de Retorno

Este error es el más crítico y persistente. A pesar de que la librería `stellar-sdk` está correctamente listada en el `package.json`, Vercel falla al intentar instalarla o resolverla en el momento de la compilación.

* **Mensaje de Error en Vercel:**
    ```
    Module not found: Can't resolve 'stellar-sdk'
    ```
* **Acciones Tomadas:**
    * Verificación y corrección de `package.json` para incluir `stellar-sdk` y otras dependencias (`@supabase/supabase-js`, `@stellar/freighter-api`).
    * Limpieza local de caché (`rm -rf node_modules`, `rm package-lock.json`).
    * Múltiples `npm install` y *pushes* a GitHub.
* **Conclusión:** Sugiere un problema de caché, conflicto de versiones en el `package-lock.json` o un problema específico del entorno Vercel/Next.js que no se pudo replicar ni solucionar con el proceso estándar.

### 2. Conflicto de Rutas (Sensibilidad a Mayúsculas/Minúsculas)

Este error fue el segundo más difícil y se relaciona con cómo Vercel (un entorno Linux, sensible a mayúsculas/minúsculas) lee el índice de Git.

* **Mensaje de Error en Vercel:**
    ```
    Module not found: Can't resolve '../lib/constants'
    ```
* **Acciones Tomadas:**
    * Identificación de un posible error de *case-sensitivity* (singular/plural) en el nombre del archivo `constants.js`.
    * Corrección de las rutas de importación en todos los componentes (`AssetBalance.jsx`, `CreateTrustline.jsx`).
    * Intentos de forzar el renombre del archivo en Git (`git mv`).
    * **Última Acción:** Se eliminó y recreó el archivo `constants.js` para forzar a Git a registrar el nombre limpio.
* **Conclusión:** Aunque la corrección se implementó en el código, el error de `stellar-sdk` reapareció antes de confirmar si la solución a este error funcionó.

---

## 📚 Tareas Pendientes (Funcionalidad)

* **Mostrar Balance:** (Completado en código) Consultar el balance de USDC/EURC en la red Stellar.
* **Crear Trustline:** (Completado en código) Operación `ChangeTrust` para permitir recibir un activo.
* **Integración de Supabase:** (Completado en código) Uso de Supabase para guardar la metadata de las `trustlines`.

---