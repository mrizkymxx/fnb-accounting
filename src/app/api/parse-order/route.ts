import { NextResponse } from 'next/server';
import { INGREDIENTS_CATALOG } from '@/lib/ingredientsCatalog';

export async function POST(request: Request) {
  try {
    const { textPrompt, defaultOutlet } = await request.json();

    if (!textPrompt || typeof textPrompt !== 'string') {
      return NextResponse.json({ error: 'Text prompt order is required' }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY || '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';

    // Format catalog ringkas untuk context AI
    const catalogSummary = INGREDIENTS_CATALOG.map(
      i => `{"name":"${i.name}","outlet":"${i.outlet}","unit":"${i.unit}","est_price":${i.price},"supplier":"${i.supplier}"}`
    ).join('\n');

    const systemPrompt = `Anda adalah Asisten AI Akuntansi & Estimasi Biaya Belanja FnB khusus Oklah, Prima Sushi, Rovu, dan Staff Meals.
Tugas Anda:
1. Analisis teks pesanan/daftar belanja mentah (dari chat WhatsApp/catatan dapur).
2. Deteksi Target Outlet (Oklah / Prima Sushi / Rovu / Staff Meals). Jika tidak tertulis di teks, gunakan default: "${defaultOutlet || 'Oklah'}".
3. Cocokkan setiap item belanja dengan KATALOG BAHAN RESEP di bawah.
4. Estimasi harga satuan dan subtotal berdasarkan harga standar katalog jika ada. Jika tidak ada di katalog, beri estimasi harga pasar wajar di Indonesia (IDR).
5. Normalisasikan kuantitas dan satuan (cth: "1/2kg" -> qty: 0.5, unit: "kg"; "3px/3pcs/3biji" -> qty: 3, unit: "pcs"; "2 Jrigen" -> qty: 2, unit: "jerigen").

KATALOG REFERENSI HARGA BAHAN RESEP:
${catalogSummary}

Format respon HANYA JSON murni tanpa markdown, tanpa teks pembuka/penutup:
{
  "detected_outlet_name": "Prima Sushi | Oklah | Rovu | Staff Meals",
  "supplier_suggestion": "Pasar Tradisional / Supplier Utama",
  "items": [
    {
      "item_name": "Nama Barang Standar",
      "raw_text": "Teks asli dari input",
      "quantity": 1,
      "unit": "kg / pcs / pack / botol / liter / jerigen",
      "estimated_unit_price": 25000,
      "estimated_subtotal": 25000,
      "matched_from_catalog": true,
      "notes": "Catatan spesifik jika ada (cth: ukuran besar)"
    }
  ],
  "total_estimated_amount": 0,
  "summary_message": "Ringkasan penjelasan ramah asisten (cth: Ditemukan 12 item belanja untuk Prima Sushi dengan total estimasi Rp...)"
}`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Berikut daftar belanjaan mentah:\n\n${textPrompt}` }
        ],
        temperature: 0.1,
        max_tokens: 2048,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Groq API Error:', errText);
      return NextResponse.json({ error: 'Gagal memproses estimasi dengan AI Groq', details: errText }, { status: 500 });
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content || '{}';
    const parsedData = JSON.parse(rawContent);

    return NextResponse.json({
      success: true,
      data: parsedData
    });
  } catch (error: any) {
    console.error('AI Order Parser Error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan sistem', message: error.message }, { status: 500 });
  }
}
