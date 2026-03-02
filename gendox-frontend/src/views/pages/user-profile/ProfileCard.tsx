import { useState } from "react"
import { toast } from "sonner"
import { Building2, Briefcase, User, Mail, Shield } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useAuth } from "src/authentication/useAuth"
import userService from "src/gendox-sdk/userService"
import { getErrorMessage } from "src/utils/errorHandler"
import { useSettings } from "src/@core/context/settingsContext"
import { localStorageConstants } from "src/utils/generalConstants"

interface ProfileCardProps {
  userData: any
}

const ProfileCard = ({ userData }: ProfileCardProps) => {
  const { settings } = useSettings()
  const isDemo = settings.isDemo
  const token =
    typeof window !== "undefined"
      ? window.localStorage.getItem(localStorageConstants.accessTokenKey)
      : null
  const { logout } = useAuth()

  const [openDeleteDialog, setOpenDeleteDialog] = useState(false)

  const initials = userData.name
    ?.split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?"

  const handleLogout = () => {
    logout()
  }

  const handleDeleteUser = async () => {
    if (!token) {
      toast.error("Authentication token missing.")
      return
    }

    try {
      await (userService as any).deactivateUserById(userData.id, token)
      toast.success("User deleted successfully.")
      setOpenDeleteDialog(false)
      handleLogout()
    } catch (error: any) {
      toast.error(
        `Failed to deactivate user. Error: ${getErrorMessage(error)}`
      )
      console.error("Error deactivating user:", error)
    } finally {
      setOpenDeleteDialog(false)
    }
  }

  const totalProjects = userData.organizations.reduce(
    (acc: number, org: any) => acc + (org.projects?.length || 0),
    0
  )

  return (
    <TooltipProvider>
    <Card>
      <CardContent className="pt-6">
        {/* Avatar and Name */}
        <div className="flex flex-col items-center gap-2 py-6">
          <Avatar className="h-20 w-20">
            <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <h6 className="text-lg font-semibold">{userData.name}</h6>
          <Badge variant="secondary">{userData.role}</Badge>
        </div>

        <Separator />

        {/* Stats */}
        <div className="flex justify-center gap-8 py-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-9 w-9 rounded-full bg-primary/10 text-primary">
              <Building2 className="h-4 w-4" />
            </div>
            <div>
              <p className="font-bold leading-tight">{userData.organizations.length}</p>
              <p className="text-xs text-muted-foreground">Organizations</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-9 w-9 rounded-full bg-primary/10 text-primary">
              <Briefcase className="h-4 w-4" />
            </div>
            <div>
              <p className="font-bold leading-tight">{totalProjects}</p>
              <p className="text-xs text-muted-foreground">Projects</p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Details */}
        <div className="py-4 space-y-3">
          <div className="flex items-center gap-3">
            <User className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Username</p>
              <p className="text-sm font-medium truncate">{userData.userName}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="text-sm font-medium truncate">{userData.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Shield className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Role</p>
              <p className="text-sm font-medium">{userData.role}</p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Buttons */}
        <div className="flex justify-center pt-4 gap-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button disabled>Edit</Button>
              </span>
            </TooltipTrigger>
            <TooltipContent>Coming soon</TooltipContent>
          </Tooltip>
          <Button
            variant="outline"
            className="text-destructive border-destructive hover:bg-destructive/10"
            onClick={() => setOpenDeleteDialog(true)}
          >
            Delete Account
          </Button>
        </div>

        {/* Delete Confirmation Dialog */}
        <Dialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm User Deletion</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete {userData.name}? You will lose
                access to all organizations and documents. This action cannot be
                undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setOpenDeleteDialog(false)}
              >
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteUser}>
                Delete Account
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
    </TooltipProvider>
  )
}

export default ProfileCard
