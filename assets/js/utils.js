// ============================================================
// utils.js — Shared helper functions
// ============================================================

// Format number as Indian currency (e.g. 1,49,192.50)
function fmt(n) {
  return Number(n).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

// Format units to 4 decimal places
function fmtU(n) {
  return Number(n).toFixed(4);
}

// Truncate long scheme names
function shortScheme(s, max = 36) {
  return s.length > max ? s.substring(0, max - 2) + '…' : s;
}
