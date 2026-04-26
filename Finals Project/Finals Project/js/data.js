// CSV Data embedded to avoid CORS issues
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

// Parse CSV data without fetch
function parseEmbeddedCSV(csv) {
  const rows = csv.trim().split('\n');
  const headers = rows[0].split(',').map(h => h.trim());
  
  return rows.slice(1).map(row => {
    const values = row.split(',');
    let obj = {};
    headers.forEach((h, i) => {
      obj[h] = values[i] ? values[i].trim() : '';
    });
    return obj;
  });
}

// Make data immediately available
const embeddedDataset = parseEmbeddedCSV(CSV_DATA);
