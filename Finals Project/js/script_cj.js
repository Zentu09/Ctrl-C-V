// Statistical Analysis Engine - CJ
// Implements: mean(), median(), mode(), stdDev(), variance(), pearsonCorr(), linearRegression()

let allCountries = [];
let csvData = [];
let selectedCountries = [];
let currentRegionFilter = 'ALL';
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
    
    // Return "No mode" if all values appear equally or if only one value appears once
    if (modes.length === Object.keys(frequency).length) return 'No mode';
    
    // Return only the first mode when there are ties
    return modes.length > 0 ? modes[0] : 'No mode';
}

function formatTwoDecimals(value) {
    if (value === null || value === undefined || Number.isNaN(value)) return '-';
    return Number(value).toFixed(2);
}

const METRIC_INSIGHTS = {
    gasoline_usd_per_liter: {
        noun: 'gasoline price',
        highMeaning: 'fuel is more expensive',
        lowMeaning: 'fuel is cheaper'
    },
    diesel_usd_per_liter: {
        noun: 'diesel price',
        highMeaning: 'diesel is more expensive',
        lowMeaning: 'diesel is cheaper'
    },
    lpg_usd_per_kg: {
        noun: 'LPG price',
        highMeaning: 'LPG is more expensive',
        lowMeaning: 'LPG is cheaper'
    },
    avg_monthly_income_usd: {
        noun: 'average monthly income',
        highMeaning: 'people earn more on average',
        lowMeaning: 'people earn less on average'
    },
    fuel_affordability_index: {
        noun: 'fuel affordability',
        highMeaning: 'fuel takes up more of a budget',
        lowMeaning: 'fuel is easier to afford'
    },
    oil_import_dependency_pct: {
        noun: 'oil import dependency',
        highMeaning: 'the region relies more on imported oil',
        lowMeaning: 'the region relies less on imported oil'
    },
    refinery_capacity_kbpd: {
        noun: 'refinery capacity',
        highMeaning: 'the region can refine more fuel locally',
        lowMeaning: 'the region can refine less fuel locally'
    },
    ev_adoption_pct: {
        noun: 'EV adoption',
        highMeaning: 'more people are using electric vehicles',
        lowMeaning: 'fewer people are using electric vehicles'
    },
    subsidy_cost_bn_usd: {
        noun: 'subsidy cost',
        highMeaning: 'the government spends more on fuel support',
        lowMeaning: 'the government spends less on fuel support'
    },
    co2_transport_mt: {
        noun: 'transport CO2 emissions',
        highMeaning: 'transport emissions are higher',
        lowMeaning: 'transport emissions are lower'
    },
    gasoline_pct_daily_wage: {
        noun: 'gasoline cost as a share of daily wage',
        highMeaning: 'gasoline takes up more of a worker\'s pay',
        lowMeaning: 'gasoline takes up less of a worker\'s pay'
    }
};

function getMetricInsight(metricKey) {
    return METRIC_INSIGHTS[metricKey] || {
        noun: 'selected metric',
        highMeaning: 'the value is higher',
        lowMeaning: 'the value is lower'
    };
}

function getValueDescriptor(value, referenceValue) {
    if (referenceValue === 0) return 'around average';

    const ratio = value / referenceValue;

    if (ratio >= 1.2) return 'high';
    if (ratio >= 1.05) return 'slightly above average';
    if (ratio <= 0.8) return 'low';
    if (ratio <= 0.95) return 'slightly below average';
    return 'around average';
}

function getSpreadDescriptor(value, referenceValue) {
    if (referenceValue === 0) return 'very little spread';

    const ratio = value / referenceValue;

    if (ratio >= 1.2) return 'a wide spread';
    if (ratio >= 1.05) return 'a somewhat wide spread';
    if (ratio <= 0.8) return 'a very stable pattern';
    if (ratio <= 0.95) return 'a fairly stable pattern';
    return 'a normal spread';
}

