'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { Store, Wallet, AlertCircle, ShoppingBag, PlusCircle, Building2, CreditCard, FileText, Settings, Calculator } from 'lucide-react';

interface NavbarProps {
  activeTab: 'dashboard' | 'purchases' | 'advance_funds' | 'cash_tracker' | 'tempo' | 'suppliers' | 'audit_reports' | 'ai_estimator';
  setActiveTab: (tab: 'dashboard' | 'purchases' | 'advance_funds' | 'cash_tracker' | 'tempo' | 'suppliers' | 'audit_reports' | 'ai_estimator') => void;
  onOpenNewPurchase: () => void;
  onOpenCollectCash: () => void;
  onOpenNewAdvance: () => void;
  onOpenManageOutlets: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenNewPurchase,
  onOpenCollectCash,
  onOpenNewAdvance,
  onOpenManageOutlets,
}) => {
  const {
    outlets,
    selectedOutletId,
    setSelectedOutletId,
    unpaidTempoCount,
    cashOnHandSummaries,
    totalAdvanceRemainingAll
  } = useApp();

  const readyToDepositCount = cashOnHandSummaries.filter(s => s.is_ready_to_deposit).length;

  return (
    <>
      {/* Top Header - Neo-Brutalism Bold */}
      <header className="sticky top-0 z-40 bg-[#FFE600] border-b-3 border-black text-black shadow-[0_3px_0px_#121212] pt-[env(safe-area-inset-top,0px)]">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 sm:h-9 sm:w-9 bg-[#FF4343] border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_#121212]">
                <Store className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-black stroke-[2.5]" />
              </div>
              <div>
                <span className="font-black text-sm sm:text-lg tracking-tight uppercase block leading-none">
                  FnB ACCOUNTIQ
                </span>
                <span className="text-[9px] sm:text-[10px] font-bold text-black/70">
                  {outlets.length} Outlets Terdaftar
                </span>
              </div>
            </div>

            {/* Quick Actions Header */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Outlet Selector */}
              <select
                value={selectedOutletId}
                onChange={(e) => setSelectedOutletId(e.target.value)}
                className="bg-white border-2 border-black px-2 py-1.5 text-xs font-black uppercase shadow-[2px_2px_0px_#121212] focus:outline-none max-w-[110px] sm:max-w-none truncate"
              >
                <option value="all">Semua Outlet</option>
                {outlets.map(o => (
                  <option key={o.id} value={o.id}>{o.name}</option>
                ))}
              </select>

              {/* Estimator Tool Shortcut */}
              <button
                onClick={() => setActiveTab('ai_estimator')}
                className={`p-1.5 border-2 border-black shadow-[2px_2px_0px_#121212] active:translate-x-[1px] active:translate-y-[1px] transition-all flex items-center gap-1 ${
                  activeTab === 'ai_estimator' ? 'bg-black text-white' : 'bg-[#00F0FF] text-black'
                }`}
                title="Kalkulator Estimasi WhatsApp"
              >
                <Calculator className="h-4 w-4 stroke-[2.5]" />
                <span className="hidden sm:inline text-xs font-black uppercase">Estimator</span>
              </button>

              {/* Manage Outlets Button */}
              <button
                onClick={onOpenManageOutlets}
                className="p-1.5 bg-white hover:bg-slate-100 border-2 border-black shadow-[2px_2px_0px_#121212] active:translate-x-[1px] active:translate-y-[1px]"
                title="Kelola & Tambah Outlet"
              >
                <Settings className="h-4 w-4 stroke-[2.5]" />
              </button>

              {/* Action Button */}
              <button
                onClick={onOpenNewPurchase}
                className="flex items-center gap-1 bg-[#FF4343] text-white border-2 border-black px-2.5 sm:px-3.5 py-1.5 text-xs font-black uppercase shadow-[2px_2px_0px_#121212] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
              >
                <PlusCircle className="h-3.5 w-3.5 stroke-[2.5]" />
                <span>+ Belanja</span>
              </button>
            </div>
          </div>

          {/* Desktop Nav Tabs */}
          <div className="hidden md:flex space-x-2 overflow-x-auto py-2 border-t-2 border-black text-xs font-black uppercase">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3 py-1.5 border-2 border-black transition-all ${
                activeTab === 'dashboard' ? 'bg-black text-white shadow-[2px_2px_0px_#121212]' : 'bg-white text-black hover:bg-slate-100'
              }`}
            >
              📊 Arus Kas
            </button>
            <button
              onClick={() => setActiveTab('purchases')}
              className={`px-3 py-1.5 border-2 border-black transition-all flex items-center gap-1 ${
                activeTab === 'purchases' ? 'bg-black text-white shadow-[2px_2px_0px_#121212]' : 'bg-white text-black hover:bg-slate-100'
              }`}
            >
              <ShoppingBag className="h-3.5 w-3.5 stroke-[2.5]" />
              Purchasing & Nota
            </button>
            <button
              onClick={() => setActiveTab('ai_estimator')}
              className={`px-3 py-1.5 border-2 border-black transition-all flex items-center gap-1.5 ${
                activeTab === 'ai_estimator' ? 'bg-black text-white shadow-[2px_2px_0px_#121212]' : 'bg-[#00F0FF] text-black hover:bg-[#00d6e6]'
              }`}
            >
              <Calculator className="h-3.5 w-3.5 stroke-[2.5]" />
              <span>Estimasi WhatsApp (Stand-alone)</span>
            </button>
            <button
              onClick={() => setActiveTab('advance_funds')}
              className={`px-3 py-1.5 border-2 border-black transition-all flex items-center gap-1.5 ${
                activeTab === 'advance_funds' ? 'bg-black text-white shadow-[2px_2px_0px_#121212]' : 'bg-white text-black hover:bg-slate-100'
              }`}
            >
              <CreditCard className="h-3.5 w-3.5 stroke-[2.5]" />
              <span>Dana Belanja Rekening</span>
              {totalAdvanceRemainingAll > 0 && (
                <span className="bg-[#00F0FF] text-black px-1 text-[9px] font-black border border-black">
                  Ada Saldo
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('cash_tracker')}
              className={`px-3 py-1.5 border-2 border-black transition-all flex items-center gap-1.5 ${
                activeTab === 'cash_tracker' ? 'bg-black text-white shadow-[2px_2px_0px_#121212]' : 'bg-white text-black hover:bg-slate-100'
              }`}
            >
              <Wallet className="h-3.5 w-3.5 stroke-[2.5]" />
              <span>Kas Dipegang & Setor Bank</span>
              {readyToDepositCount > 0 && (
                <span className="bg-[#FF4343] text-white px-1 text-[9px] font-black border border-black animate-pulse">
                  {readyToDepositCount} SIAP SETOR
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('tempo')}
              className={`px-3 py-1.5 border-2 border-black transition-all flex items-center gap-1.5 ${
                activeTab === 'tempo' ? 'bg-black text-white shadow-[2px_2px_0px_#121212]' : 'bg-white text-black hover:bg-slate-100'
              }`}
            >
              <AlertCircle className="h-3.5 w-3.5 stroke-[2.5]" />
              <span>Hutang Tempo</span>
              {unpaidTempoCount > 0 && (
                <span className="bg-[#FF4343] text-white px-1 text-[9px] font-black border border-black">
                  {unpaidTempoCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('audit_reports')}
              className={`px-3 py-1.5 border-2 border-black transition-all flex items-center gap-1 ${
                activeTab === 'audit_reports' ? 'bg-black text-white shadow-[2px_2px_0px_#121212]' : 'bg-white text-black hover:bg-slate-100'
              }`}
            >
              <FileText className="h-3.5 w-3.5 stroke-[2.5]" />
              <span>Ekstrak Audit</span>
            </button>
            <button
              onClick={() => setActiveTab('suppliers')}
              className={`px-3 py-1.5 border-2 border-black transition-all flex items-center gap-1 ${
                activeTab === 'suppliers' ? 'bg-black text-white shadow-[2px_2px_0px_#121212]' : 'bg-white text-black hover:bg-slate-100'
              }`}
            >
              <Building2 className="h-3.5 w-3.5 stroke-[2.5]" />
              Supplier
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FFE600] border-t-3 border-black shadow-[0_-3px_0px_#121212] px-1 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <div className="grid grid-cols-6 gap-0.5 text-[8px] font-black uppercase text-center">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`py-1.5 px-0.5 border-2 border-black flex flex-col items-center justify-center transition-all ${
              activeTab === 'dashboard' ? 'bg-black text-white shadow-[1px_1px_0px_#121212]' : 'bg-white text-black'
            }`}
          >
            <span className="text-xs">📊</span>
            <span className="truncate w-full">Ringkas</span>
          </button>

          <button
            onClick={() => setActiveTab('ai_estimator')}
            className={`py-1.5 px-0.5 border-2 border-black flex flex-col items-center justify-center transition-all ${
              activeTab === 'ai_estimator' ? 'bg-black text-white shadow-[1px_1px_0px_#121212]' : 'bg-[#00F0FF] text-black font-black'
            }`}
          >
            <Calculator className="h-3.5 w-3.5 stroke-[2.5]" />
            <span className="truncate w-full">Estimasi</span>
          </button>

          <button
            onClick={() => setActiveTab('purchases')}
            className={`py-1.5 px-0.5 border-2 border-black flex flex-col items-center justify-center transition-all ${
              activeTab === 'purchases' ? 'bg-black text-white shadow-[1px_1px_0px_#121212]' : 'bg-white text-black'
            }`}
          >
            <ShoppingBag className="h-3.5 w-3.5 stroke-[2.5]" />
            <span className="truncate w-full">Belanja</span>
          </button>

          <button
            onClick={() => setActiveTab('advance_funds')}
            className={`py-1.5 px-0.5 border-2 border-black flex flex-col items-center justify-center relative transition-all ${
              activeTab === 'advance_funds' ? 'bg-black text-white shadow-[1px_1px_0px_#121212]' : 'bg-white text-black'
            }`}
          >
            <CreditCard className="h-3.5 w-3.5 stroke-[2.5]" />
            <span className="truncate w-full">Rekening</span>
          </button>

          <button
            onClick={() => setActiveTab('cash_tracker')}
            className={`py-1.5 px-0.5 border-2 border-black flex flex-col items-center justify-center relative transition-all ${
              activeTab === 'cash_tracker' ? 'bg-black text-white shadow-[1px_1px_0px_#121212]' : 'bg-white text-black'
            }`}
          >
            <Wallet className="h-3.5 w-3.5 stroke-[2.5]" />
            <span className="truncate w-full">Kasir</span>
          </button>

          <button
            onClick={() => setActiveTab('tempo')}
            className={`py-1.5 px-0.5 border-2 border-black flex flex-col items-center justify-center relative transition-all ${
              activeTab === 'tempo' ? 'bg-black text-white shadow-[1px_1px_0px_#121212]' : 'bg-white text-black'
            }`}
          >
            <AlertCircle className="h-3.5 w-3.5 stroke-[2.5]" />
            <span className="truncate w-full">Tempo</span>
          </button>
        </div>
      </nav>
    </>
  );
};
