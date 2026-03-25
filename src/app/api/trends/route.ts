import { NextRequest, NextResponse } from 'next/server';
import googleTrends from 'google-trends-api';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const keyword = searchParams.get('keyword');

  if (!keyword) {
    return NextResponse.json({ success: false, error: 'Keyword is required' }, { status: 400 });
  }

  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // 1. Timeline 30 Dias
    const results30 = await googleTrends.interestOverTime({ keyword, startTime: thirtyDaysAgo });
    const timeline30Data = JSON.parse(results30).default.timelineData.map((item: any) => ({
      date: item.formattedTime, timestamp: item.time, value: item.value[0]
    }));

    // 2. Timeline 7 Dias
    const results7 = await googleTrends.interestOverTime({ keyword, startTime: sevenDaysAgo });
    const timeline7Data = JSON.parse(results7).default.timelineData.map((item: any) => ({
      date: item.formattedTime, timestamp: item.time, value: item.value[0]
    }));

    // 3. Regiões (Países) Top 5
    const regionRes = await googleTrends.interestByRegion({ keyword, startTime: thirtyDaysAgo, resolution: 'COUNTRY' });
    const geoMap = JSON.parse(regionRes).default.geoMapData || [];
    
    const topRegions = geoMap
       .sort((a: any, b: any) => (b.value[0] || 0) - (a.value[0] || 0))
       .slice(0, 5)
       .map((item: any) => ({
          country: item.geoName,
          value: item.value[0] || 0
       }));

    return NextResponse.json({ 
        success: true, 
        data30: timeline30Data, 
        data7: timeline7Data, 
        topCountries: topRegions 
    });
  } catch (error: any) {
    console.error(`Error fetching Google Trends for [${keyword}]:`, error);
    return NextResponse.json({ success: false, error: "Volume do Google muito baixo." }, { status: 500 });
  }
}
