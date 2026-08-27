'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { formatRupiah, formatDateIndo, getLocalDateString, parseNumberInput } from '@/lib/formatters';
import {
  X,
  Calculator,
  Wallet,
  Receipt,
  CheckCircle2,
  Printer,
  Store
} from 'lucide-react';

interface CashSettlementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onViewReceipt: (url: string, title: string) => void;
}

export const CashSettlementModal: React.FC<CashSettlementModalProps> = ({
  isOpen,
  onClose,
  onViewReceipt,
}) => {
  const { outlets, purchases } = useApp();

  const [outletId, setOutletId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(getLocalDateString());
  const [openingCash, setOpeningCash] = useState<number>(0);

  // Sync outletId saat outlets selesai dimuat atau berubah
  React.useEffect(() => {
    if (isOpen) {
      if (!outletId && outlets.length > 0) {
        setOutletId(outlets[0].id);
      }
      setSelectedDate(getLocalDateString());
    }
  }, [isOpen, outlets, outletId]);

  // Shortcut tombol cepat tanggal (Kemarin / Hari Ini)
  const setQuickDate = (offsetDays: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    setSelectedDate(getLocalDateString(d));
  };

  const matchedPurchases = useMemo(() => {
    return purchases.filter(p => {
      if (p.outlet_id !== outletId) return false;
      if (p.purchase_date !== selectedDate) return false;
      if (p.payment_source !== 'opening_cash') return false;
      return true;
    }).sort((a, b) => (a.created_at || '').localeCompare(b.created_at || ''));
  }, [purchases, outletId, selectedDate]);

  const totalSpent = matchedPurchases.reduce((acc, p) => acc + p.total_amount, 0);
  const remaining = openingCash - totalSpent;
  const isBalanced = remaining >= 0;
  const outletName = outlets.find(o => o.id === outletId)?.name || '-';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-xs overflow-y-auto overflow-x-hidden">
      <div className="bg-[#FFFDF5] border-t-4 sm:border-4 border-black w-full max-w-2xl shadow-[8px_8px_0px_#121212] overflow-hidden rounded-t-2xl sm:rounded-none max-h-[94dvh] flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b-4 border-black bg-[#FFE600] shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-[#FF4343] border-2 border-black shadow-[2px_2px_0px_#121212]">
              <Calculator className="h-5 w-5 text-white stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base font-black text-black uppercase tracking-tight">
                Rekap Harian Kasir
              </h2>
              <p className="text-[11px] font-bold text-black/70">
                Hitung sisa uang opening cash + semua nota belanja
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

        {/* Scrollable Body */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {/* Selector Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-black text-black uppercase mb-1">
                Outlet <span className="text-red-600">*</span>
              </label>
              <select
                value={outletId}
                onChange={(e) => setOutletId(e.target.value)}
                className="w-full bg-white border-3 border-black p-2 text-xs font-black text-black sm:shadow-[2px_2px_0px_#121212] focus:outline-none"
              >
                {outlets.map((o) => (
                  <option key={o.id} value={o.id}>{o.name}</option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-black text-black uppercase">
                  Tanggal Belanja <span className="text-red-600">*</span>
                </label>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setQuickDate(-1)}
                    className="text-[9px] font-black uppercase px-1 py-0.2 border border-black bg-white hover:bg-slate-100"
                  >
                    Kemarin
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickDate(0)}
                    className="text-[9px] font-black uppercase px-1 py-0.2 border border-black bg-[#FFE600]"
                  >
                    Hari Ini
                  </button>
                </div>
              </div>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full bg-white border-3 border-black p-2 text-xs font-bold text-black sm:shadow-[2px_2px_0px_#121212] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-black text-black uppercase mb-1">
                Uang Opening Cash (Rp) <span className="text-red-600">*</span>
              </label>
              <input
                type="number"
                inputMode="numeric"
                min="0"
                step="any"
                value={openingCash || ''}
                onChange={(e) => setOpeningCash(Number(e.target.value))}
                placeholder="Contoh: 300000"
                className="w-full bg-white border-3 border-black p-2 text-lg font-black text-black sm:shadow-[2px_2px_0px_#121212] focus:outline-none"
              />
              {openingCash > 0 && (
                <p className="text-[10px] font-bold text-black/70 mt-0.5">{formatRupiah(openingCash)}</p>
              )}
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-2">
            <div className="p-3 bg-white border-3 border-black sm:shadow-[3px_3px_0px_#121212] text-center">
              <span className="text-[9px] font-black text-black/60 uppercase block">Modal Awal</span>
              <span className="text-sm font-black text-black block mt-0.5">
                {openingCash > 0 ? formatRupiah(openingCash) : '-'}
              </span>
            </div>
            <div className="p-3 bg-[#FF4343]/10 border-3 border-black sm:shadow-[3px_3px_0px_#121212] text-center">
              <span className="text-[9px] font-black text-black/60 uppercase block">Total Belanja</span>
              <span className="text-sm font-black text-red-600 block mt-0.5">
                {totalSpent > 0 ? formatRupiah(totalSpent) : '-'}
              </span>
            </div>
            <div className={`p-3 border-3 border-black sm:shadow-[3px_3px_0px_#121212] text-center ${
              isBalanced ? 'bg-[#00F0FF]/20' : 'bg-[#FF4343]'
            }`}>
              <span className="text-[9px] font-black text-black/60 uppercase block">Sisa Uang</span>
              <span className={`text-sm font-black block mt-0.5 ${
                isBalanced ? 'text-black' : 'text-white'
              }`}>
                {openingCash > 0 || totalSpent > 0
                  ? formatRupiah(remaining)
                  : '-'}
              </span>
              {isBalanced && remaining > 0 && (
                <span className="text-[9px] font-bold text-black/70 block">Kembalikan ke kasir</span>
              )}
              {!isBalanced && openingCash > 0 && (
                <span className="text-[9px] font-bold text-white block">KURANG — cek kembali</span>
              )}
            </div>
          </div>

          {/* Detail List */}
          {matchedPurchases.length > 0 ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-black uppercase">
                  Detail Belanja ({matchedPurchases.length} Nota)
                </span>
                <span className="text-[10px] font-bold text-black/60">
                  {outletName} &bull; {formatDateIndo(selectedDate)}
                </span>
              </div>

              {matchedPurchases.map((p, idx) => (
                <div
                  key={p.id}
                  className="bg-white border-2 border-black p-2.5 sm:p-3 sm:shadow-[2px_2px_0px_#121212] flex items-start gap-3"
                >
                  <div className="shrink-0 w-7 h-7 bg-[#FFE600] border-2 border-black flex items-center justify-center">
                    <span className="text-xs font-black">{idx + 1}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-black text-black truncate">
                        {p.supplier_name}
                      </span>
                      <span className="text-xs font-black text-red-600 shrink-0">
                        -{formatRupiah(p.total_amount)}
                      </span>
                    </div>

                    {/* Items */}
                    {p.items && p.items.length > 0 && (
                      <div className="mt-1.5 space-y-0.5">
                        {p.items.map((it, i) => (
                          <div key={i} className="flex items-center justify-between text-[10px] text-black/70">
                            <span className="truncate">
                              {it.item_name} ({it.quantity} {it.unit})
                            </span>
                            <span className="shrink-0 ml-2 font-bold">
                              {formatRupiah(it.subtotal)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Receipt preview */}
                    {p.receipt_image_url && (
                      <button
                        type="button"
                        onClick={() => onViewReceipt(p.receipt_image_url!, `Nota ${p.supplier_name}`)}
                        className="mt-1.5 flex items-center gap-1 text-[10px] font-bold text-[#00F0FF] hover:underline"
                      >
                        <Receipt className="h-3 w-3" />
                        <span>Lihat Nota</span>
                      </button>
                    )}

                    {p.notes && (
                      <p className="mt-1 text-[10px] text-black/50 italic truncate">{p.notes}</p>
                    )}
                  </div>
                </div>
              ))}

              {/* Total Row */}
              <div className="bg-[#FFE600] border-3 border-black p-3 sm:shadow-[3px_3px_0px_#121212] flex items-center justify-between">
                <span className="text-xs font-black text-black uppercase">Total Belanja Hari Ini:</span>
                <span className="text-lg font-black text-black">{formatRupiah(totalSpent)}</span>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center bg-white border-2 border-dashed border-black">
              <Store className="h-8 w-8 text-black/30 mx-auto mb-2 stroke-[2]" />
              <span className="text-xs font-bold text-black/50 block">
                Belum ada belanja dengan sumber &quot;Opening Cash&quot; untuk {outletName} di tanggal ini.
              </span>
              <span className="text-[10px] text-black/40 block mt-1">
                Semua belanja yang pakai &quot;Opening Cash&quot; akan otomatis muncul di sini.
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t-3 border-black bg-white shrink-0 flex items-center justify-between">
          <span className="text-[10px] font-bold text-black/50">
            {matchedPurchases.length} nota &bull; {outletName}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 border-3 border-black bg-[#FFE600] text-black text-xs font-black uppercase sm:shadow-[2px_2px_0px_#121212]"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
