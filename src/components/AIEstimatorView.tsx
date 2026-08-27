'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { formatRupiah } from '@/lib/formatters';
import {
  Calculator,
  Sparkles,
  Copy,
  Check,
  Send,
  Loader2,
  Share2,
  Trash2,
  FileText,
  Building,
  Store
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const AIEstimatorView: React.FC = () => {
  const { outlets } = useApp();

  const [rawText, setRawText] = useState<string>('');

  const [selectedOutlet, setSelectedOutlet] = useState<string>(
    outlets.length > 0 ? outlets[0].name : 'Oklah'
  );

  const [isCalculating, setIsCalculating] = useState(false);
  const [resultData, setResultData] = useState<any | null>(null);
  const [formattedWhatsapp, setFormattedWhatsapp] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const handleCalculateEstimate = async () => {
    if (!rawText.trim()) return;

    try {
      setIsCalculating(true);
      setCopied(false);

      const res = await fetch('/api/parse-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          textPrompt: rawText,
          defaultOutlet: selectedOutlet
        })
      });

      const json = await res.json();

      if (!res.ok || !json.data) {
        throw new Error(json.error || 'Gagal menghitung estimasi. Coba lagi.');
      }

      {
        const data = {
          ...json.data,
          items: Array.isArray(json.data.items) ? json.data.items : []
        };
        setResultData(data);

        // Buat format teks rapi khusus siap copy-paste ke WhatsApp
        const todayFormatted = new Intl.DateTimeFormat('id-ID', {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        }).format(new Date());

        let waText = `*📋 ESTIMASI BELANJA - ${data.detected_outlet_name?.toUpperCase() || 'OUTLET'}*\n`;
        waText += `📅 Tanggal: ${todayFormatted}\n`;
        waText += `🏢 Sumber: ${data.supplier_suggestion || 'Pasar Tradisional'}\n`;
        waText += `------------------------------------\n`;

        data.items.forEach((it: any, idx: number) => {
          waText += `${idx + 1}. *${it.item_name}* (${it.quantity} ${it.unit}) ~ Rp ${Number(it.estimated_subtotal || 0).toLocaleString('id-ID')}\n`;
          if (it.notes) {
            waText += `   _${it.notes}_\n`;
          }
        });

        waText += `------------------------------------\n`;
        waText += `*💰 TOTAL ESTIMASI: Rp ${Number(data.total_estimated_amount || 0).toLocaleString('id-ID')}*\n\n`;
        waText += `_Catatan: Estimasi acuan harga resep standar. Realisasi di lapangan menyesuaikan nota belanja pasar._`;

        setFormattedWhatsapp(waText);

        try {
          confetti({
            particleCount: 60,
            spread: 55,
            origin: { y: 0.6 }
          });
        } catch {}
      }
    } catch (err) {
      console.error('Error calculating estimate:', err);
      alert(err instanceof Error ? err.message : 'Gagal menghitung estimasi. Periksa koneksi internet dan coba lagi.');
    } finally {
      setIsCalculating(false);
    }
  };

  const handleCopyToClipboard = async () => {
    if (!formattedWhatsapp) return;

    try {
      await navigator.clipboard.writeText(formattedWhatsapp);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback manual copy off-screen
      const textArea = document.createElement('textarea');
      textArea.value = formattedWhatsapp;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      textArea.style.top = '0';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleOpenDirectWhatsApp = () => {
    if (!formattedWhatsapp) return;
    const encoded = encodeURIComponent(formattedWhatsapp);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-20 sm:pb-12">
      {/* Header Bar */}
      <div className="bg-white p-4 sm:p-6 border-3 sm:border-4 border-black shadow-[3px_3px_0px_#121212] sm:shadow-[5px_5px_0px_#121212]">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-[#00F0FF] border-2 border-black text-black shadow-[2px_2px_0px_#121212]">
            <Calculator className="h-6 w-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-2xl font-black text-black uppercase tracking-tight">
                Kalkulator Estimasi Belanja (WhatsApp Tool)
              </h1>
              <span className="px-2 py-0.5 bg-[#FFE600] border-2 border-black text-black text-[10px] sm:text-xs font-black uppercase">
                Stand-Alone
              </span>
            </div>
            <p className="text-xs sm:text-sm font-bold text-black/70 mt-1">
              Khusus menghitung perkiraan biaya kasar dari pesan mentah & generate format siap kirim ke WhatsApp (tidak masuk pembukuan belanja).
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid Layout: Input vs Result Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Left Column: Raw Input Box */}
        <div className="bg-white border-3 sm:border-4 border-black shadow-[4px_4px_0px_#121212] p-4 sm:p-6 space-y-3.5 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-black uppercase flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-[#FF4343]" />
                <span>1. Pilih Outlet Target:</span>
              </label>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {outlets.map((outlet) => (
                <button
                  key={outlet.id}
                  onClick={() => setSelectedOutlet(outlet.name)}
                  className={`py-2 px-3 border-2 border-black text-xs font-black uppercase transition-all flex items-center justify-center gap-1.5 ${
                    selectedOutlet === outlet.name
                      ? 'bg-[#FFE600] text-black shadow-[2px_2px_0px_#121212]'
                      : 'bg-white text-black hover:bg-slate-50'
                  }`}
                >
                  <Store className="h-3.5 w-3.5 stroke-[2.5]" />
                  <span>{outlet.name}</span>
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-black/10">
              <label className="text-xs font-black text-black uppercase flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-[#FF4343]" />
                <span>2. Ketik / Paste Teks Pesanan Mentah:</span>
              </label>
              <button
                onClick={() => setRawText('')}
                className="text-[11px] font-bold text-black/60 hover:text-red-600 flex items-center gap-1"
                title="Hapus teks"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Bersihkan</span>
              </button>
            </div>

            <textarea
              rows={12}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Ketik pesanan, contoh:&#10;- Keju Prochiz Gold 3px&#10;- B.Putih 1/2kg&#10;- Kentang 2 Biji besar&#10;- Sawi Sendok 7&#10;- Sabun cuci piring 2 Jrigen"
              className="w-full bg-[#FFFDF5] border-3 border-black p-3 text-xs sm:text-sm font-bold text-black focus:outline-none shadow-[2px_2px_0px_#121212] leading-relaxed"
            />
            <p className="text-[11px] font-bold text-black/70">
              *Didukung AI Gemini + 297 Kamus Resep Oklah & Prima Sushi. Otomatis mengenali singkatan, satuan pecahan, & harga estimasi pasar.
            </p>
          </div>

          <button
            type="button"
            onClick={handleCalculateEstimate}
            disabled={isCalculating || !rawText.trim()}
            className="w-full py-3.5 bg-[#00F0FF] hover:bg-[#00d6e6] text-black font-black text-xs sm:text-sm uppercase border-3 border-black shadow-[4px_4px_0px_#121212] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isCalculating ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>AI Sedang Menghitung Estimasi...</span>
              </>
            ) : (
              <>
                <Calculator className="h-5 w-5 stroke-[2.5]" />
                <span>Hitung Estimasi Biaya & Format WhatsApp</span>
              </>
            )}
          </button>
        </div>

        {/* Right Column: WhatsApp Formatted Output */}
        <div className="bg-white border-3 sm:border-4 border-black shadow-[4px_4px_0px_#121212] p-4 sm:p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-black uppercase flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-[#2E9E66]" />
                <span>3. Hasil Format Pesan WhatsApp:</span>
              </label>

              {resultData && (
                <span className="text-[11px] font-black bg-[#FFE600] border border-black px-2 py-0.5 uppercase">
                  {resultData.items?.length || 0} Item • Total: {formatRupiah(resultData.total_estimated_amount || 0)}
                </span>
              )}
            </div>

            {formattedWhatsapp ? (
              <div className="space-y-2">
                <textarea
                  rows={12}
                  readOnly
                  value={formattedWhatsapp}
                  className="w-full bg-[#FCFAF2] border-3 border-black p-3 text-xs sm:text-sm font-mono font-bold text-black focus:outline-none shadow-[2px_2px_0px_#121212] whitespace-pre-wrap leading-relaxed select-all"
                />
              </div>
            ) : (
              <div className="p-12 text-center bg-[#FFFDF5] border-2 border-dashed border-black text-black font-bold text-xs flex flex-col items-center justify-center min-h-[260px]">
                <Calculator className="h-8 w-8 text-black/40 mb-2 stroke-[2]" />
                <span>Ketik daftar pesanan di sebelah kiri & klik Hitung Estimasi.</span>
                <span className="text-black/60 text-[11px] mt-1">Pesan berformat rapi dengan rincian harga siap kirim akan muncul di sini.</span>
              </div>
            )}
          </div>

          {/* Action Buttons for WhatsApp */}
          {formattedWhatsapp && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t-3 border-black">
              <button
                type="button"
                onClick={handleCopyToClipboard}
                className="py-3 bg-[#FFE600] hover:bg-[#ffd900] text-black font-black text-xs uppercase border-3 border-black shadow-[3px_3px_0px_#121212] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center gap-1.5"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 stroke-[3]" />
                    <span>✓ Tersalin ke Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 stroke-[2.5]" />
                    <span>Salin Teks WhatsApp</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleOpenDirectWhatsApp}
                className="py-3 bg-[#25D366] hover:bg-[#20bd5a] text-black font-black text-xs uppercase border-3 border-black shadow-[3px_3px_0px_#121212] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center gap-1.5"
              >
                <Share2 className="h-4 w-4 stroke-[2.5]" />
                <span>Buka & Kirim ke WhatsApp</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Rincian Tabel Item Hasil AI (Jika Ada) */}
      {resultData && resultData.items && resultData.items.length > 0 && (
        <div className="bg-white border-3 sm:border-4 border-black shadow-[4px_4px_0px_#121212] p-4 sm:p-6 space-y-3">
          <div className="flex items-center justify-between border-b-2 border-black pb-2.5">
            <h3 className="text-xs sm:text-sm font-black text-black uppercase">
              Tabel Rincian Estimasi Harga Pasar & Resep ({resultData.items.length} Item)
            </h3>
            <span className="text-xs font-black text-black bg-[#00F0FF] border border-black px-2 py-0.5">
              Unit: {resultData.detected_outlet_name}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {resultData.items.map((it: any, i: number) => (
              <div
                key={i}
                className="p-3 bg-[#FFFDF5] border-2 border-black shadow-[2px_2px_0px_#121212] flex flex-col justify-between text-xs space-y-1"
              >
                <div>
                  <div className="flex items-start justify-between gap-1">
                    <span className="font-black text-black text-sm uppercase">{it.item_name}</span>
                    <span className="text-[10px] font-bold bg-[#FFE600] px-1.5 py-0.2 border border-black shrink-0">
                      {it.quantity} {it.unit}
                    </span>
                  </div>
                  {it.raw_text && it.raw_text !== it.item_name && (
                    <p className="text-[10px] font-bold text-black/60 italic">Asli: &quot;{it.raw_text}&quot;</p>
                  )}
                  {it.notes && (
                    <p className="text-[10px] font-bold text-red-600">Catatan: {it.notes}</p>
                  )}
                </div>

                <div className="pt-2 border-t border-black/10 flex items-baseline justify-between">
                  <span className="text-[10px] font-bold text-black/70">@ {formatRupiah(it.estimated_unit_price || 0)}</span>
                  <span className="font-black text-black text-sm">{formatRupiah(it.estimated_subtotal || 0)}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 bg-[#FFE600] border-3 border-black shadow-[3px_3px_0px_#121212] flex items-center justify-between mt-4">
            <span className="font-black text-black text-xs sm:text-sm uppercase tracking-wider">
              Total Akumulasi Estimasi Belanja Kasar:
            </span>
            <span className="font-black text-black text-lg sm:text-2xl">
              {formatRupiah(resultData.total_estimated_amount || 0)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
