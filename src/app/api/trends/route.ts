import { NextRequest, NextResponse } from 'next/server';
import googleTrends from 'google-trends-api';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const keyword = searchParams.get('keyword');

  if (!keyword) {
    return NextResponse.json({ success: false, error: 'Keyword is required' }, { status: 400 });
  }

  try {
    const d1 = new Date(); d1.setDate(d1.getDate() - 1);
    const d7 = new Date(); d7.setDate(d7.getDate() - 7);
    const d30 = new Date(); d30.setDate(d30.getDate() - 30);
    const d365 = new Date(); d365.setFullYear(d365.getFullYear() - 1);

    const [res1, res7, res30, res365, regionRes] = await Promise.all([
      googleTrends.interestOverTime({ keyword, startTime: d1 }),
      googleTrends.interestOverTime({ keyword, startTime: d7 }),
      googleTrends.interestOverTime({ keyword, startTime: d30 }),
      googleTrends.interestOverTime({ keyword, startTime: d365 }),
      googleTrends.interestByRegion({ keyword, startTime: d30, resolution: 'COUNTRY' })
    ]);

    const formatData = (res: string) => {
      try {
        return JSON.parse(res).default.timelineData.map((item: any) => ({
          date: item.formattedTime, timestamp: item.time, value: item.value[0]
        }));
      } catch (e) {
        return [];
      }
    };

    const topRegions = (() => {
      try {
         const geoMap = JSON.parse(regionRes).default.geoMapData || [];
         return geoMap.sort((a: any, b: any) => (b.value[0] || 0) - (a.value[0] || 0)).slice(0, 5).map((item: any) => ({
             country: item.geoName, value: item.value[0] || 0
         }));
      } catch (e) { return []; }
    })();

    return NextResponse.json({ 
        success: true, 
        data1: formatData(res1),
        data7: formatData(res7), 
        data30: formatData(res30), 
        data365: formatData(res365),
        topCountries: topRegions 
    });
  } catch (error: any) {
    console.error(`Error fetching Google Trends for [${keyword}]:`, error);
    return NextResponse.json({ success: false, error: "Volume do Google muito baixo." }, { status: 500 });
  }
}
