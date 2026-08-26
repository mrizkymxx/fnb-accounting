'use client';

import React, { useState } from 'react';
import { Store, Lock, KeyRound, ArrowRight, Eye, EyeOff, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

interface LoginScreenProps {
  onSuccess: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onSuccess }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (password === 'tamparhiu12') {
      setError(false);
      localStorage.setItem('fnb_auth_session', 'authenticated');

      try {
        confetti({
          particleCount: 60,
          spread: 60,
          origin: { y: 0.6 }
        });
      } catch {}

      onSuccess();
    } else {
      setError(true);
      setErrorMessage('Password salah! Akses ditolak.');
      setPassword('');
    }
  };

  return (
    <div className="min-h-screen bg-[#FCFAF2] bg-[radial-gradient(#121212_1px,transparent_1px)] [background-size:16px_16px] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border-4 border-black shadow-[6px_6px_0px_#121212] p-6 sm:p-8 space-y-6">
        {/* Logo & Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-14 w-14 bg-[#FF4343] border-3 border-black items-center justify-center shadow-[3px_3px_0px_#121212] mb-1">
            <Store className="h-8 w-8 text-black stroke-[2.5]" />
          </div>
          <h1 className="text-2xl font-black text-black uppercase tracking-tight">
            FnB ACCOUNTIQ
          </h1>
          <p className="text-xs font-bold text-black/70">
            Sistem Operasional & Purchasing Oklah • Prima Sushi • Rovu
          </p>
        </div>

        {/* Badge Security */}
        <div className="bg-[#FFE600] border-2 border-black p-2.5 text-center shadow-[2px_2px_0px_#121212]">
          <div className="flex items-center justify-center gap-1.5 text-xs font-black text-black uppercase">
            <Lock className="h-3.5 w-3.5 stroke-[2.5]" />
            <span>Akses Terkunci • Masukkan Password</span>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-[#FF4343] text-white border-2 border-black p-2.5 text-xs font-black uppercase shadow-[2px_2px_0px_#121212] flex items-center gap-2 animate-bounce">
            <AlertCircle className="h-4 w-4 stroke-[2.5] shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-black text-black uppercase mb-1.5">
              Password Akses
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(false);
                }}
                placeholder="Ketik password..."
                className="w-full bg-[#FFFDF5] border-3 border-black p-3 text-sm font-bold text-black shadow-[3px_3px_0px_#121212] focus:outline-none pr-10"
                autoFocus
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3.5 text-black/60 hover:text-black"
                title={showPassword ? 'Sembunyikan' : 'Tampilkan'}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 stroke-[2.5]" />
                ) : (
                  <Eye className="h-4 w-4 stroke-[2.5]" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-[#00F0FF] border-3 border-black text-black font-black text-sm uppercase shadow-[4px_4px_0px_#121212] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center gap-2"
          >
            <span>Buka Aplikasi</span>
            <ArrowRight className="h-4 w-4 stroke-[2.5]" />
          </button>
        </form>

        <div className="text-center pt-2 border-t-2 border-black/10">
          <span className="text-[10px] font-bold text-black/50 uppercase">
            Private Dashboard • Multi-Outlet FnB
          </span>
        </div>
      </div>
    </div>
  );
};
