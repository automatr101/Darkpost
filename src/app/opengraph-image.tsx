import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Darkpost'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#131313',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ fontSize: 128 }}>👻</div>
        <div style={{ fontSize: 80, marginTop: 40, color: '#F0ECE3', fontWeight: 800 }}>DARKPOST</div>
        <div style={{ fontSize: 32, marginTop: 20, color: '#ff535b', fontWeight: 500, letterSpacing: '2px' }}>THE ECHO ARCHIVE</div>
      </div>
    ),
    { ...size }
  )
}
