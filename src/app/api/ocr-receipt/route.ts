import { NextResponse } from 'next/server';
import { INGREDIENTS_CATALOG } from '@/lib/ingredientsCatalog';

export async function POST(request: Request) {
  try {
    const { imageBase64 } = await request.json();

    if (!imageBase64) {
      return NextResponse.json({ error: 'Image base64 is required' }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY || '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';

    const cleanBase64 = imageBase64.startsWith('data:')
      ? imageBase64
      : `data:image/jpeg;base64,${imageBase64}`;

    // Sample list bahan baku resmi untuk referensi AI
    const referenceList = INGREDIENTS_CATALOG.map(i => `${i.name} (satuan: ${i.unit}, est. Rp${i.price})`).slice(0, 150).join(', ');

    const promptText = `Anda adalah AI OCR Akuntansi khusus restoran & kafe (Oklah & Prima Sushi).
Tugas Anda: Baca foto struk/nota belanja (termasuk NOTA TULISAN TANGAN PASAR/SUPPLIER).

DAFTAR NAMA BAHAN ACUAN KAMUS (Jika tulisan tangan mirip salah satu bahan di bawah, normalisasikan ke nama resmi ini):
[${referenceList}]

Contoh Pencocokan Tulisan Tangan Pasar:
- "susu eva" / "evaporasi" -> "Susu Evaporasi"
- "uht" / "diamond" / "ultra milk" -> "UHT Full Cream"
- "condens" / "susu kental" -> "Condense Milk"
- "paha" / "fillet" -> "PAHA FILLET"
- "salmon" / "ekor salmon" -> "Salmon Fresh"
- "tuna" / "loin" -> "Tuna Loin"
- "nori" / "rumput laut" -> "Nori"
- "beras sushi" / "sakura" -> "Beras Sushi"
- "mayo" / "kens" / "kewpie" -> "Mayo Kens"
- "cabe bubuk" / "togarasi" -> "Togarasi"
- "wasabi" -> "Wasabi"
- "telur" / "ayam dada" / "sayuran" -> sesuaikan dengan barang asli.

Ekstrak informasinya dalam format JSON murni:
1. "supplier_name": Nama toko/supplier di nota (jika tidak tertulis, tebak cth: "Pasar Segar / Supplier").
2. "purchase_date": Tanggal transaksi format YYYY-MM-DD.
3. "items": Array barang belanjaan:
   - "item_name": nama barang hasil pencocokan kamus
   - "quantity": angka jumlah
   - "unit": satuan kemasan ("kg", "pcs", "pack", "karton", "botol", "liter", "can", "gr")
   - "unit_price": harga satuan angka
   - "subtotal": total per item
4. "total_amount": total akhir nota angka.
5. "notes": catatan singkat jika ada info tambahan.

Balas HANYA JSON valid tanpa pembuka/penutup markdown:
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
}`;

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
                text: promptText
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
        max_tokens: 1500,
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
