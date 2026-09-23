export type EngineId = 'native' | 'quickjs' | 'boa'

export interface EngineInfo {
  id: EngineId
  label: string
  description: string
}

export const ENGINES: EngineInfo[] = [
  {
    id: 'native',
    label: 'Native',
    description: "The browser's own engine (V8, SpiderMonkey or JavaScriptCore), with JIT.",
  },
  {
    id: 'quickjs',
    label: 'QuickJS',
    description: 'QuickJS compiled to WASM via quickjs-emscripten (release build).',
  },
  {
    id: 'boa',
    label: 'Boa',
    description: 'Boa, a Rust JavaScript engine, compiled to WASM (@boa-dev/boa_wasm).',
  },
]

/** Message sent from the page to an engine worker. */
export interface RunRequest {
  script: string
  timeoutMs: number
}

/** Posted by a worker once its engine is loaded, right before evaluation. */
export interface ReadyMessage {
  type: 'ready'
}

/** Message sent back from an engine worker. */
export type RunResponse =
  | {
      type: 'done'
      ok: true
      /** The JSON string produced by the script's last expression. */
      result: string
      /** Time to load and instantiate the engine, in ms. Zero for native. */
      initMs: number
      /** Wall-clock time of the evaluation measured by the worker, in ms. */
      evalMs: number
    }
  | {
      type: 'done'
      ok: false
      error: string
      initMs: number
      evalMs: number
    }

export interface EngineRunResult<T> {
  engine: EngineId
  ok: boolean
  data?: T
  error?: string
  initMs: number
  evalMs: number
  timedOut?: boolean
}
