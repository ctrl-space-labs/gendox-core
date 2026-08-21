import { useEffect, useState } from 'react'
import Script from 'next/script'
import { useRouter } from 'next/router'
import { useAuth } from 'src/authentication/useAuth'

const GTAG_ID = process.env.NEXT_PUBLIC_GTAG_ID
const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID
const GTAG_CONVERSION_SEND_TO = process.env.NEXT_PUBLIC_GTAG_CONVERSION_SEND_TO
const GTAG_LINKER_DOMAINS = (process.env.NEXT_PUBLIC_GTAG_LINKER_DOMAINS || '')
  .split(',')
  .map(domain => domain.trim())
  .filter(Boolean)

const CREATE_ORGANIZATION_PATH = '/gendox/create-organization'
const CONSENT_UPDATED_EVENT = 'gendox:consent-updated'

const CONSENT_DENIED = 'denied'
const CONSENT_GRANTED = 'granted'

const DEFAULT_CONSENT = {
  ad_storage: CONSENT_DENIED,
  analytics_storage: CONSENT_DENIED,
  ad_user_data: CONSENT_DENIED,
  ad_personalization: CONSENT_DENIED
}

// ConsentMagic Pro cookies on .gendox.dev (shared with app.gendox.dev).
const CONSENT_COOKIE_ANALYTICS = 'cs_enabled_cookie_term_67'
const CONSENT_COOKIE_MARKETING = 'cs_enabled_cookie_term_68'
const CONSENT_COOKIE_VIEWED = 'cs_viewed_cookie_policy'

const getCookie = name => {
  if (typeof document === 'undefined') return null
  const prefix = `${name}=`
  const row = document.cookie.split('; ').find(value => value.startsWith(prefix))
  return row ? row.slice(prefix.length) : null
}

/**
 * Reads ConsentMagic Pro cookies set on .gendox.dev.
 * - cs_enabled_cookie_term_67: Analytics (yes/no)
 * - cs_enabled_cookie_term_68: Marketing (yes/no)
 * - cs_viewed_cookie_policy: present when the user has submitted a choice
 *
 * If the user has not submitted a choice yet, all fields stay denied.
 * To re-apply after a mid-session change, dispatch:
 *   window.dispatchEvent(new Event('gendox:consent-updated'))
 */
const readConsent = () => {
  const viewed = getCookie(CONSENT_COOKIE_VIEWED)
  const analyticsRaw = getCookie(CONSENT_COOKIE_ANALYTICS)
  const marketingRaw = getCookie(CONSENT_COOKIE_MARKETING)

  // Temporary: remove after confirming cookies are readable on .gendox.dev subdomains.
  console.log('[OptionalAnalyticsTracking] ConsentMagic cookies', {
    [CONSENT_COOKIE_VIEWED]: viewed,
    [CONSENT_COOKIE_ANALYTICS]: analyticsRaw,
    [CONSENT_COOKIE_MARKETING]: marketingRaw,
    documentCookie: typeof document !== 'undefined' ? document.cookie : null
  })

  if (!viewed) return DEFAULT_CONSENT

  const analyticsGranted = analyticsRaw === 'yes'
  const marketingGranted = marketingRaw === 'yes'

  const nextConsent = {
    analytics_storage: analyticsGranted ? CONSENT_GRANTED : CONSENT_DENIED,
    ad_storage: marketingGranted ? CONSENT_GRANTED : CONSENT_DENIED,
    ad_user_data: marketingGranted ? CONSENT_GRANTED : CONSENT_DENIED,
    ad_personalization: marketingGranted ? CONSENT_GRANTED : CONSENT_DENIED
  }

  // Temporary: remove after confirming consent mapping on deploy.
  console.log('[OptionalAnalyticsTracking] Mapped consent', nextConsent)

  return nextConsent
}

const hasMarketingConsent = consent =>
  consent.ad_storage === CONSENT_GRANTED &&
  consent.ad_user_data === CONSENT_GRANTED &&
  consent.ad_personalization === CONSENT_GRANTED

const pushConsentToGtag = consent => {
  if (typeof window.gtag !== 'function') return
  window.gtag('consent', 'update', consent)
}

const conversionFlagKey = (channel, userId) => `gendoxAnalyticsRegistration${channel}:${userId}`

