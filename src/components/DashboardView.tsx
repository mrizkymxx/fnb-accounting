'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { formatRupiah, formatDateIndo, getDaysRemaining } from '@/lib/formatters';
import {
  Wallet,
  AlertTriangle,
  TrendingDown,
  Building,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Receipt,
  PlusCircle,
  CreditCard,
  Plus,
  Calculator
} from 'lucide-react';

interface DashboardViewProps {
  onOpenNewPurchase: () => void;
  onOpenCollectCash: () => void;
  onOpenNewAdvance: () => void;
  onSelectOutletDeposit: (outletId: string) => void;
  onViewReceipt: (url: string, title: string) => void;
  onGoToTempo: () => void;
  onGoToAdvance: () => void;
  onOpenSettlement: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenNewPurchase,
  onOpenCollectCash,
  onOpenNewAdvance,
  onSelectOutletDeposit,
  onViewReceipt,
  onGoToTempo,
  onGoToAdvance,
  onOpenSettlement,
}) => {
  const {
    outlets,
    purchases,
    walletBreakdown,
    cashOnHandSummaries,
    totalHeldAllOutlets,
    totalAdvanceRemainingAll,
    unpaidTempoCount,
    unpaidTempoTotal,
    todayExpenseTotal,
    selectedOutletId,
  } = useApp();

  const filteredPurchases = selectedOutletId === 'all'
    ? purchases
    : purchases.filter(p => p.outlet_id === selectedOutletId);

  const unpaidTempoList = purchases
    .filter(p => p.is_tempo && p.tempo_status === 'unpaid' && (selectedOutletId === 'all' || p.outlet_id === selectedOutletId))
    .slice(0, 5);

  const recentPurchases = filteredPurchases.slice(0, 5);

  return (
    <div className="space-y-4 sm:space-y-6 pb-6">
      {/* Header Banner with Clean In-Flow Action Buttons */}
      <div className="bg-white p-3.5 sm:p-5 border-3 sm:border-4 border-black shadow-[3px_3px_0px_#121212] sm:shadow-[5px_5px_0px_#121212] space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="inline-block bg-[#FFE600] border-2 border-black px-2 py-0.5 text-[10px] font-black uppercase tracking-wider mb-1">
              CONTROL CENTER
            </div>
            <h1 className="text-lg sm:text-2xl font-black text-black tracking-tight uppercase leading-tight">
              Ringkasan Operasional FnB
            </h1>
            <p className="text-[11px] sm:text-xs font-bold text-black/70 mt-0.5">
              Pantau uang kasir dipegang, dana belanja mengendap, & tempo supplier.
            </p>
          </div>
        </div>

        {/* Action Buttons Toolbar (Professional Grid for Mobile & Desktop) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t-2 border-black/10">
          <button
            onClick={onOpenNewAdvance}
            className="py-2.5 px-2 bg-[#00F0FF] border-2 border-black text-black text-[11px] sm:text-xs font-black uppercase shadow-[2px_2px_0px_#121212] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all flex items-center justify-center gap-1"
          >
            <CreditCard className="h-3.5 w-3.5 stroke-[2.5]" />
            <span className="truncate">+ Dana Masuk</span>
          </button>

          <button
            onClick={onOpenNewPurchase}
            className="py-2.5 px-2 bg-[#FF4343] text-white border-2 border-black text-[11px] sm:text-xs font-black uppercase shadow-[2px_2px_0px_#121212] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all flex items-center justify-center gap-1"
          >
            <PlusCircle className="h-3.5 w-3.5 stroke-[2.5]" />
            <span className="truncate">+ Belanja</span>
          </button>

          <button
            onClick={onOpenCollectCash}
            className="py-2.5 px-2 bg-[#FFE600] border-2 border-black text-black text-[11px] sm:text-xs font-black uppercase shadow-[2px_2px_0px_#121212] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all flex items-center justify-center gap-1"
          >
            <Wallet className="h-3.5 w-3.5 stroke-[2.5]" />
            <span className="truncate">Tarik Kasir</span>
          </button>

          <button
            onClick={onOpenSettlement}
            className="py-2.5 px-2 bg-white border-2 border-black text-black text-[11px] sm:text-xs font-black uppercase shadow-[2px_2px_0px_#121212] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all flex items-center justify-center gap-1"
          >
            <Calculator className="h-3.5 w-3.5 stroke-[2.5]" />
            <span className="truncate">Rekap Kasir</span>
          </button>
        </div>
      </div>

      {/* DOMPET (CASH FISIK) & REKENING (M-BANKING) REAL-TIME FINANCIAL POSITION */}
      <div className="bg-white border-3 sm:border-4 border-black p-3.5 sm:p-5 shadow-[4px_4px_0px_#121212] space-y-3">
        <div className="flex items-center justify-between border-b-2 border-black pb-2">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-[#FFE600] border-2 border-black font-black text-xs">
              💼 POSISI UANG NYATA
            </span>
            <span className="text-xs sm:text-sm font-black uppercase text-black">
              Dompet (Cash) vs Rekening (Bank)
            </span>
          </div>
          <span className="text-[10px] sm:text-xs font-black bg-black text-white px-2 py-0.5 uppercase">
            Total Riil: {formatRupiah(walletBreakdown.totalRealMoney)}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Card Dompet Cash Fisik */}
          <div className="p-3 bg-[#FFE600]/25 border-3 border-black space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-black uppercase flex items-center gap-1.5">
                <Wallet className="h-4 w-4 stroke-[2.5]" />
                <span>💵 Cash Fisik di Dompet/Kantong</span>
              </span>
              <span className="text-base sm:text-lg font-black text-black">
                {formatRupiah(walletBreakdown.cashInWallet)}
              </span>
            </div>

            <div className="p-2 bg-white border-2 border-black space-y-1 text-[11px]">
              <div className="flex items-center justify-between text-black/80 font-bold">
                <span>&bull; Uang Kasir Dipegang (Belum Setor):</span>
                <span className="font-black text-black">{formatRupiah(walletBreakdown.cashierHeldTotal)}</span>
              </div>
              <div className="flex items-center justify-between text-black/80 font-bold">
                <span>&bull; Cash Sisa Pecahan ATM Titipan:</span>
                <span className="font-black text-emerald-700">{formatRupiah(walletBreakdown.advanceCashHolding)}</span>
              </div>
            </div>
          </div>

          {/* Card Saldo M-Banking */}
          <div className="p-3 bg-[#00F0FF]/25 border-3 border-black space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-black uppercase flex items-center gap-1.5">
                <CreditCard className="h-4 w-4 stroke-[2.5]" />
                <span>🏦 Saldo di Rekening M-Banking</span>
              </span>
              <span className="text-base sm:text-lg font-black text-black">
                {formatRupiah(walletBreakdown.balanceInBank)}
              </span>
            </div>

            <div className="p-2 bg-white border-2 border-black space-y-1 text-[11px]">
              <div className="flex items-center justify-between text-black/80 font-bold">
                <span>&bull; Sisa Dana Titipan Belanja di Bank:</span>
                <span className="font-black text-black">{formatRupiah(walletBreakdown.advanceBankBalance)}</span>
              </div>
              <div className="flex items-center justify-between text-black/80 font-bold">
                <span>&bull; Siap Ditransferkan:</span>
                <span className="font-black text-blue-700">{formatRupiah(walletBreakdown.balanceInBank)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top 4 Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Metric 1: Kas Fisik Dipegang */}
        <div className="bg-[#FFFDF5] border-3 border-black p-3 sm:p-4 shadow-[3px_3px_0px_#121212] relative flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-black bg-[#FFE600] border border-black px-1.5 py-0.5">
              Kasir Dipegang
            </span>
            <Wallet className="h-4 w-4 text-black stroke-[2.5]" />
          </div>
          <div className="mt-2 sm:mt-3">
            <div className="text-base sm:text-xl font-black text-black tracking-tight">
              {formatRupiah(totalHeldAllOutlets)}
            </div>
            <p className="text-[9px] sm:text-[10px] font-bold text-black/60 mt-0.5 truncate">
              Belum setor bank
            </p>
          </div>
        </div>

        {/* Metric 2: Dana Rekening Mengendap */}
        <div
          onClick={onGoToAdvance}
          className="bg-[#FFFDF5] border-3 border-black p-3 sm:p-4 shadow-[3px_3px_0px_#121212] relative cursor-pointer active:bg-[#E6FDFF] transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-black bg-[#00F0FF] border border-black px-1.5 py-0.5">
              Dana Rekening
            </span>
            <CreditCard className="h-4 w-4 text-black stroke-[2.5]" />
          </div>
          <div className="mt-2 sm:mt-3">
            <div className="text-base sm:text-xl font-black text-black tracking-tight">
              {formatRupiah(totalAdvanceRemainingAll)}
            </div>
            <p className="text-[9px] sm:text-[10px] font-bold text-black/60 mt-0.5 truncate">
              Sisa transfer luar
            </p>
          </div>
        </div>

        {/* Metric 3: Hutang Tempo */}
        <div
          onClick={onGoToTempo}
          className="bg-[#FFFDF5] border-3 border-black p-3 sm:p-4 shadow-[3px_3px_0px_#121212] relative cursor-pointer active:bg-[#FFEAEB] transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-white bg-[#FF4343] border border-black px-1.5 py-0.5">
              Hutang Tempo
            </span>
            <AlertTriangle className="h-4 w-4 text-black stroke-[2.5]" />
          </div>
          <div className="mt-2 sm:mt-3">
            <div className="text-base sm:text-xl font-black text-black tracking-tight">
              {formatRupiah(unpaidTempoTotal)}
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="px-1 bg-black text-white text-[8px] sm:text-[9px] font-black uppercase">
                {unpaidTempoCount} Belum Lunas
              </span>
            </div>
          </div>
        </div>

        {/* Metric 4: Belanja Hari Ini */}
        <div className="bg-[#FFFDF5] border-3 border-black p-3 sm:p-4 shadow-[3px_3px_0px_#121212] relative flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-black bg-[#FFE600] border border-black px-1.5 py-0.5">
              Belanja Hari Ini
            </span>
            <TrendingDown className="h-4 w-4 text-black stroke-[2.5]" />
          </div>
          <div className="mt-2 sm:mt-3">
            <div className="text-base sm:text-xl font-black text-black tracking-tight">
              {formatRupiah(todayExpenseTotal)}
            </div>
            <p className="text-[9px] sm:text-[10px] font-bold text-black/60 mt-0.5 truncate">
              Bahan baku hari ini
            </p>
          </div>
        </div>
      </div>

      {/* AMBANG SETOR TUNAI PER OUTLET */}
      <div className="bg-white border-3 sm:border-4 border-black p-3.5 sm:p-5 shadow-[4px_4px_0px_#121212]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <div className="p-1 bg-[#FFE600] border-2 border-black">
              <Building className="h-4 w-4 text-black stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-xs sm:text-base font-black text-black uppercase">
                AMBANG SETOR TUNAI BANK
              </h2>
              <p className="text-[10px] font-bold text-black/60">
                Oklah &gt; 500rb disetor | Prima Sushi &gt; 1jt disetor
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
          {cashOnHandSummaries.map((summary) => {
            const outlet = outlets.find(o => o.id === summary.outlet_id);
            const percentage = Math.min(100, Math.round((summary.total_held / summary.threshold) * 100));
            const isReady = summary.is_ready_to_deposit;

            return (
              <div
                key={summary.outlet_id}
                className={`p-3.5 sm:p-4 border-3 border-black transition-all ${
                  isReady
                    ? 'bg-[#FFE600] shadow-[3px_3px_0px_#121212]'
                    : 'bg-[#FFFDF5] shadow-[2px_2px_0px_#121212]'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-black text-black text-sm uppercase">{summary.outlet_name}</span>
                    {outlet?.status === 'construction' && (
                      <span className="text-[8px] bg-[#FF4343] text-white px-1 border border-black font-black uppercase">
                        Draft
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-black text-black bg-white border border-black px-1.5 py-0.2">
                    Target: {formatRupiah(summary.threshold)}
                  </span>
                </div>

                <div className="flex items-baseline justify-between mb-1.5">
                  <span className="text-[10px] font-bold text-black/80 uppercase">Dipegang:</span>
                  <span className="text-base sm:text-lg font-black text-black">
                    {formatRupiah(summary.total_held)}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-white h-3.5 border-2 border-black overflow-hidden mb-2.5 p-0.5">
                  <div
                    className={`h-full border-r-2 border-black transition-all duration-300 ${
                      isReady ? 'bg-[#00F0FF]' : 'bg-[#FFDE59]'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                {isReady ? (
                  <button
                    onClick={() => onSelectOutletDeposit(summary.outlet_id)}
                    className="w-full py-2 bg-[#FF4343] text-white font-black text-xs uppercase border-2 border-black shadow-[2px_2px_0px_#121212] flex items-center justify-center gap-1.5 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                  >
                    <CheckCircle2 className="h-4 w-4 stroke-[2.5]" />
                    <span>Target Tercapai • Setor Bank</span>
                  </button>
                ) : (
                  <div className="text-[10px] font-bold text-center text-black py-1.5 bg-white border border-black">
                    {summary.total_held > 0
                      ? `Kurang ${formatRupiah(summary.threshold - summary.total_held)} (${percentage}%)`
                      : 'Belum ada kas ditarik'}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Grid: Unpaid Tempo + Recent Purchases */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Left: Tempo Tagihan */}
        <div className="bg-white border-3 sm:border-4 border-black p-3.5 sm:p-5 shadow-[4px_4px_0px_#121212]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <div className="p-1 bg-[#FF4343] text-white border-2 border-black">
                <Clock className="h-3.5 w-3.5 stroke-[2.5]" />
              </div>
              <h2 className="text-xs sm:text-sm font-black text-black uppercase">Jatuh Tempo Terdekat</h2>
            </div>
            <button
              onClick={onGoToTempo}
              className="text-[10px] font-black text-black bg-[#FFE600] border border-black px-2 py-0.5 flex items-center gap-0.5"
            >
              <span>Semua</span>
              <ArrowUpRight className="h-3 w-3 stroke-[2.5]" />
            </button>
          </div>

          {unpaidTempoList.length === 0 ? (
            <div className="p-6 text-center bg-[#FFFDF5] border border-black text-black font-bold text-xs">
              <CheckCircle2 className="h-6 w-6 text-black mx-auto mb-1" />
              Semua tagihan tempo supplier lunas!
            </div>
          ) : (
            <div className="space-y-2">
              {unpaidTempoList.map((p) => {
                const outlet = outlets.find(o => o.id === p.outlet_id);
                const remaining = getDaysRemaining(p.tempo_due_date);

                return (
                  <div
                    key={p.id}
                    className="p-2.5 bg-[#FFFDF5] border-2 border-black shadow-[2px_2px_0px_#121212] flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="font-black text-black uppercase truncate">{p.supplier_name}</span>
                        <span className="text-[9px] px-1 border border-black bg-[#FFE600] font-black uppercase shrink-0">
                          {outlet?.name}
                        </span>
                      </div>
                      <p className="text-[10px] font-semibold text-black/70 truncate">
                        {p.notes || `${p.items.length} item`}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs sm:text-sm font-black text-black">
                        {formatRupiah(p.total_amount)}
                      </div>
                      <span
                        className={`text-[8px] sm:text-[9px] font-black uppercase px-1.5 py-0.2 border border-black inline-block ${
                          remaining.isOverdue
                            ? 'bg-[#FF4343] text-white'
                            : remaining.days <= 3
                            ? 'bg-[#FFE600] text-black'
                            : 'bg-white text-black'
                        }`}
                      >
                        {remaining.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Belanja Terbaru */}
        <div className="bg-white border-3 sm:border-4 border-black p-3.5 sm:p-5 shadow-[4px_4px_0px_#121212]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <div className="p-1 bg-[#00F0FF] border-2 border-black">
                <Receipt className="h-3.5 w-3.5 text-black stroke-[2.5]" />
              </div>
              <h2 className="text-xs sm:text-sm font-black text-black uppercase">Belanja Terbaru</h2>
            </div>
            <span className="text-[10px] font-black text-black bg-[#FFFDF5] border border-black px-1.5 py-0.2">
              {recentPurchases.length} Data
            </span>
          </div>

          {recentPurchases.length === 0 ? (
            <div className="p-6 text-center bg-[#FFFDF5] border border-black text-black font-bold text-xs">
              Belum ada transaksi belanja yang dicatat.
            </div>
          ) : (
            <div className="space-y-2">
              {recentPurchases.map((p) => {
                const outlet = outlets.find(o => o.id === p.outlet_id);

                return (
                  <div
                    key={p.id}
                    className="p-2.5 bg-[#FFFDF5] border-2 border-black shadow-[2px_2px_0px_#121212] flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="font-black text-black uppercase truncate">{p.supplier_name}</span>
                        <span className="text-[9px] px-1 border border-black bg-[#00F0FF] font-black uppercase shrink-0">
                          {outlet?.name}
                        </span>
                      </div>
                      <div className="text-[10px] font-bold text-black/60 truncate">
                        {formatDateIndo(p.purchase_date)} • {p.items?.length || 0} item • {p.payment_source.replace('_', ' ')}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <div className="text-right">
                        <div className="text-xs sm:text-sm font-black text-black">
                          {formatRupiah(p.total_amount)}
                        </div>
                      </div>
                      {p.receipt_image_url && (
                        <button
                          onClick={() => onViewReceipt(p.receipt_image_url!, `Nota ${p.supplier_name}`)}
                          className="p-1 bg-[#FFE600] border border-black shadow-[1px_1px_0px_#121212]"
                          title="Lihat Nota"
                        >
                          <Receipt className="h-3.5 w-3.5 stroke-[2.5]" />
                        </button>
                      )}
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
