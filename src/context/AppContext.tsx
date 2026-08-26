'use client';

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { Outlet, Supplier, Purchase, CashCollection, AdvanceFundBatch, CashOnHandSummary } from '@/types/database';
import { INITIAL_OUTLETS, INITIAL_SUPPLIERS, INITIAL_PURCHASES, INITIAL_COLLECTIONS, INITIAL_ADVANCE_BATCHES } from '@/lib/mockData';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

interface AppContextType {
  outlets: Outlet[];
  suppliers: Supplier[];
  purchases: Purchase[];
  collections: CashCollection[];
  advanceBatches: AdvanceFundBatch[];
  selectedOutletId: string | 'all';
  setSelectedOutletId: (id: string | 'all') => void;

  // 1. Outlet CRUD
  addOutlet: (outlet: Omit<Outlet, 'id' | 'created_at'>) => Promise<Outlet>;
  updateOutlet: (id: string, outlet: Partial<Outlet>) => Promise<void>;
  deleteOutlet: (id: string) => Promise<void>;

  // 2. Purchase CRUD
  addPurchase: (purchase: Omit<Purchase, 'id' | 'created_at'>) => Promise<Purchase>;
  updatePurchase: (id: string, purchase: Partial<Purchase>) => Promise<void>;
  deletePurchase: (id: string) => Promise<void>;
  updateTempoStatus: (id: string, status: 'paid' | 'unpaid', proofUrl?: string) => Promise<void>;

  // 3. Cash Collection CRUD
  addCashCollection: (collection: Omit<CashCollection, 'id' | 'created_at'>) => Promise<CashCollection>;
  updateCashCollection: (id: string, collection: Partial<CashCollection>) => Promise<void>;
  deleteCashCollection: (id: string) => Promise<void>;
  depositCashOnHand: (outletId: string, bankName: string, bankAccount: string, slipUrl?: string, notes?: string) => Promise<void>;

  // 4. Advance Fund CRUD
  addAdvanceFundBatch: (batch: Omit<AdvanceFundBatch, 'id' | 'created_at' | 'remaining_amount' | 'status'>) => Promise<AdvanceFundBatch>;
  updateAdvanceFundBatch: (id: string, batch: Partial<AdvanceFundBatch>) => Promise<void>;
  deleteAdvanceFundBatch: (batchId: string) => Promise<void>;
  closeAdvanceFundBatch: (batchId: string) => Promise<void>;
  consolidateAdvanceBatches: (outletId: string, batchIds: string[], consolidatedName?: string) => Promise<AdvanceFundBatch>;

  // 5. Supplier CRUD
  addSupplier: (supplier: Omit<Supplier, 'id' | 'created_at'>) => Promise<Supplier>;
  updateSupplier: (id: string, supplier: Partial<Supplier>) => Promise<void>;
  deleteSupplier: (id: string) => Promise<void>;

  // Computed Metrics
  cashOnHandSummaries: CashOnHandSummary[];
  totalHeldAllOutlets: number;
  totalAdvanceRemainingAll: number;
  unpaidTempoCount: number;
  unpaidTempoTotal: number;
  todayExpenseTotal: number;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  OUTLETS: 'fnb_acc_outlets',
  SUPPLIERS: 'fnb_acc_suppliers',
  PURCHASES: 'fnb_acc_purchases',
  COLLECTIONS: 'fnb_acc_collections',
  ADVANCE_BATCHES: 'fnb_acc_advance_batches',
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [collections, setCollections] = useState<CashCollection[]>([]);
  const [advanceBatches, setAdvanceBatches] = useState<AdvanceFundBatch[]>([]);
  const [selectedOutletId, setSelectedOutletId] = useState<string | 'all'>('all');
  const [isLoaded, setIsLoaded] = useState(false);

