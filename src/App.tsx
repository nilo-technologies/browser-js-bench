import { useRef, useState } from 'react'
import './App.css'
import { buildCustomScript, type CustomResult } from './benchmarks/customHarness'
import { PRESETS } from './benchmarks/presets'
import { buildV8Script, V8_BENCHMARKS, type V8Result } from './benchmarks/v8Harness'
import { BenchmarkPicker, type CustomSettings } from './components/BenchmarkPicker'
import { EngineSelector } from './components/EngineSelector'
import { ResultsChart } from './components/ResultsChart'
import { ResultsTable } from './components/ResultsTable'
import { RunControls } from './components/RunControls'
import { runEngine } from './engines/runEngine'
import { ENGINES, type EngineId } from './engines/types'
import type { CellState, Mode, ResultSet } from './results'

interface Job {
  id: string
  label: string
  buildScript: () => string | Promise<string>
}

const defaultPreset = PRESETS.find((p) => p.id === 'fib') ?? PRESETS[0]

export default function App() {
  const [engines, setEngines] = useState<EngineId[]>(ENGINES.map((e) => e.id))
  const [mode, setMode] = useState<Mode>('v8')
  const [selectedV8, setSelectedV8] = useState<string[]>(['richards'])
  const [custom, setCustom] = useState<CustomSettings>({
    code: defaultPreset.code,
    iterations: defaultPreset.iterations,
    warmup: defaultPreset.warmup,
  })
  const [timeoutSec, setTimeoutSec] = useState(120)
  const [results, setResults] = useState<ResultSet | null>(null)
  const [progress, setProgress] = useState<string | null>(null)
  const [running, setRunning] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  const jobs: Job[] =
    mode === 'v8'
      ? V8_BENCHMARKS.filter((b) => selectedV8.includes(b.id)).map((b) => ({
          id: b.id,
          label: b.name,
          buildScript: () => buildV8Script(b),
        }))
      : [{ id: 'custom', label: 'Custom code', buildScript: () => buildCustomScript(custom) }]

  const canRun = engines.length > 0 && jobs.length > 0 && (mode === 'v8' || custom.code.trim().length > 0)

  const setCell = (rowId: string, engine: EngineId, cell: CellState) =>
    setResults((prev) =>
      prev && {
        ...prev,
        rows: prev.rows.map((r) => (r.id === rowId ? { ...r, cells: { ...r.cells, [engine]: cell } } : r)),
      },
    )

  const run = async () => {
    const controller = new AbortController()
    abortRef.current = controller
    const runEngines = [...engines]
    setRunning(true)
    setResults({
      mode,
      engines: runEngines,
      rows: jobs.map((j) => ({ id: j.id, label: j.label, cells: Object.fromEntries(runEngines.map((e) => [e, { status: 'pending' }])) })),
    })

    // Strictly sequential so engines never compete for CPU.
    for (const job of jobs) {
      if (controller.signal.aborted) break
      const script = await job.buildScript()
      for (const engine of runEngines) {
        if (controller.signal.aborted) break
        setProgress(`Running ${job.label} on ${ENGINES.find((e) => e.id === engine)?.label}...`)
        setCell(job.id, engine, { status: 'running' })
        const result = await runEngine<V8Result | CustomResult>({
          engine,
          script,
          timeoutMs: timeoutSec * 1000,
          signal: controller.signal,
        })
        setCell(job.id, engine, { status: 'done', result })
      }
    }

    setProgress(controller.signal.aborted ? 'Cancelled.' : 'Done.')
    setRunning(false)
    abortRef.current = null
  }

  return (
    <div className="app">
      <header>
        <h1>Browser JS engine bench</h1>
        <p className="muted">
          Run the same JavaScript on your browser's native engine and on QuickJS and Boa compiled to WebAssembly. Every run
          happens in a fresh Web Worker.
        </p>
      </header>

      <div className="config">
        <EngineSelector selected={engines} onChange={setEngines} disabled={running} />
        <BenchmarkPicker
          mode={mode}
          onModeChange={setMode}
          selectedV8={selectedV8}
          onSelectedV8Change={setSelectedV8}
          custom={custom}
          onCustomChange={setCustom}
          disabled={running}
        />
      </div>

      <RunControls
        running={running}
        canRun={canRun}
        timeoutSec={timeoutSec}
        onTimeoutChange={setTimeoutSec}
        onRun={run}
        onCancel={() => abortRef.current?.abort()}
        progress={progress}
      />

      {results && (
        <section className="results-section">
          <h2>Results</h2>
          <ResultsTable results={results} />
          <ResultsChart results={results} />
        </section>
      )}
    </div>
  )
}
