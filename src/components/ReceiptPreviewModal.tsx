'use client';

import React, { useState } from 'react';
import { X, ZoomIn, Download } from 'lucide-react';

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

  if (!isOpen || !imageUrl) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-none">
      <div className="bg-[#FFFDF5] border-4 border-black w-full max-w-4xl max-h-[90vh] shadow-[10px_10px_0px_#000000] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b-4 border-black bg-[#FFE600] shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-sm sm:text-base font-black text-black uppercase truncate max-w-md">
              {title}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setZoom(!zoom)}
              className="p-2 border-2 border-black bg-white hover:bg-slate-100 text-xs font-black uppercase flex items-center gap-1 shadow-[2px_2px_0px_#000000]"
              title="Perbesar / Zoom"
            >
              <ZoomIn className="h-4 w-4 stroke-[2.5]" />
              <span className="hidden sm:inline">{zoom ? 'Reset' : 'Zoom'}</span>
            </button>

            <a
              href={imageUrl}
              download="nota_bukti.png"
              target="_blank"
              rel="noreferrer"
              className="p-2 border-2 border-black bg-white hover:bg-slate-100 shadow-[2px_2px_0px_#000000]"
              title="Unduh Gambar Asli"
            >
              <Download className="h-4 w-4 stroke-[2.5]" />
            </a>

            <button
              onClick={onClose}
              className="p-2 border-2 border-black bg-[#FF5757] text-white shadow-[2px_2px_0px_#000000]"
            >
              <X className="h-5 w-5 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* Image Container */}
        <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-white min-h-[300px]">
          <img
            src={imageUrl}
            alt="Bukti Nota"
            className={`border-3 border-black shadow-[4px_4px_0px_#000000] object-contain transition-all duration-300 ${
              zoom ? 'max-w-none w-auto cursor-zoom-out' : 'max-h-[70vh] w-auto cursor-zoom-in'
            }`}
            onClick={() => setZoom(!zoom)}
          />
        </div>
      </div>
    </div>
  );
};
