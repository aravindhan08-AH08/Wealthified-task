let chartInstances = {};

function destroyCharts() {
  Object.values(chartInstances).forEach(c => { try { c.destroy(); } catch(e) {} });
  chartInstances = {};
}

function buildFundChart(filtered) {
  const byScheme = {};
  filtered.forEach(r => {
    if (!byScheme[r.scheme]) byScheme[r.scheme] = { totalAmt: 0, totalUnits: 0 };
    byScheme[r.scheme].totalAmt   += r.amount;
    byScheme[r.scheme].totalUnits += r.units;
  });

  const labels = Object.keys(byScheme).map(s => s.length > 28 ? s.substring(0, 26) + '…' : s);
  const amts   = Object.values(byScheme).map(v => Math.round(v.totalAmt));
  const units  = Object.values(byScheme).map(v => parseFloat(v.totalUnits.toFixed(4)));
  const COLORS = ['#4f7fff', '#2ecc8f', '#f0a500', '#e05a6a'];

  const amtCtx  = document.getElementById('amtChart');
  const unitCtx = document.getElementById('unitChart');
  if (!amtCtx || !unitCtx) return;

  const baseOpts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: {
        ticks: { color: '#555f7a', font: { size: 11, family: "'DM Sans'" }, autoSkip: false, maxRotation: 20 },
        grid:  { color: 'rgba(255,255,255,0.04)' }
      },
      y: {
        ticks: { color: '#555f7a', font: { size: 11, family: "'DM Sans'" } },
        grid:  { color: 'rgba(255,255,255,0.06)' }
      }
    }
  };

  chartInstances.amt = new Chart(amtCtx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        data: amts,
        backgroundColor: COLORS,
        borderRadius: 6,
        borderSkipped: false
      }]
    },
    options: {
      ...baseOpts,
      scales: {
        ...baseOpts.scales,
        y: {
          ...baseOpts.scales.y,
          ticks: {
            ...baseOpts.scales.y.ticks,
            callback: v => '₹' + v.toLocaleString('en-IN')
          }
        }
      }
    }
  });

  chartInstances.unit = new Chart(unitCtx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        data: units,
        backgroundColor: COLORS.map(c => c + '99'),
        borderRadius: 6,
        borderSkipped: false
      }]
    },
    options: baseOpts
  });
}
