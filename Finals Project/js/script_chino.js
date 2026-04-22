// =============================================
//  script_chino.js — FINAL CLEAN VERSION
// =============================================

let chinoChartInstances = {};
let uniqueRegions = [];

// 🔥 FILE PATH (adjust if needed)
const FILE_PATH = "asia_fuel_prices_detailed.csv";

// ── LOAD CSV ────────────────────────────────
fetch(FILE_PATH)
  .then(res => res.text())
  .then(csv => {
    const data = parseCSV(csv);
    onDataReady(data);
  })
  .catch(err => console.error("CSV Load Error:", err));

// ── CSV PARSER (flexible mapping) ───────────
function parseCSV(text) {
  const rows = text.trim().split("\n");
  const headers = rows[0].split(",");

  return rows.slice(1).map(row => {
    const cols = row.split(",");

    let obj = {};
    headers.forEach((h, i) => {
      obj[h.trim()] = cols[i];
    });

    return obj;
  });
}

// ── ENTRY POINT ─────────────────────────────
function onDataReady(dataset) {
  if (!dataset || !dataset.length) {
    console.warn("No dataset received");
    return;
  }

  window._chinoDataset = dataset;
  console.log("[chino] Loaded dataset sample:", dataset[0]);

  extractRegions(dataset);
  populateRegionSelector();
}

// ── REGION HANDLING ─────────────────────────
function extractRegions(dataset) {
  const regions = new Set();

  dataset.forEach(row => {
    const r = getField(row, "sub_region", "region", "Region");
    if (r) regions.add(r);
  });

  uniqueRegions = Array.from(regions).sort();
}

function populateRegionSelector() {
  const select = document.getElementById("regionSelect");
  if (!select) return;

  select.innerHTML = "";

  uniqueRegions.forEach((region, i) => {
    const option = document.createElement("option");
    option.value = region;
    option.textContent = region;
    select.appendChild(option);

    if (i === 0) option.selected = true;
  });

  if (uniqueRegions.length > 0) {
    window._chinoSelectedRegion = uniqueRegions[0];
    initCharts(window._chinoDataset, uniqueRegions[0]);
  }
}

function onRegionChange() {
  const region = document.getElementById("regionSelect").value;
  window._chinoSelectedRegion = region;
  initCharts(window._chinoDataset, region);
}

// ── INIT ALL CHARTS ─────────────────────────
function initCharts(dataset, region) {

  // Original charts
  drawGasolineChart(dataset, region);
  drawAffordabilityChart(dataset, region);
  drawImportDependencyChart(dataset, region);
  drawEVChart(dataset, region);

  // Required charts
  drawBarChart(dataset, region);
  drawScatterPlot(dataset, region);
  drawHistogram(dataset, region);
  drawPieChart(dataset, region);
}

// ── HELPERS ─────────────────────────────────
function destroyIfExists(id) {
  if (chinoChartInstances[id]) {
    chinoChartInstances[id].destroy();
    delete chinoChartInstances[id];
  }
}

function getField(row, ...keys) {
  for (let k of keys) {
    // Try exact match
    if (row[k] !== undefined && row[k] !== "") return row[k];
    // Try lowercase match
    const lower = k.toLowerCase();
    if (row[lower] !== undefined && row[lower] !== "") return row[lower];
    // Try uppercase match
    const upper = k.toUpperCase();
    if (row[upper] !== undefined && row[upper] !== "") return row[upper];
  }
  return null;
}

function safeNum(v) {
  if (v === null || v === undefined) return null;

  const cleaned = String(v).trim().replace(/[^0-9.-]/g, "");
  const n = parseFloat(cleaned);

  return isNaN(n) ? null : n;
}

function filterByRegion(dataset, region) {
  return dataset.filter(row => {
    const r = getField(row, "sub_region", "region", "Region");
    return r === region;
  });
}

// ── ORIGINAL CHARTS ─────────────────────────

// 1 Gasoline
function drawGasolineChart(dataset, region) {
  destroyIfExists("gasolineChart");
  const rows = filterByRegion(dataset, region)
    .map(r => ({
      label: getField(r, "country", "Country"),
      value: safeNum(getField(r, "gasoline_usd_per_liter"))
    }))
    .filter(r => r.value !== null);
  console.log("[chino] Gasoline chart data:", rows);
  if (!rows.length) return showNoData("gasolineChart");
  chinoChartInstances["gasolineChart"] = new Chart(
    document.getElementById("gasolineChart").getContext("2d"),
    {
      type: "bar",
      data: {
        labels: rows.map(r => r.label),
        datasets: [{
          label: "Gasoline (USD/L)",
          data: rows.map(r => r.value),
          backgroundColor: "#4f8ef7"
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } }
      }
    }
  );
}

