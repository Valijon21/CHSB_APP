import { NextRequest, NextResponse } from 'next/server';
import { processChatQuery } from '@/lib/ai-engine';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const prompt = body?.prompt || body?.message;

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Prompt matni kiritilishi shart.' },
        { status: 400 }
      );
    }

    const result = await processChatQuery(prompt);
    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Noma’lum xatolik yuz berdi.';
    console.error('Chat API Error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