function getRelativeSummary(value, referenceValue, metricKey) {
    const insight = getMetricInsight(metricKey);
    const descriptor = getValueDescriptor(value, referenceValue);

    if (descriptor === 'high') {
        return `This region has a high ${insight.noun}, so ${insight.highMeaning}.`;
    }

    if (descriptor === 'low') {
        return `This region has a low ${insight.noun}, so ${insight.lowMeaning}.`;
    }

    if (descriptor === 'slightly above average') {
        return `This region is a little above average for ${insight.noun}, so it leans higher than most regions.`;
    }

    if (descriptor === 'slightly below average') {
        return `This region is a little below average for ${insight.noun}, so it leans lower than most regions.`;
    }

    return `This region is around average for ${insight.noun}, so it is close to the normal level.`;
}

function getMedianSummary(value, referenceValue, metricKey) {
    const insight = getMetricInsight(metricKey);
    const descriptor = getValueDescriptor(value, referenceValue);

    if (descriptor === 'high') {
        return `The middle value is high, so a typical country in this region is on the expensive or large side for ${insight.noun}.`;
    }

    if (descriptor === 'low') {
        return `The middle value is low, so a typical country in this region is on the cheaper or smaller side for ${insight.noun}.`;
    }

    if (descriptor === 'slightly above average') {
        return `The middle value is a little above average, so a typical country in this region is a bit higher than most regions.`;
    }

    if (descriptor === 'slightly below average') {
        return `The middle value is a little below average, so a typical country in this region is a bit lower than most regions.`;
    }

    return `The middle value is about average, so a typical country in this region is close to the normal level.`;
}

function getModeSummary(modeValue, metricKey) {
    const insight = getMetricInsight(metricKey);

    if (modeValue === 'No mode') {
        return 'There is no repeated value, so no single number shows up most often.';
    }

    return `The most common value is ${modeValue}, so this ${insight.noun} is the one that shows up the most.`;
}

function getCorrelationSummary(correlationValue, metricKey) {
    const insight = getMetricInsight(metricKey);
    const strength = Math.abs(correlationValue);

    let strengthText = 'very weak';
    if (strength >= 0.8) strengthText = 'very strong';
    else if (strength >= 0.6) strengthText = 'strong';
    else if (strength >= 0.4) strengthText = 'moderate';
    else if (strength >= 0.2) strengthText = 'weak';

    const directionText = correlationValue > 0 ? 'move in the same direction' : correlationValue < 0 ? 'move in opposite directions' : 'do not clearly move together';
    if (strengthText === 'very weak' || strengthText === 'weak') {
        return `Pearson correlation is ${strengthText}, so there is only a weak link between ${insight.noun} and the country order.`;
    }

    return `Pearson correlation is ${strengthText}, so the values for ${insight.noun} and the country order tend to ${directionText}.`;
}

