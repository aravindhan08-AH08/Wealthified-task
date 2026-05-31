// ============================================================
// filters.js — Date range filter logic
// ============================================================

let filtered = [...DATA];

function applyFilter() {
  const from = document.getElementById("fromDate").value;
  const to = document.getElementById("toDate").value;
  filtered = DATA.filter(
    (r) => (!from || r.tradeDate >= from) && (!to || r.tradeDate <= to),
  );
  renderAll();
}

function resetFilter() {
  document.getElementById("fromDate").value = "2025-05-01";
  document.getElementById("toDate").value = "2025-05-31";
  filtered = [...DATA];
  renderAll();
}
