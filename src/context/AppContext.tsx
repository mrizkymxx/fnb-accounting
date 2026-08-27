'use client';

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { Outlet, Supplier, Purchase, CashCollection, AdvanceFundBatch, CashOnHandSummary, WalletBreakdown } from '@/types/database';
import { INITIAL_OUTLETS, INITIAL_SUPPLIERS, INITIAL_PURCHASES, INITIAL_COLLECTIONS, INITIAL_ADVANCE_BATCHES } from '@/lib/mockData';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { formatRupiah } from '@/lib/formatters';

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
  depositCashOnHand: (outletId: string, bankName: string, bankAccount: string, slipUrl?: string, notes?: string, atmDepositAmount?: number, cashRemainderToAdvance?: number) => Promise<void>;

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
  walletBreakdown: WalletBreakdown;
  cashOnHandSummaries: CashOnHandSummary[];
  totalHeldAllOutlets: number;
  totalAdvanceRemainingAll: number;
  unpaidTempoCount: number;
  unpaidTempoTotal: number;
  todayExpenseTotal: number;
  isCloudSyncActive: boolean;
  refreshCloudData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  OUTLETS: 'fnb_acc_outlets_v2',
  SUPPLIERS: 'fnb_acc_suppliers_v2',
  PURCHASES: 'fnb_acc_purchases_v2',
  COLLECTIONS: 'fnb_acc_collections_v2',
  ADVANCE_BATCHES: 'fnb_acc_advance_batches_v2',
};

