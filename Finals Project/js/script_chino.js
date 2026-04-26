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
  selectedMetric = document.getElementById("metricSelect").value;

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

// ── INIT ─────────────────────────────────────
function initCharts(dataset, region) {
  drawBarChart(dataset, region);
  drawScatterPlot(dataset, region);
  drawHistogram(dataset, region);
  drawPieChart(dataset, region);

  renderInsights(dataset, region);
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
        data: rows.map(r => r.value)
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } }
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
        data
      }]
    }
  });
}

// ── HISTOGRAM ───────────────────────────────
function drawHistogram(dataset, region) {
  destroyIfExists("histChart");

  const values = filterData(dataset, region)
    .map(r => safeNum(r[selectedMetric])) // 🔥 NOW DYNAMIC
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

  const ctx = document.getElementById("histChart");

  chinoChartInstances["histChart"] = new Chart(ctx, {
    type: "bar",
    data: {
      labels: counts.map((_, i) => `Bin ${i + 1}`),
      datasets: [{
        label: getMetricLabel(selectedMetric),
        data: counts
      }]
    }
  });
}

// ── PIE ─────────────────────────────────────
function drawPieChart(dataset, region) {
  destroyIfExists("pieChart");

  const rows = filterData(dataset, region)
    .map(r => ({
      label: r.country,
      value: safeNum(r[selectedMetric]) // 🔥 NOW DYNAMIC
    }))
    .filter(r => r.value !== null)
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  if (!rows.length) return showNoData("pieChart");

  const ctx = document.getElementById("pieChart");

  chinoChartInstances["pieChart"] = new Chart(ctx, {
    type: "pie",
    data: {
      labels: rows.map(r => r.label),
      datasets: [{
        data: rows.map(r => r.value)
      }]
    }
  });
}

// ── INSIGHTS ────────────────────────────────
function renderInsights(dataset, region) {
  const data = filterData(dataset, region);

  const values = data
    .map(r => safeNum(r[selectedMetric]))
    .filter(v => v !== null);

  if (!values.length) return;

  const max = Math.max(...values);
  const min = Math.min(...values);
  const avg = values.reduce((a, b) => a + b, 0) / values.length;

  document.getElementById("chino-insights").innerHTML = `
    <div class="stat-card">
      <div class="stat-label">Highest</div>
      <div class="stat-value">${max.toFixed(2)}</div>
    </div>

    <div class="stat-card alt">
      <div class="stat-label">Lowest</div>
      <div class="stat-value">${min.toFixed(2)}</div>
    </div>

    <div class="stat-card alt-2">
      <div class="stat-label">Average</div>
      <div class="stat-value">${avg.toFixed(2)}</div>
    </div>
  `;
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