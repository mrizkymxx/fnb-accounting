# 💰 FNB Accounting

Sistem pembukuan & pengeluaran untuk bisnis F&B (multi-outlet) — pembelian, kas, supplier, dan rekonsiliasi kasir.

## ✨ Fitur

- 🏪 **Multi-outlet** — data dikelola per cabang/outlet
- 🧾 **Pembelian** — input item belanja + total struk, upload bukti transfer bank
- 📸 **AI OCR struk** — pemindaian struk otomatis, simpan langsung ke CDN storage
- 💵 **Dompet dual-pocket** — pisah kas fisik & rekening (M-Banking)
- 🧾 **Rekap harian kasir** — cash settlement per shift
- 🏦 **Kas & transfer** — pengeluaran, koleksi kas, batch advance fund
- 🤝 **Supplier** — master data pemasok

## 🛠️ Tech Stack

- **Framework:** Next.js (App Router) + TypeScript
- **UI:** Tailwind CSS, shadcn/ui
- **Backend/DB:** Supabase (PostgreSQL), schema di `supabase_schema.sql`
- **Deployment:** Vercel

## 📁 Struktur Database

`outlets`, `suppliers`, `purchases`, `purchase_items`, `cash_collections`, `advance_fund_batches`