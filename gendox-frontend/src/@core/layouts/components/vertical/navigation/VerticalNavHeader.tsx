import Link from "next/link"
import themeConfig from "src/configs/themeConfig"
import type { ReactNode } from "react"

interface VerticalNavHeaderProps {
  verticalNavMenuBranding?: (props: any) => ReactNode
  [key: string]: any
}

const VerticalNavHeader = (props: VerticalNavHeaderProps) => {
  const { verticalNavMenuBranding: userVerticalNavMenuBranding } = props

  return (
    <div className="nav-header flex items-center justify-between pr-4 transition-[padding] duration-250 ease-in-out min-h-16 pl-6">
      {userVerticalNavMenuBranding ? (
        userVerticalNavMenuBranding(props)
      ) : (
        <Link href="/" className="flex items-center no-underline">
          <span className="font-semibold leading-normal uppercase text-foreground transition-[opacity,margin] duration-250 ease-in-out ml-3">
            {themeConfig.templateName}
          </span>
        </Link>
      )}
    </div>
  )
}

export default VerticalNavHeader
