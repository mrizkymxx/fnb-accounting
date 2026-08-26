'use client';

import React, { useState, useEffect } from 'react';
import { AppProvider } from '@/context/AppContext';
import { Purchase, CashCollection } from '@/types/database';
import { Navbar } from '@/components/Navbar';
import { DashboardView } from '@/components/DashboardView';
import { PurchasesListView } from '@/components/PurchasesListView';
import { AdvanceFundView } from '@/components/AdvanceFundView';
import { CashTrackerView } from '@/components/CashTrackerView';
import { TempoManagerView } from '@/components/TempoManagerView';
import { SuppliersView } from '@/components/SuppliersView';
import { AuditReportView } from '@/components/AuditReportView';
import { PurchaseFormModal } from '@/components/PurchaseFormModal';
import { AdvanceFundModal } from '@/components/AdvanceFundModal';
import { CashCollectionModal } from '@/components/CashCollectionModal';
import { DepositBankModal } from '@/components/DepositBankModal';
import { ReceiptPreviewModal } from '@/components/ReceiptPreviewModal';
import { LoginScreen } from '@/components/LoginScreen';

function MainApp() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'purchases' | 'advance_funds' | 'cash_tracker' | 'tempo' | 'suppliers' | 'audit_reports'>('dashboard');

  useEffect(() => {
    const session = localStorage.getItem('fnb_auth_session');
    setIsAuthenticated(session === 'authenticated');
  }, []);

  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);

  const [isCollectionModalOpen, setIsCollectionModalOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<CashCollection | null>(null);

  const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false);
  const [depositModalOutletId, setDepositModalOutletId] = useState<string | null>(null);

  const [previewReceipt, setPreviewReceipt] = useState<{ url: string; title: string } | null>(null);

  const handleOpenNewPurchase = () => {
    setEditingPurchase(null);
    setIsPurchaseModalOpen(true);
  };

  const handleEditPurchase = (purchase: Purchase) => {
    setEditingPurchase(purchase);
    setIsPurchaseModalOpen(true);
  };

  const handleOpenCollectCash = () => {
    setEditingCollection(null);
    setIsCollectionModalOpen(true);
  };

  const handleEditCollection = (collection: CashCollection) => {
    setEditingCollection(collection);
    setIsCollectionModalOpen(true);
  };

  const handleOpenDeposit = (outletId: string) => {
    setDepositModalOutletId(outletId);
  };

  const handleViewReceipt = (url: string, title: string) => {
    setPreviewReceipt({ url, title });
  };

  const handleLogout = () => {
    localStorage.removeItem('fnb_auth_session');
    setIsAuthenticated(false);
  };

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-[#FCFAF2] flex items-center justify-center">
        <div className="text-xs font-black uppercase bg-[#FFE600] border-2 border-black px-3 py-1.5 shadow-[2px_2px_0px_#121212]">
          Memeriksa Akses...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen onSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="min-h-screen text-black flex flex-col antialiased selection:bg-[#FFE600] selection:text-black font-sans">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNewPurchase={handleOpenNewPurchase}
        onOpenCollectCash={handleOpenCollectCash}
        onOpenNewAdvance={() => setIsAdvanceModalOpen(true)}
      />

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6">
        <div className="hidden sm:flex justify-end mb-2">
          <button
            onClick={handleLogout}
            className="text-[10px] font-black uppercase text-black/60 hover:text-black bg-white border border-black px-2 py-0.5"
          >
            🔒 Kunci / Logout
          </button>
        </div>

        {activeTab === 'dashboard' && (
          <DashboardView
            onOpenNewPurchase={handleOpenNewPurchase}
            onOpenCollectCash={handleOpenCollectCash}
            onOpenNewAdvance={() => setIsAdvanceModalOpen(true)}
            onSelectOutletDeposit={handleOpenDeposit}
            onViewReceipt={handleViewReceipt}
            onGoToTempo={() => setActiveTab('tempo')}
            onGoToAdvance={() => setActiveTab('advance_funds')}
          />
        )}

        {activeTab === 'purchases' && (
          <PurchasesListView
            onOpenNewPurchase={handleOpenNewPurchase}
            onEditPurchase={handleEditPurchase}
            onViewReceipt={handleViewReceipt}
          />
        )}

        {activeTab === 'advance_funds' && (
          <AdvanceFundView
            onOpenNewAdvance={() => setIsAdvanceModalOpen(true)}
            onOpenNewPurchase={handleOpenNewPurchase}
            onViewReceipt={handleViewReceipt}
          />
        )}

        {activeTab === 'cash_tracker' && (
          <CashTrackerView
            onOpenCollectCash={handleOpenCollectCash}
            onEditCollection={handleEditCollection}
            onSelectOutletDeposit={handleOpenDeposit}
            onViewReceipt={handleViewReceipt}
          />
        )}

        {activeTab === 'tempo' && (
          <TempoManagerView onViewReceipt={handleViewReceipt} />
        )}

        {activeTab === 'audit_reports' && (
          <AuditReportView />
        )}

        {activeTab === 'suppliers' && (
          <SuppliersView />
        )}
      </main>

      {/* Modals */}
      <PurchaseFormModal
        isOpen={isPurchaseModalOpen}
        initialData={editingPurchase}
        onClose={() => {
          setIsPurchaseModalOpen(false);
          setEditingPurchase(null);
        }}
      />

      <AdvanceFundModal
        isOpen={isAdvanceModalOpen}
        onClose={() => setIsAdvanceModalOpen(false)}
      />

      <CashCollectionModal
        isOpen={isCollectionModalOpen}
        initialData={editingCollection}
        onClose={() => {
          setIsCollectionModalOpen(false);
          setEditingCollection(null);
        }}
      />

      <DepositBankModal
        isOpen={Boolean(depositModalOutletId)}
        outletId={depositModalOutletId || ''}
        onClose={() => setDepositModalOutletId(null)}
      />

      <ReceiptPreviewModal
        isOpen={Boolean(previewReceipt)}
        imageUrl={previewReceipt?.url || null}
        title={previewReceipt?.title}
        onClose={() => setPreviewReceipt(null)}
      />
    </div>
  );
}

export default function Home() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}
