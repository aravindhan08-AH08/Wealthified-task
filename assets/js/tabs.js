// ============================================================
// tabs.js — Navigation & Multi-View Rendering Engine
// ============================================================

let activeTab = 0;

const TAB_META = [
  { title: "Dashboard Overview",    desc: "Real-time mutual fund performance metrics",      bc: "Overview" },
  { title: "Transaction History",   desc: "Complete transaction ledger database",           bc: "Transactions" },
  { title: "All Investors",         desc: "List of all unique investor accounts",           bc: "All Investors" },
  { title: "All Funds",             desc: "Capital allocations across all mutual schemes",   bc: "All Funds" },
  { title: "Investor-wise Ledger",  desc: "Portfolios and holdings grouped by investor",    bc: "Investor Summary" },
  { title: "Fund-wise Ledger",      desc: "Investor capital summaries grouped by scheme",    bc: "Fund Summary" }
];

/**
 * Switch the active tab, highlight sidebar navigation, and trigger page redraw.
 */
function setTab(i) {
  activeTab = i;
  
  // Toggle active class on sidebar navigation items
  document.querySelectorAll('.nav-item').forEach((item, idx) => {
    item.classList.toggle('active', idx === i);
  });
  
  // Update header text and breadcrumb dynamically
  document.getElementById('pageTitle').textContent = TAB_META[i].title;
  document.getElementById('pageDesc').textContent  = TAB_META[i].desc;
  document.getElementById('breadcrumbActive').textContent = TAB_META[i].bc;
  
  renderContent();
}

/**
 * Redraws complete metric cards and active tab pages.
 */
function renderAll() {
  renderMetrics(filtered);
  renderContent();
}

/**
 * Selects and renders the correct view markup based on activeTab.
 */
function renderContent() {
  const el = document.getElementById('tabContent');
  if (!el) return;
  
  el.classList.remove('fade-up');
  void el.offsetWidth; // Force CSS animation repaint
  el.classList.add('fade-up');
  
  destroyCharts();

  switch(activeTab) {
    case 0:
      el.innerHTML = buildOverviewTab(filtered);
      // Let the canvas render fully before drawing Chart.js graphs
      setTimeout(() => buildFundChart(filtered), 60);
      break;
    case 1:
      el.innerHTML = buildTransactionsTab(filtered);
      break;
    case 2:
      el.innerHTML = buildAllInvestorsTab(filtered);
      break;
    case 3:
      el.innerHTML = buildAllFundsTab(filtered);
      break;
    case 4:
      el.innerHTML = buildInvestorSummaryTab(filtered);
      break;
    case 5:
      el.innerHTML = buildFundSummaryTab(filtered);
      break;
    default:
      el.innerHTML = '<div class="empty">Page not found.</div>';
  }
}

