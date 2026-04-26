// Statistical Analysis Engine - CJ
// Implements: mean(), median(), mode(), stdDev(), variance(), pearsonCorr(), linearRegression()

let allCountries = [];
let csvData = [];
let selectedRegion = null;
let currentMetric = 'gasoline_usd_per_liter';

function mean(data) {
    if (data.length === 0) return 0;
    return data.reduce((a, b) => a + b, 0) / data.length;
}

function median(data) {
    const sorted = [...data].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function stdDev(data) {
    if (data.length === 0) return 0;
    const avg = mean(data);
    const squaredDiffs = data.map(x => Math.pow(x - avg, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / data.length;
    return Math.sqrt(variance);
}

function variance(data) {
    if (data.length === 0) return 0;
    const avg = mean(data);
    const squaredDiffs = data.map(x => Math.pow(x - avg, 2));
    return squaredDiffs.reduce((a, b) => a + b, 0) / data.length;
}

function mode(data) {
    if (data.length === 0) return null;
    const frequency = {};
    let maxFreq = 0;
    let modes = [];
    
    data.forEach(num => {
        const rounded = Math.round(num * 100) / 100;
        frequency[rounded] = (frequency[rounded] || 0) + 1;
        if (frequency[rounded] > maxFreq) {
            maxFreq = frequency[rounded];
        }
    });
    
    for (let num in frequency) {
        if (frequency[num] === maxFreq) {
            modes.push(num);
        }
    }
    
    return modes.length === Object.keys(frequency).length ? 'No mode' : modes.join(', ');
}

function pearsonCorr(x, y) {
    if (x.length !== y.length || x.length === 0) return 0;
    
    const meanX = mean(x);
    const meanY = mean(y);
    
    let numerator = 0;
    let sumXSquared = 0;
    let sumYSquared = 0;
    
    for (let i = 0; i < x.length; i++) {
        const xDiff = x[i] - meanX;
        const yDiff = y[i] - meanY;
        numerator += xDiff * yDiff;
        sumXSquared += xDiff * xDiff;
        sumYSquared += yDiff * yDiff;
    }
    
    const denominator = Math.sqrt(sumXSquared * sumYSquared);
    return denominator === 0 ? 0 : numerator / denominator;
}

function linearRegression(x, y) {
    if (x.length !== y.length || x.length < 2) return { slope: 0, intercept: 0, r2: 0 };
    
    const n = x.length;
    const meanX = mean(x);
    const meanY = mean(y);
    
    let numerator = 0;
    let denominatorX = 0;
    let denominatorY = 0;
    
    for (let i = 0; i < n; i++) {
        numerator += (x[i] - meanX) * (y[i] - meanY);
        denominatorX += (x[i] - meanX) * (x[i] - meanX);
        denominatorY += (y[i] - meanY) * (y[i] - meanY);
    }
    
    const slope = denominatorX === 0 ? 0 : numerator / denominatorX;
    const intercept = meanY - slope * meanX;
    
    // Calculate R² (coefficient of determination)
    const r2 = denominatorY === 0 ? 0 : (numerator * numerator) / (denominatorX * denominatorY);
    
    return { 
        slope: parseFloat(slope.toFixed(4)), 
        intercept: parseFloat(intercept.toFixed(4)),
        r2: parseFloat(r2.toFixed(4))
    };
}

function displayCountriesList(countries) {
    const listDiv = document.getElementById('countryList');
    listDiv.innerHTML = '';
    
    countries.forEach(country => {
        const btn = document.createElement('button');
        btn.textContent = country;
        btn.className = 'country-btn';
        btn.onclick = () => selectCountry(country);
        listDiv.appendChild(btn);
    });
}

function selectCountry(selectedRegionName) {
    selectedRegion = selectedRegionName;
    updateMetric();
}

function getRegressionExplanation(regression) {
    const slope = regression.slope;
    const intercept = regression.intercept;
    const r2 = regression.r2;
    
    // Determine trend direction
    let trendDirection = slope > 0 ? "increasing" : slope < 0 ? "decreasing" : "flat";
    let trendStrength = "";
    
    if (r2 > 0.8) {
        trendStrength = "very strong";
    } else if (r2 > 0.6) {
        trendStrength = "strong";
    } else if (r2 > 0.4) {
        trendStrength = "moderate";
    } else if (r2 > 0.2) {
        trendStrength = "weak";
    } else {
        trendStrength = "very weak";
    }
    
    const explanation = `${trendStrength.charAt(0).toUpperCase() + trendStrength.slice(1)} ${trendDirection} trend (${(r2 * 100).toFixed(1)}% fit)`;
    
    return {
        equation: `y = ${slope}x + ${intercept}`,
        explanation: explanation,
        r2: r2,
        r2Percent: (r2 * 100).toFixed(1)
    };
}

function updateMetric() {
    currentMetric = document.getElementById('metricSelect').value;
    
    if (!selectedRegion) return;
    
    // Get all countries in the selected region
    const regionRecords = csvData.filter(record => record.sub_region === selectedRegion);
    
    if (regionRecords.length === 0) {
        alert('No data found for ' + selectedRegion);
        return;
    }
    
    // Extract values for the current metric from all countries in region
    const metricValues = regionRecords
        .map(record => parseFloat(record[currentMetric]))
        .filter(x => !isNaN(x));
    
    if (metricValues.length === 0) {
        alert('No data for this metric in ' + selectedRegion);
        return;
    }
    
    // Create indices for correlation and regression (1, 2, 3, ...)
    const indices = Array.from({ length: metricValues.length }, (_, i) => i + 1);
    
    // Calculate pearson correlation between index and metric values
    const correlationValue = pearsonCorr(indices, metricValues);
    
    // Calculate linear regression
    const regression = linearRegression(indices, metricValues);
    const regressionInfo = getRegressionExplanation(regression);
    
    // Calculate mode
    const modeValue = mode(metricValues);
    
    // Display results for entire region
    const metricLabel = document.getElementById('metricSelect').options[
        document.getElementById('metricSelect').selectedIndex
    ].text;
    
    document.getElementById('selectedCountry').textContent = selectedRegion + ' - ' + metricLabel;
    document.getElementById('mean').textContent = mean(metricValues).toFixed(2);
    document.getElementById('median').textContent = median(metricValues).toFixed(2);
    document.getElementById('stddev').textContent = stdDev(metricValues).toFixed(4);
    document.getElementById('variance').textContent = variance(metricValues).toFixed(4);
    document.getElementById('mode').textContent = modeValue;
    document.getElementById('pearson').textContent = correlationValue.toFixed(4);
    document.getElementById('regression').innerHTML = `<strong>${regressionInfo.explanation}</strong><br><small>${regressionInfo.equation} (R² = ${regressionInfo.r2Percent}%)</small>`;
    document.getElementById('dataCount').textContent = metricValues.length;
}

function loadCountries() {
    // Use embedded data instead of fetching
    csvData = embeddedDataset;
    
    // Get unique regions (sub_region)
    allCountries = [...new Set(csvData.map(record => record.sub_region))].sort();
    
    // Display all regions
    displayCountriesList(allCountries);
    
    // Set up search by region
    document.getElementById('countrySearch').addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filtered = allCountries.filter(region => 
            region.toLowerCase().includes(searchTerm)
        );
        displayCountriesList(filtered);
    });
}

// Load countries when page is ready
document.addEventListener('DOMContentLoaded', loadCountries);
