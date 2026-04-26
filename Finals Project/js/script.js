// ===============================
//        EMBEDDED CSV DATA
// ===============================
// Note: CSV_FILE is no longer used, data is embedded in data.js

// ===============================
//           DATA CLASS
// ===============================
class FuelData {
    constructor(data) {
        this.raw = data;

        this.country = data.country;
        this.gasoline = data.gasoline_usd_per_liter;
        this.diesel = data.diesel_usd_per_liter;
        this.lpg = data.lpg_usd_per_kg;
        this.index = data.fuel_affordability_index;
        this.oil_import = data.oil_import_dependency_pct;
        this.subsidy = data.active_subsidy;
        this.date = data.price_date;
    }

    getTableRow() {
        return [
            this.country,
            this.gasoline,
            this.diesel,
            this.lpg,
            this.index,
            this.date
        ];
    }
}

// ===============================
//         GLOBAL STATE
// ===============================
const visibleColumns = [
    "Country",
    "Gasoline USD per Liter",
    "Diesel USD per Liter",
    "LPG USD per Liter",
    "Affordability Index",
    "Price Date"
];

let dataset = [];
let filteredData = [];
let sortAsc = true;

// ===============================
//           MODAL
// ===============================
const modal = document.getElementById("modal");
const modalTitle = document.getElementById("modalTitle");
const modalBody = document.getElementById("modalBody");
const closeModal = document.getElementById("closeModal");

function openModal(data) {
    modalTitle.innerHTML = `<h2>${data.country}</h2>`;
    modalBody.innerHTML = buildModalFields(data);
    modal.classList.remove("hidden");
}

function closeModalFunc() {
    modal.classList.add("hidden");
}

closeModal.addEventListener("click", closeModalFunc);

window.addEventListener("click", (e) => {
    if (e.target === modal) closeModalFunc();
});

// ===============================
//        FIELD BUILDER
// ===============================
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

// ===============================
//        KPI COLOR SYSTEM
// ===============================
function formatValue(value, key) {
    if (value === null || value === undefined) return "";

    const str = String(value).trim().toLowerCase();
    const num = Number(value);

    // BOOLEAN (subsidy)
    if (str === "true") return `<span class="positive">Active</span>`;
    if (str === "false") return `<span class="negative">Inactive</span>`;

    // AFFORDABILITY INDEX
    if (key === "fuel_affordability_index") {
        if (!isNaN(num)) {
            if (num >= 6) return `<span class="positive">${value}</span>`;
            else return `<span class="negative">${value}</span>`;
        }
    }

    // OIL IMPORT DEPENDENCY
    if (key === "oil_import_dependency_pct") {
        if (!isNaN(num)) {
            if (num <= 50) return `<span class="positive">${value}</span>`;
            else return `<span class="negative">${value}</span>`;
        }
    }

    return value;
}

// ===============================
//        LOAD CSV DATA
// ===============================
function loadDataset() {
    try {
        // Use embedded data instead of fetching
        dataset = embeddedDataset.map(row => new FuelData(row));

        filteredData = [...dataset];
        renderTable(filteredData);

        // Make data globally available for charts
        window.datasetRows = dataset;
        window.globalData = dataset;
        
        // Trigger chart initialization if available
        if (typeof onDataReady === "function") {
            onDataReady(dataset);
        }

    } catch (err) {
        console.error("CSV load failed:", err);
    }
}

// ===============================
//         RENDER TABLE
// ===============================
function renderTable(data) {
    const tableHead = document.querySelector("#dataTable thead");
    const tableBody = document.querySelector("#dataTable tbody");

    tableHead.innerHTML = "";
    tableBody.innerHTML = "";

    if (!data.length) return;

    // HEADER
    const headerRow = document.createElement("tr");

    visibleColumns.forEach(col => {
        const th = document.createElement("th");
        th.textContent = col;
        headerRow.appendChild(th);
    });

    const th = document.createElement("th");
    th.textContent = "Details";
    headerRow.appendChild(th);

    tableHead.appendChild(headerRow);

    // ROWS
    data.forEach(row => {
        const tr = document.createElement("tr");

        row.getTableRow().forEach((cell, i) => {
            const td = document.createElement("td");
            td.innerHTML = formatValue(cell, Object.keys(row.raw)[i]);
            tr.appendChild(td);
        });

        const td = document.createElement("td");
        const btn = document.createElement("button");
        btn.textContent = "View";

        btn.addEventListener("click", () => openModal(row));

        td.appendChild(btn);
        tr.appendChild(td);

        tableBody.appendChild(tr);
    });
}

// ===============================
//           SEARCH
// ===============================
document.getElementById("searchInput").addEventListener("input", function () {
    const query = this.value.toLowerCase();

    filteredData = dataset.filter(row =>
        Object.values(row.raw).some(val =>
            String(val).toLowerCase().includes(query)
        )
    );

    renderTable(filteredData);
});

// ===============================
//            SORT
// ===============================
function sortTable() {
    filteredData.sort((a, b) =>
        sortAsc
            ? a.country.localeCompare(b.country)
            : b.country.localeCompare(a.country)
    );

    sortAsc = !sortAsc;
    renderTable(filteredData);
}

// ===============================
//            INIT
// ===============================
// Load dataset when DOM is ready to ensure chart libraries are loaded
document.addEventListener('DOMContentLoaded', function() {
    if (typeof embeddedDataset !== 'undefined') {
        loadDataset();
    }
});

// ===============================
//      SIDEBAR NAVIGATION
// ===============================
document.addEventListener('DOMContentLoaded', function() {
    const sidebarLinks = document.querySelectorAll('.sidebar-link');
    
    // Handle sidebar link clicks
    sidebarLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all links
            sidebarLinks.forEach(l => l.classList.remove('active'));
            
            // Add active class to clicked link
            this.classList.add('active');
            
            // Smooth scroll to target section
            const targetId = this.getAttribute('data-target');
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
    
    // Update active link on scroll
    window.addEventListener('scroll', function() {
        let currentSection = '';
        
        sidebarLinks.forEach(link => {
            const sectionId = link.getAttribute('data-target');
            const section = document.getElementById(sectionId);
            
            if (section) {
                const sectionTop = section.offsetTop;
                const sectionHeight = section.offsetHeight;
                
                if (window.scrollY >= sectionTop - 100 && window.scrollY < sectionTop + sectionHeight - 100) {
                    currentSection = sectionId;
                }
            }
        });
        
        // Update active state based on scroll position
        sidebarLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-target') === currentSection) {
                link.classList.add('active');
            }
        });
    });
});