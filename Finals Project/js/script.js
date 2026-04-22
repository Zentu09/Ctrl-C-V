const CSV_FILE = "asia_fuel_prices_detailed.csv"; // 🔗 UPDATED PATH

let dataset = [];
let filteredData = [];
let sortAsc = true;

// 📥 Load CSV Dataset
async function loadDataset() {
    const response = await fetch(CSV_FILE);
    const text = await response.text();

    const rows = text.trim().split("\n");
    const headers = rows[0].split(",");

    dataset = rows.slice(1).map(row => {
        const values = row.split(",");
        let obj = {};
        headers.forEach((h, i) => {
            obj[h.trim()] = values[i].trim();
        });
        return obj;
    });

    filteredData = [...dataset];
    renderTable(filteredData);
}

// 📊 Render Table
function renderTable(data) {
    const tableHead = document.querySelector("#dataTable thead");
    const tableBody = document.querySelector("#dataTable tbody");

    tableHead.innerHTML = "";
    tableBody.innerHTML = "";

    if (data.length === 0) return;

    const headerRow = document.createElement("tr");
    Object.keys(data[0]).forEach(key => {
        const th = document.createElement("th");
        th.textContent = key
        .replace(/_/g, " ")
        .replace(/\b\w/g, char => char.toUpperCase());
            headerRow.appendChild(th);
        });
    tableHead.appendChild(headerRow);

    data.forEach(row => {
        const tr = document.createElement("tr");
        Object.values(row).forEach(value => {
            const td = document.createElement("td");
            td.textContent = value;
            tr.appendChild(td);
        });
        tableBody.appendChild(tr);
    });
}

// 🔍 Filter
document.getElementById("searchInput").addEventListener("input", function () {
    const query = this.value.toLowerCase();

    filteredData = dataset.filter(row =>
        Object.values(row).some(val =>
            val.toLowerCase().includes(query)
        )
    );

    renderTable(filteredData);
});

// 🔃 Sort
function sortTable() {
    const keys = Object.keys(filteredData[0]);

    filteredData.sort((a, b) => {
        let valA = a[keys[0]];
        let valB = b[keys[0]];

        if (!isNaN(valA) && !isNaN(valB)) {
            valA = Number(valA);
            valB = Number(valB);
        }

        if (valA < valB) return sortAsc ? -1 : 1;
        if (valA > valB) return sortAsc ? 1 : -1;
        return 0;
    });

    sortAsc = !sortAsc;
    renderTable(filteredData);
}

// 🚀 Init
loadDataset();