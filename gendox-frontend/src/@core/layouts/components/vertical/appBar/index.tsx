import type { ReactNode } from "react"
import { cn } from "@/lib/utils"
import type { Settings } from "src/@core/context/settingsContext"

interface LayoutAppBarProps {
  settings: Settings
  verticalAppBarContent?: (props: any) => ReactNode
  toggleNavVisibility: () => void
  [key: string]: any
}

const LayoutAppBar = (props: LayoutAppBarProps) => {
  const { settings, verticalAppBarContent: userVerticalAppBarContent } = props
  const { contentWidth } = settings

  return (
    <header className="layout-navbar flex items-center justify-center px-4 sm:px-6 bg-transparent text-foreground min-h-16">
      <div
        className={cn(
          "navbar-content-container w-full rounded-b-[10px] transition-all duration-250 ease-in-out",
          contentWidth === "boxed" && "max-w-[1440px] 2xl:max-w-[calc(1440px-3rem)]"
        )}
      >
        {userVerticalAppBarContent?.(props) ?? null}
      </div>
    </header>
  )
}

export default LayoutAppBar
