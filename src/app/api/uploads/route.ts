import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

export const runtime = 'nodejs' as const;

const MAX_BYTES = 5 * 1024 * 1024; // 5MB

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get('file') as any;
    if (!file) return NextResponse.json({ error: 'no file' }, { status: 400 });
    const arrayBuffer = await file.arrayBuffer();
    if (arrayBuffer.byteLength > MAX_BYTES) return NextResponse.json({ error: 'file too large' }, { status: 413 });
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
    const ext = (file.name || 'jpg').split('.').pop()?.toLowerCase() || 'jpg';
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2,8)}.${ext}`;
    const dest = path.join(uploadsDir, filename);
    // resize to max width 1600 and re-encode
    const buffer = Buffer.from(arrayBuffer);
    await sharp(buffer).resize({ width: 1600, withoutEnlargement: true }).toFile(dest);
    const url = `/uploads/${filename}`;
    return NextResponse.json({ url });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}
