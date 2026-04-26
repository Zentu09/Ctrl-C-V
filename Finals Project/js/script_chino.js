let chinoChartInstances = {};
let uniqueRegions = [];

// ── LOAD DATA ─────────────────────────────
function onDataReady(dataset) {
  if (!dataset || !dataset.length) {
    console.error("Dataset is empty!");
    return;
  }

  window._chinoDataset = dataset;
  extractRegions(dataset);
  populateRegionSelector();
}

// ── REGION HANDLING (Minimal Fix) ─────────────────────────
function extractRegions(dataset) {
  const regions = new Set();
  dataset.forEach(row => {
    const r = getField(row, "sub_region", "region", "Region");
    if (r) regions.add(String(r).trim());
  });
  uniqueRegions = Array.from(regions).sort();
}

function populateRegionSelector() {
  const select = document.getElementById("regionSelect");
  if (!select) return;

  select.innerHTML = "";

  uniqueRegions.forEach(region => {
    const option = document.createElement("option");
    option.value = region;
    option.textContent = region;
    select.appendChild(option);
  });

  // Simple and reliable event listener
  select.onchange = function() {
    const region = this.value;
    if (region) {
      initCharts(window._chinoDataset, region);
    }
  };

  // Load the first region automatically
  if (uniqueRegions.length > 0) {
    initCharts(window._chinoDataset, uniqueRegions[0]);
  }
}

// ── INIT ALL CHARTS ─────────────────────────
function initCharts(dataset, region) {
  // Required charts (these canvases exist in your HTML)
  drawBarChart(dataset, region);
  drawScatterPlot(dataset, region);
  drawHistogram(dataset, region);
  drawPieChart(dataset, region);

  // Original charts - commented out because the canvases don't exist in HTML
  // If you want them, add the corresponding <canvas id="gasolineChart"> etc. inside .chino-chart-grid
  /*
  drawGasolineChart(dataset, region);
  drawAffordabilityChart(dataset, region);
  drawImportDependencyChart(dataset, region);
  drawEVChart(dataset, region);
  */
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
    if (row[k] !== undefined && row[k] !== "") return row[k];
    const lower = k.toLowerCase();
    if (row[lower] !== undefined && row[lower] !== "") return row[lower];
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
    return r && r.toString().trim() === region.toString().trim();
  });
}

// ── REQUIRED CHARTS (working) ─────────────────────────

function drawBarChart(dataset, region) {
  destroyIfExists("barChart");
  const rows = filterByRegion(dataset, region)
    .map(r => ({
      label: getField(r, "country", "Country") || "Unknown",
      value: safeNum(getField(r, "gasoline_usd_per_liter"))
    }))
    .filter(r => r.value !== null);

  if (!rows.length) return showNoData("barChart");

  chinoChartInstances["barChart"] = new Chart(
    document.getElementById("barChart").getContext("2d"),
    {
      type: "bar",
      data: {
        labels: rows.map(r => r.label),
        datasets: [{
          label: "Gasoline USD/Liter",
          data: rows.map(r => r.value),
          backgroundColor: "#4f8ef7",
          borderColor: "#2c6fd1",
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: true } },
        scales: { y: { beginAtZero: true } }
      }
    }
  );
}

function drawScatterPlot(dataset, region) {
  destroyIfExists("scatterChart");
  const dataPoints = filterByRegion(dataset, region)
    .map(r => ({
      x: safeNum(getField(r, "fuel_affordability_index")),
      y: safeNum(getField(r, "ev_adoption_pct"))
    }))
    .filter(d => d.x !== null && d.y !== null);

  if (!dataPoints.length) return showNoData("scatterChart");

  chinoChartInstances["scatterChart"] = new Chart(
    document.getElementById("scatterChart").getContext("2d"),
    {
      type: "scatter",
      data: {
        datasets: [{
          label: "Affordability vs EV Adoption",
          data: dataPoints,
          backgroundColor: "#f76b4f"
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { title: { display: true, text: "Fuel Affordability Index" } },
          y: { title: { display: true, text: "EV Adoption %" }, beginAtZero: true }
        }
      }
    }
  );
}

function drawHistogram(dataset, region) {
  destroyIfExists("histChart");
  const values = filterByRegion(dataset, region)
    .map(r => safeNum(getField(r, "oil_import_dependency_pct")))
    .filter(v => v !== null);

  if (!values.length) return showNoData("histChart");

  const bins = 6;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const step = (max - min) / bins || 1;

  const counts = new Array(bins).fill(0);
  const binLabels = [];

  values.forEach(v => {
    let i = Math.floor((v - min) / step);
    i = Math.min(Math.max(i, 0), bins - 1);
    counts[i]++;
  });

  for (let i = 0; i < bins; i++) {
    const binStart = (min + i * step).toFixed(1);
    const binEnd = (min + (i + 1) * step).toFixed(1);
    binLabels.push(`${binStart} - ${binEnd}`);
  }

  chinoChartInstances["histChart"] = new Chart(
    document.getElementById("histChart").getContext("2d"),
    {
      type: "bar",
      data: {
        labels: binLabels,
        datasets: [{
          label: "Oil Import Dependency %",
          data: counts,
          backgroundColor: "#9c4ff7"
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: true } }
      }
    }
  );
}

function drawPieChart(dataset, region) {
  destroyIfExists("pieChart");
  const rows = filterByRegion(dataset, region)
    .map(r => ({
      label: getField(r, "country", "Country") || "Unknown",
      value: safeNum(getField(r, "ev_adoption_pct"))
    }))
    .filter(r => r.value !== null);

  if (!rows.length) return showNoData("pieChart");

  chinoChartInstances["pieChart"] = new Chart(
    document.getElementById("pieChart").getContext("2d"),
    {
      type: "pie",
      data: {
        labels: rows.map(r => r.label),
        datasets: [{
          data: rows.map(r => r.value),
          backgroundColor: [
            "#4f8ef7", "#f76b4f", "#4fca8e", "#f7c94f",
            "#9c4ff7", "#ff6b9d", "#4ecdc4", "#45b7d1"
          ]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: "right" }
        }
      }
    }
  );
}

// ── NO DATA HELPER ────────────────────────────────
function showNoData(id) {
  const canvas = document.getElementById(id);
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  ctx.save();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = "16px Arial";
  ctx.textAlign = "center";
  ctx.fillStyle = "#888";
  ctx.fillText("No data available for this region", canvas.width / 2, canvas.height / 2);
  ctx.restore();
}

// ── INITIALIZE ─────────────────────────────
document.addEventListener('DOMContentLoaded', function() {
  if (typeof embeddedDataset !== 'undefined' && embeddedDataset.length > 0) {
    onDataReady(embeddedDataset);
  } else {
    console.error("embeddedDataset is not defined or empty!");
  }
});