// Helper to generate standard UUID v4
const generateUUID = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [collections, setCollections] = useState<CashCollection[]>([]);
  const [advanceBatches, setAdvanceBatches] = useState<AdvanceFundBatch[]>([]);
  const [selectedOutletId, setSelectedOutletId] = useState<string | 'all'>('all');
  const [isLoaded, setIsLoaded] = useState(false);
  const [isCloudSyncActive, setIsCloudSyncActive] = useState(false);

  // Sync / Load Function
  const fetchCloudData = async () => {
    const client = supabase;
    if (isSupabaseConfigured && client) {
      try {
        const [outletsRes, suppliersRes, batchesRes, purchasesRes, collectionsRes] = await Promise.all([
          client.from('outlets').select('*').order('name'),
          client.from('suppliers').select('*').order('name'),
          client.from('advance_fund_batches').select('*').order('received_at', { ascending: false }),
          client.from('purchases').select('*, items:purchase_items(*)').order('purchase_date', { ascending: false }),
          client.from('cash_collections').select('*').order('collected_at', { ascending: false }),
        ]);

        if (outletsRes.data && outletsRes.data.length > 0) {
          setOutlets(outletsRes.data as Outlet[]);
          setSuppliers((suppliersRes.data as Supplier[]) || []);
          setAdvanceBatches((batchesRes.data as AdvanceFundBatch[]) || []);
          const mappedPurchases = ((purchasesRes.data as Purchase[]) || []).map(p => ({
            ...p,
            items: Array.isArray(p.items) ? p.items : []
          }));
          setPurchases(mappedPurchases);
          setCollections((collectionsRes.data as CashCollection[]) || []);
          setIsCloudSyncActive(true);
          return;
        }
      } catch (err) {
        console.warn('Cloud sync error, using local state', err);
      }
    }

    // Fallback Local
    try {
      const storedOutlets = localStorage.getItem(STORAGE_KEYS.OUTLETS);
      const storedSuppliers = localStorage.getItem(STORAGE_KEYS.SUPPLIERS);
      const storedPurchases = localStorage.getItem(STORAGE_KEYS.PURCHASES);
      const storedCollections = localStorage.getItem(STORAGE_KEYS.COLLECTIONS);
      const storedBatches = localStorage.getItem(STORAGE_KEYS.ADVANCE_BATCHES);

      setOutlets(storedOutlets ? JSON.parse(storedOutlets) : INITIAL_OUTLETS);
      setSuppliers(storedSuppliers ? JSON.parse(storedSuppliers) : INITIAL_SUPPLIERS);
      const parsedPurchases = storedPurchases ? JSON.parse(storedPurchases) : INITIAL_PURCHASES;
      const safePurchases = Array.isArray(parsedPurchases)
        ? parsedPurchases.map((p: any) => ({ ...p, items: Array.isArray(p.items) ? p.items : [] }))
        : INITIAL_PURCHASES;
      setPurchases(safePurchases);
      setCollections(storedCollections ? JSON.parse(storedCollections) : INITIAL_COLLECTIONS);
      setAdvanceBatches(storedBatches ? JSON.parse(storedBatches) : INITIAL_ADVANCE_BATCHES);
    } catch {
      setOutlets(INITIAL_OUTLETS);
      setSuppliers(INITIAL_SUPPLIERS);
      setPurchases(INITIAL_PURCHASES);
      setCollections(INITIAL_COLLECTIONS);
      setAdvanceBatches(INITIAL_ADVANCE_BATCHES);
    }
  };

  const refreshCloudData = async () => {
    await fetchCloudData();
  };

  useEffect(() => {
    fetchCloudData().finally(() => setIsLoaded(true));
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

  // 1. OUTLET CRUD
  const addOutlet = async (data: Omit<Outlet, 'id' | 'created_at'>): Promise<Outlet> => {
    const id = generateUUID();
    const newOutlet: Outlet = {
      ...data,
      id,
      created_at: new Date().toISOString(),
    };
    setOutlets(prev => [...prev, newOutlet]);

    const client = supabase;
    if (isSupabaseConfigured && client) {
      const { error } = await client.from('outlets').insert({
        id: newOutlet.id,
        name: newOutlet.name,
        type: newOutlet.type,
        cash_deposit_threshold: newOutlet.cash_deposit_threshold,
        status: newOutlet.status,
      });
      if (error) console.error('Supabase addOutlet error:', error);
    }

    return newOutlet;
  };

  const updateOutlet = async (id: string, data: Partial<Outlet>) => {
    setOutlets(prev => prev.map(o => o.id === id ? { ...o, ...data } : o));

    const client = supabase;
    if (isSupabaseConfigured && client) {
      const { error } = await client.from('outlets').update(data).eq('id', id);
      if (error) console.error('Supabase updateOutlet error:', error);
    }
  };

  const deleteOutlet = async (id: string) => {
    setOutlets(prev => prev.filter(o => o.id !== id));
    if (selectedOutletId === id) setSelectedOutletId('all');

    const client = supabase;
    if (isSupabaseConfigured && client) {
      const { error } = await client.from('outlets').delete().eq('id', id);
      if (error) console.error('Supabase deleteOutlet error:', error);
    }
  };

  // 2. ADVANCE FUND CRUD
  const addAdvanceFundBatch = async (
    data: Omit<AdvanceFundBatch, 'id' | 'created_at' | 'remaining_amount' | 'status'>
  ): Promise<AdvanceFundBatch> => {
    const id = generateUUID();
    const newBatch: AdvanceFundBatch = {
      ...data,
      id,
      remaining_amount: data.initial_amount,
      status: 'active',
      created_at: new Date().toISOString(),
    };
    setAdvanceBatches(prev => [newBatch, ...prev]);

    const client = supabase;
    if (isSupabaseConfigured && client) {
      const { error } = await client.from('advance_fund_batches').insert({
        id: newBatch.id,
        outlet_id: newBatch.outlet_id,
        sender_source: newBatch.sender_source,
        batch_name: newBatch.batch_name,
        received_at: newBatch.received_at,
        initial_amount: newBatch.initial_amount,
        remaining_amount: newBatch.remaining_amount,
        status: newBatch.status,
        notes: newBatch.notes,
        proof_image_url: newBatch.proof_image_url,
      });
      if (error) console.error('Supabase addAdvanceFundBatch error:', error);
    }

    return newBatch;
  };

  const updateAdvanceFundBatch = async (id: string, data: Partial<AdvanceFundBatch>) => {
    setAdvanceBatches(prev => prev.map(b => b.id === id ? { ...b, ...data } : b));
    const client = supabase;
    if (isSupabaseConfigured && client) {
      const { error } = await client.from('advance_fund_batches').update(data).eq('id', id);
      if (error) console.error('Supabase updateAdvanceFundBatch error:', error);
    }
  };

  const deleteAdvanceFundBatch = async (batchId: string) => {
    setPurchases(prev => prev.map(p => {
      if (p.advance_batch_id === batchId) {
        return { ...p, advance_batch_id: undefined, payment_source: 'personal_cash' };
      }
      return p;
    }));
    setAdvanceBatches(prev => prev.filter(b => b.id !== batchId));
    const client = supabase;
    if (isSupabaseConfigured && client) {
      // Lepaskan referensi FK purchases dulu sebelum menghapus batch dari Supabase
      await client
        .from('purchases')
        .update({ advance_batch_id: null, payment_source: 'personal_cash' })
        .eq('advance_batch_id', batchId);

      const { error } = await client.from('advance_fund_batches').delete().eq('id', batchId);
      if (error) console.error('Supabase deleteAdvanceFundBatch error:', error);
    }
  };

  const closeAdvanceFundBatch = async (batchId: string) => {
    setAdvanceBatches(prev => prev.map(b => {
      if (b.id === batchId) {
        return { ...b, status: 'closed' };
      }
      return b;
    }));
    const client = supabase;
    if (isSupabaseConfigured && client) {
      const { error } = await client.from('advance_fund_batches').update({ status: 'closed' }).eq('id', batchId);
      if (error) console.error('Supabase closeAdvanceFundBatch error:', error);
    }
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

    const newId = generateUUID();
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

    const client = supabase;
    if (isSupabaseConfigured && client) {
      await client.from('advance_fund_batches').insert({
        id: newConsolidatedBatch.id,
        outlet_id: newConsolidatedBatch.outlet_id,
        sender_source: newConsolidatedBatch.sender_source,
        batch_name: newConsolidatedBatch.batch_name,
        received_at: newConsolidatedBatch.received_at,
        initial_amount: newConsolidatedBatch.initial_amount,
        remaining_amount: newConsolidatedBatch.remaining_amount,
        status: newConsolidatedBatch.status,
        notes: newConsolidatedBatch.notes,
      });
      for (const bId of batchIds) {
        await client.from('advance_fund_batches').update({ status: 'closed' }).eq('id', bId);
      }
    }

    return newConsolidatedBatch;
  };

  // 3. PURCHASE CRUD
  const addPurchase = async (newPurData: Omit<Purchase, 'id' | 'created_at'>): Promise<Purchase> => {
    const id = generateUUID();
    const newPurchase: Purchase = {
      ...newPurData,
      id,
      created_at: new Date().toISOString(),
    };

    setPurchases(prev => [newPurchase, ...prev]);

    if ((newPurData.payment_source === 'advance_transfer' || newPurData.payment_source === 'advance_cash') && newPurData.advance_batch_id && newPurData.advance_batch_id !== 'auto_fifo') {
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

    if ((newPurData.payment_source === 'advance_transfer' || newPurData.payment_source === 'advance_cash') && (!newPurData.advance_batch_id || newPurData.advance_batch_id === 'auto_fifo')) {
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

    const client = supabase;
    if (isSupabaseConfigured && client) {
      const { error: purErr } = await client.from('purchases').insert({
        id: newPurchase.id,
        outlet_id: newPurchase.outlet_id,
        supplier_id: newPurchase.supplier_id || null,
        supplier_name: newPurchase.supplier_name,
        purchase_date: newPurchase.purchase_date,
        payment_source: newPurchase.payment_source,
        advance_batch_id: newPurchase.advance_batch_id && newPurchase.advance_batch_id !== 'auto_fifo' ? newPurchase.advance_batch_id : null,
        total_amount: newPurchase.total_amount,
        is_tempo: newPurchase.is_tempo,
        tempo_due_date: newPurchase.tempo_due_date || null,
        tempo_status: newPurchase.tempo_status || 'unpaid',
        receipt_image_url: newPurchase.receipt_image_url || null,
        notes: newPurchase.notes || null,
      });

      if (purErr) {
        console.error('Supabase insert purchase error:', purErr);
      } else if (newPurchase.items && newPurchase.items.length > 0) {
        const itemsToInsert = newPurchase.items.map(it => ({
          id: generateUUID(),
          purchase_id: newPurchase.id,
          item_name: it.item_name,
          quantity: it.quantity,
          unit: it.unit,
          unit_price: it.unit_price,
          subtotal: it.subtotal,
        }));
        const { error: itemErr } = await client.from('purchase_items').insert(itemsToInsert);
        if (itemErr) console.error('Supabase insert purchase_items error:', itemErr);
      }

      // Update remaining amount of advance batch in Supabase if applicable
      if (newPurchase.advance_batch_id && newPurchase.advance_batch_id !== 'auto_fifo') {
        const targetBatch = advanceBatches.find(b => b.id === newPurchase.advance_batch_id);
        if (targetBatch) {
          const newRem = Math.max(0, targetBatch.remaining_amount - newPurchase.total_amount);
          await client.from('advance_fund_batches').update({
            remaining_amount: newRem,
            status: newRem === 0 ? 'depleted' : 'active',
          }).eq('id', targetBatch.id);
        }
      }
    }

    return newPurchase;
  };

  const updatePurchase = async (id: string, updatedData: Partial<Purchase>) => {
    const oldPurchase = purchases.find(p => p.id === id);
    if (!oldPurchase) return;

    // Rollback batch lama jika sebelumnya memakai batch tertentu
    if ((oldPurchase.payment_source === 'advance_transfer' || oldPurchase.payment_source === 'advance_cash') && oldPurchase.advance_batch_id && oldPurchase.advance_batch_id !== 'auto_fifo') {
      setAdvanceBatches(prev => prev.map(b => {
        if (b.id === oldPurchase.advance_batch_id) {
          const restored = Math.round(b.remaining_amount + oldPurchase.total_amount);
          return { ...b, remaining_amount: restored, status: 'active' };
        }
        return b;
      }));
    }

    const newPurchase = { ...oldPurchase, ...updatedData };

    // Potong batch baru jika memakai batch tertentu
    if ((newPurchase.payment_source === 'advance_transfer' || newPurchase.payment_source === 'advance_cash') && newPurchase.advance_batch_id && newPurchase.advance_batch_id !== 'auto_fifo') {
      setAdvanceBatches(prev => prev.map(b => {
        if (b.id === newPurchase.advance_batch_id) {
          const newRem = Math.max(0, Math.round(b.remaining_amount - newPurchase.total_amount));
          return { ...b, remaining_amount: newRem, status: newRem === 0 ? 'depleted' : 'active' };
        }
        return b;
      }));
    }

    setPurchases(prev => prev.map(p => p.id === id ? newPurchase : p));

    const client = supabase;
    if (isSupabaseConfigured && client) {
      const { error: upErr } = await client.from('purchases').update({
        outlet_id: newPurchase.outlet_id,
        supplier_id: newPurchase.supplier_id || null,
        supplier_name: newPurchase.supplier_name,
        purchase_date: newPurchase.purchase_date,
        payment_source: newPurchase.payment_source,
        advance_batch_id: newPurchase.advance_batch_id && newPurchase.advance_batch_id !== 'auto_fifo' ? newPurchase.advance_batch_id : null,
        total_amount: newPurchase.total_amount,
        is_tempo: newPurchase.is_tempo,
        tempo_due_date: newPurchase.tempo_due_date || null,
        tempo_status: newPurchase.tempo_status || 'unpaid',
        receipt_image_url: newPurchase.receipt_image_url || null,
        notes: newPurchase.notes || null,
      }).eq('id', id);

      if (upErr) console.error('Supabase update purchase error:', upErr);

      if (newPurchase.items && newPurchase.items.length > 0) {
        await client.from('purchase_items').delete().eq('purchase_id', id);
        const itemsToInsert = newPurchase.items.map(it => ({
          id: generateUUID(),
          purchase_id: id,
          item_name: it.item_name,
          quantity: it.quantity,
          unit: it.unit,
          unit_price: it.unit_price,
          subtotal: it.subtotal,
        }));
        await client.from('purchase_items').insert(itemsToInsert);
      }

      // Sync saldo batch ke Supabase
      if (oldPurchase.advance_batch_id && oldPurchase.advance_batch_id !== 'auto_fifo') {
        const oldB = advanceBatches.find(b => b.id === oldPurchase.advance_batch_id);
        if (oldB) {
          const restored = Math.round(oldB.remaining_amount + oldPurchase.total_amount);
          await client.from('advance_fund_batches').update({
            remaining_amount: restored,
            status: 'active'
          }).eq('id', oldPurchase.advance_batch_id);
        }
      }

      if (newPurchase.advance_batch_id && newPurchase.advance_batch_id !== 'auto_fifo') {
        const newB = advanceBatches.find(b => b.id === newPurchase.advance_batch_id);
        if (newB) {
          const newRem = Math.max(0, Math.round(newB.remaining_amount - newPurchase.total_amount));
          await client.from('advance_fund_batches').update({
            remaining_amount: newRem,
            status: newRem === 0 ? 'depleted' : 'active'
          }).eq('id', newPurchase.advance_batch_id);
        }
      }
    }
  };

  const deletePurchase = async (id: string) => {
    const target = purchases.find(p => p.id === id);
    if (target && (target.payment_source === 'advance_transfer' || target.payment_source === 'advance_cash') && target.advance_batch_id && target.advance_batch_id !== 'auto_fifo') {
      setAdvanceBatches(prev => prev.map(b => {
        if (b.id === target.advance_batch_id) {
          const restored = Math.round(b.remaining_amount + target.total_amount);
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

    const client = supabase;
    if (isSupabaseConfigured && client) {
      await client.from('purchase_items').delete().eq('purchase_id', id);
      const { error } = await client.from('purchases').delete().eq('id', id);
      if (error) console.error('Supabase deletePurchase error:', error);

      if (target && (target.payment_source === 'advance_transfer' || target.payment_source === 'advance_cash') && target.advance_batch_id && target.advance_batch_id !== 'auto_fifo') {
        const b = advanceBatches.find(batch => batch.id === target.advance_batch_id);
        if (b) {
          const restored = Math.round(b.remaining_amount + target.total_amount);
          await client.from('advance_fund_batches').update({
            remaining_amount: restored,
            status: 'active'
          }).eq('id', target.advance_batch_id);
        }
      }
    }
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

    const client = supabase;
    if (isSupabaseConfigured && client) {
      const { error } = await client.from('purchases').update({
        tempo_status: status,
        tempo_paid_at: status === 'paid' ? new Date().toISOString() : null,
        tempo_payment_proof_url: proofUrl || null,
      }).eq('id', id);
      if (error) console.error('Supabase updateTempoStatus error:', error);
    }
  };

  // 4. CASH COLLECTION CRUD
  const addCashCollection = async (data: Omit<CashCollection, 'id' | 'created_at'>): Promise<CashCollection> => {
    const id = generateUUID();
    const newCol: CashCollection = {
      ...data,
      id,
      created_at: new Date().toISOString(),
    };
    setCollections(prev => [newCol, ...prev]);

    const client = supabase;
    if (isSupabaseConfigured && client) {
      const { error } = await client.from('cash_collections').insert({
        id: newCol.id,
        outlet_id: newCol.outlet_id,
        collected_at: newCol.collected_at,
        amount: newCol.amount,
        source: newCol.source,
        notes: newCol.notes,
        status: newCol.status,
        proof_image_url: newCol.proof_image_url,
      });
      if (error) console.error('Supabase addCashCollection error:', error);
    }

    return newCol;
  };

  const updateCashCollection = async (id: string, data: Partial<CashCollection>) => {
    setCollections(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
    const client = supabase;
    if (isSupabaseConfigured && client) {
      const { error } = await client.from('cash_collections').update(data).eq('id', id);
      if (error) console.error('Supabase updateCashCollection error:', error);
    }
  };

  const deleteCashCollection = async (id: string) => {
    setCollections(prev => prev.filter(c => c.id !== id));
    const client = supabase;
    if (isSupabaseConfigured && client) {
      const { error } = await client.from('cash_collections').delete().eq('id', id);
      if (error) console.error('Supabase deleteCashCollection error:', error);
    }
  };

  const depositCashOnHand = async (
    outletId: string,
    bankName: string,
    bankAccount: string,
    slipUrl?: string,
    notes?: string,
    atmDepositAmount?: number,
    cashRemainderToAdvance?: number
  ) => {
    const nowIso = new Date().toISOString();
    const outlet = outlets.find(o => o.id === outletId);

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

    // Jika ada sisa pecahan ATM yang tidak bisa disetor (e.g. 44.300),
    // otomatis buat batch dana titipan berbentuk cash di tangan
    if (cashRemainderToAdvance && cashRemainderToAdvance > 0) {
      const remainderBatchId = generateUUID();
      const remainderBatch: AdvanceFundBatch = {
        id: remainderBatchId,
        outlet_id: outletId,
        sender_source: `Sisa Pecahan Setor ATM ${outlet?.name || ''}`,
        batch_name: `Cash Kembalian ATM Setor ${outlet?.name || ''} (${formatRupiah(cashRemainderToAdvance)})`,
        received_at: nowIso,
        initial_amount: cashRemainderToAdvance,
        remaining_amount: cashRemainderToAdvance,
        status: 'active',
        notes: `Sisa uang fisik tidak masuk mesin ATM saat transfer lunas ke pusat. Berubah jadi Cash Dana Titipan.`,
        proof_image_url: slipUrl,
        created_at: nowIso,
      };

      setAdvanceBatches(prev => [remainderBatch, ...prev]);

      const client = supabase;
      if (isSupabaseConfigured && client) {
        await client.from('advance_fund_batches').insert({
          id: remainderBatch.id,
          outlet_id: remainderBatch.outlet_id,
          sender_source: remainderBatch.sender_source,
          batch_name: remainderBatch.batch_name,
          received_at: remainderBatch.received_at,
          initial_amount: remainderBatch.initial_amount,
          remaining_amount: remainderBatch.remaining_amount,
          status: remainderBatch.status,
          notes: remainderBatch.notes,
          proof_image_url: remainderBatch.proof_image_url,
        });
      }
    }

    const client = supabase;
    if (isSupabaseConfigured && client) {
      const { error } = await client.from('cash_collections').update({
        status: 'deposited_to_bank',
        deposited_at: nowIso,
        deposit_bank: bankName,
        deposit_account: bankAccount,
        proof_image_url: slipUrl || null,
      }).eq('outlet_id', outletId).eq('status', 'held_by_me');
      if (error) console.error('Supabase depositCashOnHand error:', error);
    }
  };

  // 5. SUPPLIER CRUD
  const addSupplier = async (data: Omit<Supplier, 'id' | 'created_at'>): Promise<Supplier> => {
    const id = generateUUID();
    const newSup: Supplier = {
      ...data,
      id,
      created_at: new Date().toISOString(),
    };
    setSuppliers(prev => [...prev, newSup]);

    const client = supabase;
    if (isSupabaseConfigured && client) {
      const { error } = await client.from('suppliers').insert({
        id: newSup.id,
        name: newSup.name,
        category: newSup.category,
        phone: newSup.phone,
        address: newSup.address,
        payment_terms: newSup.payment_terms,
        default_tempo_days: newSup.default_tempo_days,
        bank_name: newSup.bank_name,
        bank_account_number: newSup.bank_account_number,
        bank_account_name: newSup.bank_account_name,
      });
      if (error) console.error('Supabase addSupplier error:', error);
    }

    return newSup;
  };

  const updateSupplier = async (id: string, data: Partial<Supplier>) => {
    setSuppliers(prev => prev.map(s => s.id === id ? { ...s, ...data } : s));
    const client = supabase;
    if (isSupabaseConfigured && client) {
      const { error } = await client.from('suppliers').update(data).eq('id', id);
      if (error) console.error('Supabase updateSupplier error:', error);
    }
  };

  const deleteSupplier = async (id: string) => {
    setSuppliers(prev => prev.filter(s => s.id !== id));
    const client = supabase;
    if (isSupabaseConfigured && client) {
      const { error } = await client.from('suppliers').delete().eq('id', id);
      if (error) console.error('Supabase deleteSupplier error:', error);
    }
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
        is_ready_to_deposit: threshold > 0 && totalHeld >= threshold,
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

  const walletBreakdown: WalletBreakdown = useMemo(() => {
    // Sisa titipan yang berbentuk cash fisik (hasil pecahan ATM / cash)
    const advanceCashHolding = advanceBatches
      .filter(b => b.status === 'active' && (
        b.sender_source.toLowerCase().includes('atm') ||
        b.sender_source.toLowerCase().includes('cash') ||
        b.batch_name.toLowerCase().includes('cash') ||
        b.batch_name.toLowerCase().includes('kembalian')
      ))
      .reduce((acc, b) => acc + b.remaining_amount, 0);

    // Sisa titipan yang berbentuk saldo di rekening M-Banking
    const advanceBankBalance = Math.max(0, totalAdvanceRemainingAll - advanceCashHolding);

    const cashierHeldTotal = totalHeldAllOutlets;
    const cashInWallet = cashierHeldTotal + advanceCashHolding;
    const balanceInBank = advanceBankBalance;
    const totalRealMoney = cashInWallet + balanceInBank;

    return {
      cashInWallet,
      balanceInBank,
      totalRealMoney,
      advanceCashHolding,
      advanceBankBalance,
      cashierHeldTotal,
    };
  }, [advanceBatches, totalAdvanceRemainingAll, totalHeldAllOutlets]);

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
        walletBreakdown,
        cashOnHandSummaries,
        totalHeldAllOutlets,
        totalAdvanceRemainingAll,
        unpaidTempoCount,
        unpaidTempoTotal,
        todayExpenseTotal,
        isCloudSyncActive,
        refreshCloudData: fetchCloudData,
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
