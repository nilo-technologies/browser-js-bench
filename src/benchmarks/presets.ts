export interface Preset {
  id: string
  name: string
  code: string
  iterations: number
  warmup: number
}

export const PRESETS: Preset[] = [
  {
    id: 'sanity',
    name: 'Sanity check (1 + 1)',
    iterations: 1,
    warmup: 0,
    code: `return 1 + 1;`,
  },
  {
    id: 'fib',
    name: 'Recursive Fibonacci',
    iterations: 5,
    warmup: 1,
    code: `function fib(n) {
  return n < 2 ? n : fib(n - 1) + fib(n - 2);
}
return fib(24);`,
  },
  {
    id: 'string-concat',
    name: 'String building',
    iterations: 20,
    warmup: 2,
    code: `var s = '';
for (var i = 0; i < 20000; i++) {
  s += String.fromCharCode(97 + (i % 26));
}
return s.length;`,
  },
  {
    id: 'array-sort',
    name: 'Array sort',
    iterations: 10,
    warmup: 1,
    code: `var seed = 42;
function rand() {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff;
  return seed;
}
var arr = [];
for (var i = 0; i < 20000; i++) arr.push(rand());
arr.sort(function (a, b) { return a - b; });
return arr[0];`,
  },
  {
    id: 'object-alloc',
    name: 'Object allocation',
    iterations: 20,
    warmup: 2,
    code: `var list = [];
for (var i = 0; i < 20000; i++) {
  list.push({ id: i, name: 'item' + i, tags: [i, i + 1] });
}
var sum = 0;
for (var j = 0; j < list.length; j++) sum += list[j].tags[1];
return sum;`,
  },
  {
    id: 'json',
    name: 'JSON round trip',
    iterations: 20,
    warmup: 2,
    code: `var data = [];
for (var i = 0; i < 2000; i++) {
  data.push({ id: i, label: 'row ' + i, values: [i, i * 2, i * 3], ok: i % 2 === 0 });
}
var text = JSON.stringify(data);
return JSON.parse(text).length;`,
  },
]