  // Initial Load
  useEffect(() => {
    try {
      const storedOutlets = localStorage.getItem(STORAGE_KEYS.OUTLETS);
      const storedSuppliers = localStorage.getItem(STORAGE_KEYS.SUPPLIERS);
      const storedPurchases = localStorage.getItem(STORAGE_KEYS.PURCHASES);
      const storedCollections = localStorage.getItem(STORAGE_KEYS.COLLECTIONS);
      const storedBatches = localStorage.getItem(STORAGE_KEYS.ADVANCE_BATCHES);

      setOutlets(storedOutlets ? JSON.parse(storedOutlets) : INITIAL_OUTLETS);
      setSuppliers(storedSuppliers ? JSON.parse(storedSuppliers) : INITIAL_SUPPLIERS);
      setPurchases(storedPurchases ? JSON.parse(storedPurchases) : INITIAL_PURCHASES);
      setCollections(storedCollections ? JSON.parse(storedCollections) : INITIAL_COLLECTIONS);
      setAdvanceBatches(storedBatches ? JSON.parse(storedBatches) : INITIAL_ADVANCE_BATCHES);
    } catch {
      setOutlets(INITIAL_OUTLETS);
      setSuppliers(INITIAL_SUPPLIERS);
      setPurchases(INITIAL_PURCHASES);
      setCollections(INITIAL_COLLECTIONS);
      setAdvanceBatches(INITIAL_ADVANCE_BATCHES);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save to LocalStorage
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(STORAGE_KEYS.OUTLETS, JSON.stringify(outlets));
      localStorage.setItem(STORAGE_KEYS.SUPPLIERS, JSON.stringify(suppliers));
      localStorage.setItem(STORAGE_KEYS.PURCHASES, JSON.stringify(purchases));
      localStorage.setItem(STORAGE_KEYS.COLLECTIONS, JSON.stringify(collections));
      localStorage.setItem(STORAGE_KEYS.ADVANCE_BATCHES, JSON.stringify(advanceBatches));
    } catch (e) {
      console.warn('Failed to save to local storage', e);
    }
  }, [outlets, suppliers, purchases, collections, advanceBatches, isLoaded]);

  // ==========================================
  // 1. OUTLET CRUD
  // ==========================================
  const addOutlet = async (data: Omit<Outlet, 'id' | 'created_at'>): Promise<Outlet> => {
    const id = `out_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newOutlet: Outlet = {
      ...data,
      id,
      created_at: new Date().toISOString(),
    };
    setOutlets(prev => [...prev, newOutlet]);
    return newOutlet;
  };

  const updateOutlet = async (id: string, data: Partial<Outlet>) => {
    setOutlets(prev => prev.map(o => o.id === id ? { ...o, ...data } : o));
  };

  const deleteOutlet = async (id: string) => {
    setOutlets(prev => prev.filter(o => o.id !== id));
    if (selectedOutletId === id) setSelectedOutletId('all');
  };

  // ==========================================
  // 2. ADVANCE FUND CRUD
  // ==========================================
  const addAdvanceFundBatch = async (
    data: Omit<AdvanceFundBatch, 'id' | 'created_at' | 'remaining_amount' | 'status'>
  ): Promise<AdvanceFundBatch> => {
    const id = `batch_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newBatch: AdvanceFundBatch = {
      ...data,
      id,
      remaining_amount: data.initial_amount,
      status: 'active',
      created_at: new Date().toISOString(),
    };
    setAdvanceBatches(prev => [newBatch, ...prev]);
    return newBatch;
  };

  const updateAdvanceFundBatch = async (id: string, data: Partial<AdvanceFundBatch>) => {
    setAdvanceBatches(prev => prev.map(b => b.id === id ? { ...b, ...data } : b));
  };

  const deleteAdvanceFundBatch = async (batchId: string) => {
    setPurchases(prev => prev.map(p => {
      if (p.advance_batch_id === batchId) {
        return { ...p, advance_batch_id: undefined, payment_source: 'personal_cash' };
      }
      return p;
    }));
    setAdvanceBatches(prev => prev.filter(b => b.id !== batchId));
  };

  const closeAdvanceFundBatch = async (batchId: string) => {
    setAdvanceBatches(prev => prev.map(b => {
      if (b.id === batchId) {
        return { ...b, status: 'closed' };
      }
      return b;
    }));
  };

