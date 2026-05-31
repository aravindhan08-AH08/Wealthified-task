// ============================================================
// charts.js — Overview Visualizations (Bar & Doughnut Charts)
// ============================================================

let chartInstances = {};

/**
 * Cleanly destroys any existing chart instances to avoid redraw bugs.
 */
function destroyCharts() {
  Object.values(chartInstances).forEach(c => {
    try {
      c.destroy();
    } catch (e) {
      console.warn("Error destroying chart: ", e);
    }
  });
  chartInstances = {};
}

/**
 * Builds the visual dashboard charts (Bar allocation & Doughnut distribution).
 */
function buildFundChart(filtered) {
  const byScheme = {};
  filtered.forEach(r => {
    if (!byScheme[r.scheme]) {
      byScheme[r.scheme] = { totalAmt: 0, totalUnits: 0 };
    }
    byScheme[r.scheme].totalAmt   += r.amount;
    byScheme[r.scheme].totalUnits += r.units;
  });

  const labels = Object.keys(byScheme).map(s => s.length > 25 ? s.substring(0, 23) + '…' : s);
  const amts   = Object.values(byScheme).map(v => Math.round(v.totalAmt));
  const units  = Object.values(byScheme).map(v => parseFloat(v.totalUnits.toFixed(2)));
  
  // Dynamic, premium light HSL palette
  const COLORS = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];

  const amtCtx  = document.getElementById('amtChart');
  const unitCtx = document.getElementById('unitChart');
  if (!amtCtx || !unitCtx) return;

  // 1. AMOUNT INVESTED BAR CHART
  chartInstances.amt = new Chart(amtCtx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        data: amts,
        backgroundColor: COLORS,
        borderRadius: 8,
        borderSkipped: false,
        barThickness: 24
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: {
          ticks: { color: '#64748b', font: { size: 10.5, family: "'Inter', sans-serif", weight: 500 } },
          grid: { display: false }
        },
        y: {
          ticks: {
            color: '#64748b',
            font: { size: 10.5, family: "'Inter', sans-serif" },
            callback: v => '₹' + v.toLocaleString('en-IN')
          },
          grid: { color: '#f1f5f9' }
        }
      }
    }
  });

  // 2. UNITS DISTRIBUTION DOUGHNUT CHART
  chartInstances.unit = new Chart(unitCtx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data: units,
        backgroundColor: COLORS,
        borderWidth: 2,
        borderColor: '#ffffff',
        hoverOffset: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: {
            color: '#475569',
            boxWidth: 12,
            font: { size: 11, family: "'Inter', sans-serif", weight: 500 },
            padding: 14
          }
        }
      },
      cutout: '70%' // Gives the hollow ring look shown in the screenshots
    }
  });
}
