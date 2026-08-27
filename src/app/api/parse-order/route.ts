import { NextResponse } from 'next/server';
import {
  GeminiError,
  generateGeminiJson,
  PARSE_ORDER_SYSTEM_PROMPT,
} from '@/lib/gemini';

type EstimatedItem = {
  item_name?: string;
  raw_text?: string;
  quantity?: number;
  unit?: string;
  estimated_unit_price?: number;
  estimated_subtotal?: number;
  matched_from_catalog?: boolean;
  notes?: string;
};

type EstimatedOrder = {
  detected_outlet_name?: string;
  supplier_suggestion?: string;
  items?: EstimatedItem[];
  total_estimated_amount?: number;
  summary_message?: string;
};

export async function POST(request: Request) {
  try {
    const { textPrompt, defaultOutlet } = await request.json();

    if (typeof textPrompt !== 'string' || !textPrompt.trim()) {
      return NextResponse.json({ error: 'Teks pesanan wajib diisi.' }, { status: 400 });
    }

    if (textPrompt.length > 20_000) {
      return NextResponse.json({ error: 'Teks pesanan terlalu panjang.' }, { status: 400 });
    }

    const outlet = typeof defaultOutlet === 'string' && defaultOutlet.trim()
      ? defaultOutlet.trim()
      : 'Oklah';
    const systemPrompt = PARSE_ORDER_SYSTEM_PROMPT.replace('{defaultOutlet}', outlet);
    const result = await generateGeminiJson<EstimatedOrder>({
      systemInstruction: systemPrompt,
      parts: [{ text: `Berikut daftar belanjaan mentah:\n\n${textPrompt.trim()}` }],
      maxOutputTokens: 4096,
    });
    const items = Array.isArray(result.items) ? result.items : [];
    const estimatedItemsTotal = items.reduce(
      (total, item) => total + Number(item.estimated_subtotal || 0),
      0
    );
    const total = Number(result.total_estimated_amount);

    return NextResponse.json({
      success: true,
      data: {
        detected_outlet_name: result.detected_outlet_name || outlet,
        supplier_suggestion: result.supplier_suggestion || 'Pasar Tradisional',
        items,
        total_estimated_amount: Number.isFinite(total) ? total : estimatedItemsTotal,
        summary_message: result.summary_message || `Ditemukan ${items.length} item belanja.`,
      },
    });
  } catch (error) {
    console.error('Gemini order parser error:', error);

    if (error instanceof GeminiError) {
      return NextResponse.json({ error: error.clientMessage }, { status: error.status });
    }

    return NextResponse.json(
      { error: 'Terjadi kesalahan saat memproses estimasi.' },
      { status: 500 }
    );
  }
}
