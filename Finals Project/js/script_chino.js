// =============================================
//  script_chino.js — FINAL FINAL WORKING VERSION
// =============================================

let chinoChartInstances = {};
let uniqueRegions = [];

let selectedMetric = "gasoline_usd_per_liter";

// ── ENTRY POINT ──────────────────────────────
function onDataReady(dataset) {
  if (!dataset || !dataset.length) {
    console.warn("[chino] No dataset received");
    return;
  }

  const normalized = dataset.map(d => d.raw ? d.raw : d);
  window._chinoDataset = normalized;

  extractRegions(normalized);
  populateRegionSelector();
}

// ── REGION HANDLING ──────────────────────────
function extractRegions(dataset) {
  const regions = new Set();

  dataset.forEach(row => {
    if (row.sub_region) regions.add(row.sub_region);
  });

  uniqueRegions = Array.from(regions).sort();
}

function populateRegionSelector() {
  const select = document.getElementById("regionSelect");
  if (!select) return;

  select.innerHTML = `<option value="ALL">All Regions</option>`;

  uniqueRegions.forEach(region => {
    const option = document.createElement("option");
    option.value = region;
    option.textContent = region;
    select.appendChild(option);
  });

  window._chinoSelectedRegion = "ALL";
  initCharts(window._chinoDataset, "ALL");
}

function onRegionChange() {
  const region = document.getElementById("regionSelect").value;
  window._chinoSelectedRegion = region;

  initCharts(window._chinoDataset, region);
}

// ── METRIC HANDLING ──────────────────────────
function onMetricChange() {
  selectedMetric = document.getElementById("metricSelectChino").value;

  console.log("Selected Metric:", selectedMetric); // DEBUG

  initCharts(window._chinoDataset, window._chinoSelectedRegion);
}

function getMetricLabel(metric) {
  const labels = {
    gasoline_usd_per_liter: "Gasoline (USD/L)",
    diesel_usd_per_liter: "Diesel (USD/L)",
    lpg_usd_per_kg: "LPG (USD/kg)",
    avg_monthly_income_usd: "Avg Monthly Income (USD)",
    fuel_affordability_index: "Fuel Affordability Index",
    oil_import_dependency_pct: "Oil Import Dependency (%)",
    refinery_capacity_kbpd: "Refinery Capacity (KBPD)",
    ev_adoption_pct: "EV Adoption (%)",
    subsidy_cost_bn_usd: "Subsidy Cost (Bn USD)",
    co2_transport_mt: "CO2 Transport (Mt)",
    gasoline_pct_daily_wage: "Gasoline (% Daily Wage)"
  };

  return labels[metric] || "Value";
}

// ── FILTER ───────────────────────────────────
function filterData(dataset, region) {
  return dataset.filter(row => {
    return region === "ALL" ? true : row.sub_region === region;
  });
}

// ── HELPERS ──────────────────────────────────
function destroyIfExists(id) {
  if (chinoChartInstances[id]) {
    chinoChartInstances[id].destroy();
    delete chinoChartInstances[id];
  }
}

function safeNum(v) {
  if (v === null || v === undefined) return null;

  const cleaned = String(v).replace(/[^0-9.-]/g, "");
  const n = parseFloat(cleaned);

  return isNaN(n) ? null : n;
}

function formatNumber(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M"; // millions
  if (num >= 1000) return num.toLocaleString(); // 1,000+
  if (num >= 100) return num.toFixed(0); // no decimals
  if (num >= 10) return num.toFixed(1); // 1 decimal
  return num.toFixed(2); // small values
}

// ── INIT ─────────────────────────────────────
function initCharts(dataset, region) {
  drawBarChart(dataset, region);
  drawScatterPlot(dataset, region);
  drawHistogram(dataset, region);
  drawPieChart(dataset, region);

  renderInsights(dataset, region);
  renderSmartInsight(dataset, region);
}

