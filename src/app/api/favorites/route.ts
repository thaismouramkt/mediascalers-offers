import { NextResponse } from 'next/server';

// Usar uma variável global para armazenar favoritos (funciona no Vercel)
let globalFavorites: string[] = [];

export async function GET() {
  return NextResponse.json({ success: true, favorites: globalFavorites });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    let offerId = body?.offerId;
    if (offerId == null) {
      return NextResponse.json({ success: false, error: 'offerId is required' }, { status: 400 });
    }
    offerId = String(offerId);

    const exists = globalFavorites.includes(offerId);
    if (exists) {
      globalFavorites = globalFavorites.filter((id) => id !== offerId);
    } else {
      globalFavorites = [...globalFavorites, offerId];
    }

    return NextResponse.json({ success: true, favorites: globalFavorites });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Falha ao atualizar favoritos' }, { status: 500 });
  }
}
