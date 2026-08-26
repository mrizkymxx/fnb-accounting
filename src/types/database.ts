export type OutletType = 'cafe' | 'resto' | 'cafe/resto' | 'internal';
export type OutletStatus = 'active' | 'construction' | 'inactive';

export interface Outlet {
  id: string;
  name: string;
  type: OutletType;
  cash_deposit_threshold: number; // 500rb Oklah, 1jt Prima Sushi, 0 untuk internal/staff meals
  status: OutletStatus;
  color: string;
  created_at?: string;
}

export interface Supplier {
  id: string;
  name: string;
  category: string;
  phone?: string;
  address?: string;
  payment_terms: 'cash' | 'tempo';
  default_tempo_days: number;
  bank_name?: string;
  bank_account_number?: string;
  bank_account_name?: string;
  created_at?: string;
}

export type CollectionStatus = 'held_by_me' | 'deposited_to_bank';

export interface CashCollection {
  id: string;
  outlet_id: string;
  collected_at: string;
  amount: number;
  source: 'pos_cash_drawer' | 'daily_sales' | 'other';
  notes?: string;
  status: CollectionStatus;
  deposited_at?: string;
  deposit_bank?: string;
  deposit_account?: string;
  proof_image_url?: string;
  created_at?: string;
  outlet?: Outlet;
}

// BATCH TRANSFER DANA BELANJA DARI LUAR
export type AdvanceFundStatus = 'active' | 'depleted' | 'closed';

export interface AdvanceFundBatch {
  id: string;
  outlet_id: string;
  sender_source: string;
  batch_name: string;
  received_at: string;
  initial_amount: number;
  remaining_amount: number;
  status: AdvanceFundStatus;
  notes?: string;
  proof_image_url?: string;
  created_at?: string;
  outlet?: Outlet;
}

export interface PurchaseItem {
  id: string;
  purchase_id?: string;
  item_name: string;
  quantity: number;
  unit: string;
  unit_price: number;
  subtotal: number;
}

export type PaymentSource = 'opening_cash' | 'personal_cash' | 'advance_transfer' | 'tempo' | 'transfer_bank';
export type TempoStatus = 'unpaid' | 'paid' | 'overdue';

export interface Purchase {
  id: string;
  outlet_id: string;
  supplier_id?: string;
  supplier_name: string;
  purchase_date: string;
  payment_source: PaymentSource;
  advance_batch_id?: string;
  total_amount: number;
  is_tempo: boolean;
  tempo_due_date?: string;
  tempo_status?: TempoStatus;
  tempo_paid_at?: string;
  tempo_payment_proof_url?: string;
  receipt_image_url?: string;
  notes?: string;
  created_at?: string;
  items: PurchaseItem[];
  outlet?: Outlet;
  supplier?: Supplier;
  advance_batch?: AdvanceFundBatch;
}

export interface CashOnHandSummary {
  outlet_id: string;
  outlet_name: string;
  threshold: number;
  total_held: number;
  is_ready_to_deposit: boolean;
  collections: CashCollection[];
}
