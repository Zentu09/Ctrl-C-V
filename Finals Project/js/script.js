// ===============================
//        EMBEDDED CSV DATA
// ===============================
const CSV_DATA = `country,sub_region,iso3,gasoline_usd_per_liter,diesel_usd_per_liter,lpg_usd_per_kg,avg_monthly_income_usd,fuel_affordability_index,oil_import_dependency_pct,refinery_capacity_kbpd,ev_adoption_pct,fuel_subsidy_active,subsidy_cost_bn_usd,co2_transport_mt,price_date,gasoline_pct_daily_wage
Pakistan,South Asia,PAK,1.64,1.86,1.25,180,3.7,85,450,0.4,TRUE,5.2,42.5,4/4/2026,27.3
India,South Asia,IND,1.11,1.03,1.08,280,8.4,85,5340,2.4,TRUE,8.5,325,4/4/2026,11.9
Bangladesh,South Asia,BGD,1.07,0.93,0.98,160,5,100,33,0.1,TRUE,2.8,16.2,4/4/2026,20.1
Sri Lanka,South Asia,LKA,1.34,1.19,1.18,210,5.2,100,50,0.2,FALSE,0,8.5,4/4/2026,19.1
Nepal,South Asia,NPL,1.34,1.21,1.28,120,3,100,0,0.6,FALSE,0,4.3,4/4/2026,33.5
Afghanistan,South Asia,AFG,0.86,0.81,0.85,60,2.3,100,0,0,FALSE,0,2.9,4/4/2026,43
China,East Asia,CHN,1.26,1.12,0.82,960,25.4,72,17840,10.2,FALSE,0,990,4/4/2026,3.9
Japan,East Asia,JPN,1.15,1.04,1.2,3200,92.8,99,3520,3.5,TRUE,8.2,182,4/4/2026,1.1
South Korea,East Asia,KOR,1.37,1.22,1,2800,68.1,97,3330,10.5,FALSE,0,96,4/4/2026,1.5
Taiwan,East Asia,TWN,1.06,0.91,0.85,2200,69.2,98,1200,5,TRUE,3.5,35,4/4/2026,1.4
Mongolia,East Asia,MNG,1.06,1.02,0.95,450,14.2,100,0,0.1,FALSE,0,3.3,4/4/2026,7.1
Thailand,Southeast Asia,THA,1.24,1.1,0.78,580,15.6,62,1340,4.2,TRUE,5.8,79,4/4/2026,6.4
Malaysia,Southeast Asia,MYS,0.46,0.86,0.5,820,59.4,35,770,2.8,TRUE,14.2,56,4/4/2026,1.7
Indonesia,Southeast Asia,IDN,0.61,0.72,0.68,320,17.5,42,1080,0.5,TRUE,18.5,148,4/4/2026,5.7
Vietnam,Southeast Asia,VNM,1.09,0.95,0.82,280,8.6,60,360,0.7,FALSE,0,43.5,4/4/2026,11.7
Philippines,Southeast Asia,PHL,1.26,1.13,0.95,310,8.2,100,280,0.4,FALSE,0,36,4/4/2026,12.2
Singapore,Southeast Asia,SGP,2.53,2.05,1.35,4800,63.2,100,1500,5.8,FALSE,0,17.5,4/4/2026,1.6
Cambodia,Southeast Asia,KHM,1.27,1.17,1.02,180,4.7,100,0,0,FALSE,0,4.8,4/4/2026,21.2
Myanmar,Southeast Asia,MMR,1.12,1.02,0.92,110,3.3,55,50,0,TRUE,0.8,10.2,4/4/2026,30.5
Laos,Southeast Asia,LAO,1.32,1.16,1.08,160,4,100,0,0,FALSE,0,2.4,4/4/2026,24.8
Brunei,Southeast Asia,BRN,0.39,0.23,0.3,2200,188,0,165,0.2,TRUE,0.5,2.6,4/4/2026,0.5
Timor-Leste,Southeast Asia,TLS,1.38,1.32,1.15,120,2.9,100,0,0,FALSE,0,0.4,4/4/2026,34.5`;

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
async function loadDataset() {
    try {
        const text = CSV_DATA;

        const rows = text.trim().split("\n");
        const headers = rows[0].split(",").map(h => h.trim());

        dataset = rows.slice(1).map(row => {
            const values = row.split(",");
            let obj = {};

            headers.forEach((h, i) => {
                obj[h] = values[i]?.trim() ?? "";
            });

            return new FuelData(obj);
        });

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
loadDataset();

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