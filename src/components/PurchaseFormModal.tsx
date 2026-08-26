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
  Sparkles,
  Loader2,
  Bot,
  Send,
  CheckCircle2,
  Calculator,
  ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';

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

  const [inputMode, setInputMode] = useState<'chatbot' | 'manual'>('chatbot');
  const [chatPrompt, setChatPrompt] = useState<string>(
`Order Prima Sushi :
- Keju Prochiz Gold 3px
- B.Putih 1/2kg
- Kentang 2 Biji besar / 3 Biji sedang
- Sawi Sendok 7
- Sabun cuci piring 2 Jrigen
- Selada 1plastik
- Kol putih ukuran kecil 1
- Jeruk Nipis 6biji yang matang/ banyak airnya
- Toge 500 gram
- Gula 2kg
- Udang 1/2kg
- Ayam Paha`
  );
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [aiSummaryMsg, setAiSummaryMsg] = useState<string | null>(null);

  // Form states
  const [outletId, setOutletId] = useState<string>('out_oklah');
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

  const [items, setItems] = useState<PurchaseItem[]>([
    { id: '1', item_name: '', quantity: 1, unit: 'pcs', unit_price: 0, subtotal: 0 }
  ]);

  useEffect(() => {
    if (initialData) {
      setOutletId(initialData.outlet_id);
      setSupplierId(initialData.supplier_id || '');
      setSupplierName(initialData.supplier_name);
      setPurchaseDate(initialData.purchase_date);
      setPaymentSource(initialData.payment_source);
      setAdvanceBatchId(initialData.advance_batch_id || 'auto_fifo');
      setIsTempo(initialData.is_tempo);
      setTempoDueDate(initialData.tempo_due_date || '');
      setNotes(initialData.notes || '');
      setItems(initialData.items && initialData.items.length > 0 ? initialData.items : [
        { id: '1', item_name: '', quantity: 1, unit: 'pcs', unit_price: 0, subtotal: 0 }
      ]);
      setInputMode('manual');
    } else {
      setOutletId(selectedOutletId !== 'all' ? selectedOutletId : (outlets[0]?.id || 'out_oklah'));
      setSupplierId('');
      setSupplierName('Pasar Tradisional / Supplier');
      setPurchaseDate(new Date().toISOString().split('T')[0]);
      setPaymentSource('advance_transfer');
      setAdvanceBatchId('auto_fifo');
      setIsTempo(false);
      setNotes('');
      setAiSummaryMsg(null);
      setInputMode('chatbot');
    }
  }, [initialData, isOpen, selectedOutletId, outlets]);

  if (!isOpen) return null;

  const outletAdvanceBatches = advanceBatches.filter(
    b => b.outlet_id === outletId && (b.status === 'active' || b.id === advanceBatchId)
  );

  const totalOutletRemaining = outletAdvanceBatches
    .filter(b => b.status === 'active')
    .reduce((acc, b) => acc + b.remaining_amount, 0);

  // Proses teks mentah chat via AI Groq (Llama 3.3 70B Versatile)
  const handleProcessAIChat = async () => {
    if (!chatPrompt.trim()) return;

    try {
      setIsProcessingAI(true);
      setAiSummaryMsg(null);

      const currentOutletObj = outlets.find(o => o.id === outletId);

      const res = await fetch('/api/parse-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          textPrompt: chatPrompt,
          defaultOutlet: currentOutletObj?.name || 'Oklah'
        })
      });

      const json = await res.json();

      if (res.ok && json.data) {
        const aiData = json.data;

        if (aiData.detected_outlet_name) {
          const matchedOutlet = outlets.find(
            o => o.name.toLowerCase().includes(aiData.detected_outlet_name.toLowerCase()) ||
                 aiData.detected_outlet_name.toLowerCase().includes(o.name.toLowerCase())
          );
          if (matchedOutlet) {
            setOutletId(matchedOutlet.id);
          }
        }

        if (aiData.supplier_suggestion) {
          setSupplierName(aiData.supplier_suggestion);
        }

        if (Array.isArray(aiData.items) && aiData.items.length > 0) {
          setItems(aiData.items.map((it: any, idx: number) => ({
            id: `item_chat_${Date.now()}_${idx}`,
            item_name: it.item_name || it.raw_text,
            quantity: Number(it.quantity) || 1,
            unit: it.unit || 'pcs',
            unit_price: Number(it.estimated_unit_price) || 0,
            subtotal: Number(it.estimated_subtotal) || ((Number(it.quantity) || 1) * (Number(it.estimated_unit_price) || 0)),
          })));

          setAiSummaryMsg(aiData.summary_message || `✓ Berhasil menghitung estimasi harga untuk ${aiData.items.length} item barang.`);

          try {
            confetti({
              particleCount: 70,
              spread: 60,
              origin: { y: 0.6 }
            });
          } catch {}
        }
      }
    } catch (err) {
      console.error('Gagal memproses chat AI:', err);
      alert('Gagal memproses teks dengan AI. Silakan coba lagi atau gunakan input manual.');
    } finally {
      setIsProcessingAI(false);
    }
  };

  const handleItemChange = (index: number, field: keyof PurchaseItem, value: any) => {
    const updated = [...items];
    const item = { ...updated[index], [field]: value };

    if (field === 'quantity' || field === 'unit_price') {
      const q = field === 'quantity' ? Number(value) : item.quantity;
      const p = field === 'unit_price' ? Number(value) : item.unit_price;
      item.subtotal = (q || 0) * (p || 0);
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-xs overflow-y-auto">
      <div className="bg-[#FFFDF5] border-t-4 sm:border-4 border-black w-full max-w-3xl shadow-[8px_8px_0px_#121212] overflow-hidden rounded-t-2xl sm:rounded-none max-h-[94dvh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-3.5 sm:p-4 border-b-4 border-black bg-[#FFE600] shrink-0">
          <div>
            <h2 className="text-base sm:text-lg font-black text-black uppercase tracking-tight flex items-center gap-2">
              <Calculator className="h-5 w-5 stroke-[2.5]" />
              <span>{initialData ? '✏️ Edit Belanja' : '🤖 Chatbot Estimasi & Input Belanja'}</span>
            </h2>
            <p className="text-[11px] font-bold text-black/70">
              Ketik atau paste daftar belanja mentah &rarr; AI otomatis hitung estimasi harga dari kamus resep
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 border-2 border-black bg-white hover:bg-slate-100 shadow-[2px_2px_0px_#121212] active:translate-x-[1px] active:translate-y-[1px]"
          >
            <X className="h-5 w-5 stroke-[2.5]" />
          </button>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex bg-white border-b-3 border-black p-1">
          <button
            type="button"
            onClick={() => setInputMode('chatbot')}
            className={`flex-1 py-2 text-xs font-black uppercase transition-all flex items-center justify-center gap-1.5 ${
              inputMode === 'chatbot'
                ? 'bg-[#00F0FF] text-black border-2 border-black shadow-[2px_2px_0px_#121212]'
                : 'text-black/70 hover:text-black'
            }`}
          >
            <Bot className="h-4 w-4 stroke-[2.5]" />
            <span>Chatbot AI Estimator</span>
          </button>
          <button
            type="button"
            onClick={() => setInputMode('manual')}
            className={`flex-1 py-2 text-xs font-black uppercase transition-all flex items-center justify-center gap-1.5 ${
              inputMode === 'manual'
                ? 'bg-[#FFE600] text-black border-2 border-black shadow-[2px_2px_0px_#121212]'
                : 'text-black/70 hover:text-black'
            }`}
          >
            <span>Tabel Rincian & Pembayaran</span>
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-3.5 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {/* TAB 1: CHATBOT AI INPUT */}
          {inputMode === 'chatbot' && (
            <div className="p-4 bg-[#00F0FF]/15 border-3 border-black shadow-[3px_3px_0px_#121212] space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-black uppercase flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-[#FF4343]" />
                  <span>Ketik / Tempel Daftar Pesanan Belanja Mentah:</span>
                </label>
              </div>

              <div className="relative">
                <textarea
                  rows={8}
                  value={chatPrompt}
                  onChange={(e) => setChatPrompt(e.target.value)}
                  placeholder="Ketik pesanan cth:\nOrder Prima Sushi:\n- Keju 3 pcs\n- B.Putih 1/2kg\n- Ayam paha 2kg"
                  className="w-full bg-white border-3 border-black p-3 text-xs sm:text-sm font-bold text-black focus:outline-none shadow-[2px_2px_0px_#121212]"
                />
              </div>

              <button
                type="button"
                onClick={handleProcessAIChat}
                disabled={isProcessingAI || !chatPrompt.trim()}
                className="w-full py-3 bg-[#00F0FF] hover:bg-[#00d6e6] text-black font-black text-xs sm:text-sm uppercase border-3 border-black shadow-[3px_3px_0px_#121212] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isProcessingAI ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>AI Sedang Menghitung Estimasi Harga...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 stroke-[2.5]" />
                    <span>Hitung Estimasi Harga & Masukkan ke Tabel</span>
                  </>
                )}
              </button>

              {aiSummaryMsg && (
                <div className="p-3 bg-white border-2 border-black text-xs font-black text-black space-y-1">
                  <div className="flex items-center gap-1.5 text-emerald-700">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>{aiSummaryMsg}</span>
                  </div>
                  <p className="text-[11px] font-bold text-black/70">
                    *Rincian barang & estimasi harga sudah masuk ke tabel di bawah. Anda bisa menyesuaikan harga real jika diperlukan.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2 & CORE: FORM PENGATURAN TARGET & PEMBAYARAN */}
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
                className="w-full bg-white border-3 border-black p-2 text-xs sm:text-sm font-black text-black shadow-[3px_3px_0px_#121212] focus:outline-none"
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
                className="w-full bg-white border-3 border-black p-2 text-xs sm:text-sm font-bold text-black shadow-[3px_3px_0px_#121212] focus:outline-none"
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
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentSource('advance_transfer')}
                    className={`p-2.5 border-3 border-black text-left transition-all ${
                      paymentSource === 'advance_transfer'
                        ? 'bg-[#00F0FF] shadow-[3px_3px_0px_#121212]'
                        : 'bg-white'
                    }`}
                  >
                    <div className="font-black text-[11px] uppercase">💰 Dana Titipan</div>
                    <div className="text-[9px] font-bold text-black/70">Transfer luar</div>
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
                    <div className="text-[9px] font-bold text-black/70">Modal kasir</div>
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

                {paymentSource === 'advance_transfer' && (
                  <div className="p-3 bg-[#00F0FF]/15 border-2 border-black space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-black text-black uppercase">
                        Pilih Batch Dana Transfer Luar Yang Dipotong:
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

          {/* Detail Item Barang */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-black uppercase">
                Rincian Barang & Estimasi Harga ({items.length} Item)
              </label>
              <button
                type="button"
                onClick={addItemRow}
                className="text-xs font-black text-black uppercase flex items-center gap-1 bg-[#00F0FF] border-2 border-black px-2.5 py-1 shadow-[2px_2px_0px_#121212]"
              >
                <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
                <span>+ Baris</span>
              </button>
            </div>

            <div className="space-y-2">
              {items.map((item, index) => (
                <div
                  key={item.id || index}
                  className="grid grid-cols-12 gap-1.5 sm:gap-2 bg-white p-2 border-3 border-black shadow-[2px_2px_0px_#121212] items-center"
                >
                  <div className="col-span-12 sm:col-span-5">
                    <input
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
                      placeholder="Estimasi Harga"
                      value={item.unit_price || ''}
                      onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)}
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
                  Total Estimasi Belanja:
                </span>
                <span className="text-[10px] font-bold text-black/70">
                  Dihitung otomatis dari 297 katalog resep
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
