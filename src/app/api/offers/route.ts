import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const API_KEY = 'XAetgHrzQGW9Idew7lguzw';
const EFLOW_URL = 'https://api.eflow.team/v1/affiliates/alloffers';

export async function GET() {
  try {
    const fetchOpts = { headers: { 'X-Eflow-API-Key': API_KEY } };
    const initialRes = await fetch(EFLOW_URL, fetchOpts);
    if (!initialRes.ok) throw new Error(`API error: ${initialRes.status}`);

    const initialData = await initialRes.json();
    const paging = initialData.paging;
    let allOffers: any[] = [];

    if (paging && paging.total_count > 0) {
      const totalPages = Math.ceil(paging.total_count / paging.page_size);
      // Para "buscar todas", vamos puxar 30 páginas de vez (Até 1.500 ofertas)
      const maxPages = 30;
      const startPage = Math.max(1, totalPages - maxPages + 1);
      
      const pageRequests = [];
      for(let i = startPage; i <= totalPages; i++) {
        pageRequests.push(fetch(`${EFLOW_URL}?page=${i}`, fetchOpts).then(r => r.json()).catch(() => null));
      }
      
      const pagesData = await Promise.all(pageRequests);
      pagesData.forEach(pData => {
         if(!pData) return;
         const items = pData.offers || pData || [];
         if (Array.isArray(items)) allOffers.push(...items);
         else allOffers.push(...Object.values(items));
      });
    } else {
      let items = initialData.offers || initialData || [];
      if(!Array.isArray(items)) items = Object.values(items);
      allOffers = items;
    }

    let activeOffers = allOffers.filter(o => o.offer_status === 'active');
    
    // As "New Offers" puramente listadas pelo Banco a partir das mais recentes
    const sorted = activeOffers.sort((a, b) => parseInt(b.network_offer_id) - parseInt(a.network_offer_id));

    return NextResponse.json({ success: true, count: sorted.length, offers: sorted });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
