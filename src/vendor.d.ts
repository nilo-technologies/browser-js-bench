declare module '@boa-dev/boa_wasm/boa_wasm_bg.js' {
  export function evaluate(src: string): string
  export function __wbg_set_wasm(exports: WebAssembly.Exports): void
}
