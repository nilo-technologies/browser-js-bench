import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  worker: {
    format: 'es',
  },
  optimizeDeps: {
    // Only imported from a worker, so Vite would otherwise discover it late
    // and force a page reload in the middle of the first run.
    include: ['quickjs-emscripten-core'],
    // These packages locate their .wasm files relative to import.meta.url,
    // which breaks when Vite pre-bundles them.
    exclude: ['@boa-dev/boa_wasm', '@jitl/quickjs-wasmfile-release-sync'],
  },
})
