'use client';

import React, { useState, useEffect } from 'react';
import { X, ZoomIn, Download, RotateCw, AlertCircle } from 'lucide-react';

interface ReceiptPreviewModalProps {
  isOpen: boolean;
  imageUrl: string | null;
  title?: string;
  onClose: () => void;
}

export const ReceiptPreviewModal: React.FC<ReceiptPreviewModalProps> = ({
  isOpen,
  imageUrl,
  title = 'Foto Bukti Nota Fisik',
  onClose,
}) => {
  const [zoom, setZoom] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setZoom(false);
      setRotation(0);
      setIsError(false);
    }
  }, [isOpen, imageUrl]);

  // Keyboard shortcut: Escape to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !imageUrl) return null;

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs cursor-pointer"
      onClick={onClose}
    >
      <div
        className="bg-[#FFFDF5] border-4 border-black w-full max-w-4xl max-h-[90vh] shadow-[10px_10px_0px_#000000] overflow-hidden flex flex-col cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b-4 border-black bg-[#FFE600] shrink-0">
          <div className="flex items-center gap-2 min-w-0 pr-2">
            <span className="text-xs sm:text-base font-black text-black uppercase truncate">
              {title}
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              onClick={handleRotate}
              className="p-1.5 sm:p-2 border-2 border-black bg-white hover:bg-slate-100 text-xs font-black uppercase flex items-center gap-1 shadow-[2px_2px_0px_#000000] active:translate-x-[1px] active:translate-y-[1px]"
              title="Putar / Rotate 90°"
            >
              <RotateCw className="h-4 w-4 stroke-[2.5]" />
              <span className="hidden sm:inline">Putar</span>
            </button>

            <button
              onClick={() => setZoom(!zoom)}
              className="p-1.5 sm:p-2 border-2 border-black bg-white hover:bg-slate-100 text-xs font-black uppercase flex items-center gap-1 shadow-[2px_2px_0px_#000000] active:translate-x-[1px] active:translate-y-[1px]"
              title="Perbesar / Zoom"
            >
              <ZoomIn className="h-4 w-4 stroke-[2.5]" />
              <span className="hidden sm:inline">{zoom ? 'Reset' : 'Zoom'}</span>
            </button>

            <a
              href={imageUrl}
              download="nota_bukti.jpg"
              target="_blank"
              rel="noreferrer"
              className="p-1.5 sm:p-2 border-2 border-black bg-white hover:bg-slate-100 shadow-[2px_2px_0px_#000000]"
              title="Unduh Gambar Asli"
            >
              <Download className="h-4 w-4 stroke-[2.5]" />
            </a>

            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 border-2 border-black bg-[#FF5757] text-white shadow-[2px_2px_0px_#000000] active:translate-x-[1px] active:translate-y-[1px]"
            >
              <X className="h-5 w-5 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* Image Container */}
        <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-900 min-h-[300px]">
          {isError ? (
            <div className="p-6 text-center bg-white border-3 border-black text-black">
              <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
              <p className="text-sm font-black">Gambar tidak dapat dimuat</p>
              <p className="text-xs text-black/70 mt-1">Tautan atau file nota mungkin telah kedaluwarsa.</p>
            </div>
          ) : (
            <img
              src={imageUrl}
              alt="Bukti Nota"
              onError={() => setIsError(true)}
              style={{ transform: `rotate(${rotation}deg)` }}
              className={`border-3 border-black shadow-[4px_4px_0px_#000000] object-contain transition-all duration-200 ${
                zoom ? 'max-w-none w-auto cursor-zoom-out' : 'max-h-[70vh] w-auto cursor-zoom-in'
              }`}
              onClick={() => setZoom(!zoom)}
            />
          )}
        </div>
      </div>
    </div>
  );
};
