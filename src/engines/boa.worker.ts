import * as glue from '@boa-dev/boa_wasm/boa_wasm_bg.js'
import wasmUrl from '@boa-dev/boa_wasm/boa_wasm_bg.wasm?url'
import { serveEngine } from './workerUtil'

serveEngine(async () => {
  // Instantiated by hand instead of importing the package entry, so we don't
  // need bundler wasm plugins and can time the load separately.
  const { instance } = await WebAssembly.instantiateStreaming(fetch(wasmUrl), {
    './boa_wasm_bg.js': glue as unknown as WebAssembly.ModuleImports,
  })
  glue.__wbg_set_wasm(instance.exports)
  ;(instance.exports.__wbindgen_start as () => void)()

  return (script) => {
    // Boa returns the display form of the completion value, so a string
    // result comes back quoted and escaped. Harness output is ASCII-only JSON,
    // which makes that form valid JSON too.
    const display = glue.evaluate(script)
    if (display.startsWith('"')) {
      try {
        return JSON.parse(display) as string
      } catch {
        return display.slice(1, -1)
      }
    }
    return display
  }
})
