import { useRef, useState, type ReactNode } from "react"
import { cn } from "@/lib/utils"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import VerticalNavItems from "./VerticalNavItems"
import VerticalNavHeader from "./VerticalNavHeader"

interface NavigationProps {
  hidden: boolean
  navWidth: number
  navVisible: boolean
  setNavVisible: (visible: boolean) => void
  toggleNavVisibility: () => void
  verticalNavItems?: any[]
  verticalNavMenuContent?: (props: any) => ReactNode
  verticalNavMenuBranding?: (props: any) => ReactNode
  beforeVerticalNavMenuContent?: ((props: any) => ReactNode) | ReactNode
  afterVerticalNavMenuContent?: ((props: any) => ReactNode) | ReactNode
  [key: string]: any
}

const Navigation = (props: NavigationProps) => {
  const {
    hidden,
    navWidth,
    navVisible,
    setNavVisible,
    afterVerticalNavMenuContent,
    beforeVerticalNavMenuContent,
    verticalNavMenuContent: userVerticalNavMenuContent,
  } = props

  const [groupActive, setGroupActive] = useState<string[]>([])
  const [currentActiveGroup, setCurrentActiveGroup] = useState<string[]>([])

  const navContent = (
    <div className="flex flex-col h-full">
      <VerticalNavHeader {...props} />
      <div className="ml-2 flex-1 min-h-0 overflow-y-auto">
          {typeof beforeVerticalNavMenuContent === "function"
            ? beforeVerticalNavMenuContent(props)
            : beforeVerticalNavMenuContent ?? null}
          <div className="flex flex-col justify-between">
            {userVerticalNavMenuContent ? (
              userVerticalNavMenuContent(props)
            ) : (
              <ul className="nav-items list-none transition-[padding] duration-250 ease-in-out pr-4">
                <VerticalNavItems
                  groupActive={groupActive}
                  setGroupActive={setGroupActive}
                  currentActiveGroup={currentActiveGroup}
                  setCurrentActiveGroup={setCurrentActiveGroup}
                  {...props}
                />
              </ul>
            )}
          </div>
          {typeof afterVerticalNavMenuContent === "function"
            ? afterVerticalNavMenuContent(props)
            : afterVerticalNavMenuContent ?? null}
      </div>
    </div>
  )

  // Mobile: use Sheet (slide-over drawer)
  if (hidden) {
    return (
      <Sheet open={navVisible} onOpenChange={setNavVisible}>
        <SheetContent
          side="left"
          className="layout-vertical-nav p-0 bg-background border-r-0"
          style={{ "--nav-width": `${navWidth}px`, width: "var(--nav-width)" } as React.CSSProperties}
        >
          {navContent}
        </SheetContent>
      </Sheet>
    )
  }

  // Desktop: permanent sidebar
  return (
    <aside
      className="layout-vertical-nav h-full overflow-x-hidden transition-[width] duration-250 ease-in-out bg-background [&_ul]:list-none"
      style={{ "--nav-width": `${navWidth}px`, width: "var(--nav-width)" } as React.CSSProperties}
    >
      {navContent}
    </aside>
  )
}

export default Navigation
