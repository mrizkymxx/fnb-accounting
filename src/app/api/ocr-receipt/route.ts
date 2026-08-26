import { NextResponse } from 'next/server';
import {
  GeminiError,
  generateGeminiJson,
  OCR_RECEIPT_PROMPT,
} from '@/lib/gemini';

type ReceiptItem = {
  item_name?: string;
  quantity?: number;
  unit?: string;
  unit_price?: number;
  subtotal?: number;
};

type ReceiptResult = {
  supplier_name?: string;
  purchase_date?: string;
  items?: ReceiptItem[];
  total_amount?: number;
  notes?: string;
};

export async function POST(request: Request) {
  try {
    const { imageBase64 } = await request.json();

    if (typeof imageBase64 !== 'string' || !imageBase64) {
      return NextResponse.json({ error: 'Foto nota wajib diisi.' }, { status: 400 });
    }

    const base64 = imageBase64.startsWith('data:')
      ? imageBase64.split(',')[1]
      : imageBase64;
    const mimeType = imageBase64.startsWith('data:image/png')
      ? 'image/png'
      : 'image/jpeg';

    if (!base64) {
      return NextResponse.json({ error: 'Format foto nota tidak valid.' }, { status: 400 });
    }

    const result = await generateGeminiJson<ReceiptResult>({
      systemInstruction: OCR_RECEIPT_PROMPT,
      parts: [
        { text: 'Baca nota pada gambar dan ekstrak datanya sesuai format JSON.' },
        { inlineData: { mimeType, data: base64 } },
      ],
      maxOutputTokens: 4096,
    });
    const items = Array.isArray(result.items) ? result.items : [];
    const extractedItemsTotal = items.reduce(
      (total, item) => total + Number(item.subtotal || 0),
      0
    );
    const total = Number(result.total_amount);

    return NextResponse.json({
      success: true,
      data: {
        supplier_name: result.supplier_name || 'Pasar Segar / Supplier',
        purchase_date: result.purchase_date || new Date().toISOString().slice(0, 10),
        items,
        total_amount: Number.isFinite(total) ? total : extractedItemsTotal,
        notes: result.notes || '',
      },
    });
  } catch (error) {
    console.error('Gemini receipt OCR error:', error);

    if (error instanceof GeminiError) {
      return NextResponse.json({ error: error.clientMessage }, { status: error.status });
    }

    return NextResponse.json(
      { error: 'Terjadi kesalahan saat memproses nota.' },
      { status: 500 }
    );
  }
}
