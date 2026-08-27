'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { formatRupiah, formatDateIndo, getLocalDateString } from '@/lib/formatters';
import { generateAuditReport, exportPeriodAuditCSV, AuditLogEntry } from '@/lib/exportUtils';
import {
  Calendar,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Receipt,
  ShoppingBag,
  CreditCard,
  Wallet,
  Clock,
  ArrowRight,
  Filter
} from 'lucide-react';

export const AuditReportView: React.FC = () => {
  const { outlets, purchases, collections, advanceBatches, selectedOutletId, setSelectedOutletId } = useApp();

  const todayStr = getLocalDateString();
  const startOfMonthStr = getLocalDateString(new Date(new Date().getFullYear(), new Date().getMonth(), 1));

  const [startDate, setStartDate] = useState<string>(startOfMonthStr);
  const [endDate, setEndDate] = useState<string>(todayStr);

  const logs = generateAuditReport(
    startDate,
    endDate,
    selectedOutletId,
    purchases,
    collections,
    advanceBatches,
    outlets
  );

  const totalBelanjaPeriod = logs.filter(l => l.type === 'BELANJA' || l.type === 'BAYAR_TEMPO').reduce((acc, l) => acc + l.amount, 0);
  const totalKasTarikPeriod = logs.filter(l => l.type === 'TARIK_KAS').reduce((acc, l) => acc + l.amount, 0);
  const totalDanaMasukPeriod = logs.filter(l => l.type === 'DANA_MASUK').reduce((acc, l) => acc + l.amount, 0);

  const currentOutletName = selectedOutletId === 'all'
    ? 'Semua_Outlet'
    : (outlets.find(o => o.id === selectedOutletId)?.name || selectedOutletId);

  return (
    <div className="space-y-4 sm:space-y-6 pb-20 sm:pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-6 border-3 sm:border-4 border-black shadow-[3px_3px_0px_#121212] sm:shadow-[5px_5px_0px_#121212]">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-lg sm:text-2xl font-black text-black uppercase tracking-tight">
              Audit & Ekstrak Laporan Periode
            </h1>
            <span className="px-2 py-0.5 bg-[#FFE600] border-2 border-black text-black text-[10px] sm:text-xs font-black uppercase">
              {logs.length} Aktivitas Terdeteksi
            </span>
          </div>
          <p className="text-xs sm:text-sm font-bold text-black/70 mt-1">
            Ekstrak semua mutasi database berdasarkan rentang tanggal: belanja, tarik kasir, terima transfer luar, & pelunasan tempo.
          </p>
        </div>

        <button
          onClick={() => exportPeriodAuditCSV(startDate, endDate, logs, currentOutletName)}
          disabled={logs.length === 0}
          className="px-4 py-2.5 sm:py-3 bg-[#00F0FF] border-3 border-black text-black text-xs font-black uppercase shadow-[3px_3px_0px_#121212] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all flex items-center justify-center gap-1.5 disabled:opacity-40"
        >
          <FileSpreadsheet className="h-4 w-4 stroke-[2.5]" />
          <span>Ekstrak Rekap Excel (CSV)</span>
        </button>
      </div>

      {/* Date Range & Outlet Selector */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 bg-white p-3.5 sm:p-4 border-3 border-black shadow-[3px_3px_0px_#121212]">
        <div>
          <label className="block text-[10px] font-black text-black uppercase mb-1">
            Mulai Tanggal
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full bg-[#FFFDF5] border-2 border-black p-2 text-xs font-bold text-black focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-[10px] font-black text-black uppercase mb-1">
            Sampai Tanggal
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full bg-[#FFFDF5] border-2 border-black p-2 text-xs font-bold text-black focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-[10px] font-black text-black uppercase mb-1">
            Filter Outlet
          </label>
          <select
            value={selectedOutletId}
            onChange={(e) => setSelectedOutletId(e.target.value)}
            className="w-full bg-[#FFFDF5] border-2 border-black p-2 text-xs font-bold text-black focus:outline-none"
          >
            <option value="all">Semua Outlet</option>
            {outlets.map(o => (
              <option key={o.id} value={o.id}>{o.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Stat Cards for this Range */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-4">
        <div className="p-3 sm:p-4 bg-[#FFFDF5] border-3 border-black shadow-[3px_3px_0px_#121212]">
          <div className="text-[10px] font-black text-black/70 uppercase">Total Belanja Periode Ini</div>
          <div className="text-lg sm:text-xl font-black text-[#FF4343] mt-0.5">
            {formatRupiah(totalBelanjaPeriod)}
          </div>
        </div>

        <div className="p-3 sm:p-4 bg-[#FFFDF5] border-3 border-black shadow-[3px_3px_0px_#121212]">
          <div className="text-[10px] font-black text-black/70 uppercase">Total Kasir Ditarik Periode Ini</div>
          <div className="text-lg sm:text-xl font-black text-[#121212] mt-0.5">
            {formatRupiah(totalKasTarikPeriod)}
          </div>
        </div>

        <div className="p-3 sm:p-4 bg-[#FFE600] border-3 border-black shadow-[3px_3px_0px_#121212]">
          <div className="text-[10px] font-black text-black uppercase">Total Transfer Luar Diterima</div>
          <div className="text-lg sm:text-xl font-black text-black mt-0.5">
            {formatRupiah(totalDanaMasukPeriod)}
          </div>
        </div>
      </div>

      {/* Activity Timeline / Audit Log Table */}
      <div className="bg-white border-3 sm:border-4 border-black shadow-[4px_4px_0px_#121212] p-4 sm:p-6 space-y-3">
        <div className="flex items-center justify-between border-b-2 border-black pb-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-black text-black uppercase">
              Timeline Aktivitas & Update Database ({logs.length})
            </span>
          </div>
          <span className="text-[10px] font-bold text-black/70">
            {formatDateIndo(startDate)} sd {formatDateIndo(endDate)}
          </span>
        </div>

        {logs.length === 0 ? (
          <div className="p-8 text-center text-xs font-bold text-black/60">
            Tidak ada aktivitas database yang tercatat pada rentang tanggal ini.
          </div>
        ) : (
          <div className="space-y-2">
            {logs.map((log, idx) => (
              <div
                key={idx}
                className="p-3 bg-[#FFFDF5] border-2 border-black shadow-[2px_2px_0px_#121212] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div className="flex items-start sm:items-center gap-2">
                  <span className={`text-[9px] px-2 py-0.5 border border-black font-black uppercase shrink-0 ${
                    log.type === 'BELANJA' ? 'bg-[#FF4343] text-white' :
                    log.type === 'TARIK_KAS' ? 'bg-[#FFE600] text-black' :
                    log.type === 'DANA_MASUK' ? 'bg-[#00F0FF] text-black' : 'bg-black text-white'
                  }`}>
                    {log.type.replace('_', ' ')}
                  </span>

                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-black text-black">{log.title}</span>
                      <span className="text-[10px] px-1 bg-white border border-black font-bold">
                        {log.outlet_name}
                      </span>
                      {log.has_receipt && (
                        <span className="text-[9px] text-emerald-700 font-bold">📸 Ada Bukti</span>
                      )}
                    </div>
                    <p className="text-[11px] text-black/70">{log.details}</p>
                  </div>
                </div>

                <div className="text-left sm:text-right shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-black/10">
                  <span className="font-black text-black block sm:inline mr-2 text-sm">
                    {formatRupiah(log.amount)}
                  </span>
                  <span className="text-[10px] text-black/60">
                    {formatDateIndo(log.date)} • {log.time}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