const fireGoogleConversionIfAllowed = userId => {
  if (!GTAG_CONVERSION_SEND_TO || typeof window.gtag !== 'function') return false

  const flagKey = conversionFlagKey('Google', userId)
  if (window.localStorage.getItem(flagKey)) return false

  // Independent of consent: Consent Mode already handles cookie-backed vs
  // cookieless (modeled) conversions. Skipping this call would lose the
  // signup permanently instead of degrading gracefully.
  window.gtag('event', 'conversion', {
    send_to: GTAG_CONVERSION_SEND_TO,
    transaction_id: `signup_${userId}`
  })
  window.localStorage.setItem(flagKey, 'true')
  return true
}

const fireMetaConversionIfAllowed = (userId, marketingConsent) => {
  if (!marketingConsent || !META_PIXEL_ID || typeof window.fbq !== 'function') return false

  const flagKey = conversionFlagKey('Meta', userId)
  if (window.localStorage.getItem(flagKey)) return false

  window.fbq('track', 'CompleteRegistration')
  window.localStorage.setItem(flagKey, 'true')
  return true
}

const clearConversionFlags = userId => {
  window.localStorage.removeItem(conversionFlagKey('Google', userId))
  window.localStorage.removeItem(conversionFlagKey('Meta', userId))
}

const OptionalAnalyticsTracking = () => {
  const { user } = useAuth()
  const router = useRouter()
  const [consent, setConsent] = useState(DEFAULT_CONSENT)
  // Scripts load asynchronously (strategy="afterInteractive"), so gtag/fbq may not
  // exist yet the first time the conversion effect runs. These flip to true via
  // each Script's onLoad and re-trigger the effect below.
  const [gtagReady, setGtagReady] = useState(false)
  const [metaReady, setMetaReady] = useState(false)
  const marketingConsent = hasMarketingConsent(consent)

  // Read consent once on mount, and again whenever a CMP reports a change.
  useEffect(() => {
    const applyConsent = () => {
      const nextConsent = readConsent()
      setConsent(nextConsent)
      pushConsentToGtag(nextConsent)
    }

    applyConsent()
    window.addEventListener(CONSENT_UPDATED_EVENT, applyConsent)
    return () => window.removeEventListener(CONSENT_UPDATED_EVENT, applyConsent)
  }, [])

  // Fire the signup conversion exactly once per user, per channel.
  useEffect(() => {
    if (!user) return

    // Most page loads are not create-organization — exit immediately without touching
    // localStorage or organizations.
    if (router.pathname !== CREATE_ORGANIZATION_PATH) return

    // Users invited to an existing organization already have one on first
    // login, so they never reach this page and are not counted here.
    // Tracking their first login is a future task.
    const hasOrganizations = user.organizations && user.organizations.length > 0
    if (hasOrganizations) {
      clearConversionFlags(user.id)
      return
    }

    fireGoogleConversionIfAllowed(user.id)
    fireMetaConversionIfAllowed(user.id, marketingConsent)
  }, [user, router.pathname, marketingConsent, gtagReady, metaReady])

  return (
    <>
      {GTAG_ID && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${GTAG_ID}`} strategy='afterInteractive' />
          <Script
            id='gtag-init'
            strategy='afterInteractive'
            onLoad={() => {
              pushConsentToGtag(readConsent())
              setGtagReady(true)
            }}
          >{`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('consent', 'default', {
              ad_storage: '${CONSENT_DENIED}',
              analytics_storage: '${CONSENT_DENIED}',
              ad_user_data: '${CONSENT_DENIED}',
              ad_personalization: '${CONSENT_DENIED}',
              wait_for_update: 500
            });
            ${
              GTAG_LINKER_DOMAINS.length
                ? `gtag('set', 'linker', {
              domains: ${JSON.stringify(GTAG_LINKER_DOMAINS)},
              accept_incoming: true
            });`
                : ''
            }
            gtag('js', new Date());
            gtag('config', '${GTAG_ID}');
          `}</Script>
        </>
      )}

      {marketingConsent && META_PIXEL_ID && (
        <Script id='meta-pixel' strategy='afterInteractive' onLoad={() => setMetaReady(true)}>{`
          !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
          n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
          document,'script','https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${META_PIXEL_ID}');
          fbq('track', 'PageView');
        `}</Script>
      )}
    </>
  )
}

export default OptionalAnalyticsTracking
