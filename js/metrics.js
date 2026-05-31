// Calculates and renders dashboard metrics (Total Invested, Total Units, Avg NAV, Active Funds)
function renderMetrics(filtered) {
  const totalAmt = filtered.reduce((s, r) => s + r.amount, 0);
  const totalUnits = filtered.reduce((s, r) => s + r.units, 0);
  const uniqueFunds = new Set(filtered.map((r) => r.scheme)).size;

  // Calculate weighted average NAV: Sum(purPrice * units) / Sum(units)
  let weightedNavSum = 0;
  if (totalUnits > 0) {
    weightedNavSum =
      filtered.reduce((s, r) => s + r.purPrice * r.units, 0) / totalUnits;
  }

  // Update DOM labels
  document.getElementById("mTotalAmt").textContent = "₹" + fmt(totalAmt);
  document.getElementById("mTotalUnits").textContent = fmtU(totalUnits);
  document.getElementById("mAvgNav").textContent = "₹" + fmt(weightedNavSum);
  document.getElementById("mFunds").textContent = uniqueFunds;
}
