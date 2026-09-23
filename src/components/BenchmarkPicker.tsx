import { javascript } from '@codemirror/lang-javascript'
import CodeMirror from '@uiw/react-codemirror'
import { PRESETS } from '../benchmarks/presets'
import { V8_BENCHMARKS } from '../benchmarks/v8Harness'
import type { Mode } from '../results'

export interface CustomSettings {
  code: string
  iterations: number
  warmup: number
}

interface Props {
  mode: Mode
  onModeChange: (mode: Mode) => void
  selectedV8: string[]
  onSelectedV8Change: (ids: string[]) => void
  custom: CustomSettings
  onCustomChange: (custom: CustomSettings) => void
  disabled?: boolean
}

const jsExtensions = [javascript()]

export function BenchmarkPicker({
  mode,
  onModeChange,
  selectedV8,
  onSelectedV8Change,
  custom,
  onCustomChange,
  disabled,
}: Props) {
  const toggleV8 = (id: string) => {
    const next = selectedV8.includes(id) ? selectedV8.filter((b) => b !== id) : [...selectedV8, id]
    onSelectedV8Change(V8_BENCHMARKS.map((b) => b.id).filter((b) => next.includes(b)))
  }

  const applyPreset = (id: string) => {
    const preset = PRESETS.find((p) => p.id === id)
    if (preset) onCustomChange({ code: preset.code, iterations: preset.iterations, warmup: preset.warmup })
  }

  return (
    <fieldset className="panel picker">
      <legend>Workload</legend>
      <div className="tabs" role="tablist">
        <button role="tab" aria-selected={mode === 'v8'} className={mode === 'v8' ? 'active' : ''} onClick={() => onModeChange('v8')} disabled={disabled}>
          V8 benchmark suite
        </button>
        <button role="tab" aria-selected={mode === 'custom'} className={mode === 'custom' ? 'active' : ''} onClick={() => onModeChange('custom')} disabled={disabled}>
          Custom code
        </button>
      </div>

      {mode === 'v8' ? (
        <div className="v8-list">
          <div className="row-actions">
            <button type="button" className="link" onClick={() => onSelectedV8Change(V8_BENCHMARKS.map((b) => b.id))} disabled={disabled}>
              Select all
            </button>
            <button type="button" className="link" onClick={() => onSelectedV8Change([])} disabled={disabled}>
              Clear
            </button>
          </div>
          {V8_BENCHMARKS.map((b) => (
            <label key={b.id} className="check">
              <input type="checkbox" checked={selectedV8.includes(b.id)} onChange={() => toggleV8(b.id)} disabled={disabled} />
              <span>
                <strong>{b.name}</strong>
                <small>
                  {b.description}
                  {b.slow && <em className="warn"> - takes 30-60s on Boa</em>}
                </small>
              </span>
            </label>
          ))}
          <p className="hint">
            Each benchmark runs for at least a few seconds per engine (base.js measures in 1 second chunks until it has 32
            runs). Scores are relative to a reference machine; higher is better.
          </p>
        </div>
      ) : (
        <div className="custom">
          <div className="custom-controls">
            <label>
              Preset
              <select value="" onChange={(e) => applyPreset(e.target.value)} disabled={disabled}>
                <option value="" disabled>
                  Load a preset...
                </option>
                {PRESETS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Iterations
              <input
                type="number"
                min={1}
                value={custom.iterations}
                onChange={(e) => onCustomChange({ ...custom, iterations: Number(e.target.value) })}
                disabled={disabled}
              />
            </label>
            <label>
              Warmup
              <input
                type="number"
                min={0}
                value={custom.warmup}
                onChange={(e) => onCustomChange({ ...custom, warmup: Number(e.target.value) })}
                disabled={disabled}
              />
            </label>
          </div>
          <CodeMirror
            value={custom.code}
            height="260px"
            theme="dark"
            extensions={jsExtensions}
            onChange={(code) => onCustomChange({ ...custom, code })}
            editable={!disabled}
          />
          <p className="hint">
            The code becomes the body of a function that is called <code>warmup</code> times untimed, then{' '}
            <code>iterations</code> times timed. Use <code>return</code> to report a value; <code>console.log</code> and{' '}
            <code>print</code> output is captured.
          </p>
        </div>
      )}
    </fieldset>
  )
}
