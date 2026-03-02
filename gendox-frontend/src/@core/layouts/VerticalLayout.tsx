import { useState, type ReactNode } from "react"
import { ArrowUp } from "lucide-react"
import { cn } from "@/lib/utils"
import themeConfig from "src/configs/themeConfig"
import type { Settings } from "src/@core/context/settingsContext"
import Navigation from "./components/vertical/navigation"
import LayoutAppBar from "./components/vertical/appBar"
import Footer from "./components/shared-components/footer"
import ScrollToTop from "src/@core/components/scroll-to-top"
import { Button } from "@/components/ui/button"

interface NavItem {
  title?: string
  icon?: string
  path?: string
  itemId?: string
  sectionTitle?: string
  subtitle?: string
  badgeContent?: string | number
  badgeColor?: string
  disabled?: boolean
  openInNewTab?: boolean
}

export interface VerticalLayoutProps {
  hidden: boolean
  settings: Settings
  saveSettings: (settings: Settings) => void
  children: ReactNode
  verticalNavItems?: NavItem[]
  scrollToTop?: (props: any) => ReactNode
  verticalAppBarContent?: (props: any) => ReactNode
  verticalNavMenuContent?: (props: any) => ReactNode
  verticalNavMenuBranding?: (props: any) => ReactNode
  beforeVerticalNavMenuContent?: (props: any) => ReactNode | ReactNode
  afterVerticalNavMenuContent?: (props: any) => ReactNode | ReactNode
  footerContent?: ((props: any) => ReactNode) | null
}

const VerticalLayout = (props: VerticalLayoutProps) => {
  const { settings, children, scrollToTop } = props
  const { contentWidth } = settings
  const navWidth = themeConfig.navigationSize

  const [navVisible, setNavVisible] = useState(false)
  const toggleNavVisibility = () => setNavVisible(!navVisible)

  return (
    <>
      <div className="layout-wrapper h-full flex">
        {settings.navBarContent !== "hidden" && (
          <Navigation
            navWidth={navWidth}
            navVisible={navVisible}
            setNavVisible={setNavVisible}
            toggleNavVisibility={toggleNavVisibility}
            {...props}
          />
        )}
        <div className="layout-content-wrapper flex-grow min-w-0 flex min-h-screen flex-col">
          <LayoutAppBar toggleNavVisibility={toggleNavVisibility} {...props} />

          <main
            className={cn(
              "layout-page-content flex-grow w-full px-4 py-4 sm:px-6 sm:py-6 transition-[padding] duration-250 ease-in-out",
              contentWidth === "boxed" && "mx-auto max-w-[1440px] xl:max-w-full"
            )}
          >
            {children}
          </main>

          {settings.footerContent !== "hidden" && <Footer {...props} />}

          {/* DatePicker portal */}
          <div className="z-[11]">
            <div id="react-datepicker-portal" />
          </div>
        </div>
      </div>

      {scrollToTop ? (
        scrollToTop(props)
      ) : (
        <ScrollToTop>
          <Button
            size="icon"
            className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
            aria-label="scroll back to top"
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
        </ScrollToTop>
      )}
    </>
  )
}

export default VerticalLayout
