import type { CustomResult } from '../benchmarks/customHarness'
import type { V8Result } from '../benchmarks/v8Harness'
import { ENGINES, type EngineId } from '../engines/types'
import { formatMs, formatNumber, metricOf, slowdown, type CellState, type Mode, type ResultSet } from '../results'

const engineLabel = (id: EngineId) => ENGINES.find((e) => e.id === id)?.label ?? id

export function ResultsTable({ results }: { results: ResultSet }) {
  const { mode, engines, rows } = results
  return (
    <div className="table-wrap">
      <table className="results">
        <thead>
          <tr>
            <th>{mode === 'v8' ? 'Benchmark (score, higher is better)' : 'Workload (ms per iteration, lower is better)'}</th>
            {engines.map((e) => (
              <th key={e}>{engineLabel(e)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const native = metricOf(mode, row.cells.native)
            return (
              <tr key={row.id}>
                <th scope="row">{row.label}</th>
                {engines.map((e) => (
                  <td key={e}>
                    <Cell mode={mode} cell={row.cells[e]} engine={e} native={native} />
                  </td>
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function Cell({ mode, cell, engine, native }: { mode: Mode; cell?: CellState; engine: EngineId; native: number | null }) {
  if (!cell || cell.status === 'pending') return <span className="muted">queued</span>
  if (cell.status === 'running') return <span className="running">running...</span>

  const { result } = cell
  const timing = (
    <small className="muted">
      {result.initMs > 1 && <>load {formatMs(result.initMs)} · </>}
      wall {formatMs(result.evalMs)}
    </small>
  )

  if (!result.ok || !result.data) {
    return (
      <div className="cell error">
        <strong>{result.timedOut ? 'timeout' : 'error'}</strong>
        <details>
          <summary>details</summary>
          <pre>{result.error}</pre>
        </details>
        {timing}
      </div>
    )
  }

  const value = metricOf(mode, cell)
  const ratio = engine === 'native' ? null : slowdown(mode, value, native)
  const out = result.data.out
  const errors = mode === 'v8' ? (result.data as V8Result).errors : []
  const extra = mode === 'custom' ? (result.data as CustomResult) : null

  return (
    <div className={`cell${errors.length ? ' error' : ''}`}>
      <strong className="metric">{value == null ? 'failed' : formatNumber(value)}</strong>
      {ratio != null && <span className="ratio">{ratio >= 1 ? `${formatNumber(ratio)}x slower` : `${formatNumber(1 / ratio)}x faster`}</span>}
      {timing}
      {(out.length > 0 || errors.length > 0 || extra) && (
        <details>
          <summary>details</summary>
          {extra && (
            <p className="muted">
              {extra.iterations} iterations in {formatMs(extra.totalMs)} ({extra.clock}), returned <code>{extra.lastValue}</code>
            </p>
          )}
          {mode === 'v8' &&
            (result.data as V8Result).benchmarks.map((b) => (
              <p key={b.name} className="muted">
                {b.name}: {formatNumber(b.usPerRun)} µs/run
              </p>
            ))}
          {errors.length > 0 && <pre>{errors.join('\n')}</pre>}
          {out.length > 0 && <pre>{out.join('\n')}</pre>}
        </details>
      )}
    </div>
  )
}
