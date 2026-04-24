import { NextRequest, NextResponse } from 'next/server';
import googleTrends from 'google-trends-api';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const keyword = searchParams.get('keyword');

  if (!keyword) {
    return NextResponse.json({ success: false, error: 'Keyword is required' }, { status: 400 });
  }

  console.log(`Fetching Google Trends for keyword: ${keyword}`);

  try {
    const d1 = new Date(); d1.setDate(d1.getDate() - 1);
    const d7 = new Date(); d7.setDate(d7.getDate() - 7);
    const d30 = new Date(); d30.setDate(d30.getDate() - 30);
    const d365 = new Date(); d365.setFullYear(d365.getFullYear() - 1);

    console.log('Making Google Trends API calls...');

    const [res1, res7, res30, res365, regionRes] = await Promise.all([
      googleTrends.interestOverTime({ keyword, startTime: d1 }).catch((err: any) => {
        console.error('Error in 1 day trend:', err);
        return '[]';
      }),
      googleTrends.interestOverTime({ keyword, startTime: d7 }).catch((err: any) => {
        console.error('Error in 7 day trend:', err);
        return '[]';
      }),
      googleTrends.interestOverTime({ keyword, startTime: d30 }).catch((err: any) => {
        console.error('Error in 30 day trend:', err);
        return '[]';
      }),
      googleTrends.interestOverTime({ keyword, startTime: d365 }).catch((err: any) => {
        console.error('Error in 365 day trend:', err);
        return '[]';
      }),
      googleTrends.interestByRegion({ keyword, startTime: d30, resolution: 'COUNTRY' }).catch((err: any) => {
        console.error('Error in region trend:', err);
        return '[]';
      })
    ]);

    console.log('Google Trends API calls completed');

    const formatData = (res: string) => {
      try {
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

    const topRegions = (() => {
      try {
         const parsed = JSON.parse(regionRes);
         if (parsed.default && parsed.default.geoMapData) {
           const geoMap = parsed.default.geoMapData || [];
           return geoMap.sort((a: any, b: any) => (b.value[0] || 0) - (a.value[0] || 0)).slice(0, 5).map((item: any) => ({
               country: item.geoName, value: item.value[0] || 0
           }));
         }
         return [];
      } catch (e) {
        console.error('Error parsing region data:', e);
        return [];
      }
    })();

    const result = {
        success: true,
        data1: formatData(res1),
        data7: formatData(res7),
        data30: formatData(res30),
        data365: formatData(res365),
        topCountries: topRegions
    };

    console.log(`Trends data prepared for ${keyword}:`, {
      data1Length: result.data1.length,
      data7Length: result.data7.length,
      data30Length: result.data30.length,
      data365Length: result.data365.length,
      topCountriesLength: result.topCountries.length
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error(`Error fetching Google Trends for [${keyword}]:`, error);
    return NextResponse.json({ success: false, error: "Erro ao buscar dados do Google Trends. Volume muito baixo ou API indisponível." }, { status: 500 });
  }
}
