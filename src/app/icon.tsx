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
          fontSize: 92,
          background: '#FFE600',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '10px solid #121212',
          fontWeight: 900,
          color: '#121212',
        }}
      >
        🏪
      </div>
    ),
    {
      ...size,
    }
  );
}
