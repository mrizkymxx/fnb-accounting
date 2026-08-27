'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { CashCollection } from '@/types/database';
import { formatRupiah } from '@/lib/formatters';
import { X, Wallet, Camera } from 'lucide-react';

interface CashCollectionModalProps {
  isOpen: boolean;
  initialData?: CashCollection | null;
  onClose: () => void;
}

export const CashCollectionModal: React.FC<CashCollectionModalProps> = ({
  isOpen,
  initialData,
  onClose,
}) => {
  const { outlets, addCashCollection, updateCashCollection, selectedOutletId } = useApp();

  const [outletId, setOutletId] = useState<string>('');
  const [amount, setAmount] = useState<number>(0);
  const [source, setSource] = useState<'pos_cash_drawer' | 'daily_sales' | 'other'>('pos_cash_drawer');
  const [notes, setNotes] = useState<string>('');
  const [proofImage, setProofImage] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setOutletId(initialData.outlet_id);
      setAmount(initialData.amount);
      setSource(initialData.source);
      setNotes(initialData.notes || '');
      setProofImage(initialData.proof_image_url || null);
    } else {
      setOutletId(selectedOutletId !== 'all' ? selectedOutletId : (outlets[0]?.id || ''));
      setAmount(0);
      setSource('pos_cash_drawer');
      setNotes('');
      setProofImage(null);
    }
  }, [initialData, isOpen, selectedOutletId, outlets]);

  if (!isOpen) return null;

  const currentOutlet = outlets.find(o => o.id === outletId);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setProofImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      alert('Nominal uang ditarik harus lebih dari 0');
      return;
    }

    if (initialData) {
      await updateCashCollection(initialData.id, {
        outlet_id: outletId,
        amount: Number(amount),
        source,
        notes: notes.trim() || undefined,
        proof_image_url: proofImage || undefined,
      });
    } else {
      await addCashCollection({
        outlet_id: outletId,
        collected_at: new Date().toISOString(),
        amount: Number(amount),
        source,
        notes: notes.trim() || undefined,
        status: 'held_by_me',
        proof_image_url: proofImage || undefined,
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-[#FFFDF5] border-t-4 sm:border-4 border-black w-full max-w-lg shadow-[8px_8px_0px_#121212] overflow-hidden rounded-t-2xl sm:rounded-none">
        {/* Header */}
        <div className="flex items-center justify-between p-3.5 sm:p-4 border-b-4 border-black bg-[#FFE600]">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-white border-2 border-black shadow-[2px_2px_0px_#121212]">
              <Wallet className="h-4.5 w-4.5 text-black stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-black uppercase">
                {initialData ? '✏️ Edit Tarik Kas Outlet' : 'Tarik Kas Fisik Kasir Outlet'}
              </h2>
              <p className="text-[10px] font-bold text-black/70">
                Pencatatan saat uang fisik berpindah ke tangan Anda
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 border-2 border-black bg-white hover:bg-slate-100 shadow-[2px_2px_0px_#121212]"
          >
            <X className="h-5 w-5 stroke-[2.5]" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-3.5">
          {/* Outlet Target */}
          <div>
            <label className="block text-xs font-black text-black uppercase mb-1">
              Pilih Outlet
            </label>
            <select
              value={outletId}
              onChange={(e) => setOutletId(e.target.value)}
              className="w-full bg-white border-3 border-black p-2 text-xs sm:text-sm font-black text-black shadow-[3px_3px_0px_#121212] focus:outline-none"
              required
            >
              {outlets.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name} (Target Setor: {formatRupiah(o.cash_deposit_threshold)})
                </option>
              ))}
            </select>
            {currentOutlet && (
              <div className="text-[10px] font-black text-black mt-1 inline-block bg-[#FFE600] border border-black px-1.5 py-0.2">
                ⚡ AMBANG SETOR {currentOutlet.name.toUpperCase()}: {formatRupiah(currentOutlet.cash_deposit_threshold)}
              </div>
            )}
          </div>

          {/* Jumlah Uang Ditarik */}
          <div>
            <label className="block text-xs font-black text-black uppercase mb-1">
              Nominal Uang Fisik Ditarik (Rp) <span className="text-red-600">*</span>
            </label>
            <input
              type="number"
              inputMode="numeric"
              pattern="[0-9]*"
              min="1000"
              step="1000"
              value={amount || ''}
              onChange={(e) => setAmount(Number(e.target.value))}
              placeholder="Contoh: 350000"
              className="w-full bg-white border-3 border-black p-2 text-lg sm:text-xl font-black text-black shadow-[3px_3px_0px_#121212] focus:outline-none"
              required
            />
            {amount > 0 && (
              <p className="text-xs font-bold text-black mt-1">Terbaca: {formatRupiah(amount)}</p>
            )}
          </div>

          {/* Sumber Kas */}
          <div>
            <label className="block text-xs font-black text-black uppercase mb-1">
              Sumber Uang
            </label>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value as any)}
              className="w-full bg-white border-2 border-black p-2 text-xs font-bold text-black focus:outline-none"
            >
              <option value="pos_cash_drawer">Laci Kasir Shift (POS Drawer)</option>
              <option value="daily_sales">Hasil Penjualan Harian</option>
              <option value="other">Lainnya</option>
            </select>
          </div>

          {/* Foto Bukti Hitung */}
          <div>
            <label className="block text-xs font-black text-black uppercase mb-1">
              Foto Bukti Fisik / Slip Kasir (Opsional)
            </label>
            <label className="w-full cursor-pointer flex items-center justify-center gap-2 p-2.5 bg-white border-3 border-black shadow-[2px_2px_0px_#121212] text-xs font-black uppercase">
              <Camera className="h-4 w-4 stroke-[2.5]" />
              <span>Foto Uang / Nota Tarik</span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>
            {proofImage && (
              <div className="flex items-center gap-2 mt-2 bg-white p-1.5 border-2 border-black">
                <img src={proofImage} alt="Bukti" className="h-9 w-9 object-cover border border-black" />
                <span className="text-xs font-black text-black">✓ BUKTI TERLAMPIR</span>
              </div>
            )}
          </div>

          {/* Catatan */}
          <div>
            <label className="block text-xs font-black text-black uppercase mb-1">
              Catatan
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Tarik kasir shift siang Oklah"
              className="w-full bg-white border-2 border-black p-2 text-xs font-bold text-black focus:outline-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t-3 border-black">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border-3 border-black bg-white text-black text-xs font-black uppercase shadow-[2px_2px_0px_#121212]"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 border-3 border-black bg-[#FFE600] text-black text-xs font-black uppercase shadow-[3px_3px_0px_#121212] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
            >
              {initialData ? 'Simpan Perubahan' : 'Simpan & Pegang Uang'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
