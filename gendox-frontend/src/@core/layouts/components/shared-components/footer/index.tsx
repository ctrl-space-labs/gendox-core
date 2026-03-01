import type { ReactNode } from "react"
import { cn } from "@/lib/utils"
import type { Settings } from "src/@core/context/settingsContext"

interface FooterProps {
  settings: Settings
  footerContent?: ((props: any) => ReactNode) | null
  [key: string]: any
}

const Footer = (props: FooterProps) => {
  const { settings, footerContent: userFooterContent } = props
  const { contentWidth } = settings

  return (
    <footer className="layout-footer z-10 flex items-center justify-center">
      <div
        className={cn(
          "footer-content-container w-full rounded-t-[14px] py-4 px-6",
          contentWidth === "boxed" && "max-w-[1440px]"
        )}
      >
        {userFooterContent ? userFooterContent(props) : null}
      </div>
    </footer>
  )
}

export default Footer
