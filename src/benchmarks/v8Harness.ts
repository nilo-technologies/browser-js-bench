import { PRELUDE } from './prelude'

type SourceLoader = () => Promise<string>

// Loaded on demand so ~460KB of benchmark source stays out of the main chunk.
const raw = (load: () => Promise<{ default: string }>): SourceLoader => () => load().then((m) => m.default)

const loadBase = raw(() => import('./v8-v7/base.js?raw'))

export interface V8Benchmark {
  id: string
  name: string
  description: string
  loadSource: SourceLoader
  /** Takes 30s or more on Boa. */
  slow?: boolean
}

export const V8_BENCHMARKS: V8Benchmark[] = [
  { id: 'richards', name: 'Richards', description: 'OS kernel simulation', loadSource: raw(() => import('./v8-v7/richards.js?raw')) },
  { id: 'deltablue', name: 'DeltaBlue', description: 'One-way constraint solver', loadSource: raw(() => import('./v8-v7/deltablue.js?raw')) },
  { id: 'crypto', name: 'Crypto', description: 'RSA encryption and decryption', loadSource: raw(() => import('./v8-v7/crypto.js?raw')), slow: true },
  { id: 'raytrace', name: 'RayTrace', description: 'Ray tracer', loadSource: raw(() => import('./v8-v7/raytrace.js?raw')) },
  {
    id: 'earley-boyer',
    name: 'EarleyBoyer',
    description: 'Scheme-to-JS compiled parser and theorem prover',
    loadSource: raw(() => import('./v8-v7/earley-boyer.js?raw')),
    slow: true,
  },
  {
    id: 'regexp',
    name: 'RegExp',
    description: 'Regular expressions from popular web pages',
    loadSource: raw(() => import('./v8-v7/regexp.js?raw')),
    slow: true,
  },
  { id: 'splay', name: 'Splay', description: 'Splay tree manipulation (memory management)', loadSource: raw(() => import('./v8-v7/splay.js?raw')) },
  { id: 'navier-stokes', name: 'NavierStokes', description: '2D fluid dynamics solver', loadSource: raw(() => import('./v8-v7/navier-stokes.js?raw')) },
]

export interface V8Result {
  /** Suite score as computed by base.js; higher is better. */
  score: number | null
  suites: { name: string; score: number }[]
  benchmarks: { name: string; usPerRun: number }[]
  errors: string[]
  out: string[]
}

const RUNNER = `
var __v8 = { score: null, suites: [], benchmarks: [], errors: [] };
BenchmarkSuite.RunSuites({
  NotifyResult: function (name, score) { __v8.suites.push({ name: name, score: Number(score) }); },
  NotifyError: function (name, error) {
    __v8.errors.push(name + ': ' + String(error && error.stack ? error.stack : error));
  },
  NotifyScore: function (score) { __v8.score = Number(score); }
});
for (var __s = 0; __s < BenchmarkSuite.suites.length; __s++) {
  var __results = BenchmarkSuite.suites[__s].results || [];
  for (var __r = 0; __r < __results.length; __r++) {
    __v8.benchmarks.push({ name: __results[__r].benchmark.name, usPerRun: __results[__r].time });
  }
}
if (__v8.errors.length || !isFinite(__v8.score)) __v8.score = null;
__asciiJson({ score: __v8.score, suites: __v8.suites, benchmarks: __v8.benchmarks, errors: __v8.errors, out: __out });
`

export async function buildV8Script(benchmark: V8Benchmark): Promise<string> {
  const [base, source] = await Promise.all([loadBase(), benchmark.loadSource()])
  return [PRELUDE, base, source, RUNNER].join('\n;\n')
}