// ── BAR CHART ───────────────────────────────
function drawBarChart(dataset, region) {
  destroyIfExists("barChart");

  const rows = filterData(dataset, region)
    .map(r => ({
      label: r.country,
      value: safeNum(r[selectedMetric])
    }))
    .filter(r => r.value !== null);

  if (!rows.length) return showNoData("barChart");

  const ctx = document.getElementById("barChart");

  chinoChartInstances["barChart"] = new Chart(ctx, {
    type: "bar",
    data: {
      labels: rows.map(r => r.label),
      datasets: [{
        label: getMetricLabel(selectedMetric),
        data: rows.map(r => r.value),
        borderRadius: 8,
        backgroundColor: "#3b82f6",
        hoverBackgroundColor: "#60a5fa" // 🔥 hover color
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,

      interaction: {
        mode: "index",
        intersect: false
      },

      plugins: {
        legend: {
          labels: {
            color: "#e5e7eb",
            font: {
              size: 12,
              weight: "600"
            }
          }
        },

        tooltip: {
          backgroundColor: "#111",
          titleColor: "#fff",
          bodyColor: "#fff",
          borderColor: "#333",
          borderWidth: 1,
          callbacks: {
            label: function(context) {
              return `${context.label}: ${formatNumber(context.raw)}`;
            }
          }
        }
      },

      scales: {
        x: {
          ticks: { color: "#9ca3af" },
          grid: { color: "rgba(255,255,255,0.05)" }
        },
        y: {
          ticks: { color: "#9ca3af" },
          grid: { color: "rgba(255,255,255,0.05)" }
        }
      }
    }
  });
}

// ── SCATTER ─────────────────────────────────
function drawScatterPlot(dataset, region) {
  destroyIfExists("scatterChart");

  const data = filterData(dataset, region)
    .map(r => ({
      x: safeNum(r.fuel_affordability_index),
      y: safeNum(r.ev_adoption_pct)
    }))
    .filter(d => d.x !== null && d.y !== null);

  if (!data.length) return showNoData("scatterChart");

  const ctx = document.getElementById("scatterChart");

  chinoChartInstances["scatterChart"] = new Chart(ctx, {
    type: "scatter",
    data: {
      datasets: [{
        label: "Affordability vs EV Adoption",
        data,
        pointRadius: 6,
        pointHoverRadius: 8,
        backgroundColor: "#22c55e"
      }]
    },
    options: {
  responsive: true,
  maintainAspectRatio: false,

  plugins: {
    legend: {
      labels: {
        color: "#e5e7eb",
        font: {
          size: 12,
          weight: "600"
        }
      }
    }
  },

  scales: {
    x: {
      title: {
        display: true,
        text: "Fuel Affordability Index",
        color: "#9ca3af"
      },
      ticks: { color: "#9ca3af" },
      grid: { color: "rgba(255,255,255,0.05)" }
    },
    y: {
      title: {
        display: true,
        text: "EV Adoption (%)",
        color: "#9ca3af"
      },
      ticks: { color: "#9ca3af" },
      grid: { color: "rgba(255,255,255,0.05)" }
    }
  }
}
  });
}

// ── HISTOGRAM ───────────────────────────────
function drawHistogram(dataset, region) {
  destroyIfExists("histChart");

  const values = filterData(dataset, region)
    .map(r => safeNum(r[selectedMetric]))
    .filter(v => v !== null);

  if (!values.length) return showNoData("histChart");

  const bins = 5;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const step = (max - min) / bins;

  const counts = new Array(bins).fill(0);

  values.forEach(v => {
    const i = Math.min(Math.floor((v - min) / step), bins - 1);
    counts[i]++;
  });

  const labels = counts.map((_, i) => {
    const start = (min + step * i).toFixed(2);
    const end = (min + step * (i + 1)).toFixed(2);
    return `${start} - ${end}`; // 🔥 REALISTIC LABELS
  });

  const ctx = document.getElementById("histChart");

  chinoChartInstances["histChart"] = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: getMetricLabel(selectedMetric),
        data: counts,
        borderRadius: 6,
        backgroundColor: "#f59e0b",
        hoverBackgroundColor: "#fbbf24" // 🔥 hover color
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,

      interaction: {
        mode: "index",
        intersect: false
      },

      plugins: {
        legend: {
          labels: {
            color: "#e5e7eb",
            font: {
              size: 12,
              weight: "600"
            }
          }
        },

        tooltip: {
          backgroundColor: "#111",
          titleColor: "#fff",
          bodyColor: "#fff",
          borderColor: "#333",
          borderWidth: 1,
          callbacks: {
            label: function(context) {
              return `Count: ${context.raw}`;
            }
          }
        }
      },

      scales: {
        x: {
          ticks: { color: "#9ca3af" },
          grid: { color: "rgba(255,255,255,0.05)" }
        },
        y: {
          ticks: { color: "#9ca3af" },
          grid: { color: "rgba(255,255,255,0.05)" }
        }
      }
    }
  });
}

