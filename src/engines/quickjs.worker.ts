import releaseSync from '@jitl/quickjs-wasmfile-release-sync'
import wasmUrl from '@jitl/quickjs-wasmfile-release-sync/wasm?url'
import {
  newQuickJSWASMModuleFromVariant,
  newVariant,
  shouldInterruptAfterDeadline,
} from 'quickjs-emscripten-core'
import { serveEngine } from './workerUtil'

// The stack limit is left at QuickJS's default: raising it beyond the WASM
// build's real stack makes every evaluation fail with a stack overflow.
const MEMORY_LIMIT_BYTES = 1024 * 1024 * 1024

serveEngine(async () => {
  const variant = newVariant(releaseSync, { wasmLocation: wasmUrl })
  const QuickJS = await newQuickJSWASMModuleFromVariant(variant)

  return (script, timeoutMs) => {
    const runtime = QuickJS.newRuntime()
    runtime.setMemoryLimit(MEMORY_LIMIT_BYTES)
    runtime.setInterruptHandler(shouldInterruptAfterDeadline(Date.now() + timeoutMs))
    const context = runtime.newContext()
    try {
      const result = context.evalCode(script, 'bench.js')
      if (result.error) {
        const error = context.dump(result.error)
        result.error.dispose()
        // Thrown as a string so the worker's own stack isn't appended.
        throw formatQuickJSError(error)
      }
      const value = context.dump(result.value)
      result.value.dispose()
      return String(value)
    } finally {
      context.dispose()
      runtime.dispose()
    }
  }
})

function formatQuickJSError(error: unknown): string {
  if (error && typeof error === 'object') {
    const { name, message, stack } = error as { name?: string; message?: string; stack?: string }
    return [`${name ?? 'Error'}: ${message ?? ''}`, stack].filter(Boolean).join('\n')
  }
  return String(error) || 'Uncaught exception with an empty value'
}
