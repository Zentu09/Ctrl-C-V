// =============================================
//  script_chino.js — FINAL FIXED VERSION
//  Compatible with Art + CJ
// =============================================

let chinoChartInstances = {};
let uniqueRegions = [];

// ── ENTRY POINT (called by Art's script) ──────
function onDataReady(dataset) {
  if (!dataset || !dataset.length) {
    console.warn("[chino] No dataset received");
    return;
  }

  // 🔥 Normalize dataset (handle .raw structure)
  const normalized = dataset.map(d => d.raw ? d.raw : d);

  window._chinoDataset = normalized;

  extractRegions(normalized);
  populateRegionSelector();
}

// ── REGION HANDLING ───────────────────────────
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

  populateCountrySelector(region);

  selectedCountry = null;

  initCharts(window._chinoDataset, region);
}

// ── CORE FILTER ───────────────────────────────
function filterData(dataset, region, selectedCountry) {
  return dataset.filter(row => {
    const inRegion = row.sub_region === region;
    const inCountry = selectedCountry ? row.country === selectedCountry : true;
    return inRegion && inCountry;
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

// ── INIT CHARTS (ONLY VALID ONES) ─────────────
function initCharts(dataset, region) {
  drawBarChart(dataset, region);
  drawScatterPlot(dataset, region);
  drawHistogram(dataset, region);
  drawPieChart(dataset, region);
}

// ── BAR CHART ────────────────────────────────
function drawBarChart(dataset, region) {
  destroyIfExists("barChart");

  const rows = filterData(dataset, region, selectedCountry)
    .map(r => ({
      label: r.country,
      value: safeNum(r.gasoline_usd_per_liter)
    }))
    .filter(r => r.value !== null);

  if (!rows.length) return showNoData("barChart");

  const ctx = document.getElementById("barChart");
  if (!ctx) return;

  chinoChartInstances["barChart"] = new Chart(ctx, {
    type: "bar",
    data: {
      labels: rows.map(r => r.label),
      datasets: [{
        label: "Gasoline Price (USD/L)",
        data: rows.map(r => r.value)
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } }
    }
  });
}

// ── SCATTER ──────────────────────────────────
function drawScatterPlot(dataset, region) {
  destroyIfExists("scatterChart");

  const data = filterData(dataset, region, selectedCountry)
    .map(r => ({
      x: safeNum(r.fuel_affordability_index),
      y: safeNum(r.ev_adoption_pct)
    }))
    .filter(d => d.x !== null && d.y !== null);

  if (!data.length) return showNoData("scatterChart");

  const ctx = document.getElementById("scatterChart");
  if (!ctx) return;

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

// ── HISTOGRAM ────────────────────────────────
function drawHistogram(dataset, region) {
  destroyIfExists("histChart");

  const values = filterData(dataset, region, selectedCountry)
    .map(r => safeNum(r.oil_import_dependency_pct))
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
  if (!ctx) return;

  chinoChartInstances["histChart"] = new Chart(ctx, {
    type: "bar",
    data: {
      labels: counts.map((_, i) => `Bin ${i + 1}`),
      datasets: [{
        label: "Distribution",
        data: counts
      }]
    }
  });
}

// ── PIE ──────────────────────────────────────
function drawPieChart(dataset, region) {
  destroyIfExists("pieChart");

  const rows = filterData(dataset, region, selectedCountry)
    .map(r => ({
      label: r.country,
      value: safeNum(r.ev_adoption_pct)
    }))
    .filter(r => r.value !== null);

  if (!rows.length) return showNoData("pieChart");

  const ctx = document.getElementById("pieChart");
  if (!ctx) return;

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

// ── NO DATA FALLBACK ─────────────────────────
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

let selectedCountry = null;
function populateCountrySelector(region) {
  const select = document.getElementById("countrySelect");
  if (!select) return;

  select.innerHTML = `<option value="">All Countries (Region View)</option>`;

  const countries = window._chinoDataset
    .filter(r => r.sub_region === region)
    .map(r => r.country)
    .sort();

  countries.forEach(country => {
    const option = document.createElement("option");
    option.value = country;
    option.textContent = country;
    select.appendChild(option);
  });

  selectedCountry = null;
}

function onCountryChange() {
  const country = document.getElementById("countrySelect").value;
  selectedCountry = country || null;

  initCharts(window._chinoDataset, window._chinoSelectedRegion);
}

function filterData(dataset, region, selectedCountry) {
  return dataset.filter(row => {
    const inRegion = row.sub_region === region;
    const inCountry = selectedCountry ? row.country === selectedCountry : true;
    return inRegion && inCountry;
  });
}

document.addEventListener("DOMContentLoaded", () => {
  if (window.globalData) {
    onDataReady(window.globalData);
  }
});