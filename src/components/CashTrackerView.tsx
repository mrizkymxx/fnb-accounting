'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { CashCollection } from '@/types/database';
import { formatRupiah, formatDateIndo } from '@/lib/formatters';
import { exportCashCollectionsCSV } from '@/lib/exportUtils';
import {
  Wallet,
  Building,
  CheckCircle2,
  Clock,
  PlusCircle,
  Receipt,
  FileCheck,
  Edit,
  Trash2,
  FileSpreadsheet
} from 'lucide-react';

interface CashTrackerViewProps {
  onOpenCollectCash: () => void;
  onEditCollection: (col: CashCollection) => void;
  onSelectOutletDeposit: (outletId: string) => void;
  onViewReceipt: (url: string, title: string) => void;
}

export const CashTrackerView: React.FC<CashTrackerViewProps> = ({
  onOpenCollectCash,
  onEditCollection,
  onSelectOutletDeposit,
  onViewReceipt,
}) => {
  const {
    outlets,
    collections,
    deleteCashCollection,
    cashOnHandSummaries,
    selectedOutletId,
  } = useApp();

  const filteredCollections = selectedOutletId === 'all'
    ? collections
    : collections.filter(c => c.outlet_id === selectedOutletId);

  const heldList = filteredCollections.filter(c => c.status === 'held_by_me');
  const depositedList = filteredCollections.filter(c => c.status === 'deposited_to_bank');

  return (
    <div className="space-y-4 sm:space-y-6 pb-20 sm:pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-6 border-3 sm:border-4 border-black shadow-[3px_3px_0px_#121212] sm:shadow-[5px_5px_0px_#121212]">
        <div>
          <h1 className="text-lg sm:text-2xl font-black text-black uppercase tracking-tight">
            Tracker Kas Fisik Dipegang & Setor Bank
          </h1>
          <p className="text-xs sm:text-sm font-bold text-black/70 mt-1">
            Uang kasir outlet yang Anda kumpulkan dan tahan sampai mencapai batas ambang setor bank.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportCashCollectionsCSV(filteredCollections, outlets)}
            className="px-3 py-2 bg-white border-2 border-black text-black text-xs font-black uppercase shadow-[2px_2px_0px_#121212] hover:bg-slate-50 flex items-center gap-1.5 active:translate-x-[1px] active:translate-y-[1px]"
            title="Export CSV Excel"
          >
            <FileSpreadsheet className="h-4 w-4 stroke-[2.5]" />
            <span>Export</span>
          </button>

          <button
            onClick={onOpenCollectCash}
            className="px-3.5 sm:px-4 py-2 bg-[#FFE600] border-3 border-black text-black text-xs font-black uppercase shadow-[3px_3px_0px_#121212] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all flex items-center justify-center gap-1.5"
          >
            <PlusCircle className="h-4 w-4 stroke-[2.5]" />
            <span>+ Tarik Kasir</span>
          </button>
        </div>
      </div>

      {/* Threshold Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
        {cashOnHandSummaries.map((summary) => {
          const percentage = Math.min(100, Math.round((summary.total_held / summary.threshold) * 100));
          const isReady = summary.is_ready_to_deposit;

          return (
            <div
              key={summary.outlet_id}
              className={`p-4 sm:p-5 border-3 border-black transition-all ${
                isReady
                  ? 'bg-[#FFE600] shadow-[4px_4px_0px_#121212]'
                  : 'bg-white shadow-[2px_2px_0px_#121212]'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-black text-black text-base uppercase">{summary.outlet_name}</h3>
                  <p className="text-xs font-bold text-black/80">
                    Batas Setor: <span className="underline">{formatRupiah(summary.threshold)}</span>
                  </p>
                </div>
                <div className="p-1.5 bg-white border-2 border-black">
                  <Building className="h-4.5 w-4.5 text-black stroke-[2.5]" />
                </div>
              </div>

              <div className="my-3">
                <div className="text-[10px] font-black uppercase text-black/80">Total Uang Fisik Dipegang:</div>
                <div className="text-xl sm:text-2xl font-black text-black">
                  {formatRupiah(summary.total_held)}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-white h-3.5 border-2 border-black overflow-hidden mb-3 p-0.5">
                <div
                  className={`h-full border-r-2 border-black transition-all duration-300 ${
                    isReady ? 'bg-[#00F0FF]' : 'bg-[#FF4343]'
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>

              {isReady ? (
                <button
                  onClick={() => onSelectOutletDeposit(summary.outlet_id)}
                  className="w-full py-2 bg-[#FF4343] text-white font-black text-xs uppercase border-2 border-black shadow-[2px_2px_0px_#121212] flex items-center justify-center gap-2 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                >
                  <CheckCircle2 className="h-4 w-4 stroke-[2.5]" />
                  <span>Ambang Tercapai • Setor Bank</span>
                </button>
              ) : (
                <div className="text-xs font-bold text-center text-black py-1.5 bg-[#FFFDF5] border border-black">
                  {summary.total_held > 0
                    ? `Kurang ${formatRupiah(summary.threshold - summary.total_held)} untuk siap setor`
                    : 'Belum ada saldo kasir dipegang'}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Grid: Held vs Deposited */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Left: Kas Dipegang */}
        <div className="bg-white border-3 sm:border-4 border-black p-4 sm:p-5 shadow-[4px_4px_0px_#121212] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1 bg-[#FFE600] border-2 border-black">
                <Clock className="h-4 w-4 stroke-[2.5]" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-black text-black uppercase">Kas Dipegang Belum Disetor</h2>
                <p className="text-[11px] font-bold text-black/70">Uang fisik masih disimpan di dompet/brankas pribadi</p>
              </div>
            </div>
            <span className="px-2 py-0.5 bg-black text-white text-xs font-black uppercase">
              {heldList.length} Entri
            </span>
          </div>

          {heldList.length === 0 ? (
            <div className="p-6 text-center bg-[#FFFDF5] border-2 border-black text-black font-bold text-xs">
              Semua kas yang ditarik sudah disetorkan ke bank.
            </div>
          ) : (
            <div className="space-y-2.5">
              {heldList.map((c) => {
                const outlet = outlets.find(o => o.id === c.outlet_id);

                return (
                  <div
                    key={c.id}
                    className="p-3 bg-[#FFFDF5] border-2 border-black shadow-[2px_2px_0px_#121212] flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-black uppercase">{outlet?.name}</span>
                        <span className="text-[10px] font-bold text-black/60">
                          {formatDateIndo(c.collected_at)}
                        </span>
                      </div>
                      <p className="text-[11px] font-semibold text-black/80 truncate mt-0.5">
                        {c.notes || 'Tarik laci kasir outlet'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right">
                        <div className="text-xs sm:text-sm font-black text-black">
                          {formatRupiah(c.amount)}
                        </div>
                        <span className="text-[9px] font-bold bg-[#FFE600] border border-black px-1">
                          HELD BY ME
                        </span>
                      </div>

                      {c.proof_image_url && (
                        <button
                          onClick={() => onViewReceipt(c.proof_image_url!, `Bukti Tarik Kasir ${outlet?.name}`)}
                          className="p-1.5 bg-white border border-black shadow-[1px_1px_0px_#121212]"
                          title="Lihat Bukti Foto"
                        >
                          <Receipt className="h-3.5 w-3.5 stroke-[2.5]" />
                        </button>
                      )}

                      <button
                        onClick={() => onEditCollection(c)}
                        className="p-1.5 bg-[#00F0FF] border border-black shadow-[1px_1px_0px_#121212] active:translate-x-[1px] active:translate-y-[1px]"
                        title="Edit Tarik Kas"
                      >
                        <Edit className="h-3.5 w-3.5 stroke-[2.5]" />
                      </button>

                      <button
                        onClick={() => {
                          if (confirm(`Hapus catatan tarik kas ${outlet?.name} senilai ${formatRupiah(c.amount)}?`)) {
                            deleteCashCollection(c.id);
                          }
                        }}
                        className="p-1.5 bg-[#FF4343] border border-black text-white shadow-[1px_1px_0px_#121212] active:translate-x-[1px] active:translate-y-[1px]"
                        title="Hapus Catatan"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Riwayat Setor */}
        <div className="bg-white border-3 sm:border-4 border-black p-4 sm:p-5 shadow-[4px_4px_0px_#121212] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1 bg-[#00F0FF] border-2 border-black">
                <FileCheck className="h-4 w-4 stroke-[2.5]" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-black text-black uppercase">Riwayat Setor Tunai Bank</h2>
                <p className="text-[11px] font-bold text-black/70">Uang fisik yang sudah aman masuk rekening bank</p>
              </div>
            </div>
            <span className="px-2 py-0.5 bg-[#00F0FF] border-2 border-black text-black text-xs font-black uppercase">
              {depositedList.length} Selesai
            </span>
          </div>

          {depositedList.length === 0 ? (
            <div className="p-6 text-center bg-[#FFFDF5] border-2 border-black text-black font-bold text-xs">
              Belum ada riwayat setoran tunai bank yang tercatat.
            </div>
          ) : (
            <div className="space-y-2.5">
              {depositedList.map((c) => {
                const outlet = outlets.find(o => o.id === c.outlet_id);

                return (
                  <div
                    key={c.id}
                    className="p-3 bg-[#FFFDF5] border-2 border-black shadow-[2px_2px_0px_#121212] flex items-center justify-between gap-2 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-black uppercase">{outlet?.name}</span>
                        <span className="text-[10px] font-bold text-black/60">
                          Disetor: {formatDateIndo(c.deposited_at || '')}
                        </span>
                      </div>
                      <p className="text-[11px] font-bold text-black/70 mt-0.5">
                        Tujuan: {c.deposit_bank} - {c.deposit_account || 'Rek Operasional'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right">
                        <div className="text-xs sm:text-sm font-black text-black">
                          {formatRupiah(c.amount)}
                        </div>
                        <span className="text-[9px] bg-[#00F0FF] border border-black font-black uppercase px-1">
                          ✓ MASUK BANK
                        </span>
                      </div>

                      {c.proof_image_url && (
                        <button
                          onClick={() => onViewReceipt(c.proof_image_url!, `Struk Setor ${c.deposit_bank}`)}
                          className="p-1.5 bg-white border border-black shadow-[1px_1px_0px_#121212]"
                        >
                          <Receipt className="h-3.5 w-3.5 stroke-[2.5]" />
                        </button>
                      )}

                      <button
                        onClick={() => {
                          if (confirm(`Hapus riwayat setoran ${outlet?.name} senilai ${formatRupiah(c.amount)}?`)) {
                            deleteCashCollection(c.id);
                          }
                        }}
                        className="p-1.5 bg-[#FF4343] border border-black text-white shadow-[1px_1px_0px_#121212]"
                        title="Hapus Catatan"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
