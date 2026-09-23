interface Props {
  running: boolean
  canRun: boolean
  timeoutSec: number
  onTimeoutChange: (sec: number) => void
  onRun: () => void
  onCancel: () => void
  progress: string | null
}

export function RunControls({ running, canRun, timeoutSec, onTimeoutChange, onRun, onCancel, progress }: Props) {
  return (
    <div className="run-controls">
      {running ? (
        <button className="primary" onClick={onCancel}>
          Cancel
        </button>
      ) : (
        <button className="primary" onClick={onRun} disabled={!canRun}>
          Run
        </button>
      )}
      <label>
        Timeout per engine (s)
        <input type="number" min={1} value={timeoutSec} onChange={(e) => onTimeoutChange(Number(e.target.value))} disabled={running} />
      </label>
      {progress && <span className="progress">{progress}</span>}
    </div>
  )
}
