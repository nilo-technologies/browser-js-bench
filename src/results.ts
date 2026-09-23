import type { CustomResult } from './benchmarks/customHarness'
import type { V8Result } from './benchmarks/v8Harness'
import type { EngineId, EngineRunResult } from './engines/types'

export type Mode = 'v8' | 'custom'

export type CellState =
  | { status: 'pending' }
  | { status: 'running' }
  | { status: 'done'; result: EngineRunResult<V8Result | CustomResult> }

export interface ResultRow {
  id: string
  label: string
  cells: Partial<Record<EngineId, CellState>>
}

export interface ResultSet {
  mode: Mode
  engines: EngineId[]
  rows: ResultRow[]
}

/**
 * The headline number for a cell: the V8 score (higher is better) or ms per
 * iteration for custom code (lower is better). Null if the run failed.
 */
export function metricOf(mode: Mode, cell: CellState | undefined): number | null {
  if (!cell || cell.status !== 'done' || !cell.result.ok || !cell.result.data) return null
  if (mode === 'v8') return (cell.result.data as V8Result).score
  return (cell.result.data as CustomResult).perIterMs
}

/** How many times slower `value` is than `native`, for the given mode. */
export function slowdown(mode: Mode, value: number | null, native: number | null): number | null {
  if (value == null || native == null || value <= 0 || native <= 0) return null
  return mode === 'v8' ? native / value : value / native
}

export function formatNumber(value: number): string {
  if (value === 0) return '0'
  const abs = Math.abs(value)
  if (abs >= 1000) return value.toFixed(0)
  if (abs >= 1) return String(Number(value.toPrecision(4)))
  return String(Number(value.toPrecision(3)))
}

export function formatMs(ms: number): string {
  return ms >= 1000 ? `${(ms / 1000).toFixed(2)}s` : `${ms.toFixed(ms < 10 ? 2 : 0)}ms`
}
