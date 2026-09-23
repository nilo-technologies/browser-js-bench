import { serveEngine } from './workerUtil'

serveEngine(async () => (script) => {
  // Indirect eval runs the script in global scope, like the other engines.
  // oxlint-disable-next-line no-eval
  const indirectEval = eval
  return String(indirectEval(script))
})
