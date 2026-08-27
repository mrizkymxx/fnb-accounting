'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { formatRupiah, formatDateIndo, getDaysRemaining } from '@/lib/formatters';
import { compressReceiptImage } from '@/lib/imageCompressor';
import { exportTempoCSV } from '@/lib/exportUtils';
import {
  CheckCircle2,
  Camera,
  Search,
  Receipt,
  FileSpreadsheet
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface TempoManagerViewProps {
  onViewReceipt: (url: string, title: string) => void;
}

export const TempoManagerView: React.FC<TempoManagerViewProps> = ({ onViewReceipt }) => {
  const { purchases, outlets, updateTempoStatus, selectedOutletId, setSelectedOutletId } = useApp();

  const [filterStatus, setFilterStatus] = useState<'all' | 'unpaid' | 'paid'>('unpaid');
  const [searchQuery, setSearchQuery] = useState('');
  const [payingPurchaseId, setPayingPurchaseId] = useState<string | null>(null);
  const [proofImage, setProofImage] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const tempoPurchases = purchases.filter(p => {
    if (!p.is_tempo) return false;
    if (selectedOutletId !== 'all' && p.outlet_id !== selectedOutletId) return false;
    if (filterStatus === 'unpaid' && p.tempo_status !== 'unpaid') return false;
    if (filterStatus === 'paid' && p.tempo_status !== 'paid') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchSup = p.supplier_name.toLowerCase().includes(q);
      const matchNotes = p.notes?.toLowerCase().includes(q);
      if (!matchSup && !matchNotes) return false;
    }

    return true;
  });

  const unpaidTotal = purchases
    .filter(p => p.is_tempo && p.tempo_status === 'unpaid' && (selectedOutletId === 'all' || p.outlet_id === selectedOutletId))
    .reduce((acc, p) => acc + p.total_amount, 0);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsCompressing(true);
      const compressed = await compressReceiptImage(file, 1200, 0.72);
      setProofImage(compressed);
    } catch {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProofImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    } finally {
      setIsCompressing(false);
    }
  };

  const handleConfirmPayTempo = async (purchaseId: string) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await updateTempoStatus(purchaseId, 'paid', proofImage || undefined);
      setPayingPurchaseId(null);
      setProofImage(null);

      try {
        confetti({
          particleCount: 70,
          spread: 50,
          origin: { y: 0.6 }
        });
      } catch {}
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-20 sm:pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-6 border-3 sm:border-4 border-black shadow-[3px_3px_0px_#121212] sm:shadow-[5px_5px_0px_#121212]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-2xl font-black text-black uppercase tracking-tight">
              Hutang Tempo Supplier
            </h1>
            <span className="px-2 py-0.5 bg-[#FF4343] text-white border-2 border-black text-[10px] sm:text-xs font-black uppercase">
              Tempo
            </span>
          </div>
          <p className="text-xs sm:text-sm font-bold text-black/70 mt-1">
            Pantau jadwal jatuh tempo supplier andalan, bayar via transfer, dan arsipkan bukti transfer.
          </p>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
          <div className="bg-[#FFE600] border-3 border-black p-2.5 sm:p-3.5 shadow-[3px_3px_0px_#121212] text-left sm:text-right flex-1 sm:flex-initial">
            <span className="text-[9px] sm:text-[10px] font-black text-black uppercase tracking-wider block">
              Total Tagihan Belum Lunas
            </span>
            <div className="text-lg sm:text-2xl font-black text-black mt-0.5">
              {formatRupiah(unpaidTotal)}
            </div>
          </div>

          <button
            onClick={() => exportTempoCSV(purchases, outlets)}
            className="w-full sm:w-auto px-3 py-2.5 sm:py-3 bg-white border-2 border-black text-black text-xs font-black uppercase shadow-[2px_2px_0px_#121212] hover:bg-slate-50 flex items-center justify-center gap-1.5 active:translate-x-[1px] active:translate-y-[1px]"
            title="Export CSV Excel"
          >
            <FileSpreadsheet className="h-4 w-4 stroke-[2.5]" />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 bg-white p-3 sm:p-4 border-3 border-black shadow-[3px_3px_0px_#121212]">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari supplier..."
            className="w-full bg-[#FFFDF5] border-2 border-black pl-9 pr-3 py-1.5 text-xs font-bold text-black placeholder:text-black/50 focus:outline-none"
          />
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-black stroke-[2.5]" />
        </div>

        <div>
          <select
            value={selectedOutletId}
            onChange={(e) => setSelectedOutletId(e.target.value)}
            className="w-full bg-[#FFFDF5] border-2 border-black px-3 py-1.5 text-xs font-bold text-black focus:outline-none"
          >
            <option value="all">Semua Outlet</option>
            {outlets.map(o => (
              <option key={o.id} value={o.id}>{o.name}</option>
            ))}
          </select>
        </div>

        <div className="flex bg-[#FFFDF5] p-1 border-2 border-black">
          <button
            onClick={() => setFilterStatus('unpaid')}
            className={`flex-1 py-1 text-xs font-black uppercase transition-all ${
              filterStatus === 'unpaid' ? 'bg-[#FF4343] text-white border border-black shadow-[2px_2px_0px_#121212]' : 'text-black'
            }`}
          >
            Belum Lunas
          </button>
          <button
            onClick={() => setFilterStatus('paid')}
            className={`flex-1 py-1 text-xs font-black uppercase transition-all ${
              filterStatus === 'paid' ? 'bg-[#00F0FF] text-black border border-black shadow-[2px_2px_0px_#121212]' : 'text-black'
            }`}
          >
            Lunas
          </button>
          <button
            onClick={() => setFilterStatus('all')}
            className={`flex-1 py-1 text-xs font-black uppercase transition-all ${
              filterStatus === 'all' ? 'bg-black text-white' : 'text-black'
            }`}
          >
            Semua
          </button>
        </div>
      </div>

      {/* Cards */}
      {tempoPurchases.length === 0 ? (
        <div className="p-8 sm:p-12 text-center bg-white border-3 border-black shadow-[3px_3px_0px_#121212] text-black font-bold text-xs">
          Tidak ada data tempo yang sesuai filter.
        </div>
      ) : (
        <div className="space-y-3">
          {tempoPurchases.map((p) => {
            const outlet = outlets.find(o => o.id === p.outlet_id);
            const remaining = getDaysRemaining(p.tempo_due_date);
            const isUnpaid = p.tempo_status === 'unpaid';

            return (
              <div
                key={p.id}
                className={`p-3.5 sm:p-5 border-3 border-black transition-all ${
                  isUnpaid
                    ? remaining.isOverdue
                      ? 'bg-[#FFEAEB] shadow-[4px_4px_0px_#121212]'
                      : 'bg-white shadow-[3px_3px_0px_#121212]'
                    : 'bg-[#F2F2F2] shadow-[2px_2px_0px_#121212] opacity-80'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      <span className="font-black text-black text-sm sm:text-base uppercase">{p.supplier_name}</span>
                      <span className="text-[10px] px-1.5 py-0.2 border-2 border-black bg-[#FFE600] font-black uppercase">
                        {outlet?.name}
                      </span>
                      <span
                        className={`text-[9px] sm:text-[10px] px-2 py-0.5 border-2 border-black font-black uppercase ${
                          isUnpaid
                            ? remaining.isOverdue
                              ? 'bg-[#FF4343] text-white'
                              : 'bg-[#FFE600] text-black'
                            : 'bg-[#00F0FF] text-black'
                        }`}
                      >
                        {isUnpaid ? remaining.label : 'LUNAS DITRANSFER'}
                      </span>
                    </div>

                    <div className="text-xs font-bold text-black/70 flex flex-wrap items-center gap-2">
                      <span>Beli: {formatDateIndo(p.purchase_date)}</span>
                      <span>•</span>
                      <span>
                        Jatuh Tempo: {formatDateIndo(p.tempo_due_date || '')}
                      </span>
                    </div>

                    {p.notes && (
                      <p className="text-xs font-semibold text-black/80 italic">
                        Keterangan: {p.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-3 shrink-0 pt-2 md:pt-0 border-t-2 md:border-t-0 border-black">
                    <div className="text-right">
                      <div className="text-[10px] font-bold text-black/70 uppercase">Total Tagihan:</div>
                      <div className={`text-base sm:text-xl font-black ${isUnpaid ? 'text-[#FF4343]' : 'text-black'}`}>
                        {formatRupiah(p.total_amount)}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {p.receipt_image_url && (
                        <button
                          onClick={() => onViewReceipt(p.receipt_image_url!, `Nota ${p.supplier_name}`)}
                          className="p-2 bg-white border-2 border-black shadow-[2px_2px_0px_#121212]"
                          title="Lihat Nota Beli"
                        >
                          <Receipt className="h-4 w-4 stroke-[2.5]" />
                        </button>
                      )}

                      {isUnpaid ? (
                        <button
                          onClick={() => setPayingPurchaseId(p.id)}
                          className="px-3.5 py-2 bg-[#00F0FF] text-black font-black text-xs uppercase border-2 border-black shadow-[2px_2px_0px_#121212] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all flex items-center gap-1"
                        >
                          <CheckCircle2 className="h-4 w-4 stroke-[2.5]" />
                          <span>Bayar / Lunas</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => updateTempoStatus(p.id, 'unpaid')}
                          className="px-2.5 py-1.5 bg-white text-black font-bold text-xs uppercase border border-black shadow-[1px_1px_0px_#121212]"
                        >
                          Batal Lunas
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Sub-form Modal Pelunasan */}
                {payingPurchaseId === p.id && (
                  <div className="mt-3 p-3 bg-[#FFE600] border-2 border-black shadow-[3px_3px_0px_#121212] space-y-2.5">
                    <div className="text-xs font-black text-black uppercase">
                      Konfirmasi Pelunasan Transfer: {p.supplier_name}
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-black uppercase mb-1">
                        Lampirkan Bukti Transfer M-Banking (Opsional)
                      </label>
                      <label className="cursor-pointer inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white border-2 border-black shadow-[2px_2px_0px_#121212] text-xs font-black uppercase">
                        <Camera className="h-3.5 w-3.5 stroke-[2.5]" />
                        <span>Upload Bukti Transfer</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                        />
                      </label>
                      {proofImage && (
                        <span className="text-xs font-black text-black ml-2">✓ BUKTI TERLAMPIR</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 justify-end pt-1">
                      <button
                        onClick={() => {
                          setPayingPurchaseId(null);
                          setProofImage(null);
                        }}
                        className="px-3 py-1 text-xs font-black uppercase bg-white border-2 border-black"
                      >
                        Batal
                      </button>
                      <button
                        onClick={() => handleConfirmPayTempo(p.id)}
                        className="px-4 py-1 bg-[#00F0FF] text-black font-black text-xs uppercase border-2 border-black shadow-[2px_2px_0px_#121212]"
                      >
                        Simpan Lunas
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