  const consolidateAdvanceBatches = async (
    outletId: string,
    batchIds: string[],
    consolidatedName?: string
  ): Promise<AdvanceFundBatch> => {
    const targetBatches = advanceBatches.filter(b => batchIds.includes(b.id) && b.status === 'active');
    const totalRemaining = targetBatches.reduce((acc, b) => acc + b.remaining_amount, 0);

    const outlet = outlets.find(o => o.id === outletId);
    const label = consolidatedName || `Konsolidasi Kumpulan Sisa ${outlet?.name || ''} (${new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short' }).format(new Date())})`;

    setAdvanceBatches(prev => prev.map(b => {
      if (batchIds.includes(b.id)) {
        return { ...b, status: 'closed', notes: `${b.notes || ''} [Terkonsolidasi ke batch baru]` };
      }
      return b;
    }));

    const newId = `batch_cons_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
    const newConsolidatedBatch: AdvanceFundBatch = {
      id: newId,
      outlet_id: outletId,
      sender_source: 'Gabungan Kumpulan Sisa Batch',
      batch_name: label,
      received_at: new Date().toISOString(),
      initial_amount: totalRemaining,
      remaining_amount: totalRemaining,
      status: 'active',
      notes: `Hasil gabungan ${targetBatches.length} batch sisa (${targetBatches.map(t => t.batch_name).join(', ')})`,
      created_at: new Date().toISOString(),
    };

    setAdvanceBatches(prev => [newConsolidatedBatch, ...prev]);
    return newConsolidatedBatch;
  };

  // ==========================================
  // 3. PURCHASE CRUD
  // ==========================================
  const addPurchase = async (newPurData: Omit<Purchase, 'id' | 'created_at'>): Promise<Purchase> => {
    const id = `pur_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newPurchase: Purchase = {
      ...newPurData,
      id,
      created_at: new Date().toISOString(),
    };

    setPurchases(prev => [newPurchase, ...prev]);

    if (newPurData.payment_source === 'advance_transfer' && newPurData.advance_batch_id && newPurData.advance_batch_id !== 'auto_fifo') {
      setAdvanceBatches(prev => prev.map(b => {
        if (b.id === newPurData.advance_batch_id) {
          const newRemaining = Math.max(0, b.remaining_amount - newPurData.total_amount);
          return {
            ...b,
            remaining_amount: newRemaining,
            status: newRemaining === 0 ? 'depleted' : 'active',
          };
        }
        return b;
      }));
    }

    if (newPurData.payment_source === 'advance_transfer' && (!newPurData.advance_batch_id || newPurData.advance_batch_id === 'auto_fifo')) {
      let needed = newPurData.total_amount;
      setAdvanceBatches(prev => {
        return prev.map(b => {
          if (b.outlet_id === newPurData.outlet_id && b.status === 'active' && b.remaining_amount > 0 && needed > 0) {
            if (b.remaining_amount >= needed) {
              const remaining = b.remaining_amount - needed;
              needed = 0;
              return { ...b, remaining_amount: remaining, status: remaining === 0 ? 'depleted' : 'active' };
            } else {
              needed -= b.remaining_amount;
              return { ...b, remaining_amount: 0, status: 'depleted' };
            }
          }
          return b;
        });
      });
    }

    return newPurchase;
  };

  const updatePurchase = async (id: string, updatedData: Partial<Purchase>) => {
    const oldPurchase = purchases.find(p => p.id === id);
    if (!oldPurchase) return;

    if (oldPurchase.payment_source === 'advance_transfer' && oldPurchase.advance_batch_id && oldPurchase.advance_batch_id !== 'auto_fifo') {
      setAdvanceBatches(prev => prev.map(b => {
        if (b.id === oldPurchase.advance_batch_id) {
          return { ...b, remaining_amount: b.remaining_amount + oldPurchase.total_amount, status: 'active' };
        }
        return b;
      }));
    }

    const newPurchase = { ...oldPurchase, ...updatedData };

    if (newPurchase.payment_source === 'advance_transfer' && newPurchase.advance_batch_id && newPurchase.advance_batch_id !== 'auto_fifo') {
      setAdvanceBatches(prev => prev.map(b => {
        if (b.id === newPurchase.advance_batch_id) {
          const newRem = Math.max(0, b.remaining_amount - newPurchase.total_amount);
          return { ...b, remaining_amount: newRem, status: newRem === 0 ? 'depleted' : 'active' };
        }
        return b;
      }));
    }

    setPurchases(prev => prev.map(p => p.id === id ? newPurchase : p));
  };

  const deletePurchase = async (id: string) => {
    const target = purchases.find(p => p.id === id);
    if (target && target.payment_source === 'advance_transfer' && target.advance_batch_id && target.advance_batch_id !== 'auto_fifo') {
      setAdvanceBatches(prev => prev.map(b => {
        if (b.id === target.advance_batch_id) {
          const restored = b.remaining_amount + target.total_amount;
          return {
            ...b,
            remaining_amount: restored,
            status: 'active',
          };
        }
        return b;
      }));
    }

    setPurchases(prev => prev.filter(p => p.id !== id));
  };

  const updateTempoStatus = async (id: string, status: 'paid' | 'unpaid', proofUrl?: string) => {
    setPurchases(prev => prev.map(p => {
      if (p.id === id) {
        return {
          ...p,
          tempo_status: status,
          tempo_paid_at: status === 'paid' ? new Date().toISOString() : undefined,
          tempo_payment_proof_url: proofUrl || p.tempo_payment_proof_url,
        };
      }
      return p;
    }));
  };

