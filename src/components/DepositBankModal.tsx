'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { formatRupiah } from '@/lib/formatters';
import { X, Building2, CheckCircle2, Camera, Split, AlertCircle, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';

interface DepositBankModalProps {
  isOpen: boolean;
  outletId: string;
  onClose: () => void;
}

export const DepositBankModal: React.FC<DepositBankModalProps> = ({
  isOpen,
  outletId,
  onClose,
}) => {
  const { outlets, cashOnHandSummaries, depositCashOnHand } = useApp();

  const [bankName, setBankName] = useState<string>('BCA');
  const [bankAccount, setBankAccount] = useState<string>('');
  const [slipImage, setSlipImage] = useState<string | null>(null);
  const [notes, setNotes] = useState<string>('');

  const targetSummary = cashOnHandSummaries.find(s => s.outlet_id === outletId);
  const targetOutlet = outlets.find(o => o.id === outletId);

  const totalToDeposit = targetSummary ? targetSummary.total_held : 0;

  // Hitung otomatis kelipatan 50.000 / 100.000 untuk mesin setor ATM
  const atmEligibleAmount = Math.floor(totalToDeposit / 50000) * 50000;
  const remainderCash = totalToDeposit - atmEligibleAmount;

  const [useAtmSplit, setUseAtmSplit] = useState<boolean>(remainderCash > 0);

  if (!isOpen) return null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setSlipImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (totalToDeposit <= 0) {
      alert('Tidak ada saldo kas dipegang untuk outlet ini.');
      return;
    }

    const atmDeposit = useAtmSplit ? atmEligibleAmount : totalToDeposit;
    const remainder = useAtmSplit ? remainderCash : 0;

    await depositCashOnHand(
      outletId,
      bankName,
      bankAccount.trim() || 'Rekening Operasional Utama',
      slipImage || undefined,
      notes.trim() || undefined,
      atmDeposit,
      remainder
    );

    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 }
      });
    } catch {}

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-xs overflow-y-auto overflow-x-hidden">
      <div className="bg-[#FFFDF5] border-t-4 sm:border-4 border-black w-full max-w-lg shadow-[8px_8px_0px_#000000] overflow-hidden rounded-t-2xl sm:rounded-none max-h-[94dvh] flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b-4 border-black bg-[#00F0FF] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white border-2 border-black shadow-[2px_2px_0px_#000000]">
              <Building2 className="h-5 w-5 text-black stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-black uppercase tracking-tight">
                Setor Kasir ke Rekening / Pusat
              </h2>
              <p className="text-xs font-bold text-black/80">
                Outlet: <span className="underline">{targetOutlet?.name}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 border-2 border-black bg-white hover:bg-slate-100 shadow-[2px_2px_0px_#000000]"
          >
            <X className="h-5 w-5 stroke-[2.5]" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {/* Total yang akan disetor */}
          <div className="p-3.5 sm:p-4 bg-[#FFE600] border-3 border-black sm:shadow-[4px_4px_0px_#000000] text-center">
            <span className="text-[11px] sm:text-xs font-black text-black uppercase tracking-wider block">
              Total Kewajiban Setoran Kasir
            </span>
            <div className="text-2xl sm:text-3xl font-black text-black mt-0.5">
              {formatRupiah(totalToDeposit)}
            </div>
            <p className="text-[10px] sm:text-[11px] font-bold text-black/70 mt-1">
              Catatan kas ditarik dari {targetOutlet?.name} akan otomatis ditandai LUNAS disetor ke pusat.
            </p>
          </div>

          {/* Smart ATM Splitter Calculator */}
          {remainderCash > 0 && (
            <div className="p-3.5 bg-white border-3 border-black shadow-[3px_3px_0px_#121212] space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-black text-black uppercase">
                  <Split className="h-4 w-4 text-[#FF4343] stroke-[2.5]" />
                  <span>Kalkulator Pecahan Mesin ATM</span>
                </div>
                <label className="flex items-center gap-1 text-[10px] font-black uppercase cursor-pointer bg-[#FFE600] border border-black px-1.5 py-0.5">
                  <input
                    type="checkbox"
                    checked={useAtmSplit}
                    onChange={(e) => setUseAtmSplit(e.target.checked)}
                    className="accent-black"
                  />
                  <span>Aktifkan Split</span>
                </label>
              </div>

              {useAtmSplit ? (
                <div className="space-y-2 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2.5 bg-[#00F0FF]/20 border-2 border-black">
                      <span className="text-[10px] font-black text-black/70 block uppercase">1. Masuk Mesin ATM (50rb/100rb)</span>
                      <span className="text-base font-black text-black mt-0.5 block">{formatRupiah(atmEligibleAmount)}</span>
                      <span className="text-[9px] font-bold text-black/60">Disetor tunai ke rekening</span>
                    </div>

                    <div className="p-2.5 bg-[#FF4343]/15 border-2 border-black">
                      <span className="text-[10px] font-black text-black/70 block uppercase">2. Sisa Receh Cash di Kantong</span>
                      <span className="text-base font-black text-red-600 mt-0.5 block">{formatRupiah(remainderCash)}</span>
                      <span className="text-[9px] font-bold text-black/60">Jadi Cash Dana Titipan</span>
                    </div>
                  </div>

                  <div className="p-2 bg-[#FFFDF5] border border-black text-[11px] font-bold text-black/80 space-y-1">
                    <div className="flex items-center gap-1 text-emerald-700 font-black">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Transfer ke Bos Tetap Utuh: {formatRupiah(totalToDeposit)}</span>
                    </div>
                    <p className="text-[10px] leading-relaxed">
                      *Kekurangan {formatRupiah(remainderCash)} otomatis ditalangi dari Saldo Titipan di rekening, dan kamu memegang uang tunai {formatRupiah(remainderCash)} di kantong.
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-[11px] font-bold text-black/60">
                  Setor manual non-split (asumsi semua uang masuk mesin ATM atau setor lewat teller).
                </p>
              )}
            </div>
          )}

          {/* Bank Tujuan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black text-black uppercase mb-1.5">
                Bank Tujuan Transfer
              </label>
              <select
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full bg-white border-3 border-black p-2.5 text-xs font-black text-black focus:outline-none"
              >
                <option value="BCA">BCA</option>
                <option value="Mandiri">Bank Mandiri</option>
                <option value="BRI">BRI</option>
                <option value="BNI">BNI</option>
                <option value="BSI">BSI</option>
                <option value="Jago">Bank Jago</option>
                <option value="Seabank">SeaBank</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-black text-black uppercase mb-1.5">
                Keterangan / No. Rekening
              </label>
              <input
                type="text"
                value={bankAccount}
                onChange={(e) => setBankAccount(e.target.value)}
                placeholder="Contoh: Rekening Bos / Pusat"
                className="w-full bg-white border-3 border-black p-2.5 text-xs font-bold text-black focus:outline-none"
              />
            </div>
          </div>

          {/* Upload Bukti */}
          <div>
            <label className="block text-xs font-black text-black uppercase mb-1.5">
              Foto Struk CDM ATM / Bukti M-Banking
            </label>
            <label className="w-full cursor-pointer flex items-center justify-center gap-2 p-3 bg-white border-3 border-black shadow-[3px_3px_0px_#000000] hover:bg-slate-50 text-xs font-black uppercase">
              <Camera className="h-4 w-4 stroke-[2.5]" />
              <span>{slipImage ? '✓ Bukti Terlampir — Ketuk untuk Ganti' : 'Foto Struk CDM ATM / Transfer'}</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>
            {slipImage && (
              <div className="flex items-center gap-2 mt-2 bg-white p-2 border-2 border-black">
                <img src={slipImage} alt="Struk" className="h-10 w-10 object-cover border border-black" />
                <span className="text-xs font-black text-black">✓ BUKTI TERLAMPIR</span>
                <button
                  type="button"
                  onClick={() => setSlipImage(null)}
                  className="ml-auto text-[10px] font-bold text-red-600"
                >
                  Hapus
                </button>
              </div>
            )}
          </div>

          {/* Catatan */}
          <div>
            <label className="block text-xs font-black text-black uppercase mb-1.5">
              Catatan Setor
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Setoran omset minggu 3"
              className="w-full bg-white border-2 border-black p-2 text-xs font-bold text-black focus:outline-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t-3 border-black">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border-3 border-black bg-white text-black text-xs font-black uppercase shadow-[2px_2px_0px_#000000]"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 border-3 border-black bg-[#00F0FF] text-black text-xs sm:text-sm font-black uppercase shadow-[3px_3px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
            >
              Konfirmasi Setor Lunas
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
