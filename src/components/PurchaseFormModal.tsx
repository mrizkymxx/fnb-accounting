'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { PurchaseItem, PaymentSource } from '@/types/database';
import { formatRupiah } from '@/lib/formatters';
import {
  X,
  Plus,
  Trash2,
  AlertCircle,
  Calculator,
  ArrowRight,
  Camera
} from 'lucide-react';

interface PurchaseFormModalProps {
  isOpen: boolean;
  initialData?: any | null;
  onClose: () => void;
}

export const PurchaseFormModal: React.FC<PurchaseFormModalProps> = ({
  isOpen,
  initialData,
  onClose,
}) => {
  const { outlets, suppliers, advanceBatches, addPurchase, updatePurchase, selectedOutletId } = useApp();

  // Form states
  const [outletId, setOutletId] = useState<string>('');
  const [supplierId, setSupplierId] = useState<string>('');
  const [supplierName, setSupplierName] = useState<string>('Pasar Tradisional / Supplier');
  const [purchaseDate, setPurchaseDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentSource, setPaymentSource] = useState<PaymentSource>('advance_transfer');
  const [advanceBatchId, setAdvanceBatchId] = useState<string>('auto_fifo');
  const [isTempo, setIsTempo] = useState<boolean>(false);
  const [tempoDays, setTempoDays] = useState<number>(14);
  const [tempoDueDate, setTempoDueDate] = useState<string>(
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState<string>('');
  const [receiptImage, setReceiptImage] = useState<string | null>(null);

  const handleReceiptImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setReceiptImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const [items, setItems] = useState<PurchaseItem[]>([
    { id: '1', item_name: '', quantity: 1, unit: 'pcs', unit_price: 0, subtotal: 0 }
  ]);

  // Sync outletId default saat outlets selesai dimuat atau modal dibuka
  useEffect(() => {
    if (initialData) {
      setOutletId(initialData.outlet_id || (outlets[0]?.id || ''));
      setSupplierId(initialData.supplier_id || '');
      setSupplierName(initialData.supplier_name || 'Pasar Tradisional / Supplier');
      setPurchaseDate(initialData.purchase_date || new Date().toISOString().split('T')[0]);
      setPaymentSource(initialData.payment_source || 'advance_transfer');
      setAdvanceBatchId(initialData.advance_batch_id || 'auto_fifo');
      setIsTempo(Boolean(initialData.is_tempo));
      setTempoDueDate(initialData.tempo_due_date || '');
      setNotes(initialData.notes || '');
      setReceiptImage(initialData.receipt_image_url || null);
      setItems(initialData.items && initialData.items.length > 0 ? initialData.items : [
        { id: '1', item_name: '', quantity: 1, unit: 'pcs', unit_price: 0, subtotal: 0 }
      ]);
    } else if (isOpen) {
      const defaultId = selectedOutletId !== 'all' ? selectedOutletId : (outlets[0]?.id || '');
      setOutletId(defaultId);
      setSupplierId('');
      setSupplierName('Pasar Tradisional / Supplier');
      setPurchaseDate(new Date().toISOString().split('T')[0]);
      setPaymentSource('advance_transfer');
      setAdvanceBatchId('auto_fifo');
      setIsTempo(false);
      setNotes('');
      setReceiptImage(null);
      setItems([
        { id: `${Date.now()}_0`, item_name: '', quantity: 1, unit: 'pcs', unit_price: 0, subtotal: 0 }
      ]);
    }
  }, [initialData, isOpen, selectedOutletId, outlets]);

  if (!isOpen) return null;

  const currentOutletId = outletId || (selectedOutletId !== 'all' ? selectedOutletId : (outlets[0]?.id || ''));
  const safeAdvanceBatches = Array.isArray(advanceBatches) ? advanceBatches : [];

  const outletAdvanceBatches = safeAdvanceBatches.filter(
    b => b && b.outlet_id === currentOutletId && (b.status === 'active' || b.id === advanceBatchId)
  );

  const totalOutletRemaining = outletAdvanceBatches
    .filter(b => b && b.status === 'active')
    .reduce((acc, b) => acc + (b.remaining_amount || 0), 0);

  const handleItemChange = (index: number, field: keyof PurchaseItem, value: any) => {
    const updated = [...items];
    const item = { ...updated[index], [field]: value };

    if (field === 'quantity') {
      item.quantity = Number(value) || 0;
    } else if (field === 'unit_price') {
      const p = Number(value) || 0;
      item.unit_price = p;
      // Harga adalah subtotal langsung sesuai nota (tidak dikalikan qty)
      item.subtotal = p;
    }

    updated[index] = item;
    setItems(updated);
  };

  const addItemRow = () => {
    setItems(prev => [
      ...prev,
      { id: `${Date.now()}_${prev.length}`, item_name: '', quantity: 1, unit: 'pcs', unit_price: 0, subtotal: 0 }
    ]);
  };

  // Keyboard shortcut: Tambah baris saat tekan Enter di input Harga terakhir
  const handlePriceKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (index === items.length - 1) {
        addItemRow();
      }
      // Pindahkan fokus ke input nama barang baris baru
      setTimeout(() => {
        const nextInput = document.getElementById(`item-name-${index + 1}`);
        if (nextInput) {
          nextInput.focus();
        }
      }, 50);
    }
  };

  // Keyboard shortcut: Alt+A atau Ctrl+Shift+A untuk tambah baris kapan saja
  useEffect(() => {
    if (!isOpen) return;
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.altKey && e.key.toLowerCase() === 'a') || (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'a')) {
        e.preventDefault();
        addItemRow();
        setTimeout(() => {
          const allInputs = document.querySelectorAll('input[id^="item-name-"]');
          const lastInput = allInputs[allInputs.length - 1] as HTMLInputElement;
          if (lastInput) lastInput.focus();
        }, 50);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isOpen, items.length]);

  const removeItemRow = (index: number) => {
    if (items.length <= 1) return;
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const totalCalculated = items.reduce((acc, curr) => acc + (curr.subtotal || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const finalSupplierName = supplierName.trim() || 'Pasar Tradisional / Supplier';
    const validItems = items.filter(it => it.item_name.trim() !== '');

    if (validItems.length === 0) {
      alert('Mohon isi minimal 1 nama barang belanjaan.');
      return;
    }

    const payload = {
      outlet_id: outletId,
      supplier_id: supplierId || undefined,
      supplier_name: finalSupplierName,
      purchase_date: purchaseDate,
      payment_source: isTempo ? 'tempo' : paymentSource,
      advance_batch_id: paymentSource === 'advance_transfer' ? advanceBatchId : undefined,
      total_amount: totalCalculated,
      is_tempo: isTempo,
      tempo_due_date: isTempo ? tempoDueDate : undefined,
      tempo_status: isTempo ? (initialData?.tempo_status || 'unpaid') : undefined,
      notes: notes.trim() || undefined,
      receipt_image_url: receiptImage || undefined,
      items: validItems,
    };

    if (initialData) {
      await updatePurchase(initialData.id, payload);
    } else {
      await addPurchase(payload);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-xs overflow-y-auto overflow-x-hidden">
      <div className="bg-[#FFFDF5] border-t-4 sm:border-4 border-black w-full max-w-3xl shadow-[8px_8px_0px_#121212] overflow-hidden rounded-t-2xl sm:rounded-none max-h-[94dvh] flex flex-col min-w-0">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-3.5 sm:p-4 border-b-4 border-black bg-[#FFE600] shrink-0">
          <div>
            <h2 className="text-base sm:text-lg font-black text-black uppercase tracking-tight flex items-center gap-2">
              <Calculator className="h-5 w-5 stroke-[2.5]" />
              <span>{initialData ? '✏️ Edit Belanja' : '🛒 Input Belanja'}</span>
            </h2>
            <p className="text-[11px] font-bold text-black/70">
              Isi rincian barang belanja & pembayaran secara manual
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 border-2 border-black bg-white hover:bg-slate-100 shadow-[2px_2px_0px_#121212] active:translate-x-[1px] active:translate-y-[1px]"
          >
            <X className="h-5 w-5 stroke-[2.5]" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-3.5 sm:p-6 space-y-4 overflow-y-auto overflow-x-hidden flex-1">
          {/* FORM PENGATURAN TARGET & PEMBAYARAN */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black text-black uppercase mb-1">
                Target Outlet <span className="text-red-600">*</span>
              </label>
              <select
                value={outletId}
                onChange={(e) => {
                  setOutletId(e.target.value);
                  setAdvanceBatchId('auto_fifo');
                }}
                className="w-full bg-white border-3 border-black p-2 text-xs sm:text-sm font-black text-black sm:shadow-[3px_3px_0px_#121212] focus:outline-none"
                required
              >
                {outlets.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name} ({o.type.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-black text-black uppercase mb-1">
                Tanggal Pembelian <span className="text-red-600">*</span>
              </label>
              <input
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                className="w-full bg-white border-3 border-black p-2 text-xs sm:text-sm font-bold text-black sm:shadow-[3px_3px_0px_#121212] focus:outline-none"
                required
              />
            </div>
          </div>

          {/* Supplier Info */}
          <div className="p-3 bg-white border-3 border-black shadow-[3px_3px_0px_#121212] grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-black text-black uppercase mb-1">
                Nama Toko / Tempat Belanja <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                placeholder="Contoh: Pasar Tradisional / Yanto Sayur"
                className="w-full bg-[#FFFDF5] border-2 border-black p-1.5 text-xs font-bold text-black focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-black text-black uppercase mb-1">
                Pilih Dari Master Supplier (Opsional)
              </label>
              <select
                value={supplierId}
                onChange={(e) => {
                  const sId = e.target.value;
                  setSupplierId(sId);
                  const sup = suppliers.find(s => s.id === sId);
                  if (sup) setSupplierName(sup.name);
                }}
                className="w-full bg-[#FFFDF5] border-2 border-black p-1.5 text-xs font-bold text-black focus:outline-none"
              >
                <option value="">-- Supplier Umum / Pasar --</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.payment_terms === 'tempo' ? `Tempo ${s.default_tempo_days} hari` : 'Cash'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Sumber Pembayaran & Tempo */}
          <div className="p-3 bg-white border-3 border-black shadow-[3px_3px_0px_#121212] space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-black uppercase">
                Sumber Dana / Bayar
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer bg-[#FFE600] border-2 border-black px-2 py-0.5 shadow-[2px_2px_0px_#121212]">
                <input
                  type="checkbox"
                  checked={isTempo}
                  onChange={(e) => {
                    setIsTempo(e.target.checked);
                    if (e.target.checked) setPaymentSource('tempo');
                  }}
                  className="accent-black h-4 w-4"
                />
                <span className="text-[11px] font-black text-black uppercase">Sistem Tempo</span>
              </label>
            </div>

            {!isTempo ? (
              <div className="space-y-2.5">
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentSource('advance_transfer')}
                    className={`p-2.5 border-3 border-black text-left transition-all ${
                      paymentSource === 'advance_transfer'
                        ? 'bg-[#00F0FF] shadow-[3px_3px_0px_#121212]'
                        : 'bg-white'
                    }`}
                  >
                    <div className="font-black text-[11px] uppercase">🏦 Titipan M-Banking</div>
                    <div className="text-[9px] font-bold text-black/70">Potong saldo rekening</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentSource('advance_cash')}
                    className={`p-2.5 border-3 border-black text-left transition-all ${
                      paymentSource === 'advance_cash'
                        ? 'bg-[#00F0FF] shadow-[3px_3px_0px_#121212]'
                        : 'bg-white'
                    }`}
                  >
                    <div className="font-black text-[11px] uppercase">💵 Titipan Cash Dompet</div>
                    <div className="text-[9px] font-bold text-black/70">Pakai uang tunai</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentSource('opening_cash')}
                    className={`p-2.5 border-3 border-black text-left transition-all ${
                      paymentSource === 'opening_cash'
                        ? 'bg-[#FFE600] shadow-[3px_3px_0px_#121212]'
                        : 'bg-white'
                    }`}
                  >
                    <div className="font-black text-[11px] uppercase">Opening Cash</div>
                    <div className="text-[9px] font-bold text-black/70">Modal kasir toko</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentSource('personal_cash')}
                    className={`p-2.5 border-3 border-black text-left transition-all ${
                      paymentSource === 'personal_cash'
                        ? 'bg-[#FFE600] shadow-[3px_3px_0px_#121212]'
                        : 'bg-white'
                    }`}
                  >
                    <div className="font-black text-[11px] uppercase">Talangan</div>
                    <div className="text-[9px] font-bold text-black/70">Uang pribadi</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentSource('transfer_bank')}
                    className={`p-2.5 border-3 border-black text-left transition-all ${
                      paymentSource === 'transfer_bank'
                        ? 'bg-[#FFE600] shadow-[3px_3px_0px_#121212]'
                        : 'bg-white'
                    }`}
                  >
                    <div className="font-black text-[11px] uppercase">Transfer Langsung</div>
                    <div className="text-[9px] font-bold text-black/70">BCA/Mandiri</div>
                  </button>
                </div>

                {(paymentSource === 'advance_transfer' || paymentSource === 'advance_cash') && (
                  <div className="p-3 bg-[#00F0FF]/15 border-2 border-black space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-black text-black uppercase">
                        {paymentSource === 'advance_cash' ? '💵 Potong Dari Batch Dana Titipan (Wujud Cash):' : '🏦 Potong Dari Batch Dana Titipan (Wujud M-Banking):'}
                      </label>
                      <span className="text-[10px] font-black bg-white border border-black px-1.5 py-0.2">
                        Total Kumpulan Sisa: {formatRupiah(totalOutletRemaining)}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <label
                        className={`p-2.5 border-2 border-black cursor-pointer flex items-center justify-between gap-2 transition-all ${
                          advanceBatchId === 'auto_fifo'
                            ? 'bg-[#FFE600] shadow-[2px_2px_0px_#121212]'
                            : 'bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="advance_batch"
                            value="auto_fifo"
                            checked={advanceBatchId === 'auto_fifo'}
                            onChange={() => setAdvanceBatchId('auto_fifo')}
                            className="accent-black"
                          />
                          <div>
                            <span className="text-xs font-black text-black flex items-center gap-1">
                              <span>⚡ Gunakan Kumpulan Sisa (Semua Batch Terbuka)</span>
                              <span className="text-[9px] bg-black text-white px-1 py-0.2 uppercase">FIFO</span>
                            </span>
                            <span className="text-[10px] font-bold text-black/70 block">
                              Otomatis memotong saldo batch terlama dulu
                            </span>
                          </div>
                        </div>
                        <span className="text-xs font-black text-black shrink-0">
                          {formatRupiah(totalOutletRemaining)}
                        </span>
                      </label>

                      {outletAdvanceBatches.map((b) => (
                        <label
                          key={b.id}
                          className={`p-2 border-2 border-black cursor-pointer flex items-center justify-between gap-2 ${
                            advanceBatchId === b.id
                              ? 'bg-[#00F0FF] shadow-[2px_2px_0px_#121212]'
                              : 'bg-white'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <input
                              type="radio"
                              name="advance_batch"
                              value={b.id}
                              checked={advanceBatchId === b.id}
                              onChange={() => setAdvanceBatchId(b.id)}
                              className="accent-black"
                            />
                            <div className="truncate">
                              <span className="text-xs font-black text-black block truncate">{b.batch_name}</span>
                              <span className="text-[10px] text-black/70">Dari: {b.sender_source}</span>
                            </div>
                          </div>
                          <span className="text-xs font-black text-black shrink-0">{formatRupiah(b.remaining_amount)}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {paymentSource === 'transfer_bank' && (
                  <div className="p-3 bg-[#FFE600]/30 border-2 border-black space-y-2">
                    <label className="block text-[11px] font-black text-black uppercase">
                      Bukti Transfer Bank
                    </label>
                    <label className="w-full cursor-pointer flex items-center justify-center gap-2 p-2.5 bg-white border-2 border-dashed border-black hover:bg-slate-50 text-xs font-black uppercase">
                      <Camera className="h-4 w-4 stroke-[2.5]" />
                      <span>{receiptImage ? '✓ Bukti Transfer Terlampir' : 'Upload Bukti Transfer'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleReceiptImageChange}
                        className="hidden"
                      />
                    </label>
                    {receiptImage && (
                      <div className="flex items-center gap-2 bg-white p-1.5 border border-black">
                        <img src={receiptImage} alt="Bukti" className="h-8 w-8 object-cover border border-black" />
                        <span className="text-[10px] font-black text-black">✓ BUKTI TRANSFER</span>
                        <button
                          type="button"
                          onClick={() => setReceiptImage(null)}
                          className="ml-auto text-[10px] font-bold text-red-600"
                        >
                          Hapus
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-3 bg-[#FFE600] border-2 border-black space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-black text-black uppercase">
                  <AlertCircle className="h-4 w-4 stroke-[2.5]" />
                  <span>Pengaturan Jatuh Tempo</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-black text-black uppercase mb-0.5">
                      Durasi (Hari)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={tempoDays}
                      onChange={(e) => {
                        const days = Number(e.target.value) || 0;
                        setTempoDays(days);
                        const due = new Date(purchaseDate || Date.now());
                        due.setDate(due.getDate() + days);
                        setTempoDueDate(due.toISOString().split('T')[0]);
                      }}
                      className="w-full bg-white border-2 border-black p-1.5 text-xs font-bold text-black"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-black uppercase mb-0.5">
                      Tanggal Jatuh Tempo
                    </label>
                    <input
                      type="date"
                      value={tempoDueDate}
                      onChange={(e) => setTempoDueDate(e.target.value)}
                      className="w-full bg-white border-2 border-black p-1.5 text-xs font-bold text-black"
                      required={isTempo}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Upload Foto Nota */}
          <div className="p-3 bg-white border-3 border-black shadow-[3px_3px_0px_#121212]">
            <label className="block text-xs font-black text-black uppercase mb-1.5">
              Foto Nota / Struk Belanja
            </label>
            <label className="w-full cursor-pointer flex items-center justify-center gap-2 p-3 bg-[#FFFDF5] border-2 border-dashed border-black hover:bg-slate-50 text-xs font-black uppercase transition-all">
              <Camera className="h-4 w-4 stroke-[2.5]" />
              <span>{receiptImage ? '✓ Nota Sudah Terlampir — Ketuk untuk Ganti' : 'Ketuk untuk Upload Foto Nota'}</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleReceiptImageChange}
                className="hidden"
              />
            </label>
            {receiptImage && (
              <div className="flex items-center gap-2 mt-2 bg-[#FFE600] p-2 border-2 border-black">
                <img src={receiptImage} alt="Nota" className="h-10 w-10 object-cover border border-black" />
                <span className="text-xs font-black text-black">✓ NOTA TERLAMPIR</span>
                <button
                  type="button"
                  onClick={() => setReceiptImage(null)}
                  className="ml-auto text-[10px] font-bold text-red-600 hover:text-red-800 border border-red-600 px-1.5 py-0.5"
                >
                  Hapus
                </button>
              </div>
            )}
          </div>

          {/* Detail Item Barang */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-black text-black uppercase">
                  Rincian Barang & Harga ({items.length} Item)
                </label>
                <span className="text-[10px] font-bold text-black/60 block">
                  💡 Tekan <kbd className="px-1 py-0.5 bg-black/10 border border-black text-[9px] font-mono">Enter</kbd> di kolom Harga atau <kbd className="px-1 py-0.5 bg-black/10 border border-black text-[9px] font-mono">Alt + A</kbd> untuk tambah baris
                </span>
              </div>
              <button
                type="button"
                onClick={addItemRow}
                className="text-xs font-black text-black uppercase flex items-center gap-1 bg-[#00F0FF] border-2 border-black px-2.5 py-1 shadow-[2px_2px_0px_#121212] active:translate-x-[1px] active:translate-y-[1px]"
              >
                <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
                <span>+ Baris (Alt+A)</span>
              </button>
            </div>

            <div className="space-y-2">
              {items.map((item, index) => (
                <div
                  key={item.id || index}
                  className="grid grid-cols-12 gap-1 sm:gap-2 bg-white p-1.5 sm:p-2 border-2 sm:border-3 border-black sm:shadow-[2px_2px_0px_#121212] items-center min-w-0"
                >
                  <div className="col-span-12 sm:col-span-5">
                    <input
                      id={`item-name-${index}`}
                      type="text"
                      placeholder="Nama barang (cth: Keju Prochiz, B.Putih)"
                      value={item.item_name}
                      onChange={(e) => handleItemChange(index, 'item_name', e.target.value)}
                      className="w-full bg-[#FFFDF5] border-2 border-black p-1.5 text-xs font-bold text-black focus:outline-none"
                      required
                    />
                  </div>

                  <div className="col-span-4 sm:col-span-2">
                    <input
                      type="number"
                      step="any"
                      min="0.1"
                      placeholder="Qty"
                      value={item.quantity || ''}
                      onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                      className="w-full bg-[#FFFDF5] border-2 border-black p-1.5 text-xs font-black text-black text-center focus:outline-none"
                      required
                    />
                  </div>

                  <div className="col-span-3 sm:col-span-2">
                    <input
                      type="text"
                      placeholder="Satuan"
                      value={item.unit}
                      onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                      className="w-full bg-[#FFFDF5] border-2 border-black p-1.5 text-xs font-bold text-black text-center focus:outline-none"
                    />
                  </div>

                  <div className="col-span-4 sm:col-span-2">
                    <input
                      type="number"
                      placeholder="Harga"
                      value={item.unit_price || ''}
                      onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)}
                      onKeyDown={(e) => handlePriceKeyDown(e, index)}
                      className="w-full bg-[#FFFDF5] border-2 border-black p-1.5 text-xs font-black text-black text-right focus:outline-none"
                    />
                  </div>

                  <div className="col-span-1 flex justify-center">
                    <button
                      type="button"
                      onClick={() => removeItemRow(index)}
                      disabled={items.length <= 1}
                      className="p-1 border border-black bg-[#FF4343] text-white disabled:opacity-30"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Total Estimasi Belanja */}
            <div className="flex justify-between items-center p-3.5 sm:p-4 bg-[#FFE600] border-3 sm:border-4 border-black shadow-[3px_3px_0px_#121212]">
              <div>
                <span className="text-xs font-black text-black uppercase tracking-wider block">
                  Total Belanja:
                </span>
                <span className="text-[10px] font-bold text-black/70">
                  Dihitung otomatis dari rincian item
                </span>
              </div>
              <span className="text-lg sm:text-2xl font-black text-black">
                {formatRupiah(totalCalculated)}
              </span>
            </div>
          </div>

          {/* Catatan Tambahan */}
          <div>
            <label className="block text-xs font-black text-black uppercase mb-1">
              Catatan Belanja
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Belanja pasar pagi sayur & bumbu"
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
              className="px-6 py-2.5 border-3 border-black bg-[#00F0FF] text-black text-xs sm:text-sm font-black uppercase shadow-[3px_3px_0px_#121212] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
            >
              {initialData ? 'Simpan Perubahan' : 'Simpan Transaksi Belanja'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
