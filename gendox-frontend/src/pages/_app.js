// ** Next Imports
import Head from 'next/head'
import { Router } from 'next/router'

// ** Loader Import
import NProgress from 'nprogress'

// ** Emotion Imports
import { CacheProvider } from '@emotion/react'

// ** Config Imports
import themeConfig from 'src/configs/themeConfig'

// ** Component Imports
import UserLayout from 'src/layouts/UserLayout'
import ThemeComponent from 'src/@core/theme/ThemeComponent'

// ** Contexts
import { SettingsConsumer, SettingsProvider } from 'src/@core/context/settingsContext'

// ** Utils Imports
import { createEmotionCache } from 'src/@core/utils/create-emotion-cache'

// ** React Perfect Scrollbar Style
import 'react-perfect-scrollbar/dist/css/styles.css'

// ** Global css styles
import '../../styles/globals.css'
import '../../styles/markdown-renderer.css'
import { Provider } from 'react-redux'
import { store } from 'src/store'
import CustomToast from 'src/views/custom-components/mui/toast/CustomToast'
import RouteHandler from '../authentication/components/RouteHandler'
import OrganizationProjectGuard from 'src/authentication/components/OrganizationProjectGuard'
import { AuthProvider } from '../authentication/context/AuthContext'
import { IFrameMessageManagerProvider } from '../authentication/context/IFrameMessageManagerContext'
import { GenerationProvider } from 'src/views/pages/tasks/document-digitization/table-hooks/GenerationContext'
import GlobalGenerationStatus from 'src/views/custom-components/generation-status/GlobalGenerationStatus'
import GenerationFAB from 'src/views/custom-components/generation-status/GenerationFAB'

const clientSideEmotionCache = createEmotionCache()

// ** Pace Loader
if (themeConfig.routingLoader) {
  Router.events.on('routeChangeStart', () => {
    NProgress.start()
  })
  Router.events.on('routeChangeError', () => {
    NProgress.done()
  })
  Router.events.on('routeChangeComplete', () => {
    NProgress.done()
  })
}

// ** Configure JSS & ClassName
const App = props => {
  const { Component, emotionCache = clientSideEmotionCache, pageProps } = props

  // Variables
  const getLayout = Component.getLayout ?? (page => <UserLayout>{page}</UserLayout>)
  const pageConfig = Component.pageConfig ?? undefined
  const routeType = pageConfig?.routeType ?? 'private'
  // By default it is PKCE, for /embed pages it is IFrameAuthProvider
  const authProviderOption = pageConfig?.authProviderOption ?? 'PKCEAuthProvider'

  return (
    <Provider store={store}>
      <CacheProvider value={emotionCache}>
        <Head>
          <title>{`${themeConfig.templateName}`}</title>
          <meta
            name='description'
            content={`With ${themeConfig.templateName} AI Agents can prove there origin, where they pull data from and how they use them.`}
          />
          <meta name='keywords' content='ProvenAI, Gendox, AI Agents, Verifiable Credentials' />
          <meta name='viewport' content='initial-scale=1, width=device-width' />
        </Head>

        <IFrameMessageManagerProvider>
          <AuthProvider option={authProviderOption}>
            <GenerationProvider>
              <SettingsProvider pageConfig={pageConfig ? pageConfig : undefined}>
                <SettingsConsumer>
                  {({ settings }) => {
                    return (
                      <ThemeComponent settings={settings}>
                        <GlobalGenerationStatus />
                        <OrganizationProjectGuard authProviderOption={authProviderOption} pageConfig={pageConfig}>
                          <RouteHandler routeType={routeType}>{getLayout(<Component {...pageProps} />)}</RouteHandler>

                        </OrganizationProjectGuard>
                        <CustomToast />
                        <GenerationFAB />
                      </ThemeComponent>
                    )
                  }}
                </SettingsConsumer>
              </SettingsProvider>
            </GenerationProvider>
          </AuthProvider>
        </IFrameMessageManagerProvider>
      </CacheProvider>
    </Provider>
  )
}

export default App
