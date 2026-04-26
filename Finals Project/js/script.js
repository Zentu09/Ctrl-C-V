// ====================== GLOBAL STATE ======================
const visibleColumns = [
    "Country", 
    "Gasoline USD per Liter", 
    "Diesel USD per Liter",
    "LPG USD per Liter", 
    "Affordability Index", 
    "Price Date"
];

let markedRows = JSON.parse(localStorage.getItem("markedRows")) || {};

let dataset = [];
let filteredData = [];
let selectedRegions = new Set();
let selectedSubsidy = "all";
let lastSortField = "country";
let lastSortDirection = "asc";

// Modal elements
const modal = document.getElementById("modal");
const modalTitle = document.getElementById("modalTitle");
const modalBody = document.getElementById("modalBody");
const closeModalBtn = document.getElementById("closeModal");

// ====================== VIEW DETAILS MODAL (UNCHANGED - Your Original) ======================
function openModal(data) {
    modalTitle.innerHTML = `<h2>${data.country}</h2>`;
    modalBody.innerHTML = buildModalFields(data);
    modal.classList.remove("hidden");
}

function closeModalFunc() {
    modal.classList.add("hidden");
}

if (closeModalBtn) {
    closeModalBtn.addEventListener("click", closeModalFunc);
}

window.addEventListener("click", (e) => {
    if (e.target === modal) closeModalFunc();
});

function buildModalFields(data) {
    let html = "";
    Object.entries(data.raw).forEach(([key, value]) => {
        html += `
            <div class="field">
                <div class="label">${formatLabel(key)}</div>
                <div class="value">${formatValue(value, key)}</div>
            </div>
        `;
    });
    return html;
}

