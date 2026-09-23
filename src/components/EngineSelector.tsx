import { ENGINES, type EngineId } from '../engines/types'

interface Props {
  selected: EngineId[]
  onChange: (engines: EngineId[]) => void
  disabled?: boolean
}

export function EngineSelector({ selected, onChange, disabled }: Props) {
  const toggle = (id: EngineId) => {
    const next = selected.includes(id) ? selected.filter((e) => e !== id) : [...selected, id]
    // Keep the canonical engine order regardless of click order.
    onChange(ENGINES.map((e) => e.id).filter((e) => next.includes(e)))
  }

  return (
    <fieldset className="panel">
      <legend>Engines</legend>
      {ENGINES.map((engine) => (
        <label key={engine.id} className="check" title={engine.description}>
          <input
            type="checkbox"
            checked={selected.includes(engine.id)}
            onChange={() => toggle(engine.id)}
            disabled={disabled}
          />
          <span>
            <strong>{engine.label}</strong>
            <small>{engine.description}</small>
          </span>
        </label>
      ))}
    </fieldset>
  )
}
