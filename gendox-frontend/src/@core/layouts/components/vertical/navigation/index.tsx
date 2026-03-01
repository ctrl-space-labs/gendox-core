import { useRef, useState, type ReactNode } from "react"
import { cn } from "@/lib/utils"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
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
    <>
      <VerticalNavHeader {...props} />
      <div className="ml-2 h-full relative overflow-hidden">
        <ScrollArea className="h-full">
          {typeof beforeVerticalNavMenuContent === "function"
            ? beforeVerticalNavMenuContent(props)
            : beforeVerticalNavMenuContent ?? null}
          <div className="h-full flex flex-col justify-between">
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
        </ScrollArea>
      </div>
      {typeof afterVerticalNavMenuContent === "function"
        ? afterVerticalNavMenuContent(props)
        : afterVerticalNavMenuContent ?? null}
    </>
  )

  // Mobile: use Sheet (slide-over drawer)
  if (hidden) {
    return (
      <Sheet open={navVisible} onOpenChange={setNavVisible}>
        <SheetContent
          side="left"
          className="layout-vertical-nav p-0 bg-background border-r-0"
          style={{ width: navWidth }}
        >
          {navContent}
        </SheetContent>
      </Sheet>
    )
  }

  // Desktop: permanent sidebar
  return (
    <aside
      className="layout-vertical-nav overflow-x-hidden transition-[width] duration-250 ease-in-out bg-background [&_ul]:list-none"
      style={{ width: navWidth }}
    >
      {navContent}
    </aside>
  )
}

export default Navigation
