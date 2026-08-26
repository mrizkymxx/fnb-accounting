'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Outlet, OutletType, OutletStatus } from '@/types/database';
import { formatRupiah } from '@/lib/formatters';
import {
  X,
  Building,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  PlusCircle
} from 'lucide-react';

interface OutletManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OutletManagerModal: React.FC<OutletManagerModalProps> = ({ isOpen, onClose }) => {
  const { outlets, addOutlet, updateOutlet, deleteOutlet } = useApp();

  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [type, setType] = useState<OutletType>('cafe');
  const [threshold, setThreshold] = useState<number>(500000);
  const [status, setStatus] = useState<OutletStatus>('active');

  if (!isOpen) return null;

  const handleStartAdd = () => {
    setIsEditing(true);
    setEditingId(null);
    setName('');
    setType('cafe');
    setThreshold(500000);
    setStatus('active');
  };

  const handleStartEdit = (outlet: Outlet) => {
    setIsEditing(true);
    setEditingId(outlet.id);
    setName(outlet.name);
    setType(outlet.type);
    setThreshold(outlet.cash_deposit_threshold);
    setStatus(outlet.status);
  };

  const handleCancelForm = () => {
    setIsEditing(false);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingId) {
      await updateOutlet(editingId, {
        name: name.trim(),
        type,
        cash_deposit_threshold: Number(threshold) || 0,
        status,
      });
    } else {
      await addOutlet({
        name: name.trim(),
        type,
        cash_deposit_threshold: Number(threshold) || 0,
        status,
        color: type === 'internal' ? 'purple' : 'emerald',
      });
    }

    setIsEditing(false);
    setEditingId(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-xs overflow-y-auto">
      <div className="bg-[#FFFDF5] border-t-4 sm:border-4 border-black w-full max-w-2xl shadow-[8px_8px_0px_#121212] overflow-hidden rounded-t-2xl sm:rounded-none max-h-[94dvh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b-4 border-black bg-[#FFE600] shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-white border-2 border-black shadow-[2px_2px_0px_#121212]">
              <Building className="h-5 w-5 text-black stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-black uppercase tracking-tight">
                Kelola Data Outlet & Pos Biaya
              </h2>
              <p className="text-[11px] font-bold text-black/70">
                Tambah, edit, atau atur ambang batas setor kasir per outlet
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 border-2 border-black bg-white hover:bg-slate-100 shadow-[2px_2px_0px_#121212]"
          >
            <X className="h-5 w-5 stroke-[2.5]" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {/* Form Add / Edit */}
          {isEditing ? (
            <form onSubmit={handleSubmit} className="p-4 bg-white border-3 border-black shadow-[4px_4px_0px_#121212] space-y-3.5">
              <div className="flex items-center justify-between border-b-2 border-black pb-2">
                <h3 className="text-xs font-black text-black uppercase">
                  {editingId ? '✏️ Edit Data Outlet' : '+ Tambah Outlet / Pos Baru'}
                </h3>
              </div>

              <div>
                <label className="block text-xs font-black text-black uppercase mb-1">
                  Nama Outlet / Pos <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Staff Meals, Oklah 2, Kitchen Central"
                  className="w-full bg-[#FFFDF5] border-2 border-black p-2 text-xs sm:text-sm font-bold text-black focus:outline-none"
                  required
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[10px] font-black text-black uppercase mb-1">
                    Tipe Bisnis / Kategori
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full bg-[#FFFDF5] border-2 border-black p-2 text-xs font-bold text-black focus:outline-none"
                  >
                    <option value="cafe">Cafe</option>
                    <option value="resto">Restoran</option>
                    <option value="cafe/resto">Cafe & Resto</option>
                    <option value="internal">Pos Internal / Staff Meals</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-black uppercase mb-1">
                    Batas Setor Kasir (Rp)
                  </label>
                  <input
                    type="number"
                    step="50000"
                    min="0"
                    value={threshold}
                    onChange={(e) => setThreshold(Number(e.target.value))}
                    placeholder="0 jika non-kasir"
                    className="w-full bg-[#FFFDF5] border-2 border-black p-2 text-xs font-black text-black focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-black uppercase mb-1">
                    Status Operasional
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full bg-[#FFFDF5] border-2 border-black p-2 text-xs font-bold text-black focus:outline-none"
                  >
                    <option value="active">Active (Berjalan)</option>
                    <option value="construction">Tahap Bangun / Draft</option>
                    <option value="inactive">Non-Aktif</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="px-3.5 py-1.5 border-2 border-black bg-white text-xs font-black uppercase shadow-[1px_1px_0px_#121212]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-1.5 bg-[#00F0FF] border-2 border-black text-black text-xs font-black uppercase shadow-[2px_2px_0px_#121212] active:translate-x-[1px] active:translate-y-[1px]"
                >
                  {editingId ? 'Simpan Perubahan' : 'Buat Outlet'}
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={handleStartAdd}
              className="w-full py-3 bg-[#00F0FF] border-3 border-black text-black text-xs font-black uppercase shadow-[3px_3px_0px_#121212] active:translate-x-[1px] active:translate-y-[1px] flex items-center justify-center gap-1.5"
            >
              <PlusCircle className="h-4 w-4 stroke-[2.5]" />
              <span>+ Buat Outlet / Pos Baru</span>
            </button>
          )}

          {/* List Outlets */}
          <div className="space-y-2.5 pt-2">
            <span className="text-xs font-black text-black uppercase block">
              Daftar Outlet Terdaftar ({outlets.length}):
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {outlets.map((o) => (
                <div
                  key={o.id}
                  className="p-3 bg-white border-3 border-black shadow-[3px_3px_0px_#121212] flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-black text-black text-sm uppercase truncate">{o.name}</span>
                      <span className="text-[9px] px-1 border border-black bg-[#FFE600] font-black uppercase shrink-0">
                        {o.type}
                      </span>
                    </div>
                    <p className="text-[11px] font-bold text-black/70 mt-0.5">
                      Batas Setor: <span className="underline">{formatRupiah(o.cash_deposit_threshold)}</span>
                      {o.status === 'construction' && ' • (Draft)'}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleStartEdit(o)}
                      className="p-1.5 bg-[#00F0FF] border border-black shadow-[1px_1px_0px_#121212]"
                      title="Edit Outlet"
                    >
                      <Edit className="h-3.5 w-3.5 stroke-[2.5]" />
                    </button>

                    <button
                      onClick={() => {
                        if (confirm(`Hapus outlet ${o.name}? Semua data belanja terkait outlet ini tetap tersimpan.`)) {
                          deleteOutlet(o.id);
                        }
                      }}
                      className="p-1.5 bg-[#FF4343] text-white border border-black shadow-[1px_1px_0px_#121212]"
                      title="Hapus Outlet"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
