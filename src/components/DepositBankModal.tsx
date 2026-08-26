'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { formatRupiah } from '@/lib/formatters';
import { X, Building2, CheckCircle2, Camera } from 'lucide-react';
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

  if (!isOpen) return null;

  const targetSummary = cashOnHandSummaries.find(s => s.outlet_id === outletId);
  const targetOutlet = outlets.find(o => o.id === outletId);

  const totalToDeposit = targetSummary ? targetSummary.total_held : 0;

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

    await depositCashOnHand(
      outletId,
      bankName,
      bankAccount.trim() || 'Rekening Operasional Utama',
      slipImage || undefined,
      notes.trim() || undefined
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-none">
      <div className="bg-[#FFFDF5] border-4 border-black w-full max-w-lg shadow-[8px_8px_0px_#000000] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b-4 border-black bg-[#00F0FF]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white border-2 border-black shadow-[2px_2px_0px_#000000]">
              <Building2 className="h-5 w-5 text-black stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-black uppercase">
                Setor Tunai ke Rekening Bank
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
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          {/* Total yang akan disetor */}
          <div className="p-4 bg-[#FFE600] border-3 border-black shadow-[4px_4px_0px_#000000] text-center">
            <span className="text-xs font-black text-black uppercase tracking-wider">
              Total Uang Kas Dipegang Siap Setor
            </span>
            <div className="text-2xl sm:text-3xl font-black text-black mt-1">
              {formatRupiah(totalToDeposit)}
            </div>
            <p className="text-[11px] font-bold text-black/70 mt-1">
              Semua catatan kas ditarik dari {targetOutlet?.name} akan ditandai lunas setor ke bank.
            </p>
          </div>

          {/* Bank Tujuan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black text-black uppercase mb-1.5">
                Bank Tujuan
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
                No. Rekening / Keterangan
              </label>
              <input
                type="text"
                value={bankAccount}
                onChange={(e) => setBankAccount(e.target.value)}
                placeholder="Contoh: Rek Operasional"
                className="w-full bg-white border-3 border-black p-2.5 text-xs font-bold text-black focus:outline-none"
              />
            </div>
          </div>

          {/* Upload Bukti */}
          <div>
            <label className="block text-xs font-black text-black uppercase mb-1.5">
              Foto Struk CDM / Setor Tunai Bank
            </label>
            <label className="w-full cursor-pointer flex items-center justify-center gap-2 p-3 bg-white border-3 border-black shadow-[3px_3px_0px_#000000] hover:bg-slate-50 text-xs font-black uppercase">
              <Camera className="h-4 w-4 stroke-[2.5]" />
              <span>Foto Struk Mesin Setor Tunai / Teller</span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>
            {slipImage && (
              <div className="flex items-center gap-2 mt-2 bg-white p-2 border-2 border-black">
                <img src={slipImage} alt="Struk" className="h-10 w-10 object-cover border border-black" />
                <span className="text-xs font-black text-black">✓ STRUK SETOR TERLAMPIR</span>
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
              placeholder="Contoh: Setor via CRM BCA Diponegoro"
              className="w-full bg-white border-3 border-black p-2.5 text-xs font-bold text-black focus:outline-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t-3 border-black">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border-3 border-black bg-white text-black text-xs font-black uppercase shadow-[2px_2px_0px_#000000]"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-6 py-2 border-3 border-black bg-[#00F0FF] text-black text-xs font-black uppercase shadow-[4px_4px_0px_#000000] hover:translate-x-[-2px] hover:translate-y-[-2px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
            >
              Konfirmasi Setor Selesai
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
