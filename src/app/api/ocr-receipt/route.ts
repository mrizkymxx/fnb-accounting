import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { imageBase64 } = await request.json();

    if (!imageBase64) {
      return NextResponse.json({ error: 'Image base64 is required' }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY || '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';

    // Format clean base64 data URL
    const cleanBase64 = imageBase64.startsWith('data:')
      ? imageBase64
      : `data:image/jpeg;base64,${imageBase64}`;

    // Gunakan Llama 3.2 Vision via Groq API (super cepat ~1 detik)
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.2-11b-vision-preview',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Anda adalah AI OCR Akuntansi untuk restoran/kafe. Analisis gambar nota/struk belanja ini dan ekstrak informasinya dalam format JSON murni.
Aturan:
1. "supplier_name": Nama toko/supplier di nota (jika tidak jelas, isi "Toko/Supplier").
2. "purchase_date": Tanggal transaksi format YYYY-MM-DD (jika tidak ada, gunakan tanggal hari ini).
3. "items": Array barang belanjaan dengan format:
   - "item_name": nama barang spesifik
   - "quantity": angka jumlah (cth: 1, 2.5)
   - "unit": satuan seperti "pcs", "kg", "pack", "karton", "botol", "liter", "gram"
   - "unit_price": harga satuan angka
   - "subtotal": total per item
4. "total_amount": total akhir nota angka.
5. "notes": catatan ringkas jika ada info tambahan.

Balas HANYA JSON valid tanpa markdown, tanpa teks pembuka/penutup.
Format JSON yang diharapkan:
{
  "supplier_name": "string",
  "purchase_date": "YYYY-MM-DD",
  "items": [
    {
      "item_name": "string",
      "quantity": 1,
      "unit": "pcs",
      "unit_price": 0,
      "subtotal": 0
    }
  ],
  "total_amount": 0,
  "notes": "string"
}`
              },
              {
                type: 'image_url',
                image_url: {
                  url: cleanBase64
                }
              }
            ]
          }
        ],
        temperature: 0.1,
        max_tokens: 1024,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Groq Vision API Error:', errorText);
      return NextResponse.json({ error: 'Gagal memproses gambar dengan AI Groq', details: errorText }, { status: 500 });
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content || '{}';
    const parsedData = JSON.parse(rawContent);

    return NextResponse.json({
      success: true,
      data: parsedData
    });
  } catch (error: any) {
    console.error('OCR Error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan sistem saat memproses nota', message: error.message }, { status: 500 });
  }
}
