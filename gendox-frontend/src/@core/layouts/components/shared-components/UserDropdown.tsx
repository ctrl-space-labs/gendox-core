import { useState, useMemo } from "react"
import { useRouter } from "next/router"
import { User, Plus, Settings, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { generateIdenticon } from "src/utils/identiconUtil"
import { useAuth } from "src/authentication/useAuth"
import { localStorageConstants } from "src/utils/generalConstants"

interface UserDropdownProps {
  settings: any
}

const UserDropdown = ({ settings }: UserDropdownProps) => {
  const auth = useAuth()
  const { logout } = auth
  const router = useRouter()

  let { organizationId } = router.query
  if (!organizationId && typeof window !== "undefined") {
    organizationId = window.localStorage.getItem(
      localStorageConstants.selectedOrganizationId
    ) as string
  }

  const identiconSrc = useMemo(
    () => generateIdenticon(auth?.user?.id),
    [auth?.user?.id]
  )

  const handleNavigate = (url: string) => {
    router.push(url)
  }

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error("Logout failed:", error)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative ml-2 rounded-full h-10 w-10 p-0">
          <Avatar className="h-10 w-10">
            <AvatarImage src={identiconSrc} alt={auth.user?.name || "User"} />
            <AvatarFallback>
              {auth.user?.name?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
          <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-success ring-2 ring-card" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {auth.user && (
          <>
            <div className="flex items-center gap-3 px-4 py-3">
              <Avatar className="h-10 w-10">
                <AvatarImage
                  src={identiconSrc}
                  alt={auth.user.name}
                />
                <AvatarFallback>
                  {auth.user.name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="font-semibold text-sm">{auth.user.name}</span>
                <span className="text-xs text-muted-foreground">
                  {auth.user.role}
                </span>
              </div>
            </div>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem
          onClick={() =>
            handleNavigate(
              `/gendox/user-profile/?organizationId=${organizationId}&userId=${auth.user?.id}`
            )
          }
        >
          <User className="mr-2 h-4 w-4 text-muted-foreground" />
          Profile
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => handleNavigate("/gendox/create-organization")}
        >
          <Plus className="mr-2 h-4 w-4 text-muted-foreground" />
          Add Organization
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() =>
            handleNavigate(
              `/gendox/organization-settings/?organizationId=${organizationId}`
            )
          }
        >
          <Settings className="mr-2 h-4 w-4 text-muted-foreground" />
          Organization Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default UserDropdown
