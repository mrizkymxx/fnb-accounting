import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { compressReceiptImage } from '@/lib/imageCompressor';

/**
 * Upload gambar nota/struk ke Supabase Storage (Bucket: 'receipts')
 * Jika Supabase belum aktif / offline, otomatis fallback ke data URL lokal.
 */
export async function uploadReceiptFile(file: File, folder = 'purchases'): Promise<string> {
  // 1. Kompres gambar terlebih dahulu agar sangat ringan (< 100KB)
  const compressedBase64 = await compressReceiptImage(file, 1200, 0.72);

  // 2. Upload ke Supabase Storage jika tersambung
  const client = supabase;
  if (isSupabaseConfigured && client) {
    try {
      // Konversi base64 kembali ke blob untuk upload multipart
      const res = await fetch(compressedBase64);
      const blob = await res.blob();

      const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(2, 7)}.jpg`;

      const { data, error } = await client.storage
        .from('receipts')
        .upload(fileName, blob, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (!error && data) {
        // Ambil URL public CDN Supabase
        const { data: publicUrlData } = client.storage.from('receipts').getPublicUrl(fileName);
        return publicUrlData.publicUrl;
      }
    } catch (err) {
      console.warn('Storage upload error, fallback to base64', err);
    }
  }

  // 3. Fallback: simpan sebagai Base64 terkompresi
  return compressedBase64;
}
