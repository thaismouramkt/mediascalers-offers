import { NextRequest, NextResponse } from 'next/server';
import googleTrends from 'google-trends-api';

interface CachedTrend {
  data: any[];
  topCountries: any[];
  timestamp: number;
}

const trendCache = new Map<string, CachedTrend>();
const CACHE_TTL = 1000 * 60 * 60 * 12; // 12 horas

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const keyword = searchParams.get('keyword');
  const range = searchParams.get('range') || '30';
  const includeRegion = searchParams.get('region') === 'true';

  if (!keyword) {
    return NextResponse.json({ success: false, error: 'Keyword is required' }, { status: 400 });
  }

  const cacheKey = `${keyword}-${range}-${includeRegion}`;
  const cached = trendCache.get(cacheKey);

  if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
    console.log(`Returning cached Google Trends for keyword: ${keyword}, range: ${range}, region: ${includeRegion}`);
    return NextResponse.json({ success: true, data: cached.data, topCountries: cached.topCountries });
  }

  console.log(`Fetching Google Trends for keyword: ${keyword}, range: ${range}, region: ${includeRegion}`);

  try {
    const handleTrendError = (err: any) => {
      const msg = err.message || String(err);
      console.error('Trend API Error:', msg);
      if (msg.includes('Unexpected token') || msg.includes('JSON')) {
        throw new Error('RATE_LIMIT');
      }
      return '[]';
    };

    const formatData = (res: string) => {
      try {
        if (!res || typeof res !== 'string') return [];
        if (res.trim().startsWith('<')) {
          console.error('Rate limited by Google Trends (HTML response received).');
          return [];
        }
        const parsed = JSON.parse(res);
        if (parsed.default && parsed.default.timelineData) {
          return parsed.default.timelineData.map((item: any) => ({
            date: item.formattedTime, timestamp: item.time, value: item.value[0]
          }));
        }
        return [];
      } catch (e) {
        console.error('Error parsing trend data:', e);
        return [];
      }
    };

    let startTime = new Date();
    let granularTimeResolution = false;

    if (range === '1') {
      startTime.setDate(startTime.getDate() - 1);
      granularTimeResolution = true;
    } else if (range === '7') {
      startTime.setDate(startTime.getDate() - 7);
      startTime.setHours(startTime.getHours() + 1);
      granularTimeResolution = true;
    } else if (range === '365') {
      startTime.setFullYear(startTime.getFullYear() - 1);
    } else {
      // default 30
      startTime.setDate(startTime.getDate() - 30);
    }

    const resTime = await googleTrends.interestOverTime({ keyword, startTime, granularTimeResolution }).catch(handleTrendError);
    const data = formatData(resTime);

    let topCountries: any[] = [];
    if (includeRegion) {
      await new Promise(r => setTimeout(r, 500)); // Delay before region query
      const regionRes = await googleTrends.interestByRegion({ keyword, startTime: new Date(new Date().setDate(new Date().getDate() - 30)), resolution: 'COUNTRY' }).catch(handleTrendError);
      
      try {
         if (regionRes && typeof regionRes === 'string' && !regionRes.trim().startsWith('<')) {
           const parsed = JSON.parse(regionRes);
           if (parsed.default && parsed.default.geoMapData) {
             const geoMap = parsed.default.geoMapData || [];
             topCountries = geoMap.sort((a: any, b: any) => (b.value[0] || 0) - (a.value[0] || 0)).slice(0, 5).map((item: any) => ({
                 country: item.geoName, value: item.value[0] || 0
             }));
           }
         } else if (regionRes && regionRes.trim().startsWith('<')) {
           console.error('Rate limited by Google Trends for Region (HTML response received).');
         }
      } catch (e) {
        console.error('Error parsing region data:', e);
      }
    }

    if (data && data.length > 0) {
      trendCache.set(cacheKey, { data, topCountries, timestamp: Date.now() });
    } else if (cached) {
      // Falback para o cache expirado se a API falhar
      console.log(`API falhou ou retornou vazio, usando fallback do cache expirado para: ${cacheKey}`);
      return NextResponse.json({ success: true, data: cached.data, topCountries: cached.topCountries });
    }

    return NextResponse.json({
        success: true,
        data,
        topCountries
    });
  } catch (error: any) {
    console.error(`Error fetching Google Trends for [${keyword}]:`, error);
    const cachedFallback = trendCache.get(cacheKey);
    if (cachedFallback) {
      console.log(`Retornando fallback do cache devido a erro para: ${cacheKey}`);
      return NextResponse.json({ success: true, data: cachedFallback.data, topCountries: cachedFallback.topCountries });
    }
    
    if (error.message === 'RATE_LIMIT') {
      return NextResponse.json({ success: false, error: "Serviço do Google bloqueou as requisições temporariamente (Rate Limit). Tente novamente mais tarde." }, { status: 429 });
    }
    return NextResponse.json({ success: false, error: "Erro ao buscar dados do Google Trends. Volume muito baixo ou API indisponível." }, { status: 500 });
  }
}
