import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const FAVORITES_FILE = path.join(process.cwd(), 'favorites.json');

async function ensureFavoritesFile() {
  try {
    await fs.access(FAVORITES_FILE);
  } catch {
    await fs.writeFile(FAVORITES_FILE, JSON.stringify([], null, 2), 'utf8');
  }
}

async function readFavorites() {
  await ensureFavoritesFile();
  const content = await fs.readFile(FAVORITES_FILE, 'utf8');
  try {
    const parsed = JSON.parse(content);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeFavorites(favorites: string[]) {
  await fs.writeFile(FAVORITES_FILE, JSON.stringify(favorites, null, 2), 'utf8');
}

export async function GET() {
  const favorites = await readFavorites();
  return NextResponse.json({ success: true, favorites });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const offerId = body?.offerId;
    if (!offerId) {
      return NextResponse.json({ success: false, error: 'offerId is required' }, { status: 400 });
    }

    const favorites = await readFavorites();
    const exists = favorites.includes(offerId);
    const updatedFavorites = exists
      ? favorites.filter((id) => id !== offerId)
      : [...favorites, offerId];

    await writeFavorites(updatedFavorites);
    return NextResponse.json({ success: true, favorites: updatedFavorites });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Falha ao atualizar favoritos' }, { status: 500 });
  }
}
