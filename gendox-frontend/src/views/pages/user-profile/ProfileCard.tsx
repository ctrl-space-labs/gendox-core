import { useMemo, useState } from "react"
import { toast } from "sonner"
import { Building2, Briefcase } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useAuth } from "src/authentication/useAuth"
import { generateIdenticon } from "src/utils/identiconUtil"
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

  const identiconSrc = useMemo(
    () => generateIdenticon(userData.id),
    [userData.email]
  )

  const [openEdit, setOpenEdit] = useState(false)
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false)

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
    <Card>
      <CardContent className="pt-6">
        {/* Avatar and Name */}
        <div className="flex flex-col items-center gap-1 p-8">
          <Avatar className="w-[120px] h-[120px] rounded-md mb-4">
            <AvatarImage src={identiconSrc} alt={userData.name} />
            <AvatarFallback className="text-2xl rounded-md">
              {userData.name?.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <h6 className="text-lg font-semibold mb-1">{userData.name}</h6>
          <Badge variant="outline" className="text-destructive border-destructive rounded-[5px] text-sm font-semibold">
            {userData.role}
          </Badge>
        </div>

        <Separator />

        {/* Stats */}
        <div className="flex justify-center gap-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-10 w-10 rounded-md bg-primary/10 text-primary">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <p className="font-bold mt-1">{userData.organizations.length}</p>
              <p className="text-sm text-muted-foreground">Organizations</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-10 w-10 rounded-md bg-primary/10 text-primary">
              <Briefcase className="h-5 w-5" />
            </div>
            <div>
              <p className="font-bold mt-1">{totalProjects}</p>
              <p className="text-sm text-muted-foreground">Projects</p>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="mt-3 py-8 space-y-1">
          <p className="text-sm">
            Username: <strong>{userData.userName}</strong>
          </p>
          <p className="text-sm">
            Email: <strong>{userData.email}</strong>
          </p>
          <p className="text-sm">
            Role: <strong>{userData.role}</strong>
          </p>
        </div>

        {/* Buttons */}
        <div className="flex justify-center mt-4 gap-4">
          <Button
            disabled={isDemo}
            onClick={() => setOpenEdit(true)}
          >
            Edit
          </Button>
          <Button
            variant="outline"
            className="text-destructive border-destructive hover:bg-destructive/10"
            onClick={() => setOpenDeleteDialog(true)}
          >
            Delete
          </Button>
        </div>

        {/* Edit User Dialog */}
        <Dialog open={openEdit} onOpenChange={setOpenEdit}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-center">
                Edit User Information
              </DialogTitle>
              <DialogDescription className="text-center">
                This feature is not available yet. We&apos;re working hard to
                get it up and running soon. Stay tuned!
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="justify-center">
              <Button variant="outline" onClick={() => setOpenEdit(false)}>
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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
  )
}

export default ProfileCard