// ── PIE ─────────────────────────────────────
function drawPieChart(dataset, region) {
  destroyIfExists("pieChart");

  const rows = filterData(dataset, region)
    .map(r => ({
      label: r.country,
      value: safeNum(r[selectedMetric])
    }))
    .filter(r => r.value !== null)
    .sort((a, b) => b.value - a.value);

  if (!rows.length) return showNoData("pieChart");

  const top = rows.slice(0, 4);
  const others = rows.slice(4);

  const othersTotal = others.reduce((sum, r) => sum + r.value, 0);

  if (others.length) {
    top.push({
      label: "Others",
      value: othersTotal
    });
  }

  const total = top.reduce((sum, r) => sum + r.value, 0);

  const ctx = document.getElementById("pieChart");
  if (!ctx) return;
  
  chinoChartInstances["pieChart"] = new Chart(ctx, {
    type: "pie",
    data: {
      labels: top.map(r => r.label),
      datasets: [{
        data: top.map(r => r.value),
        backgroundColor: [
          "#3B82F6", // blue
          "#EF4444", // red
          "#F59E0B", // orange
          "#10B981", // green
          "#6366F1"  // violet (others)
        ],
        borderColor: "#0f172a",
        borderWidth: 2,
        hoverOffset: 12
      }]
    },

    elements: {
      arc: {
        borderWidth: 2
      }
    },

    options: {
      responsive: true,
      maintainAspectRatio: false,

      plugins: {
        legend: {
          position: "top",
          labels: {
            color: "#fff",
            padding: 15,
            boxWidth: 15,
            font: {
              size: 12,
              weight: "600"
            }
          }
        },

        tooltip: {
          backgroundColor: "#111",
          titleColor: "#fff",
          bodyColor: "#fff",
          borderColor: "#333",
          borderWidth: 1,
          callbacks: {
            label: function(context) {
              const value = context.raw;
              const percent = ((value / total) * 100).toFixed(1);
              return `${context.label}: ${formatNumber(value)} (${percent}%)`;
            }
          }
        }
      }
    }
  });
}

// ── INSIGHTS ────────────────────────────────
function renderInsights(dataset, region) {
  const data = filterData(dataset, region);
  if (!data.length) return;

  const values = data
    .map(r => ({
      country: r.country,
      value: safeNum(r[selectedMetric])
    }))
    .filter(v => v.value !== null);

  if (!values.length) return;

  const maxObj = values.reduce((a, b) => a.value > b.value ? a : b);
  const minObj = values.reduce((a, b) => a.value < b.value ? a : b);
  const avg = values.reduce((a, b) => a + b.value, 0) / values.length;

  const metricNames = {
    gasoline_usd_per_liter: "gasoline price",
    diesel_usd_per_liter: "diesel price",
    lpg_usd_per_kg: "LPG price",
    avg_monthly_income_usd: "average income",
    fuel_affordability_index: "fuel affordability",
    oil_import_dependency_pct: "oil dependency",
    refinery_capacity_kbpd: "refinery capacity",
    ev_adoption_pct: "EV adoption",
    subsidy_cost_bn_usd: "fuel subsidy",
    co2_transport_mt: "CO2 emissions",
    gasoline_pct_daily_wage: "fuel burden"
  };

  const metricLabel = metricNames[selectedMetric] || "metric";

  document.getElementById("chino-insights").innerHTML = `
    <div class="stat-card">
      <div class="stat-label">Highest</div>
      <div class="stat-value">${formatNumber(maxObj.value)}</div>
      <div class="stat-description">
        ${maxObj.country} has the highest ${metricLabel} in this region.
      </div>
    </div>

    <div class="stat-card alt">
      <div class="stat-label">Lowest</div>
      <div class="stat-value">${formatNumber(minObj.value)}</div>
      <div class="stat-description">
        ${minObj.country} has the lowest ${metricLabel}, making it the most affordable.
      </div>
    </div>

    <div class="stat-card alt-2">
      <div class="stat-label">Average</div>
      <div class="stat-value">${formatNumber(avg)}</div>
      <div class="stat-description">
        The average ${metricLabel} across the region is shown here.
      </div>
    </div>
  `;
}

function renderSmartInsight(dataset, region) {
  const data = filterData(dataset, region);

  const values = data
    .map(r => safeNum(r[selectedMetric]))
    .filter(v => v !== null);

  if (!values.length) return;

  const avg = values.reduce((sum, v) => sum + v.value, 0) / values.length;

  let message = "";

  if (selectedMetric === "gasoline_usd_per_liter") {
    message = avg > 1.5
      ? "Fuel prices in this region are relatively high, which may impact daily expenses."
      : "";
  }

  else if (selectedMetric === "ev_adoption_pct") {
    message = avg > 50
      ? "This region is leading in electric vehicle adoption."
      : "EV adoption is still growing in this region.";
  }

  else {
    message = "This metric provides insights into regional performance and trends.";
  }

  const el = document.getElementById("chino-analysis");
  if (el) el.innerText = message;
}

// ── NO DATA ─────────────────────────────────
function showNoData(id) {
  const canvas = document.getElementById(id);
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = "14px Arial";
  ctx.fillStyle = "#888";
  ctx.textAlign = "center";
  ctx.fillText("No data available", canvas.width / 2, canvas.height / 2);
}

// ── AUTO INIT ───────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  if (window.globalData) {
    onDataReady(window.globalData);
  }
});