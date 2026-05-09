import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Zenvana Hotels — boutique stays on Rajpur Road, Dehradun'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 80,
          background:
            'linear-gradient(135deg, #001F3F 0%, #1E488F 55%, #00804C 100%)',
          color: '#F6F7ED',
          fontFamily: 'serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            fontSize: 28,
            letterSpacing: 8,
            textTransform: 'uppercase',
            color: '#DBE64C',
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: '#001F3F',
              border: '2px solid #DBE64C',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 36,
              fontWeight: 700,
              color: '#DBE64C',
            }}
          >
            Z
          </div>
          <span>Zenvana Hotels</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div
            style={{
              fontSize: 84,
              lineHeight: 1.02,
              letterSpacing: -3,
              maxWidth: 980,
              fontWeight: 600,
            }}
          >
            A quieter way to stay in Dehradun.
          </div>
          <div
            style={{
              fontSize: 30,
              lineHeight: 1.4,
              maxWidth: 880,
              color: 'rgba(246,247,237,0.82)',
              fontFamily: 'sans-serif',
            }}
          >
            Boutique hotels on Rajpur Road. Owner-operated. Book direct for the best rate.
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            fontSize: 22,
            color: 'rgba(246,247,237,0.7)',
            fontFamily: 'sans-serif',
          }}
        >
          <span>zenvanahotels.com</span>
          <span style={{ color: '#DBE64C' }}>Rajpur Road · Dehradun</span>
        </div>
      </div>
    ),
    { ...size },
  )
}
