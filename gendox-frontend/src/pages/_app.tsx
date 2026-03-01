import type { AppProps } from "next/app"
import type { ReactElement, ReactNode } from "react"
import type { NextPage } from "next"
import Head from "next/head"
import { Router } from "next/router"
import NProgress from "nprogress"
import { Provider } from "react-redux"
import { Toaster } from "@/components/ui/sonner"
import themeConfig from "src/configs/themeConfig"
import UserLayout from "src/layouts/UserLayout"
import ThemeComponent from "src/@core/theme/ThemeComponent"
import { SettingsConsumer, SettingsProvider } from "src/@core/context/settingsContext"
import { store } from "src/store"
import RouteHandler from "src/authentication/components/RouteHandler"
import OrganizationProjectGuard from "src/authentication/components/OrganizationProjectGuard"
import { AuthProvider } from "src/authentication/context/AuthContext"
import { IFrameMessageManagerProvider } from "src/authentication/context/IFrameMessageManagerContext"

// Global CSS - now includes Tailwind directives
import "src/styles/globals.css"

type NextPageWithLayout = NextPage & {
  getLayout?: (page: ReactElement) => ReactNode
  pageConfig?: {
    routeType?: string
    authProviderOption?: string
    [key: string]: any
  }
}

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout
}

// NProgress routing loader
if (themeConfig.routingLoader) {
  Router.events.on("routeChangeStart", () => NProgress.start())
  Router.events.on("routeChangeError", () => NProgress.done())
  Router.events.on("routeChangeComplete", () => NProgress.done())
}

const App = ({ Component, pageProps }: AppPropsWithLayout) => {
  const getLayout =
    Component.getLayout ?? ((page: ReactElement) => <UserLayout>{page}</UserLayout>)
  const pageConfig = Component.pageConfig ?? undefined
  const routeType = pageConfig?.routeType ?? "private"
  const authProviderOption = pageConfig?.authProviderOption ?? "PKCEAuthProvider"

  return (
    <Provider store={store}>
      <Head>
        <title>{themeConfig.templateName}</title>
        <meta
          name="description"
          content={`With ${themeConfig.templateName} AI Agents can prove there origin, where they pull data from and how they use them.`}
        />
        <meta
          name="keywords"
          content="ProvenAI, Gendox, AI Agents, Verifiable Credentials"
        />
        <meta name="viewport" content="initial-scale=1, width=device-width" />
      </Head>

      <IFrameMessageManagerProvider>
        <AuthProvider option={authProviderOption}>
          <SettingsProvider pageConfig={pageConfig}>
            <SettingsConsumer>
              {({ settings }) => (
                <ThemeComponent settings={settings}>
                  <OrganizationProjectGuard
                    authProviderOption={authProviderOption}
                    pageConfig={pageConfig}
                  >
                    <RouteHandler routeType={routeType}>
                      {getLayout(<Component {...pageProps} />)}
                    </RouteHandler>
                  </OrganizationProjectGuard>
                  <Toaster
                    position="top-right"
                    toastOptions={{
                      className: "bg-card text-card-foreground border-border",
                    }}
                  />
                </ThemeComponent>
              )}
            </SettingsConsumer>
          </SettingsProvider>
        </AuthProvider>
      </IFrameMessageManagerProvider>
    </Provider>
  )
}

export default App
