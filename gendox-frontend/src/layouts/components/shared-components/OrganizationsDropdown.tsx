import { useState, useEffect, useCallback } from "react"
import { useDispatch } from "react-redux"
import { useRouter } from "next/router"
import Link from "next/link"
import { Building2 } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { useAuth } from "src/authentication/useAuth"
import { fetchProject } from "src/store/activeProject/activeProject"
import { fetchOrganization } from "src/store/activeOrganization/activeOrganization"
import { sortByField } from "src/utils/orderUtils"
import { localStorageConstants } from "src/utils/generalConstants"

interface OrganizationsDropdownProps {
  settings: any
  saveSettings?: (settings: any) => void
}

const OrganizationsDropdown = ({ settings }: OrganizationsDropdownProps) => {
  const router = useRouter()
  const dispatch = useDispatch<any>()
  const auth = useAuth()
  const [activeOrganizationId, setActiveOrganizationId] = useState<string | null>(null)
  const token =
    typeof window !== "undefined"
      ? window.localStorage.getItem(localStorageConstants.accessTokenKey)
      : null

  // Responsive visible count: fewer on small screens
  const [visibleCount, setVisibleCount] = useState(4)

  useEffect(() => {
    const handleResize = () => {
      setVisibleCount(window.innerWidth < 640 ? 2 : 4)
    }
    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  useEffect(() => {
    const { organizationId } = router.query
    if (organizationId) {
      setActiveOrganizationId(organizationId as string)
    }
  }, [router.query])

  const handleOrganizations = useCallback(
    (organization: any) => {
      const { projects } = organization
      const newProjectId = projects?.[0]?.id ?? null

      ;(dispatch as any)(
        (fetchOrganization as any)({
          organizationId: organization.id,
          token,
        })
      )
      if (newProjectId !== null) {
        ;(dispatch as any)(
          (fetchProject as any)({
            organizationId: organization.id,
            projectId: newProjectId,
            token,
          })
        )
      }

      localStorage.setItem(localStorageConstants.selectedOrganizationId, organization.id)
      localStorage.setItem(localStorageConstants.selectedProjectId, newProjectId)
      setActiveOrganizationId(organization.id)

      const newPath =
        router.pathname === "/gendox/chat"
          ? `/gendox/chat/?organizationId=${organization.id}&projectId=${newProjectId}`
          : router.pathname === "/gendox/organization-settings"
          ? `/gendox/organization-settings/?organizationId=${organization.id}`
          : `/gendox/home/?organizationId=${organization.id}&projectId=${newProjectId}`
      router.push(newPath)
    },
    [dispatch, router, token]
  )

  const organizations = Array.isArray(auth.user?.organizations)
    ? auth.user.organizations
    : []
  const sortedOrganizations = sortByField([...organizations], "name", activeOrganizationId)
  const visibleOrganizations = sortedOrganizations.slice(0, visibleCount)
  const overflowCount = sortedOrganizations.length - visibleCount

  return (
    <TooltipProvider>
      <div className="flex items-center ml-2 -space-x-2" role="group" aria-label="Organizations">
        {visibleOrganizations.map((organization: any) => (
          <Tooltip key={organization.id}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleOrganizations(organization)}
                className="rounded-full p-0 h-10 w-10"
              >
                <Avatar
                  className={cn(
                    "h-10 w-10 text-xs bg-primary text-primary-foreground border-2 border-card transition-transform hover:scale-110",
                    organization.id === activeOrganizationId &&
                      "ring-2 ring-primary ring-offset-2 ring-offset-background"
                  )}
                >
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {organization.name.substring(0, 4)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </TooltipTrigger>
            <TooltipContent>{organization.name}</TooltipContent>
          </Tooltip>
        ))}

        {overflowCount > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label={`${overflowCount} more organizations`} className="rounded-full p-0 h-10 w-10">
                <Avatar className="h-10 w-10 text-xs bg-muted text-muted-foreground border-2 border-card">
                  <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                    +{overflowCount}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {sortByField([...organizations], "name", activeOrganizationId).map(
                (organization: any) => (
                  <DropdownMenuItem
                    key={organization.id}
                    className={cn(
                      organization.id === activeOrganizationId &&
                        "bg-primary/10"
                    )}
                    onClick={() => handleOrganizations(organization)}
                  >
                    <Building2 className="mr-2 h-4 w-4 text-primary" />
                    {organization.name}
                  </DropdownMenuItem>
                )
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </TooltipProvider>
  )
}

export default OrganizationsDropdown
