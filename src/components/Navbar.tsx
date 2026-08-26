'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { Store, Wallet, AlertCircle, ShoppingBag, PlusCircle, Building2, CreditCard, Sparkles } from 'lucide-react';

interface NavbarProps {
  activeTab: 'dashboard' | 'purchases' | 'advance_funds' | 'cash_tracker' | 'tempo' | 'suppliers';
  setActiveTab: (tab: 'dashboard' | 'purchases' | 'advance_funds' | 'cash_tracker' | 'tempo' | 'suppliers') => void;
  onOpenNewPurchase: () => void;
  onOpenCollectCash: () => void;
  onOpenNewAdvance: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenNewPurchase,
  onOpenCollectCash,
  onOpenNewAdvance,
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
      {/* Top Header - Super Compact on Mobile */}
      <header className="sticky top-0 z-40 bg-[#FFE600] border-b-3 border-black text-black shadow-[0_3px_0px_#121212] pt-[env(safe-area-inset-top,0px)]">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16 py-1.5">
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
                  Oklah • Prima Sushi
                </span>
              </div>
            </div>

            {/* Quick Actions Header */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Outlet Selector */}
              <select
                value={selectedOutletId}
                onChange={(e) => setSelectedOutletId(e.target.value)}
                className="bg-white border-2 border-black px-2 py-1.5 text-xs font-black uppercase shadow-[2px_2px_0px_#121212] focus:outline-none max-w-[120px] sm:max-w-none truncate"
              >
                <option value="all">Semua Outlet</option>
                {outlets.map(o => (
                  <option key={o.id} value={o.id}>{o.name}</option>
                ))}
              </select>

              {/* Action Button */}
              <button
                onClick={onOpenNewPurchase}
                className="flex items-center gap-1 bg-[#FF4343] text-white border-2 border-black px-2.5 sm:px-3.5 py-1.5 text-xs font-black uppercase shadow-[2px_2px_0px_#121212] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
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

      {/* Floating Action Buttons for Mobile (Sangat Cepat & Mudah Diakses Jempol) */}
      <div className="md:hidden fixed bottom-18 right-3.5 z-30 flex flex-col gap-2">
        <button
          onClick={onOpenNewAdvance}
          className="h-11 px-3 bg-[#00F0FF] border-2 border-black shadow-[3px_3px_0px_#121212] flex items-center gap-1.5 text-xs font-black uppercase text-black active:translate-x-[1px] active:translate-y-[1px]"
          title="Terima Transfer Luar"
        >
          <CreditCard className="h-4 w-4 stroke-[2.5]" />
          <span>+ Dana</span>
        </button>
        <button
          onClick={onOpenCollectCash}
          className="h-11 px-3 bg-[#FFE600] border-2 border-black shadow-[3px_3px_0px_#121212] flex items-center gap-1.5 text-xs font-black uppercase text-black active:translate-x-[1px] active:translate-y-[1px]"
          title="Tarik Kasir Outlet"
        >
          <Wallet className="h-4 w-4 stroke-[2.5]" />
          <span>Tarik Kas</span>
        </button>
      </div>

      {/* Mobile Bottom Navigation Bar (iOS Bottom Bar) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FFE600] border-t-3 border-black shadow-[0_-3px_0px_#121212] px-1.5 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <div className="grid grid-cols-5 gap-1 text-[9px] font-black uppercase text-center">
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
            {totalAdvanceRemainingAll > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-[#00F0FF] border border-black rounded-full" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('cash_tracker')}
            className={`py-1.5 px-0.5 border-2 border-black flex flex-col items-center justify-center relative transition-all ${
              activeTab === 'cash_tracker' ? 'bg-black text-white shadow-[1px_1px_0px_#121212]' : 'bg-white text-black'
            }`}
          >
            <Wallet className="h-3.5 w-3.5 stroke-[2.5]" />
            <span className="truncate w-full">Kasir</span>
            {readyToDepositCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-[#FF4343] border border-black rounded-full animate-ping" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('tempo')}
            className={`py-1.5 px-0.5 border-2 border-black flex flex-col items-center justify-center relative transition-all ${
              activeTab === 'tempo' ? 'bg-black text-white shadow-[1px_1px_0px_#121212]' : 'bg-white text-black'
            }`}
          >
            <AlertCircle className="h-3.5 w-3.5 stroke-[2.5]" />
            <span className="truncate w-full">Tempo</span>
            {unpaidTempoCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-[#FF4343] border border-black rounded-full" />
            )}
          </button>
        </div>
      </nav>
    </>
  );
};
