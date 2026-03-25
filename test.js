const API_KEY = 'XAetgHrzQGW9Idew7lguzw';
async function run() {
  const url = 'https://api.eflow.team/v1/affiliates/alloffers';
  const res = await fetch(url, { headers: { 'X-Eflow-API-Key': API_KEY } });
  const data = await res.json();
  const arr = data.offers || [];
  
  let foundEpc = 0;
  let foundSales = 0;
  let foundCV = 0;
  let allKeys = new Set();
  
  arr.forEach(o => {
    Object.keys(o).forEach(k => allKeys.add(k));
    if (o.epc !== undefined && o.epc !== null) foundEpc++;
    if (o.conversion_rate !== undefined || o.sales !== undefined) foundSales++;
    if (o.cv !== undefined) foundCV++;
  });
  
  console.log("Total analyzed:", arr.length);
  console.log("Offers with EPC:", foundEpc);
  console.log("Offers with Sales/CR:", foundSales);
  console.log("Offers with CV:", foundCV);
  
  const keysArray = Array.from(allKeys);
  console.log("Possible performance keys:", keysArray.filter(k => k.includes('epc') || k.includes('rank') || k.includes('score') || k.includes('sale') || k.includes('conv')));
}
run();
