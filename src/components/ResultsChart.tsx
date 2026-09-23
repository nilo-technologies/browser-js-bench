import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ENGINES } from '../engines/types'
import { formatNumber, metricOf, type ResultSet } from '../results'

const COLORS: Record<string, string> = {
  native: '#4f8cff',
  quickjs: '#f5a623',
  boa: '#3ecf8e',
}

export function ResultsChart({ results }: { results: ResultSet }) {
  const { mode, engines, rows } = results
  const data = rows.map((row) => {
    const point: Record<string, string | number | undefined> = { name: row.label }
    for (const e of engines) {
      const value = metricOf(mode, row.cells[e])
      // A log axis cannot show zero or missing values.
      point[e] = value != null && value > 0 ? value : undefined
    }
    return point
  })

  const values = data.flatMap((d) => engines.map((e) => d[e])).filter((v): v is number => typeof v === 'number')
  if (values.length === 0) return null

  // Explicit decade bounds: recharts' automatic log domain can clip the
  // smallest bars. Values just above a power of ten get an extra decade so
  // their bar stays visible.
  const minLog = Math.log10(Math.min(...values))
  const minExp = Math.floor(minLog) - (minLog - Math.floor(minLog) < Math.log10(3) ? 1 : 0)
  const maxExp = Math.max(Math.ceil(Math.log10(Math.max(...values))), minExp + 1)
  const ticks = Array.from({ length: maxExp - minExp + 1 }, (_, i) => 10 ** (minExp + i))

  return (
    <div className="chart">
      <p className="muted chart-title">{mode === 'v8' ? 'Score, log scale (higher is better)' : 'ms per iteration, log scale (lower is better)'}</p>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={data} margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
          <XAxis dataKey="name" stroke="#aaa" />
          <YAxis
            scale="log"
            domain={[ticks[0], ticks[ticks.length - 1]]}
            ticks={ticks}
            allowDataOverflow
            stroke="#aaa"
            tickFormatter={(v: number) => formatNumber(v)}
          />
          <Tooltip
            formatter={(v) => (typeof v === 'number' ? formatNumber(v) : String(v))}
            contentStyle={{ background: '#1d1f24', border: '1px solid #333' }}
          />
          <Legend itemSorter={null} />
          {engines.map((e) => (
            <Bar key={e} dataKey={e} name={ENGINES.find((x) => x.id === e)?.label} fill={COLORS[e]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
