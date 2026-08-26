import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = {
  width: 192,
  height: 192,
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
        <div
          style={{
            width: 154,
            height: 154,
            background: '#FFE600',
            borderRadius: 36,
            border: '6px solid #FFFFFF',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          <svg
            width="86"
            height="86"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#121212"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" fill="#FFFFFF" />
            <path d="M8 7h8" strokeWidth="2.5" />
            <path d="M8 11h8" strokeWidth="2.5" />
            <path d="M8 15h5" strokeWidth="2.5" />
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