// 2 Affordability
function drawAffordabilityChart(dataset, region) {
  destroyIfExists("affordabilityChart");
  const rows = filterByRegion(dataset, region)
    .map(r => ({
      label: getField(r, "country", "Country"),
      value: safeNum(getField(r, "fuel_affordability_index"))
    }))
    .filter(r => r.value !== null);
  console.log("[chino] Affordability chart data:", rows);
  if (!rows.length) return showNoData("affordabilityChart");
  chinoChartInstances["affordabilityChart"] = new Chart(
    document.getElementById("affordabilityChart").getContext("2d"),
    {
      type: "bar",
      data: {
        labels: rows.map(r => r.label),
        datasets: [{
          label: "Affordability Index",
          data: rows.map(r => r.value),
          backgroundColor: "#f7c94f"
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } }
      }
    }
  );
}

// 3 Import
function drawImportDependencyChart(dataset, region) {
  destroyIfExists("importChart");
  const rows = filterByRegion(dataset, region)
    .map(r => ({
      label: getField(r, "country", "Country"),
      value: safeNum(getField(r, "oil_import_dependency_pct"))
    }))
    .filter(r => r.value !== null);
  console.log("[chino] Import Dependency chart data:", rows);
  if (!rows.length) return showNoData("importChart");
  chinoChartInstances["importChart"] = new Chart(
    document.getElementById("importChart").getContext("2d"),
    {
      type: "bar",
      data: {
        labels: rows.map(r => r.label),
        datasets: [{
          label: "Oil Import Dependency (%)",
          data: rows.map(r => r.value),
          backgroundColor: "#f76b4f"
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } }
      }
    }
  );
}

// 4 EV
function drawEVChart(dataset, region) {
  destroyIfExists("evChart");
  const rows = filterByRegion(dataset, region)
    .map(r => ({
      label: getField(r, "country", "Country"),
      value: safeNum(getField(r, "ev_adoption_pct"))
    }))
    .filter(r => r.value !== null);
  console.log("[chino] EV chart data:", rows);
  if (!rows.length) return showNoData("evChart");
  chinoChartInstances["evChart"] = new Chart(
    document.getElementById("evChart").getContext("2d"),
    {
      type: "bar",
      data: {
        labels: rows.map(r => r.label),
        datasets: [{
          label: "EV Adoption (%)",
          data: rows.map(r => r.value),
          backgroundColor: "#4fca8e"
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } }
      }
    }
  );
}

// ── REQUIRED CHARTS ─────────────────────────

// BAR
function drawBarChart(dataset, region) {
  destroyIfExists("barChart");

  const rows = filterByRegion(dataset, region)
    .map(r => ({
      label: getField(r, "country", "Country"),
      value: safeNum(getField(r, "gasoline_usd_per_liter"))
    }))
    .filter(r => r.value !== null);

  if (!rows.length) return showNoData("barChart");

  chinoChartInstances["barChart"] = new Chart(
    document.getElementById("barChart"),
    {
      type: "bar",
      data: {
        labels: rows.map(r => r.label),
        datasets: [{ data: rows.map(r => r.value) }]
      }
    }
  );
}

// SCATTER
function drawScatterPlot(dataset, region) {
  destroyIfExists("scatterChart");

  const data = filterByRegion(dataset, region)
    .map(r => ({
      x: safeNum(getField(r, "fuel_affordability_index")),
      y: safeNum(getField(r, "ev_adoption_pct"))
    }))
    .filter(d => d.x !== null && d.y !== null);

  if (!data.length) return showNoData("scatterChart");

  chinoChartInstances["scatterChart"] = new Chart(
    document.getElementById("scatterChart"),
    {
      type: "scatter",
      data: {
        datasets: [{ data }]
      }
    }
  );
}

// HISTOGRAM
function drawHistogram(dataset, region) {
  destroyIfExists("histChart");

  const values = filterByRegion(dataset, region)
    .map(r => safeNum(getField(r, "oil_import_dependency_pct")))
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

  chinoChartInstances["histChart"] = new Chart(
    document.getElementById("histChart"),
    {
      type: "bar",
      data: {
        labels: counts.map((_, i) => `Bin ${i+1}`),
        datasets: [{ data: counts }]
      }
    }
  );
}

// PIE
function drawPieChart(dataset, region) {
  destroyIfExists("pieChart");

  const rows = filterByRegion(dataset, region)
    .map(r => ({
      label: getField(r, "country", "Country"),
      value: safeNum(getField(r, "ev_adoption_pct"))
    }))
    .filter(r => r.value !== null);

  if (!rows.length) return showNoData("pieChart");

  chinoChartInstances["pieChart"] = new Chart(
    document.getElementById("pieChart"),
    {
      type: "pie",
      data: {
        labels: rows.map(r => r.label),
        datasets: [{ data: rows.map(r => r.value) }]
      }
    }
  );
}

// ── NO DATA ────────────────────────────────
function showNoData(id) {
  const canvas = document.getElementById(id);
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillText("No data available", canvas.width / 2, canvas.height / 2);
}