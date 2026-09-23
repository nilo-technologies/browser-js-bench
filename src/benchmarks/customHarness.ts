import { PRELUDE } from './prelude'

export interface CustomOptions {
  code: string
  iterations: number
  warmup: number
}

export interface CustomResult {
  totalMs: number
  perIterMs: number
  iterations: number
  warmup: number
  clock: string
  lastValue: string
  out: string[]
}

/**
 * The user's code becomes the body of a function that is called `warmup`
 * times untimed and then `iterations` times timed. Its return value from the
 * last timed call is reported.
 */
export function buildCustomScript({ code, iterations, warmup }: CustomOptions): string {
  return `${PRELUDE}
function __bench() {
${code}
}
var __warmup = ${Math.max(0, Math.floor(warmup))};
var __iterations = ${Math.max(1, Math.floor(iterations))};
var __last;
for (var __i = 0; __i < __warmup; __i++) __bench();
var __t0 = __now();
for (var __j = 0; __j < __iterations; __j++) __last = __bench();
var __total = __now() - __t0;
__asciiJson({
  totalMs: __total,
  perIterMs: __total / __iterations,
  iterations: __iterations,
  warmup: __warmup,
  clock: __clock,
  lastValue: __last === undefined ? 'undefined' : __fmt(__last),
  out: __out
});
`
}
