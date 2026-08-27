'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { formatRupiah, parseNumberInput } from '@/lib/formatters';
import { compressReceiptImage } from '@/lib/imageCompressor';
import { X, ArrowDownRight, Camera } from 'lucide-react';
import confetti from 'canvas-confetti';

interface AdvanceFundModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdvanceFundModal: React.FC<AdvanceFundModalProps> = ({ isOpen, onClose }) => {
  const { outlets, addAdvanceFundBatch, selectedOutletId } = useApp();

  const [outletId, setOutletId] = useState<string>('');
  const [senderSource, setSenderSource] = useState<string>('Owner / Rekening Luar');
  const [batchName, setBatchName] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [proofImage, setProofImage] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  React.useEffect(() => {
    if (isOpen) {
      setOutletId(selectedOutletId !== 'all' ? selectedOutletId : (outlets[0]?.id || ''));
      setSenderSource('Owner / Rekening Luar');
      setBatchName('');
      setAmount(0);
      setNotes('');
      setProofImage(null);
      setIsSubmitting(false);
    }
  }, [isOpen, selectedOutletId, outlets]);

  if (!isOpen) return null;

  const currentOutlet = outlets.find(o => o.id === outletId);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const cleanAmount = parseNumberInput(amount);
    if (cleanAmount <= 0) {
      alert('Nominal transfer dana masuk harus lebih dari 0');
      return;
    }

    const defaultName = `Dana Belanja ${currentOutlet?.name} dari ${senderSource} (${new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short' }).format(new Date())})`;

    setIsSubmitting(true);
    try {
      await addAdvanceFundBatch({
        outlet_id: outletId,
        sender_source: senderSource.trim() || 'Pihak Luar',
        batch_name: batchName.trim() || defaultName,
        received_at: new Date().toISOString(),
        initial_amount: cleanAmount,
        notes: notes.trim() || undefined,
        proof_image_url: proofImage || undefined,
      });

      try {
        confetti({
          particleCount: 60,
          spread: 60,
          origin: { y: 0.6 }
        });
      } catch {}

      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-xs overflow-y-auto">
      <div className="bg-[#FFFDF5] border-t-4 sm:border-4 border-black w-full max-w-lg shadow-[8px_8px_0px_#121212] overflow-hidden rounded-t-2xl sm:rounded-none max-h-[92dvh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b-4 border-black bg-[#00F0FF] shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-white border-2 border-black shadow-[2px_2px_0px_#121212]">
              <ArrowDownRight className="h-5 w-5 text-black stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base font-black text-black uppercase tracking-tight">
                Terima Transfer Belanja Dari Luar
              </h2>
              <p className="text-[11px] font-bold text-black/80">
                Uang masuk rekening pribadi untuk kebutuhan belanja outlet
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 border-2 border-black bg-white hover:bg-slate-100 shadow-[2px_2px_0px_#121212] active:translate-x-[1px] active:translate-y-[1px]"
          >
            <X className="h-5 w-5 stroke-[2.5]" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {/* Target Peruntukan Outlet */}
          <div>
            <label className="block text-xs font-black text-black uppercase mb-1">
              Untuk Belanja Outlet Mana? <span className="text-red-600">*</span>
            </label>
            <select
              value={outletId}
              onChange={(e) => setOutletId(e.target.value)}
              className="w-full bg-white border-3 border-black p-2.5 text-sm font-black text-black shadow-[3px_3px_0px_#121212] focus:outline-none"
              required
            >
              {outlets.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name} ({o.type.toUpperCase()})
                </option>
              ))}
            </select>
            <p className="text-[11px] font-bold text-black/70 mt-1">
              Uang ini hanya akan dipotong saat mencatat belanja untuk {currentOutlet?.name}.
            </p>
          </div>

          {/* Sumber Transfer / Pengirim Luar */}
          <div>
            <label className="block text-xs font-black text-black uppercase mb-1">
              Sumber Transfer / Pengirim Dari Luar <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              value={senderSource}
              onChange={(e) => setSenderSource(e.target.value)}
              placeholder="Contoh: Owner / Bos, Investor, Rekening Luar, Dana Titipan A"
              className="w-full bg-white border-3 border-black p-2.5 text-xs font-bold text-black shadow-[3px_3px_0px_#121212] focus:outline-none"
              required
            />
          </div>

          {/* Nominal Transfer Masuk */}
          <div>
            <label className="block text-xs font-black text-black uppercase mb-1">
              Nominal Dana Masuk (Rp) <span className="text-red-600">*</span>
            </label>
            <input
              type="number"
              inputMode="numeric"
              min="1"
              step="any"
              value={amount || ''}
              onChange={(e) => setAmount(Number(e.target.value))}
              placeholder="Contoh: 1500000"
              className="w-full bg-white border-3 border-black p-2.5 text-xl font-black text-black shadow-[3px_3px_0px_#121212] focus:outline-none"
              required
            />
            {amount > 0 && (
              <p className="text-xs font-bold text-black mt-1">Terbaca: {formatRupiah(amount)}</p>
            )}
          </div>

          {/* Label / Keterangan Batch */}
          <div>
            <label className="block text-xs font-black text-black uppercase mb-1">
              Label / Catatan Batch
            </label>
            <input
              type="text"
              value={batchName}
              onChange={(e) => setBatchName(e.target.value)}
              placeholder={`Contoh: Modal Belanja ${currentOutlet?.name || 'Oklah'} Mingguan`}
              className="w-full bg-white border-2 border-black p-2 text-xs font-bold text-black focus:outline-none"
            />
          </div>

          {/* Upload Screenshot M-Banking */}
          <div>
            <label className="block text-xs font-black text-black uppercase mb-1">
              Screenshot Bukti Transfer Masuk (Opsional)
            </label>
            <label className="w-full cursor-pointer flex items-center justify-center gap-2 p-3 bg-white border-3 border-black shadow-[3px_3px_0px_#121212] hover:bg-slate-50 text-xs font-black uppercase">
              <Camera className="h-4 w-4 stroke-[2.5]" />
              <span>Foto / Screenshot M-Banking</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>
            {proofImage && (
              <div className="flex items-center gap-2 mt-2 bg-white p-2 border-2 border-black">
                <img src={proofImage} alt="Bukti" className="h-10 w-10 object-cover border border-black" />
                <span className="text-xs font-black text-black">✓ BUKTI MUTASI TERLAMPIR</span>
              </div>
            )}
          </div>

          {/* Catatan Tambahan */}
          <div>
            <label className="block text-xs font-black text-black uppercase mb-1">
              Catatan Penggunaan
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Titipan untuk beli susu, buah & cup"
              className="w-full bg-white border-2 border-black p-2 text-xs font-bold text-black focus:outline-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t-3 border-black">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 border-3 border-black bg-white text-black text-xs font-black uppercase shadow-[2px_2px_0px_#121212]"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 border-3 border-black bg-[#00F0FF] text-black text-xs font-black uppercase shadow-[4px_4px_0px_#121212] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
            >
              Simpan Dana Masuk
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
