import type { ReadyMessage, RunRequest, RunResponse } from './types'

type Evaluator = (script: string, timeoutMs: number) => string

/**
 * Wires up a worker that receives a single RunRequest, initialises its engine,
 * evaluates the script and posts back a RunResponse.
 */
export function serveEngine(init: () => Promise<Evaluator>) {
  self.onmessage = async (event: MessageEvent<RunRequest>) => {
    const { script, timeoutMs } = event.data
    let initMs = 0
    let evalMs = 0
    let response: RunResponse
    try {
      const initStart = performance.now()
      const evaluate = await init()
      initMs = performance.now() - initStart
      self.postMessage({ type: 'ready' } satisfies ReadyMessage)

      const evalStart = performance.now()
      const result = evaluate(script, timeoutMs)
      evalMs = performance.now() - evalStart
      response = { type: 'done', ok: true, result, initMs, evalMs }
    } catch (err) {
      response = { type: 'done', ok: false, error: formatError(err), initMs, evalMs }
    }
    self.postMessage(response)
  }
}

function formatError(err: unknown): string {
  if (err instanceof Error) return err.stack?.includes(err.message) ? err.stack : `${err.name}: ${err.message}`
  return String(err)
}