function formatLabel(key) {
    return key.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

function formatValue(value, key) {
    if (value === null || value === undefined) return "—";

    const str = String(value).trim().toUpperCase();
    const num = Number(value);

    // Subsidy - now checks the correct column name
    if (key === "fuel_subsidy_active" || key.includes("subsidy")) {
        if (str === "TRUE") return `<span class="positive">Active</span>`;
        if (str === "FALSE") return `<span class="negative">Inactive</span>`;
    }

    // Affordability Index
    if (key === "fuel_affordability_index") {
        if (!isNaN(num)) {
            return num >= 6 ? `<span class="positive">${value}</span>` : `<span class="negative">${value}</span>`;
        }
    }

    // Oil Import Dependency
    if (key === "oil_import_dependency_pct") {
        if (!isNaN(num)) {
            return num <= 50 ? `<span class="positive">${value}</span>` : `<span class="negative">${value}</span>`;
        }
    }

    return value;
}

// ====================== ADVANCED FILTER MODAL (Region Selection Fixed) ======================
function openFilterModal() {
    let html = `
        <h2 style="margin:0 0 15px 0;">Filter & Sort Options</h2>
        
        <p><strong>Regions (leave all unchecked to show ALL countries)</strong></p>
        <div id="regionCheckboxes" style="max-height:200px; overflow-y:auto; border:1px solid #ddd; padding:12px; border-radius:6px; background:#f9f9f9; min-height:80px;">
            <em>Loading regions...</em>
        </div>

        <p style="margin-top:15px;"><strong>Subsidy Status</strong></p>
        <label><input type="radio" name="subsidyFilter" value="all" ${selectedSubsidy === "all" ? "checked" : ""}> All Countries</label><br>
        <label><input type="radio" name="subsidyFilter" value="active" ${selectedSubsidy === "active" ? "checked" : ""}> Active Subsidy Only</label><br>
        <label><input type="radio" name="subsidyFilter" value="inactive" ${selectedSubsidy === "inactive" ? "checked" : ""}> Inactive Subsidy Only</label>

        <p style="margin-top:15px;"><strong>Sort By</strong></p>
        <select id="sortField" style="width:100%; padding:8px; margin-bottom:10px;">
            <option value="country" ${lastSortField === "country" ? "selected" : ""}>Country Name</option>
            <option value="gasoline" ${lastSortField === "gasoline" ? "selected" : ""}>Gasoline Price</option>
            <option value="diesel" ${lastSortField === "diesel" ? "selected" : ""}>Diesel Price</option>
            <option value="lpg" ${lastSortField === "lpg" ? "selected" : ""}>LPG Price</option>
            <option value="index" ${lastSortField === "index" ? "selected" : ""}>Affordability Index</option>
            <option value="oil_import" ${lastSortField === "oil_import" ? "selected" : ""}>Oil Import Dependency %</option>
        </select>
        <label><input type="radio" name="sortDirection" value="asc" ${lastSortDirection === "asc" ? "checked" : ""}> Ascending</label><br>
        <label><input type="radio" name="sortDirection" value="desc" ${lastSortDirection === "desc" ? "checked" : ""}> Descending</label>

        <div style="text-align:right; margin-top:25px;">
            <button onclick="applyAdvancedFilter()" style="padding:10px 18px; background:#254fb0; color:white; border:none; border-radius:6px;">Apply</button>
            <button onclick="closeModalFunc()" style="padding:10px 18px; margin-left:8px; background:#ddd;">Cancel</button>
        </div>
    `;

    modalTitle.innerHTML = html;
    modalBody.innerHTML = "";
    modal.classList.remove("hidden");

    // Populate regions AFTER modal is shown
    setTimeout(populateRegions, 50);
}


function populateRegions() {
    if (!dataset || dataset.length === 0) {
        document.getElementById("regionCheckboxes").innerHTML = "<em>No data loaded yet...</em>";
        return;
    }

    const regions = [...new Set(dataset.map(item => {
        // Try multiple possible column names
        return item.raw.sub_region || 
               item.raw.region || 
               item.raw.Region || 
               item.raw.Sub_Region || 
               "Unknown";
    }))].filter(r => r && r !== "Unknown").sort();

    let chkHtml = '';
    regions.forEach(reg => {
        const checked = selectedRegions.has(reg) ? "checked" : "";
        chkHtml += `
            <label style="display:block; margin:6px 0; font-size:0.95rem;">
                <input type="checkbox" value="${reg}" ${checked} onchange="toggleRegionFilter(this)"> ${reg}
            </label>`;
    });

    const container = document.getElementById("regionCheckboxes");
    if (container) {
        container.innerHTML = chkHtml || "<em>No regions found in data</em>";
    }
}

function toggleRegionFilter(checkbox) {
    if (checkbox.checked) {
        selectedRegions.add(checkbox.value);
    } else {
        selectedRegions.delete(checkbox.value);
    }
}

// ====================== APPLY FILTER ======================
function applyAdvancedFilter() {
    if (!dataset || dataset.length === 0) return;

    // Save current state
    const subsidyRadio = document.querySelector('input[name="subsidyFilter"]:checked');
    if (subsidyRadio) selectedSubsidy = subsidyRadio.value;

    lastSortField = document.getElementById("sortField").value || "country";
    const dirRadio = document.querySelector('input[name="sortDirection"]:checked');
    if (dirRadio) lastSortDirection = dirRadio.value;

    let data = [...dataset];

    // Region filter - FIXED
    if (selectedRegions.size > 0) {
        data = data.filter(row => {
            const region = row.raw.sub_region || 
                          row.raw.region || 
                          row.raw.Region || 
                          row.raw.Sub_Region || 
                          "Unknown";
            return selectedRegions.has(region);
        });
    }

    // Subsidy filter
    if (selectedSubsidy !== "all") {
        const wantActive = selectedSubsidy === "active";
        data = data.filter(row => {
            const subValue = String(row.raw.fuel_subsidy_active || "").trim().toUpperCase();   // ← Fixed
            const isActive = subValue === "TRUE";
            return wantActive ? isActive : !isActive;
        });
    }

    // Sorting
    const field = lastSortField;
    const direction = lastSortDirection;

    data.sort((a, b) => {
        let va = 0, vb = 0;
        switch(field) {
            case "country":
                va = (a.country || "").toString().toLowerCase();
                vb = (b.country || "").toString().toLowerCase();
                return direction === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
            case "gasoline": va = parseFloat(a.gasoline)||0; vb = parseFloat(b.gasoline)||0; break;
            case "diesel":   va = parseFloat(a.diesel)||0;   vb = parseFloat(b.diesel)||0;   break;
            case "lpg":      va = parseFloat(a.lpg)||0;      vb = parseFloat(b.lpg)||0;      break;
            case "index":    va = parseFloat(a.index)||0;    vb = parseFloat(b.index)||0;    break;
            case "oil_import": va = parseFloat(a.oil_import)||0; vb = parseFloat(b.oil_import)||0; break;
        }
        return direction === "asc" ? va - vb : vb - va;
    });

    filteredData = data;
    renderTable(filteredData);
    closeModalFunc();
}

// ====================== RENDER TABLE ======================
function renderTable(data) {
    const thead = document.querySelector("#dataTable thead");
    const tbody = document.querySelector("#dataTable tbody");

    if (!thead || !tbody) return;

    thead.innerHTML = "";
    tbody.innerHTML = "";

    if (!data || data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="padding:80px;text-align:center;color:#666;">No data found</td></tr>`;
        return;
    }

    // Load saved marks
    

    // HEADER
    const headerRow = document.createElement("tr");
    visibleColumns.forEach(col => {
        const th = document.createElement("th");
        th.textContent = col;
        headerRow.appendChild(th);
    });

    const detailTh = document.createElement("th");
    detailTh.textContent = "Actions";
    headerRow.appendChild(detailTh);

    thead.appendChild(headerRow);

    // ROWS
    data.forEach(row => {
        const tr = document.createElement("tr");

        // IMPORTANT: unique ID (adjust if needed)
        const rowId = row.id;
        tr.dataset.id = rowId;

        // restore marked state
        if (markedRows[rowId]) {
            tr.classList.add("marked");
        }

        // cells
        row.getTableRow().forEach(cell => {
            const td = document.createElement("td");
            td.textContent = cell != null ? cell : "";
            tr.appendChild(td);
        });

        // actions
        const actionTd = document.createElement("td");

        // INFO BUTTON
        const infoBtn = document.createElement("button");
        infoBtn.classList.add("info-btn");
        infoBtn.innerHTML = '<i class="fa-solid fa-circle-info"></i>';
        infoBtn.addEventListener("click", () => openModal(row));

        // MARK BUTTON
        const markBtn = document.createElement("button");
        markBtn.classList.add("mark-btn");
        markBtn.innerHTML = '<i class="fa-solid fa-marker"></i>';
        markBtn.classList.add("mark-btn");

        markBtn.addEventListener("click", () => {
            const id = row.id;

            if (!id) return; // safety

            if (markedRows[id]) {
                delete markedRows[id];
                tr.classList.remove("marked");
            } else {
                markedRows[id] = true;
                tr.classList.add("marked");
            }

            localStorage.setItem("markedRows", JSON.stringify(markedRows));
        });

        actionTd.appendChild(infoBtn);
        actionTd.appendChild(markBtn);
        tr.appendChild(actionTd);

        // ✅ IMPORTANT FIX
        tbody.appendChild(tr);
    });
}

// ====================== SEARCH ======================
const searchInput = document.getElementById("searchInput");
if (searchInput) {
    searchInput.addEventListener("input", function () {
        const query = this.value.toLowerCase();
        filteredData = dataset.filter(row =>
            Object.values(row.raw || {}).some(val => String(val).toLowerCase().includes(query))
        );
        renderTable(filteredData);
    });
}

// ====================== SIDEBAR NAVIGATION (Fixed Smooth Scroll) ======================
document.addEventListener('DOMContentLoaded', function() {
    const sidebarLinks = document.querySelectorAll('.sidebar-link');
    const container = document.querySelector('.main-content');

    sidebarLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();

            // Active state
            sidebarLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');

            const targetId = this.getAttribute('data-target');
            const targetElement = document.getElementById(targetId);

            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });
            }
        });
    });
});

// ====================== LOAD DATA ======================
function loadDataset() {
    if (typeof embeddedDataset === 'undefined' || !embeddedDataset.length) {
        console.error("embeddedDataset not found!");
        return;
    }

    dataset = embeddedDataset.map(row => new FuelData(row));
    filteredData = [...dataset];
    renderTable(filteredData);     // Make sure table loads on start

    window.datasetRows = dataset;
    if (typeof onDataReady === "function") onDataReady(dataset);
}

class FuelData {
    constructor(data) {
        this.raw = data;

        // ✅ FIX: stable unique ID
        this.id = data.country + "_" + data.price_date;

        this.country = data.country;
        this.gasoline = data.gasoline_usd_per_liter;
        this.diesel = data.diesel_usd_per_liter;
        this.lpg = data.lpg_usd_per_kg;
        this.index = data.fuel_affordability_index;
        this.oil_import = data.oil_import_dependency_pct;
        this.subsidy = data.fuel_subsidy_active;
        this.date = data.price_date;
    }

    getTableRow() {
        return [this.country, this.gasoline, this.diesel, this.lpg, this.index, this.date];
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', loadDataset);