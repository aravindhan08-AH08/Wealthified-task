// ============================================================
// metrics.js — Metric card calculations
// ============================================================

function renderMetrics(filtered) {
  const totalAmt   = filtered.reduce((s, r) => s + r.amount, 0);
  const totalUnits = filtered.reduce((s, r) => s + r.units, 0);
  const funds      = new Set(filtered.map(r => r.scheme)).size;
  const investors  = new Set(filtered.map(r => r.pan)).size;

  document.getElementById('mTotalAmt').textContent   = '₹' + fmt(totalAmt);
  document.getElementById('mTotalUnits').textContent = fmtU(totalUnits);
  document.getElementById('mFunds').textContent      = funds;
  document.getElementById('mInvestors').textContent  = investors;
}
