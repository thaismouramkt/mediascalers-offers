const API_KEY = 'XAetgHrzQGW9Idew7lguzw';
async function test() {
  const url = 'https://api.eflow.team/v1/affiliates/alloffers';
  const res = await fetch(url, { headers: { 'X-Eflow-API-Key': API_KEY } });
  const data = await res.json();
  const arr = data.offers || data || [];
  if (arr.length > 0) {
    const offer = arr[0];
    console.log("Variáveis de performance disponíveis:", Object.keys(offer).filter(k => 
      k.includes('epc') || k.includes('conv') || k.includes('payout') || k.includes('rev') || k.includes('click') || k.includes('rate') || k.includes('score')
    ));
    console.log("Oferta modelo:", JSON.stringify(offer, null, 2));
  }
}
test();
