import { useEffect } from 'react'
import Script from 'next/script'
import { useRouter } from 'next/router'
import { useAuth } from 'src/authentication/useAuth'

const GTAG_ID = process.env.NEXT_PUBLIC_GTAG_ID
const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID
const GTAG_CONVERSION_SEND_TO = process.env.NEXT_PUBLIC_GTAG_CONVERSION_SEND_TO

// TODO: replace with an actual cookie-consent check when consent management is implemented.
const hasConsent = true

const conversionFlagKey = userId => `gendoxAnalyticsRegistration:${userId}`

const OptionalAnalyticsTracking = () => {
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!hasConsent) return
    if (!user) return

    // Most page loads are not create-organization — exit immediately.
    if (router.pathname !== '/gendox/create-organization') return

    // Cleanup: once the user has an organization, the flag is no longer needed.
    if (user.organizations && user.organizations.length > 0) {
      window.localStorage.removeItem(conversionFlagKey(user.id))
      return
    }

    // Fire conversion when the user lands on create-organization with no organizations.
    // This detects the completed self-signup flow.
    //
    // Note: users who were invited to an existing organization already have an org on
    // first login, so they never reach this page and are not counted here.
    // Tracking their first login is a future task.
    const flagKey = conversionFlagKey(user.id)
    if (window.localStorage.getItem(flagKey)) return

    if (GTAG_CONVERSION_SEND_TO && typeof window.gtag === 'function') {
      window.gtag('event', 'conversion', { send_to: GTAG_CONVERSION_SEND_TO })
    }
    if (META_PIXEL_ID && typeof window.fbq === 'function') {
      window.fbq('track', 'CompleteRegistration')
    }

    window.localStorage.setItem(flagKey, 'true')
  }, [user, router.pathname])

  if (!hasConsent) return null

  return (
    <>
      {GTAG_ID && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GTAG_ID}`}
            strategy='afterInteractive'
          />
          <Script id='gtag-init' strategy='afterInteractive'>{`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GTAG_ID}');
          `}</Script>
        </>
      )}

      {META_PIXEL_ID && (
        <Script id='meta-pixel' strategy='afterInteractive'>{`
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
