// ====================== GLOBAL STATE ======================
const visibleColumns = [
    "Country", 
    "Gasoline USD per Liter", 
    "Diesel USD per Liter",
    "LPG USD per Liter", 
    "Affordability Index", 
    "Price Date"
];

let lastSortField = localStorage.getItem("sortField") || "country";
let lastSortDirection = localStorage.getItem("sortDirection") || "asc";

let markedRows = JSON.parse(localStorage.getItem("markedRows")) || {};

let dataset = [];
let filteredData = [];
let selectedRegions = new Set();
let selectedSubsidy = "all";


// Modal elements
const modal = document.getElementById("modal");
const modalTitle = document.getElementById("modalTitle");
const modalBody = document.getElementById("modalBody");
const closeModalBtn = document.getElementById("closeModal");

// ====================== VIEW DETAILS MODAL (UNCHANGED - Your Original) ======================
function openModal(data) {
    const raw = data.raw || data;
    const iso3 = raw.iso3 || '';
    const countryName = raw.country || data.country || 'Country';
    const subRegion = raw.sub_region || raw.subRegion || '';

    const iso2 = iso3 ? iso3ToIso2(iso3) : '';

    // Background Flag (full width, faded)
    const flagBg = document.getElementById('modalFlagBg');
    if (flagBg && iso2) {
        flagBg.src = `https://flagcdn.com/w1280/${iso2.toLowerCase()}.png`;
    }

    // Small centered flag on top
    const flagSmall = document.getElementById('modalFlag');
    if (flagSmall && iso2) {
        flagSmall.src = `https://flagcdn.com/w320/${iso2.toLowerCase()}.png`;
    }

    // Text
    document.getElementById('modalTitle').textContent = countryName;
    document.getElementById('modalSubRegion').textContent = subRegion;

    // Body content
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

function iso3ToIso2(iso3) {
    if (!iso3) return null;
    const map = {
        "AFG": "AF", "BGD": "BD", "BRN": "BN", "KHM": "KH", "CHN": "CN",
        "IDN": "ID", "IND": "IN", "JPN": "JP", "KOR": "KR", "LAO": "LA",
        "LKA": "LK", "MYS": "MY", "MMR": "MM", "MNG": "MN", "NPL": "NP",
        "PAK": "PK", "PHL": "PH", "SGP": "SG", "THA": "TH", "TLS": "TL",
        "TWN": "TW", "VNM": "VN"
        // You can add more countries later easily
    };
    return map[iso3.toUpperCase()] || null;
}

// Convert ISO2 code to Flag Emoji (this part is correct)
function getFlagEmoji(iso2) {
    if (!iso2 || iso2.length !== 2) return "🌍";
    
    return iso2
        .toUpperCase()
        .split('')
        .map(char => String.fromCodePoint(0x1F1E6 + char.charCodeAt(0) - 65))
        .join('');
}

// ====================== ADVANCED FILTER MODAL (Region Selection Fixed) ======================
function openFilterModal() {
    const filterModal = document.getElementById('filterModal');
    const filterBody = document.getElementById('filterModalBody');

    if (!filterModal || !filterBody) return;

    let html = `
    <div class="modern-filter">

        <!-- REGIONS -->
        <div class="filter-card">
            <h3>Regions</h3>
            <p class="hint">Leave empty to show all</p>
            <div id="regionChips" class="chips">
                <em>Loading regions...</em>
            </div>
        </div>

        <!-- SUBSIDY -->
        <div class="filter-card">
            <h3>Subsidy</h3>
            <div class="radio-group">
                <label><input type="radio" name="subsidyFilter" value="all" ${selectedSubsidy === "all" ? "checked" : ""}> All</label>
                <label><input type="radio" name="subsidyFilter" value="active" ${selectedSubsidy === "active" ? "checked" : ""}> Active</label>
                <label><input type="radio" name="subsidyFilter" value="inactive" ${selectedSubsidy === "inactive" ? "checked" : ""}> Inactive</label>
            </div>
        </div>

        <!-- SORT -->
        <div class="filter-card">
            <h3>Sort</h3>
            <div class="sort-grid">
                <select id="sortField">

                    <!-- Basic -->
                    <option value="country" ${lastSortField === "country" ? "selected" : ""}>Country</option>
                    <option value="region" ${lastSortField === "region" ? "selected" : ""}>Region</option>

                    <!-- Prices -->
                    <option value="gasoline" ${lastSortField === "gasoline" ? "selected" : ""}>Gasoline Price</option>
                    <option value="diesel" ${lastSortField === "diesel" ? "selected" : ""}>Diesel Price</option>
                    <option value="lpg" ${lastSortField === "lpg" ? "selected" : ""}>LPG Price</option>

                    <!-- Economy -->
                    <option value="income" ${lastSortField === "income" ? "selected" : ""}>Monthly Income</option>
                    <option value="index" ${lastSortField === "index" ? "selected" : ""}>Affordability Index</option>

                    <!-- Energy -->
                    <option value="oil_import" ${lastSortField === "oil_import" ? "selected" : ""}>Oil Import %</option>
                    <option value="refinery" ${lastSortField === "refinery" ? "selected" : ""}>Refinery Capacity</option>
                    <option value="ev" ${lastSortField === "ev" ? "selected" : ""}>EV Adoption %</option>

                    <!-- Government / Impact -->
                    <option value="subsidy" ${lastSortField === "subsidy" ? "selected" : ""}>Subsidy Status</option>
                    <option value="subsidy_cost" ${lastSortField === "subsidy_cost" ? "selected" : ""}>Subsidy Cost</option>
                    <option value="co2" ${lastSortField === "co2" ? "selected" : ""}>CO₂ Transport</option>

                    <!-- Other -->
                    <option value="wage_pct" ${lastSortField === "wage_pct" ? "selected" : ""}>Gasoline % Daily Wage</option>
                    <option value="date" ${lastSortField === "date" ? "selected" : ""}>Price Date</option>

                </select>

                <select id="sortDirection">
                    <option value="asc">Ascending</option>
                    <option value="desc">Descending</option>
                </select>
            </div>
        </div>

        <!-- ACTIONS -->
        <div class="filter-actions modern-actions">
            <button class="apply-btn" onclick="applyAdvancedFilter()">Apply</button>
            <button class="cancel-btn" onclick="closeFilterModal()">Cancel</button>
        </div>
    </div>
    `;

    filterBody.innerHTML = html;
    filterModal.classList.remove("hidden");
    setTimeout(populateRegionsChips, 50);    
    setTimeout(() => {
        document.getElementById("sortField").value = lastSortField;
        document.getElementById("sortDirection").value = lastSortDirection;
    }, 0);

}

function closeFilterModal() {
    const filterModal = document.getElementById('filterModal');
    if (filterModal) filterModal.classList.add("hidden");
}

// Close filter modal when clicking outside
document.addEventListener('click', (e) => {
    const filterModal = document.getElementById('filterModal');
    if (filterModal && e.target === filterModal) {
        closeFilterModal();
    }
});

// Close button for filter modal
document.addEventListener('DOMContentLoaded', () => {
    const closeFilterBtn = document.getElementById('closeFilterModal');
    if (closeFilterBtn) {
        closeFilterBtn.addEventListener('click', closeFilterModal);
    }
});

function populateRegionsChips() {
    const container = document.getElementById("regionChips");

    if (!dataset || dataset.length === 0) {
        container.innerHTML = "<em>No data</em>";
        return;
    }

    const regions = [...new Set(dataset.map(item =>
        item.raw.sub_region || item.raw.region || "Unknown"
    ))].filter(r => r !== "Unknown").sort();

    container.innerHTML = regions.map(region => {
        const active = selectedRegions.has(region) ? "active" : "";
        return `
            <div class="chip ${active}" onclick="toggleChip(this, '${region}')">
                ${region}
            </div>
        `;
    }).join("");
}

function toggleChip(el, region) {
    if (selectedRegions.has(region)) {
        selectedRegions.delete(region);
        el.classList.remove("active");
    } else {
        selectedRegions.add(region);
        el.classList.add("active");
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

    localStorage.setItem("sortField", lastSortField);
    localStorage.setItem("sortDirection", lastSortDirection);

    // Sorting
    const field = lastSortField;
    const direction = lastSortDirection;

    data.sort((a, b) => {
        let va, vb;

        switch(lastSortField) {

            case "country":
                va = (a.country || "").toLowerCase();
                vb = (b.country || "").toLowerCase();
                break;

            case "region":
                va = (a.region || "").toLowerCase();
                vb = (b.region || "").toLowerCase();
                break;

            case "subsidy":
                va = String(a.subsidy).toUpperCase() === "TRUE" ? 1 : 0;
                vb = String(b.subsidy).toUpperCase() === "TRUE" ? 1 : 0;
                break;

            case "date":
                va = new Date(a.date).getTime() || 0;
                vb = new Date(b.date).getTime() || 0;
                break;

            default:
                // everything else = numeric
                va = parseFloat(a[lastSortField]) || 0;
                vb = parseFloat(b[lastSortField]) || 0;
        }

        // ✅ SINGLE consistent comparison
        if (va < vb) return lastSortDirection === "asc" ? -1 : 1;
        if (va > vb) return lastSortDirection === "asc" ? 1 : -1;
        return 0;
    });

    closeFilterModal();
    filteredData = data;
    renderTable(filteredData);
    
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
        this.region = data.sub_region;
        this.income = data.avg_monthly_income_usd;
        this.refinery = data.refinery_capacity_kbpd;
        this.ev = data.ev_adoption_pct;
        this.subsidy_cost = data.subsidy_cost_bn_usd;
        this.co2 = data.co2_transport_mt;
        this.wage_pct = data.gasoline_pct_daily_wage;
    }

    getTableRow() {
        return [this.country, this.gasoline, this.diesel, this.lpg, this.index, this.date];
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', loadDataset);