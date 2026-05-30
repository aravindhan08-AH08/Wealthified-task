// ============================================================
// tabs.js — Tab switching & content rendering
// ============================================================

let activeTab = 0;

const TAB_META = [
  { title: "Investor-wise Purchase per Fund",    desc: "Purchase summary grouped by mutual fund scheme" },
  { title: "Fund-wise Summary per Investor",     desc: "Amount and NAV units purchased by each investor per fund" },
  { title: "Investor List with Purchase Details",desc: "PAN number and total amount invested per investor" },
  { title: "Mutual Fund Summary",                desc: "Total amount, NAV units, and average NAV price per fund" }
];

function setTab(i) {
  activeTab = i;
  document.querySelectorAll('.tab-btn').forEach((b, idx) => b.classList.toggle('active', idx === i));
  document.querySelectorAll('.nav-item').forEach((b, idx) => b.classList.toggle('active', idx === i));
  document.getElementById('pageTitle').textContent = TAB_META[i].title;
  document.getElementById('pageDesc').textContent  = TAB_META[i].desc;
  renderContent();
}

function renderAll() {
  renderMetrics(filtered);
  renderContent();
}

function renderContent() {
  const el = document.getElementById('tabContent');
  el.classList.remove('fade-up');
  void el.offsetWidth;
  el.classList.add('fade-up');
  destroyCharts();

  if      (activeTab === 0) el.innerHTML = buildTab0(filtered);
  else if (activeTab === 1) el.innerHTML = buildTab1(filtered);
  else if (activeTab === 2) el.innerHTML = buildTab2(filtered);
  else                      el.innerHTML = buildTab3(filtered);

  if (activeTab === 3) setTimeout(() => buildFundChart(filtered), 60);
}

