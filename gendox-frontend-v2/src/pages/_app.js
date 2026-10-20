import Head from 'next/head'
import { Provider } from 'react-redux'

// Design tokens first, then the components that use them
import 'src/styles/themes.css'
import 'src/styles/base.css'
import 'src/styles/app.css'

import { store } from 'src/store'
import RouteHandler from 'src/authentication/components/RouteHandler'
import OrganizationProjectGuard from 'src/authentication/components/OrganizationProjectGuard'
import { AuthProvider } from 'src/authentication/context/AuthContext'
import { IFrameMessageManagerProvider } from 'src/authentication/context/IFrameMessageManagerContext'
import { registerAxiosInterceptors } from 'src/configs/axiosInterceptors'
import Toasts from 'src/components/ui/Toasts'
import RouteProgress from 'src/components/ui/RouteProgress'
import OptionalAnalyticsTracking from 'src/components/analytics/OptionalAnalyticsTracking'

// Register the global 401 -> '/' redirect interceptor once for the whole app
registerAxiosInterceptors()

const App = props => {
  const { Component, pageProps } = props

  const getLayout = Component.getLayout ?? (page => page)
  const pageConfig = Component.pageConfig ?? undefined
  const routeType = pageConfig?.routeType ?? 'private'
  // By default it is PKCE, for /embed pages it is IFrameAuthProvider
  const authProviderOption = pageConfig?.authProviderOption ?? 'PKCEAuthProvider'

  return (
    <Provider store={store}>
      <Head>
        <title>Gendox</title>
        <meta name='viewport' content='initial-scale=1, width=device-width' />
      </Head>

      <IFrameMessageManagerProvider>
        <AuthProvider option={authProviderOption}>
          {(process.env.NEXT_PUBLIC_GTAG_ID || process.env.NEXT_PUBLIC_META_PIXEL_ID) && <OptionalAnalyticsTracking />}
          <OrganizationProjectGuard authProviderOption={authProviderOption} pageConfig={pageConfig}>
            <RouteHandler routeType={routeType}>{getLayout(<Component {...pageProps} />)}</RouteHandler>
          </OrganizationProjectGuard>
          <Toasts />
          <RouteProgress />
        </AuthProvider>
      </IFrameMessageManagerProvider>
    </Provider>
  )
}

export default App