// ============================================================
// TAB 0: OVERVIEW (Charts Grid & Performance Summary Table)
// ============================================================
function buildOverviewTab(filtered) {
  if (!filtered.length) {
    return '<div class="empty">No transaction data available for the selected date range.</div>';
  }

  const byScheme = {};
  filtered.forEach(r => {
    if (!byScheme[r.scheme]) {
      byScheme[r.scheme] = { scheme: r.scheme, type: r.schemeType, totalAmt: 0, totalUnits: 0, navSum: 0, navCount: 0 };
    }
    byScheme[r.scheme].totalAmt   += r.amount;
    byScheme[r.scheme].totalUnits += r.units;
    byScheme[r.scheme].navSum     += r.purPrice;
    byScheme[r.scheme].navCount++;
  });

  const funds = Object.values(byScheme).sort((a, b) => b.totalAmt - a.totalAmt);

  return `
    <!-- Charts Grid Section -->
    <div class="chart-grid">
      <div class="chart-card">
        <div class="chart-header">
          <div class="chart-title">Investments by Fund</div>
          <span class="chart-badge">Bar Chart</span>
        </div>
        <div style="position:relative; height:240px;">
          <canvas id="amtChart" role="img" aria-label="Amount invested per fund bar chart"></canvas>
        </div>
      </div>
      <div class="chart-card">
        <div class="chart-header">
          <div class="chart-title">Units Distribution</div>
          <span class="chart-badge">Doughnut</span>
        </div>
        <div style="position:relative; height:240px;">
          <canvas id="unitChart" role="img" aria-label="Units purchased per fund doughnut chart"></canvas>
        </div>
      </div>
    </div>

    <!-- Fund Performance Summary Table Section -->
    <div class="card">
      <div class="card-header">
        <div>
          <div class="card-title">Fund Performance Summary</div>
          <div class="card-sub">Aggregated metrics per mutual fund scheme</div>
        </div>
        <span class="pill pill-blue">${funds.length} Active Scheme(s)</span>
      </div>
      <div style="overflow-x: auto;">
        <table>
          <thead>
            <tr>
              <th>Mutual Fund</th>
              <th>Category</th>
              <th style="text-align: right;">Total Invested</th>
              <th style="text-align: right;">Total Units</th>
              <th style="text-align: right;">Avg NAV (Weighted)</th>
            </tr>
          </thead>
          <tbody>
            ${funds.map(f => {
              const avgNav = f.totalUnits > 0 ? (f.totalAmt / f.totalUnits) : (f.navSum / f.navCount);
              return `
                <tr>
                  <td style="font-weight: 600; color: var(--text); max-width: 320px;">${f.scheme}</td>
                  <td><span class="scheme-type">${f.type}</span></td>
                  <td class="amount" style="text-align: right; color: var(--accent);">₹${fmt(f.totalAmt)}</td>
                  <td class="units-col" style="text-align: right;">${fmtU(f.totalUnits)}</td>
                  <td class="units-col" style="text-align: right; font-weight: 500; color: var(--text);">₹${fmt(avgNav)}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// ============================================================
// TAB 1: TRANSACTIONS (Granular history list)
// ============================================================
function buildTransactionsTab(filtered) {
  if (!filtered.length) return '<div class="empty">No transactions found.</div>';
  return `
    <div class="card">
      <div class="card-header">
        <div>
          <div class="card-title">Transaction Registry</div>
          <div class="card-sub">Granular logs of all transactions in selected range</div>
        </div>
        <span class="pill pill-blue">${filtered.length} Record(s)</span>
      </div>
      <div style="overflow-x: auto;">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Trade Date</th>
              <th>Investor</th>
              <th>PAN</th>
              <th>Mutual Fund</th>
              <th>Category</th>
              <th style="text-align: right;">Amount (₹)</th>
              <th style="text-align: right;">Units</th>
              <th style="text-align: right;">NAV (₹)</th>
            </tr>
          </thead>
          <tbody>
            ${filtered.map((r, i) => `
              <tr>
                <td style="color: var(--text3); font-weight: 500;">${i + 1}</td>
                <td style="font-weight: 500;">${r.tradeDate}</td>
                <td style="font-weight: 600; color: var(--text);">${r.inv}</td>
                <td><span class="pan-badge">${r.pan}</span></td>
                <td style="max-width: 200px;">${r.scheme}</td>
                <td><span class="scheme-type">${r.schemeType}</span></td>
                <td class="amount-green" style="text-align: right;">₹${fmt(r.amount)}</td>
                <td class="units-col" style="text-align: right;">${fmtU(r.units)}</td>
                <td class="units-col" style="text-align: right;">₹${fmt(r.purPrice)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// ============================================================
// TAB 2: ALL INVESTORS (Unique Investor ledger)
// ============================================================
function buildAllInvestorsTab(filtered) {
  if (!filtered.length) return '<div class="empty">No investors found.</div>';
  const byPan = {};
  filtered.forEach(r => {
    if (!byPan[r.pan]) {
      byPan[r.pan] = { inv: r.inv, pan: r.pan, totalAmt: 0, txns: 0, taxStatus: r.taxStatus };
    }
    byPan[r.pan].totalAmt += r.amount;
    byPan[r.pan].txns++;
  });
  const rows = Object.values(byPan).sort((a, b) => b.totalAmt - a.totalAmt);
  return `
    <div class="card">
      <div class="card-header">
        <div>
          <div class="card-title">Investor Ledger</div>
          <div class="card-sub">${rows.length} unique investor profiles discovered</div>
        </div>
        <span class="pill pill-green">${rows.length} Investor(s)</span>
      </div>
      <div style="overflow-x: auto;">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Investor Name</th>
              <th>PAN</th>
              <th>Tax Status</th>
              <th>Active Investments</th>
              <th style="text-align: right;">Total Capital Invested</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map((r, i) => `
              <tr>
                <td style="color: var(--text3); font-weight: 500;">${i + 1}</td>
                <td style="font-weight: 600; color: var(--text);">${r.inv}</td>
                <td><span class="pan-badge">${r.pan}</span></td>
                <td style="font-weight: 500;">${r.taxStatus}</td>
                <td style="font-weight: 500; color: var(--text);">${r.txns}</td>
                <td class="amount" style="text-align: right; color: var(--accent);">₹${fmt(r.totalAmt)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// ============================================================
// TAB 3: ALL FUNDS (List of mutual fund schemes)
// ============================================================
function buildAllFundsTab(filtered) {
  if (!filtered.length) return '<div class="empty">No schemes found.</div>';
  const byScheme = {};
  filtered.forEach(r => {
    if (!byScheme[r.scheme]) {
      byScheme[r.scheme] = { scheme: r.scheme, type: r.schemeType, totalAmt: 0, totalUnits: 0 };
    }
    byScheme[r.scheme].totalAmt   += r.amount;
    byScheme[r.scheme].totalUnits += r.units;
  });
  const rows = Object.values(byScheme).sort((a, b) => b.totalAmt - a.totalAmt);
  return `
    <div class="card">
      <div class="card-header">
        <div>
          <div class="card-title">Mutual Fund Portfolio Directory</div>
          <div class="card-sub">${rows.length} unique active fund schemes tracked</div>
        </div>
        <span class="pill pill-amber">${rows.length} Scheme(s)</span>
      </div>
      <div style="overflow-x: auto;">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Mutual Fund Scheme</th>
              <th>Category</th>
              <th style="text-align: right;">Total Capital Allocation</th>
              <th style="text-align: right;">Cumulative Units Held</th>
              <th style="text-align: right;">Weighted Avg NAV</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map((r, i) => `
              <tr>
                <td style="color: var(--text3); font-weight: 500;">${i + 1}</td>
                <td style="font-weight: 600; color: var(--text); max-width: 300px;">${r.scheme}</td>
                <td><span class="scheme-type">${r.type}</span></td>
                <td class="amount" style="text-align: right; color: var(--accent);">₹${fmt(r.totalAmt)}</td>
                <td class="units-col" style="text-align: right;">${fmtU(r.totalUnits)}</td>
                <td class="units-col" style="text-align: right; font-weight: 500; color: var(--text);">₹${fmt(r.totalUnits > 0 ? (r.totalAmt / r.totalUnits) : 0)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// ============================================================
// TAB 4: INVESTOR-WISE LEDGER (Grouped portfolios per investor)
// ============================================================
function buildInvestorSummaryTab(filtered) {
  if (!filtered.length) return '<div class="empty">No holdings found.</div>';
  const byInv = {};
  filtered.forEach(r => {
    if (!byInv[r.pan]) {
      byInv[r.pan] = { inv: r.inv, pan: r.pan, taxStatus: r.taxStatus, rows: [], totalAmt: 0 };
    }
    byInv[r.pan].rows.push(r);
    byInv[r.pan].totalAmt += r.amount;
  });
  return Object.values(byInv).map(iv => `
    <div class="card">
      <div class="card-header">
        <div>
          <div class="card-title">${iv.inv}</div>
          <div class="card-sub"><span class="pan-badge">${iv.pan}</span> &nbsp;·&nbsp; ${iv.taxStatus}</div>
        </div>
        <span class="pill pill-green">₹${fmt(iv.totalAmt)}</span>
      </div>
      <div style="overflow-x: auto;">
        <table>
          <thead>
            <tr>
              <th>Mutual Fund</th>
              <th>Category</th>
              <th style="text-align: right;">Amount (₹)</th>
              <th style="text-align: right;">Units</th>
              <th style="text-align: right;">NAV (₹)</th>
            </tr>
          </thead>
          <tbody>
            ${iv.rows.map(r => `
              <tr>
                <td style="font-weight: 600; color: var(--text); max-width:280px">${r.scheme}</td>
                <td><span class="scheme-type">${r.schemeType}</span></td>
                <td class="amount-green" style="text-align: right;">₹${fmt(r.amount)}</td>
                <td class="units-col" style="text-align: right;">${fmtU(r.units)}</td>
                <td class="units-col" style="text-align: right;">₹${fmt(r.purPrice)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `).join('');
}

// ============================================================
// TAB 5: FUND-WISE LEDGER (Grouped investors per fund scheme)
// ============================================================
function buildFundSummaryTab(filtered) {
  if (!filtered.length) return '<div class="empty">No schemes found.</div>';
  const byScheme = {};
  filtered.forEach(r => {
    if (!byScheme[r.scheme]) {
      byScheme[r.scheme] = { scheme: r.scheme, type: r.schemeType, rows: [], totalAmt: 0, totalUnits: 0 };
    }
    byScheme[r.scheme].rows.push(r);
    byScheme[r.scheme].totalAmt   += r.amount;
    byScheme[r.scheme].totalUnits += r.units;
  });
  return Object.values(byScheme).map(s => `
    <div class="card">
      <div class="card-header">
        <div>
          <div class="card-title">${s.scheme}</div>
          <div class="card-sub">₹${fmt(s.totalAmt)} invested &nbsp;·&nbsp; ${fmtU(s.totalUnits)} total units</div>
        </div>
        <span class="scheme-type">${s.type}</span>
      </div>
      <div style="overflow-x: auto;">
        <table>
          <thead>
            <tr>
              <th>Investor Name</th>
              <th>PAN</th>
              <th style="text-align: right;">Amount (₹)</th>
              <th style="text-align: right;">Units</th>
              <th style="text-align: right;">NAV (₹)</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            ${s.rows.map(r => `
              <tr>
                <td style="font-weight: 600; color: var(--text);">${r.inv}</td>
                <td><span class="pan-badge">${r.pan}</span></td>
                <td class="amount-green" style="text-align: right;">₹${fmt(r.amount)}</td>
                <td class="units-col" style="text-align: right;">${fmtU(r.units)}</td>
                <td class="units-col" style="text-align: right;">₹${fmt(r.purPrice)}</td>
                <td style="font-weight: 500;">${r.tradeDate}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `).join('');
}
