import Link from "next/link"
import { useRouter } from "next/router"
import { MoreVertical } from "lucide-react"
import { cn } from "@/lib/utils"
import { useSettings } from "src/@core/context/settingsContext"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { handleURLQueries } from "src/@core/layouts/utils"
import themeConfig from "src/configs/themeConfig"
import UserIcon from "src/layouts/components/UserIcon"

interface NavItem {
  title?: string
  icon?: any
  path?: string
  itemId?: string
  subtitle?: string
  badgeContent?: string | number
  badgeColor?: string
  disabled?: boolean
  openInNewTab?: boolean
  [key: string]: any
}

interface VerticalNavLinkProps {
  item: NavItem
  navVisible?: boolean
  toggleNavVisibility?: () => void
  onOpenMenu?: (e: React.MouseEvent, item: NavItem) => void
  isSelected?: boolean
  [key: string]: any
}

const VerticalNavLink = ({
  item,
  navVisible,
  toggleNavVisibility,
  onOpenMenu,
  isSelected,
}: VerticalNavLinkProps) => {
  const router = useRouter()
  const IconTag = item.icon
  const { settings } = useSettings()

  const isNavLinkActive = () => {
    if (isSelected !== undefined) {
      return isSelected
    }
    return router.pathname === item.itemId || handleURLQueries(router, item.path)
  }

  const isGendoxNavLinkActive = () => {
    if (!item.itemId) return false
    return Object.values(router.query).some((queryValue) => queryValue === item.itemId)
  }

  const active =
    settings.navBarContent === "hidden" ? isNavLinkActive() : isGendoxNavLinkActive()

  return (
    <li
      className={cn(
        "nav-link mt-1.5 flex items-center",
        item.disabled && "opacity-50 pointer-events-none"
      )}
    >
      <Link
        href={item.path ?? "/"}
        {...(item.openInNewTab ? { target: "_blank" } : {})}
        onClick={(e) => {
          if (item.path === undefined) {
            e.preventDefault()
            e.stopPropagation()
          }
          if (navVisible && toggleNavVisibility) {
            toggleNavVisibility()
          }
        }}
        className={cn(
          "w-full flex items-center rounded-[5px] py-2 px-3.5 pl-5 transition-opacity duration-250 ease-in-out text-foreground no-underline",
          active &&
            "shadow-md bg-gradient-to-r from-[var(--gendox-primary-gradient)] to-primary text-white [&_*]:text-white",
          !active && "hover:bg-accent",
          item.disabled && "pointer-events-none"
        )}
      >
        {IconTag && (
          <span className="mr-2.5 text-current transition-[margin] duration-250 ease-in-out">
            <UserIcon icon={IconTag} />
          </span>
        )}

        <div
          className={cn(
            "w-full flex items-center justify-between transition-opacity duration-250 ease-in-out",
            themeConfig.menuTextTruncate && "overflow-hidden"
          )}
        >
          <div
            className={cn(
              "flex flex-col",
              themeConfig.menuTextTruncate && "overflow-hidden"
            )}
          >
            <span className={cn(themeConfig.menuTextTruncate && "truncate")}>
              {item.title}
            </span>
            {item.subtitle && (
              <span className="text-xs text-muted-foreground line-clamp-1">
                {item.subtitle}
              </span>
            )}
          </div>

          {item.badgeContent && (
            <Badge variant="default" className="ml-1 h-5 text-xs capitalize">
              {item.badgeContent}
            </Badge>
          )}

          {onOpenMenu && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    aria-label="More options"
                    onClick={(e) => {
                      e.stopPropagation()
                      e.preventDefault()
                      onOpenMenu(e, item)
                    }}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>More options</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </Link>
    </li>
  )
}

export default VerticalNavLink
