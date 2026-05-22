import Script from 'next/script'

/** Google Ads global site tag — must load from this ID for Ads verification. */
export const GOOGLE_ADS_ID =
  process.env.NEXT_PUBLIC_GOOGLE_ADS_ID ?? 'AW-16548808937'

/** Homepage conversion label from Google Ads. */
export const GOOGLE_ADS_HOME_CONVERSION =
  process.env.NEXT_PUBLIC_GOOGLE_ADS_HOME_CONVERSION ??
  'AW-16548808937/faA3CKXP7K0ZEOmRi9M9'

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

/**
 * Google tag (gtag.js) in <head> on every page, per Google Ads setup instructions.
 * Uses AW-* in the script URL so Google Tag Assistant can detect the tag.
 */
export function GoogleAdsTag() {
  const gaConfig = GA_ID
    ? `
gtag('config', '${GA_ID}', {
  send_page_view: true,
  anonymize_ip: true,
  cookie_flags: 'SameSite=None;Secure'
});`
    : ''

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ADS_ID}`}
        strategy="beforeInteractive"
      />
      <Script id="google-ads-gtag" strategy="beforeInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GOOGLE_ADS_ID}');${gaConfig}`}
      </Script>
    </>
  )
}

/** Homepage conversion event — place after the global Google tag. */
export function GoogleAdsHomeConversion() {
  return (
    <Script id="google-ads-home-conversion" strategy="afterInteractive">
      {`gtag('event', 'conversion', {'send_to': '${GOOGLE_ADS_HOME_CONVERSION}'});`}
    </Script>
  )
}
