import type { EngineId, EngineRunResult, ReadyMessage, RunRequest, RunResponse } from './types'

// Each URL must be a literal so Vite can detect and bundle the worker.
const workerFactories: Record<EngineId, () => Worker> = {
  native: () => new Worker(new URL('./native.worker.ts', import.meta.url), { type: 'module' }),
  quickjs: () => new Worker(new URL('./quickjs.worker.ts', import.meta.url), { type: 'module' }),
  boa: () => new Worker(new URL('./boa.worker.ts', import.meta.url), { type: 'module' }),
}

/** How long an engine may take to load before the run is abandoned. */
const INIT_TIMEOUT_MS = 60_000

export interface RunEngineOptions {
  engine: EngineId
  script: string
  timeoutMs: number
  signal?: AbortSignal
}

/**
 * Runs a script in a fresh worker for the given engine and parses the JSON
 * string the script evaluates to. The worker is always terminated afterwards.
 */
export function runEngine<T>({ engine, script, timeoutMs, signal }: RunEngineOptions): Promise<EngineRunResult<T>> {
  return new Promise((resolve) => {
    const worker = workerFactories[engine]()
    let settled = false
    let evalStarted = performance.now()
    let timer: ReturnType<typeof setTimeout>

    const finish = (result: EngineRunResult<T>) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      signal?.removeEventListener('abort', onAbort)
      worker.terminate()
      resolve(result)
    }

    const fail = (error: string, extra: Partial<EngineRunResult<T>> = {}) =>
      finish({ engine, ok: false, error, initMs: 0, evalMs: performance.now() - evalStarted, ...extra })

    const armTimer = (ms: number, message: string) => {
      clearTimeout(timer)
      timer = setTimeout(() => fail(message, { timedOut: true }), ms)
    }

    const onAbort = () => fail('Cancelled')
    if (signal?.aborted) return onAbort()
    signal?.addEventListener('abort', onAbort)

    armTimer(INIT_TIMEOUT_MS, `Engine failed to load within ${INIT_TIMEOUT_MS / 1000}s`)

    worker.onmessage = (event: MessageEvent<RunResponse | ReadyMessage>) => {
      const msg = event.data
      if (msg.type === 'ready') {
        evalStarted = performance.now()
        armTimer(timeoutMs, `Timed out after ${timeoutMs / 1000}s`)
        return
      }
      if (!msg.ok) {
        fail(msg.error, { initMs: msg.initMs, evalMs: msg.evalMs })
        return
      }
      try {
        finish({ engine, ok: true, data: JSON.parse(msg.result) as T, initMs: msg.initMs, evalMs: msg.evalMs })
      } catch {
        fail(`Unexpected result: ${msg.result.slice(0, 500)}`, { initMs: msg.initMs, evalMs: msg.evalMs })
      }
    }
    worker.onerror = (event) => {
      event.preventDefault()
      fail(event.message || 'Worker failed to start')
    }

    const request: RunRequest = { script, timeoutMs }
    worker.postMessage(request)
  })
}
