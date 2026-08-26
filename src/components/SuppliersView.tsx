'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Supplier } from '@/types/database';
import { exportSuppliersCSV } from '@/lib/exportUtils';
import {
  PlusCircle,
  Phone,
  MapPin,
  X,
  Edit,
  Trash2,
  FileSpreadsheet
} from 'lucide-react';

export const SuppliersView: React.FC = () => {
  const { suppliers, addSupplier, updateSupplier, deleteSupplier } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  const [name, setName] = useState('');
  const [category, setCategory] = useState('Bahan Baku Utama');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [paymentTerms, setPaymentTerms] = useState<'cash' | 'tempo'>('tempo');
  const [defaultTempoDays, setDefaultTempoDays] = useState(14);
  const [bankName, setBankName] = useState('BCA');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankAccountName, setBankAccountName] = useState('');

  const handleOpenAdd = () => {
    setEditingSupplier(null);
    setName('');
    setCategory('Bahan Baku Utama');
    setPhone('');
    setAddress('');
    setPaymentTerms('tempo');
    setDefaultTempoDays(14);
    setBankName('BCA');
    setBankAccountNumber('');
    setBankAccountName('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (s: Supplier) => {
    setEditingSupplier(s);
    setName(s.name);
    setCategory(s.category || 'Bahan Baku');
    setPhone(s.phone || '');
    setAddress(s.address || '');
    setPaymentTerms(s.payment_terms);
    setDefaultTempoDays(s.default_tempo_days || 14);
    setBankName(s.bank_name || 'BCA');
    setBankAccountNumber(s.bank_account_number || '');
    setBankAccountName(s.bank_account_name || '');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const payload = {
      name: name.trim(),
      category: category.trim(),
      phone: phone.trim() || undefined,
      address: address.trim() || undefined,
      payment_terms: paymentTerms,
      default_tempo_days: paymentTerms === 'tempo' ? defaultTempoDays : 0,
      bank_name: bankName.trim() || undefined,
      bank_account_number: bankAccountNumber.trim() || undefined,
      bank_account_name: bankAccountName.trim() || undefined,
    };

    if (editingSupplier) {
      await updateSupplier(editingSupplier.id, payload);
    } else {
      await addSupplier(payload);
    }

    setIsModalOpen(false);
    setEditingSupplier(null);
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-20 sm:pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-6 border-3 sm:border-4 border-black shadow-[3px_3px_0px_#121212] sm:shadow-[5px_5px_0px_#121212]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-2xl font-black text-black uppercase tracking-tight">
              Master Data Supplier & Toko
            </h1>
            <span className="px-2 py-0.5 bg-[#00F0FF] border-2 border-black text-black text-[10px] sm:text-xs font-black uppercase">
              {suppliers.length} Supplier
            </span>
          </div>
          <p className="text-xs sm:text-sm font-bold text-black/70 mt-1">
            Daftar toko andalan untuk Oklah & Prima Sushi beserta data rekening bank & tempo.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => exportSuppliersCSV(suppliers)}
            className="px-3 py-2 bg-white border-2 border-black text-black text-xs font-black uppercase shadow-[2px_2px_0px_#121212] hover:bg-slate-50 flex items-center gap-1.5 active:translate-x-[1px] active:translate-y-[1px]"
            title="Export CSV Excel"
          >
            <FileSpreadsheet className="h-4 w-4 stroke-[2.5]" />
            <span>Export</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="px-3.5 sm:px-4 py-2 bg-[#00F0FF] border-3 border-black text-black text-xs font-black uppercase shadow-[3px_3px_0px_#121212] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all flex items-center justify-center gap-1.5"
          >
            <PlusCircle className="h-4 w-4 stroke-[2.5]" />
            <span>+ Supplier</span>
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {suppliers.map((s) => (
          <div
            key={s.id}
            className="p-4 sm:p-5 bg-white border-3 border-black shadow-[3px_3px_0px_#121212] flex flex-col justify-between space-y-3"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-black text-black text-base uppercase">{s.name}</h3>
                <span
                  className={`text-[9px] sm:text-[10px] px-2 py-0.5 border border-black font-black uppercase ${
                    s.payment_terms === 'tempo'
                      ? 'bg-[#FFE600] text-black'
                      : 'bg-white text-black'
                  }`}
                >
                  {s.payment_terms === 'tempo' ? `Tempo ${s.default_tempo_days} Hari` : 'Cash'}
                </span>
              </div>
              <p className="text-xs font-black text-black/80 mt-0.5 uppercase underline">{s.category}</p>

              <div className="space-y-1 mt-3 text-xs font-bold text-black/80">
                {s.phone && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 stroke-[2.5]" />
                    <span>{s.phone}</span>
                  </div>
                )}
                {s.address && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 stroke-[2.5]" />
                    <span className="truncate">{s.address}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t-2 border-black/10">
              {s.bank_account_number && (
                <div className="p-2 bg-[#FFFDF5] border border-black text-xs">
                  <div className="text-[9px] font-black uppercase text-black/70">
                    Info Rekening Bank
                  </div>
                  <div className="font-black text-black">
                    {s.bank_name} - {s.bank_account_number}
                  </div>
                  {s.bank_account_name && (
                    <div className="text-black/80 text-[10px] font-bold">a.n {s.bank_account_name}</div>
                  )}
                </div>
              )}

              {/* Action Edit & Hapus */}
              <div className="flex items-center justify-end gap-1.5 pt-1">
                <button
                  onClick={() => handleOpenEdit(s)}
                  className="px-2.5 py-1.5 bg-[#00F0FF] border-2 border-black text-xs font-black uppercase shadow-[1px_1px_0px_#121212] active:translate-x-[1px] active:translate-y-[1px] flex items-center gap-1"
                >
                  <Edit className="h-3.5 w-3.5 stroke-[2.5]" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Hapus supplier ${s.name}?`)) {
                      deleteSupplier(s.id);
                    }
                  }}
                  className="px-2.5 py-1.5 bg-[#FF4343] text-white border-2 border-black text-xs font-black uppercase shadow-[1px_1px_0px_#121212] active:translate-x-[1px] active:translate-y-[1px] flex items-center gap-1"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Hapus</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Tambah / Edit Supplier */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-[#FFFDF5] border-t-4 sm:border-4 border-black w-full max-w-lg shadow-[8px_8px_0px_#121212] overflow-hidden rounded-t-2xl sm:rounded-none">
            <div className="flex items-center justify-between p-3.5 sm:p-4 border-b-4 border-black bg-[#FFE600]">
              <h2 className="text-sm sm:text-base font-black text-black uppercase">
                {editingSupplier ? '✏️ Edit Supplier' : 'Tambah Supplier Baru'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 border-2 border-black bg-white hover:bg-slate-100 shadow-[2px_2px_0px_#121212]"
              >
                <X className="h-5 w-5 stroke-[2.5]" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-3.5">
              <div>
                <label className="block text-xs font-black text-black uppercase mb-1">
                  Nama Supplier / Toko <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Toko Berkah Sembako"
                  className="w-full bg-white border-3 border-black p-2 text-xs sm:text-sm font-bold text-black focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-black text-black uppercase mb-1">
                    Kategori Bahan
                  </label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="Sembako / Sayur / Kopi"
                    className="w-full bg-white border-2 border-black p-1.5 text-xs font-bold text-black focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black text-black uppercase mb-1">
                    No. WhatsApp / HP
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="08123xxx"
                    className="w-full bg-white border-2 border-black p-1.5 text-xs font-bold text-black focus:outline-none"
                  />
                </div>
              </div>

              {/* Ketentuan */}
              <div className="p-2.5 bg-white border-2 border-black space-y-2">
                <label className="block text-xs font-black text-black uppercase">
                  Ketentuan Pembayaran
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-black cursor-pointer">
                    <input
                      type="radio"
                      name="terms"
                      value="tempo"
                      checked={paymentTerms === 'tempo'}
                      onChange={() => setPaymentTerms('tempo')}
                      className="accent-black"
                    />
                    <span>Sistem Tempo</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-black cursor-pointer">
                    <input
                      type="radio"
                      name="terms"
                      value="cash"
                      checked={paymentTerms === 'cash'}
                      onChange={() => setPaymentTerms('cash')}
                      className="accent-black"
                    />
                    <span>Cash Langsung</span>
                  </label>
                </div>

                {paymentTerms === 'tempo' && (
                  <div>
                    <label className="block text-[10px] font-black text-black uppercase mb-0.5">
                      Default Durasi Tempo (Hari)
                    </label>
                    <input
                      type="number"
                      value={defaultTempoDays}
                      onChange={(e) => setDefaultTempoDays(Number(e.target.value))}
                      className="w-full bg-[#FFFDF5] border-2 border-black p-1 text-xs font-bold text-black"
                    />
                  </div>
                )}
              </div>

              {/* Rekening */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-black text-black uppercase mb-0.5">
                    Bank
                  </label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="BCA"
                    className="w-full bg-white border-2 border-black p-1 text-xs font-bold text-black"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-black text-black uppercase mb-0.5">
                    No. Rekening
                  </label>
                  <input
                    type="text"
                    value={bankAccountNumber}
                    onChange={(e) => setBankAccountNumber(e.target.value)}
                    placeholder="1234567890"
                    className="w-full bg-white border-2 border-black p-1 text-xs font-bold text-black"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t-3 border-black">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border-2 border-black bg-white text-xs font-black uppercase"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 border-3 border-black bg-[#00F0FF] text-black font-black text-xs uppercase shadow-[2px_2px_0px_#121212] active:translate-x-[1px] active:translate-y-[1px]"
                >
                  {editingSupplier ? 'Simpan Perubahan' : 'Simpan Supplier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