function getTrendSummary(regressionInfo, metricKey) {
    const insight = getMetricInsight(metricKey);

    if (regressionInfo.explanation.includes('very weak')) {
        return `The trend is very weak, so there is almost no clear pattern in ${insight.noun} across the region.`;
    }

    if (regressionInfo.explanation.includes('very strong')) {
        return 'The trend is very strong, so the values follow a very clear pattern across the region.';
    }

    if (regressionInfo.explanation.includes('strong')) {
        return 'The trend is strong, so the values follow a clear pattern across the region.';
    }

    if (regressionInfo.explanation.includes('moderate')) {
        return 'The trend is moderate, so the pattern is there but not perfect.';
    }

    if (regressionInfo.explanation.includes('weak')) {
        return `The trend is weak, so ${insight.noun} does not change in a very steady way.`;
    }

    return `The trend is mixed, so ${insight.noun} changes in a less predictable way.`;
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

function getCountriesForCurrentRegion() {
    if (currentRegionFilter === 'ALL') {
        return allCountries;
    }

    return allCountries.filter(country => {
        const record = csvData.find(row => row.country === country);
        return record && record.sub_region === currentRegionFilter;
    });
}

function renderCountryList() {
    const regionCountries = getCountriesForCurrentRegion();
    selectedCountries = [...regionCountries];
}

function populateRegionSelect() {
    const regionSelect = document.getElementById('cjRegionSelect');
    if (!regionSelect) return;

    const regions = [...new Set(csvData.map(record => record.sub_region).filter(Boolean))].sort();
    regionSelect.innerHTML = '<option value="ALL">All Countries</option>' + regions.map(region => `<option value="${region}">${region}</option>`).join('');
    regionSelect.value = currentRegionFilter;
}

function onCjRegionChange() {
    const regionSelect = document.getElementById('cjRegionSelect');
    currentRegionFilter = regionSelect ? regionSelect.value : 'ALL';
    renderCountryList();
    updateMetric();
}

function openCountryFilterModal() {
    const countryModal = document.getElementById('countryFilterModal');
    const countryModalTitle = document.getElementById('countryModalTitle');
    const countryModalBody = document.getElementById('countryModalBody');

    if (!countryModal || !countryModalTitle || !countryModalBody) {
        console.error("Country filter modal elements not found! Check your HTML IDs.");
        return;
    }

    const countries = getCountriesForCurrentRegion();

    const checkboxMarkup = countries.map(country => {
        const checked = selectedCountries.includes(country) ? 'checked' : '';
        return `
            <label class="cf-country-item">
                <input type="checkbox" 
                       name="cfCountryCheckbox" 
                       value="${country}" 
                       ${checked}>
                <span class="cf-country-label">${country}</span>
            </label>`;
    }).join('');

    countryModalTitle.innerHTML = `
        <div class="cf-modal-header">
            <h2 class="cf-modal-title">Filter Countries</h2>
            <p class="cf-modal-subtitle">Select countries to compare statistics</p>
        </div>
    `;

    countryModalBody.innerHTML = `
        <div class="cf-country-filter-body">
            <div class="cf-search-wrapper">
                <input 
                    type="text" 
                    placeholder="Search country..." 
                    id="cfCountrySearchInput"
                    oninput="filterCountryList()"
                    class="cf-search-input"
                >
            </div>

            <div class="cf-country-list" id="cfCountryList">
                ${checkboxMarkup || '<div class="cf-empty-state">No countries found</div>'}
            </div>

            <div class="cf-modal-footer">
                <button type="button" class="cf-btn cf-btn-secondary" id="cfClearAllBtn">Clear All</button>
                <div class="cf-footer-actions">
                    <button type="button" class="cf-btn cf-btn-ghost" id="cfCancelBtn">Cancel</button>
                    <button type="button" class="cf-btn cf-btn-primary" id="cfApplyBtn">Apply Filters</button>
                </div>
            </div>
        </div>
    `;

    countryModal.classList.remove('hidden');
    countryModal.classList.add('show');

    // Attach buttons safely after DOM update
    setTimeout(() => {
        const clearBtn = document.getElementById('cfClearAllBtn');
        const cancelBtn = document.getElementById('cfCancelBtn');
        const applyBtn = document.getElementById('cfApplyBtn');
        const searchInput = document.getElementById('cfCountrySearchInput');

        if (clearBtn) clearBtn.addEventListener('click', deselectAllCountries);
        if (cancelBtn) cancelBtn.addEventListener('click', closeCountryFilterModal);
        if (applyBtn) applyBtn.addEventListener('click', applyCountryFilter);
        if (searchInput) searchInput.focus();
    }, 80);
}

function closeCountryFilterModal() {
    const countryModal = document.getElementById('countryFilterModal');
    if (countryModal) {
        countryModal.classList.remove('show');
        countryModal.classList.add('hidden');
    }
}

function clearStatsDisplay(message = '-') {
    document.getElementById('selectedCountry').textContent = message;
    document.getElementById('mean').textContent = '-';
    document.getElementById('median').textContent = '-';
    document.getElementById('stddev').textContent = '-';
    document.getElementById('variance').textContent = '-';
    document.getElementById('mode').textContent = '-';
    document.getElementById('pearson').textContent = '-';
    document.getElementById('regression').textContent = '-';
    document.getElementById('dataCount').textContent = '0';
}

function filterCountryList() {
    const searchTerm = document.getElementById('cfCountrySearchInput').value.toLowerCase().trim();
    const items = document.querySelectorAll('.cf-country-item');

    items.forEach(item => {
        const countryName = item.querySelector('.cf-country-label').textContent.toLowerCase();
        if (countryName.includes(searchTerm)) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
}

function applyCountryFilter() {
    const checkedCountries = [...document.querySelectorAll('input[name="cfCountryCheckbox"]:checked')]
        .map(input => input.value);

    selectedCountries = checkedCountries;
    updateMetric();
    closeCountryFilterModal();
}

function deselectAllCountries() {
    selectedCountries = [];
    clearStatsDisplay();
    closeCountryFilterModal();
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
    
    const explanation = `${trendStrength.charAt(0).toUpperCase() + trendStrength.slice(1)} ${trendDirection} trend (${(r2 * 100).toFixed(2)}% fit)`;
    
    return {
        equation: `y = ${slope.toFixed(2)}x + ${intercept.toFixed(2)}`,
        explanation: explanation,
        r2: r2,
        r2Percent: (r2 * 100).toFixed(2)
    };
}

function updateMetric() {
    currentMetric = document.getElementById('cjMetricSelect').value;
    
    if (selectedCountries.length < 2) {
        clearStatsDisplay('Select at least 2 countries to show statistics');
        return;
    }
    
    // Get only the selected countries
    const regionRecords = csvData.filter(record => selectedCountries.includes(record.country));
    
    if (regionRecords.length === 0) {
        alert('No data found for the selected countries.');
        return;
    }
    
    // Extract values for the current metric from all countries in region
    const metricValues = regionRecords
        .map(record => parseFloat(record[currentMetric]))
        .filter(x => !isNaN(x));
    
    if (metricValues.length === 0) {
        alert('No data for this metric in the selected countries.');
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

    const overallMean = mean(csvData.map(record => parseFloat(record[currentMetric])).filter(x => !isNaN(x)));
    const overallMedian = median(csvData.map(record => parseFloat(record[currentMetric])).filter(x => !isNaN(x)));
    const overallStdDev = stdDev(csvData.map(record => parseFloat(record[currentMetric])).filter(x => !isNaN(x)));
    const overallVariance = variance(csvData.map(record => parseFloat(record[currentMetric])).filter(x => !isNaN(x)));
    
    // Display results for entire region
    const metricSelect = document.getElementById('cjMetricSelect');
    const metricLabel = metricSelect.options[
        metricSelect.selectedIndex
    ].text;
    
    document.getElementById('selectedCountry').textContent = selectedCountries.join(', ') + ' - ' + metricLabel;
    document.getElementById('mean').textContent = formatTwoDecimals(mean(metricValues));
    document.getElementById('median').textContent = formatTwoDecimals(median(metricValues));
    document.getElementById('stddev').textContent = formatTwoDecimals(stdDev(metricValues));
    document.getElementById('variance').textContent = formatTwoDecimals(variance(metricValues));
    document.getElementById('mode').textContent = modeValue === 'No mode' ? modeValue : modeValue.split(', ').map(value => formatTwoDecimals(value)).join(', ');
    document.getElementById('pearson').textContent = formatTwoDecimals(correlationValue);
    document.getElementById('regression').innerHTML = `<strong>${regressionInfo.explanation}</strong><br><small>${regressionInfo.equation} (R² = ${regressionInfo.r2Percent}%)</small>`;
    document.getElementById('dataCount').textContent = metricValues.length;

    document.getElementById('meanDescription').textContent = getRelativeSummary(mean(metricValues), overallMean, currentMetric);
    document.getElementById('medianDescription').textContent = getMedianSummary(median(metricValues), overallMedian, currentMetric);
    document.getElementById('stddevDescription').textContent = `This region has ${getSpreadDescriptor(stdDev(metricValues), overallStdDev)}, which tells you how similar or different the countries are.`;
    document.getElementById('varianceDescription').textContent = `This region has ${getSpreadDescriptor(variance(metricValues), overallVariance)}, which is another way of showing how spread out the values are.`;
    document.getElementById('modeDescription').textContent = getModeSummary(modeValue, currentMetric);
    document.getElementById('pearsonDescription').textContent = getCorrelationSummary(correlationValue, currentMetric);
    document.getElementById('regressionDescription').textContent = `${regressionInfo.explanation}. ${getTrendSummary(regressionInfo, currentMetric)}`;
}

function loadCountries() {
    // Use embedded data instead of fetching
    csvData = embeddedDataset;
    
    // Get unique countries from the dataset
    allCountries = [...new Set(csvData.map(record => record.country))].sort();
    currentRegionFilter = 'ALL';
    
    // Display all countries
    populateRegionSelect();
    selectedCountries = [...getCountriesForCurrentRegion()];
    
    updateMetric();
}

// Load countries when page is ready
document.addEventListener('DOMContentLoaded', loadCountries);
