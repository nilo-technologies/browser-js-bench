/** Maximum number of captured output lines per run. */
export const MAX_OUTPUT_LINES = 200

/**
 * Plain ES5 prepended to every script so all engines get the same `print` and
 * `console` (QuickJS and Boa have none by default), plus `__asciiJson`, which
 * the harnesses use to produce their result. The result is kept ASCII-only so
 * Boa's quoted display form of the string is also valid JSON.
 */
export const PRELUDE = `
var __out = [];
function __fmt(v) {
  if (typeof v === 'string') return v;
  try { var s = JSON.stringify(v); return s === undefined ? String(v) : s; }
  catch (e) { return String(v); }
}
function print() {
  if (__out.length >= ${MAX_OUTPUT_LINES}) return;
  var parts = [];
  for (var i = 0; i < arguments.length; i++) parts.push(__fmt(arguments[i]));
  __out.push(parts.join(' '));
}
var console = { log: print, info: print, warn: print, error: print, debug: print };
var __now = (typeof performance !== 'undefined' && performance && typeof performance.now === 'function')
  ? function () { return performance.now(); }
  : function () { return Date.now(); };
var __clock = (typeof performance !== 'undefined' && performance && typeof performance.now === 'function')
  ? 'performance.now' : 'Date.now';
function __asciiJson(value) {
  return JSON.stringify(value).replace(/[\\u007f-\\uffff]/g, function (c) {
    return '\\\\u' + ('0000' + c.charCodeAt(0).toString(16)).slice(-4);
  });
}
`
