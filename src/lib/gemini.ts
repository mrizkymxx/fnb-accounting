import { INGREDIENTS_CATALOG } from './ingredientsCatalog';

type GeminiPart =
  | { text: string }
  | { inlineData: { mimeType: string; data: string } };

interface GeminiJsonRequest {
  systemInstruction: string;
  parts: GeminiPart[];
  maxOutputTokens: number;
}

export class GeminiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly clientMessage: string
  ) {
    super(message);
  }
}

const CATALOG_SUMMARY = INGREDIENTS_CATALOG.map(
  i => `{"name":"${i.name}","outlet":"${i.outlet}","unit":"${i.unit}","est_price":${i.price},"supplier":"${i.supplier}"}`
).join('\n');

const OCR_REFERENCE_LIST = INGREDIENTS_CATALOG
  .map(i => `${i.name} (satuan: ${i.unit}, est. Rp${i.price})`)
  .slice(0, 150)
  .join(', ');

export const PARSE_ORDER_SYSTEM_PROMPT = `Anda adalah Asisten AI Akuntansi & Estimasi Biaya Belanja FnB khusus Oklah, Prima Sushi, Rovu, dan Staff Meals.
Tugas Anda:
1. Analisis teks pesanan/daftar belanja mentah (dari chat WhatsApp/catatan dapur).
2. Deteksi Target Outlet (Oklah / Prima Sushi / Rovu / Staff Meals). Jika tidak tertulis di teks, gunakan default: "{defaultOutlet}".
3. Cocokkan setiap item belanja dengan KATALOG BAHAN RESEP di bawah.
4. Estimasi harga satuan dan subtotal berdasarkan harga standar katalog jika ada. Jika tidak ada di katalog, beri estimasi harga pasar wajar di Indonesia (IDR).
5. Normalisasikan kuantitas dan satuan (cth: "1/2kg" -> qty: 0.5, unit: "kg"; "3px/3pcs/3biji" -> qty: 3, unit: "pcs"; "2 Jrigen" -> qty: 2, unit: "jerigen").

KATALOG REFERENSI HARGA BAHAN RESEP:
${CATALOG_SUMMARY}

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

export const OCR_RECEIPT_PROMPT = `Anda adalah AI OCR Akuntansi khusus restoran & kafe (Oklah & Prima Sushi).
Tugas Anda: Baca foto struk/nota belanja (termasuk NOTA TULISAN TANGAN PASAR/SUPPLIER).

DAFTAR NAMA BAHAN ACUAN KAMUS (Jika tulisan tangan mirip salah satu bahan di bawah, normalisasikan ke nama resmi ini):
[${OCR_REFERENCE_LIST}]

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

export async function generateGeminiJson<T>({
  systemInstruction,
  parts,
  maxOutputTokens,
}: GeminiJsonRequest): Promise<T> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new GeminiError(
      'GEMINI_API_KEY environment variable is missing',
      503,
      'AI Gemini belum dikonfigurasi.'
    );
  }

  const response = await fetch(
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemInstruction }] },
        contents: [{ role: 'user', parts }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.1,
          maxOutputTokens,
        },
      }),
    }
  );

  if (!response.ok) {
    const providerError = await response.text();
    throw new GeminiError(
      `Gemini API ${response.status}: ${providerError}`,
      502,
      'Layanan AI Gemini sedang bermasalah. Coba lagi sesaat.'
    );
  }

  const data = await response.json();
  const rawContent = data.candidates?.[0]?.content?.parts
    ?.map((part: { text?: string }) => part.text || '')
    .join('')
    .trim();

  if (!rawContent) {
    throw new GeminiError(
      `Gemini returned no content: ${JSON.stringify(data)}`,
      502,
      'AI Gemini tidak menghasilkan data. Coba lagi.'
    );
  }

  try {
    return JSON.parse(rawContent) as T;
  } catch {
    throw new GeminiError(
      `Gemini returned invalid JSON: ${rawContent}`,
      502,
      'AI Gemini menghasilkan format tidak valid. Coba lagi.'
    );
  }
}
