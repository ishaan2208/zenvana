import { ImageResponse } from 'next/og'
import { getPublicPropertyBySlug } from '@/lib/api'
import { pickHeroAndGallery } from '@/lib/media'

export const runtime = 'nodejs'
export const alt = 'Zenvana Hotels property'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function PropertyOgImage({ params }: { params: { slug: string } }) {
  const property = await getPublicPropertyBySlug(params.slug)
  const heroUrl = property ? pickHeroAndGallery(property.images).heroUrl : undefined
  const name = property?.publicName ?? 'Zenvana Hotels'
  const location = property
    ? [property.city, property.state].filter(Boolean).join(', ') || 'Dehradun'
    : 'Rajpur Road, Dehradun'
  const description =
    property?.descriptionShort ??
    'A thoughtful boutique stay in Dehradun. Book direct for the best rate.'

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          position: 'relative',
          background: '#001F3F',
          color: '#F6F7ED',
          fontFamily: 'serif',
        }}
      >
        {heroUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={heroUrl}
            alt=""
            width={1200}
            height={630}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        ) : null}

        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(180deg, rgba(0,31,63,0.45) 0%, rgba(0,31,63,0.78) 70%, rgba(0,31,63,0.94) 100%)',
            display: 'flex',
          }}
        />

        <div
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: 72,
            width: '100%',
            height: '100%',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              fontSize: 24,
              letterSpacing: 8,
              textTransform: 'uppercase',
              color: '#DBE64C',
              fontFamily: 'sans-serif',
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: '#001F3F',
                border: '2px solid #DBE64C',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 30,
                fontWeight: 700,
                color: '#DBE64C',
              }}
            >
              Z
            </div>
            <span>Zenvana Hotels</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div
              style={{
                fontSize: 96,
                lineHeight: 0.95,
                letterSpacing: -4,
                maxWidth: 1040,
                fontWeight: 600,
              }}
            >
              {name}
            </div>
            <div
              style={{
                fontSize: 30,
                color: 'rgba(246,247,237,0.86)',
                fontFamily: 'sans-serif',
                maxWidth: 920,
              }}
            >
              {description}
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: 22,
              color: '#DBE64C',
              fontFamily: 'sans-serif',
            }}
          >
            <span>{location}</span>
            <span style={{ color: 'rgba(246,247,237,0.7)' }}>Book direct · zenvanahotels.com</span>
          </div>
        </div>
      </div>
    ),
    { ...size },
  )
}