  // ==========================================
  // 4. CASH COLLECTION CRUD
  // ==========================================
  const addCashCollection = async (data: Omit<CashCollection, 'id' | 'created_at'>): Promise<CashCollection> => {
    const id = `col_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newCol: CashCollection = {
      ...data,
      id,
      created_at: new Date().toISOString(),
    };
    setCollections(prev => [newCol, ...prev]);
    return newCol;
  };

  const updateCashCollection = async (id: string, data: Partial<CashCollection>) => {
    setCollections(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
  };

  const deleteCashCollection = async (id: string) => {
    setCollections(prev => prev.filter(c => c.id !== id));
  };

  const depositCashOnHand = async (outletId: string, bankName: string, bankAccount: string, slipUrl?: string, notes?: string) => {
    const nowIso = new Date().toISOString();
    setCollections(prev => prev.map(c => {
      if (c.outlet_id === outletId && c.status === 'held_by_me') {
        return {
          ...c,
          status: 'deposited_to_bank',
          deposited_at: nowIso,
          deposit_bank: bankName,
          deposit_account: bankAccount,
          proof_image_url: slipUrl || c.proof_image_url,
          notes: notes ? `${c.notes || ''} [Setor: ${notes}]` : c.notes,
        };
      }
      return c;
    }));
  };

  // ==========================================
  // 5. SUPPLIER CRUD
  // ==========================================
  const addSupplier = async (data: Omit<Supplier, 'id' | 'created_at'>): Promise<Supplier> => {
    const id = `sup_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newSup: Supplier = {
      ...data,
      id,
      created_at: new Date().toISOString(),
    };
    setSuppliers(prev => [...prev, newSup]);
    return newSup;
  };

  const updateSupplier = async (id: string, data: Partial<Supplier>) => {
    setSuppliers(prev => prev.map(s => s.id === id ? { ...s, ...data } : s));
  };

  const deleteSupplier = async (id: string) => {
    setSuppliers(prev => prev.filter(s => s.id !== id));
  };

  // Summaries
  const cashOnHandSummaries = useMemo(() => {
    return outlets.map(outlet => {
      const heldCollections = collections.filter(
        c => c.outlet_id === outlet.id && c.status === 'held_by_me'
      );
      const totalHeld = heldCollections.reduce((acc, curr) => acc + curr.amount, 0);
      const threshold = outlet.cash_deposit_threshold || 500000;

      return {
        outlet_id: outlet.id,
        outlet_name: outlet.name,
        threshold,
        total_held: totalHeld,
        is_ready_to_deposit: totalHeld >= threshold,
        collections: heldCollections,
      };
    });
  }, [outlets, collections]);

  const totalHeldAllOutlets = useMemo(() => {
    return cashOnHandSummaries.reduce((acc, curr) => acc + curr.total_held, 0);
  }, [cashOnHandSummaries]);

  const totalAdvanceRemainingAll = useMemo(() => {
    return advanceBatches
      .filter(b => b.status === 'active')
      .reduce((acc, b) => acc + b.remaining_amount, 0);
  }, [advanceBatches]);

  const unpaidTempoList = useMemo(() => {
    return purchases.filter(p => p.is_tempo && p.tempo_status === 'unpaid');
  }, [purchases]);

  const unpaidTempoCount = unpaidTempoList.length;
  const unpaidTempoTotal = unpaidTempoList.reduce((acc, p) => acc + p.total_amount, 0);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayExpenseTotal = useMemo(() => {
    return purchases
      .filter(p => p.purchase_date === todayStr)
      .reduce((acc, p) => acc + p.total_amount, 0);
  }, [purchases, todayStr]);

  return (
    <AppContext.Provider
      value={{
        outlets,
        suppliers,
        purchases,
        collections,
        advanceBatches,
        selectedOutletId,
        setSelectedOutletId,
        addOutlet,
        updateOutlet,
        deleteOutlet,
        addPurchase,
        updatePurchase,
        deletePurchase,
        updateTempoStatus,
        addCashCollection,
        updateCashCollection,
        deleteCashCollection,
        depositCashOnHand,
        addAdvanceFundBatch,
        updateAdvanceFundBatch,
        deleteAdvanceFundBatch,
        closeAdvanceFundBatch,
        consolidateAdvanceBatches,
        addSupplier,
        updateSupplier,
        deleteSupplier,
        cashOnHandSummaries,
        totalHeldAllOutlets,
        totalAdvanceRemainingAll,
        unpaidTempoCount,
        unpaidTempoTotal,
        todayExpenseTotal,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