// ---- TAB 0: Investor per Fund ----
function buildTab0(filtered) {
  if (!filtered.length) return '<div class="empty">No transactions found in selected date range.</div>';
  const byScheme = {};
  filtered.forEach(r => {
    if (!byScheme[r.scheme]) byScheme[r.scheme] = { scheme: r.scheme, type: r.schemeType, rows: [], totalAmt: 0, totalUnits: 0 };
    byScheme[r.scheme].rows.push(r);
    byScheme[r.scheme].totalAmt   += r.amount;
    byScheme[r.scheme].totalUnits += r.units;
  });
  return Object.values(byScheme).map(s => `
    <div class="card">
      <div class="card-header">
        <div>
          <div class="card-title">${s.scheme}</div>
          <div class="card-sub">₹${fmt(s.totalAmt)} total &nbsp;·&nbsp; ${fmtU(s.totalUnits)} units</div>
        </div>
        <span class="scheme-type">${s.type}</span>
      </div>
      <table>
        <thead><tr><th>Investor Name</th><th>PAN</th><th>Amount (₹)</th><th>Units</th><th>NAV (₹)</th><th>Date</th></tr></thead>
        <tbody>
          ${s.rows.map(r => `<tr>
            <td>${r.inv}</td>
            <td><span class="pan-badge">${r.pan}</span></td>
            <td class="amount">₹${fmt(r.amount)}</td>
            <td class="units-col">${fmtU(r.units)}</td>
            <td class="units-col">₹${fmt(r.purPrice)}</td>
            <td style="color:var(--text2)">${r.tradeDate}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>`).join('');
}

// ---- TAB 1: Fund per Investor ----
function buildTab1(filtered) {
  if (!filtered.length) return '<div class="empty">No transactions found in selected date range.</div>';
  const byInv = {};
  filtered.forEach(r => {
    if (!byInv[r.pan]) byInv[r.pan] = { inv: r.inv, pan: r.pan, taxStatus: r.taxStatus, rows: [], totalAmt: 0 };
    byInv[r.pan].rows.push(r);
    byInv[r.pan].totalAmt += r.amount;
  });
  return Object.values(byInv).map(iv => `
    <div class="card">
      <div class="card-header">
        <div>
          <div class="card-title">${iv.inv}</div>
          <div class="card-sub"><span class="pan-badge">${iv.pan}</span> &nbsp; ${iv.taxStatus}</div>
        </div>
        <span class="pill pill-green">₹${fmt(iv.totalAmt)}</span>
      </div>
      <table>
        <thead><tr><th>Mutual Fund</th><th>Type</th><th>Amount (₹)</th><th>Units</th><th>NAV (₹)</th></tr></thead>
        <tbody>
          ${iv.rows.map(r => `<tr>
            <td style="max-width:260px">${r.scheme}</td>
            <td><span class="scheme-type">${r.schemeType}</span></td>
            <td class="amount">₹${fmt(r.amount)}</td>
            <td class="units-col">${fmtU(r.units)}</td>
            <td class="units-col">₹${fmt(r.purPrice)}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>`).join('');
}

// ---- TAB 2: Investor List ----
function buildTab2(filtered) {
  if (!filtered.length) return '<div class="empty">No investors found in selected date range.</div>';
  const byPan = {};
  filtered.forEach(r => {
    if (!byPan[r.pan]) byPan[r.pan] = { inv: r.inv, pan: r.pan, totalAmt: 0, txns: 0, taxStatus: r.taxStatus };
    byPan[r.pan].totalAmt += r.amount;
    byPan[r.pan].txns++;
  });
  const rows = Object.values(byPan).sort((a, b) => b.totalAmt - a.totalAmt);
  return `<div class="card">
    <div class="card-header">
      <div><div class="card-title">All Investors</div><div class="card-sub">${rows.length} investors in selected range</div></div>
      <span class="pill pill-blue">${rows.length} records</span>
    </div>
    <table>
      <thead><tr><th>#</th><th>Investor Name</th><th>PAN</th><th>Tax Status</th><th>Transactions</th><th>Total Invested (₹)</th></tr></thead>
      <tbody>
        ${rows.map((r, i) => `<tr>
          <td style="color:var(--text3)">${i + 1}</td>
          <td>${r.inv}</td>
          <td><span class="pan-badge">${r.pan}</span></td>
          <td style="color:var(--text2);font-size:12px">${r.taxStatus}</td>
          <td style="color:var(--text2)">${r.txns}</td>
          <td class="amount">₹${fmt(r.totalAmt)}</td>
        </tr>`).join('')}
      </tbody>
    </table>
  </div>`;
}

// ---- TAB 3: Fund Summary ----
function buildTab3(filtered) {
  if (!filtered.length) return '<div class="empty">No funds found in selected date range.</div>';
  const byScheme = {};
  filtered.forEach(r => {
    if (!byScheme[r.scheme]) byScheme[r.scheme] = { scheme: r.scheme, type: r.schemeType, totalAmt: 0, totalUnits: 0, navSum: 0, navCount: 0 };
    byScheme[r.scheme].totalAmt   += r.amount;
    byScheme[r.scheme].totalUnits += r.units;
    byScheme[r.scheme].navSum     += r.purPrice;
    byScheme[r.scheme].navCount++;
  });
  const funds = Object.values(byScheme).sort((a, b) => b.totalAmt - a.totalAmt);
  return `
    <div class="chart-grid">
      <div class="chart-card">
        <div class="chart-title">Amount invested per fund</div>
        <div style="position:relative;height:220px"><canvas id="amtChart" role="img" aria-label="Bar chart of total amount invested per mutual fund"></canvas></div>
      </div>
      <div class="chart-card">
        <div class="chart-title">Units purchased per fund</div>
        <div style="position:relative;height:220px"><canvas id="unitChart" role="img" aria-label="Bar chart of units purchased per mutual fund"></canvas></div>
      </div>
    </div>
    <div class="card">
      <div class="card-header">
        <div><div class="card-title">Fund-wise breakdown</div><div class="card-sub">${funds.length} fund(s) in selected range</div></div>
        <span class="pill pill-amber">${funds.length} funds</span>
      </div>
      <table>
        <thead><tr><th>Fund Name</th><th>Type</th><th>Total Amount (₹)</th><th>Total Units</th><th>Avg NAV (₹)</th><th>Investors</th></tr></thead>
        <tbody>
          ${funds.map(f => {
            const investorCount = new Set(filtered.filter(r => r.scheme === f.scheme).map(r => r.pan)).size;
            return `<tr>
              <td style="max-width:260px">${f.scheme}</td>
              <td><span class="scheme-type">${f.type}</span></td>
              <td class="amount">₹${fmt(f.totalAmt)}</td>
              <td class="units-col">${fmtU(f.totalUnits)}</td>
              <td class="units-col">₹${fmt(f.navSum / f.navCount)}</td>
              <td style="color:var(--text2)">${investorCount}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>`;
}
