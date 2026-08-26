import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = {
  width: 180,
  height: 180,
};
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#121212',
          position: 'relative',
        }}
      >
        {/* Yellow Accent Inner Card */}
        <div
          style={{
            width: 144,
            height: 144,
            background: '#FFE600',
            borderRadius: 32,
            border: '6px solid #FFFFFF',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            boxShadow: '0 8px 0 #000000',
          }}
        >
          {/* Stylized Modern Vector Receipt & Fork Symbol */}
          <svg
            width="80"
            height="80"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#121212"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {/* Receipt Outline */}
            <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" fill="#FFFFFF" />
            {/* Currency / Accounting Check Lines */}
            <path d="M8 7h8" strokeWidth="2.5" />
            <path d="M8 11h8" strokeWidth="2.5" />
            <path d="M8 15h5" strokeWidth="2.5" />
            {/* Accent Dot */}
            <circle cx="16" cy="15" r="1.5" fill="#FF4343" stroke="#FF4343" />
          </svg>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
