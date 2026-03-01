import { useState } from "react"
import { useSelector } from "react-redux"
import { useRouter } from "next/router"
import { Mail, UserPlus, CheckCircle, X } from "lucide-react"
import { toast } from "sonner"

import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import { useAuth } from "src/authentication/useAuth"
import { localStorageConstants } from "src/utils/generalConstants"
import invitationService from "src/gendox-sdk/invitationService"
import { getErrorMessage } from "src/utils/errorHandler"
import { getAllowedRoles, memberRoleStatus } from "src/utils/membersUtils"

interface InviteDialogProps {
  open: boolean
  handleClose: () => void
}

const InviteDialog = ({ open, handleClose }: InviteDialogProps) => {
  const auth = useAuth() as any
  const token =
    typeof window !== "undefined"
      ? window.localStorage.getItem(localStorageConstants.accessTokenKey)
      : null
  const project = useSelector(
    (state: any) => state.activeProject.projectDetails
  )
  const organizationMembers = useSelector(
    (state: any) => state.activeOrganization.organizationMembers
  )
  const { id: projectId, organizationId } = project
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [selectedRole, setSelectedRole] = useState("")

  const members = organizationMembers.filter(
    (member: any) => member.user.email !== null
  )
  const userRole = members.find(
    (member: any) => member.user.email === auth.user.email
  )?.role?.name
  const allowedRoles = getAllowedRoles(userRole)

  const validateEmail = (emailStr: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return re.test(emailStr)
  }

  const handleInvitation = async () => {
    if (!email) {
      setError("Email is required.")
      return
    }

    if (!validateEmail(email)) {
      setError("Please enter a valid email address.")
      return
    }

    setError("")

    const existingMember = members.find(
      (member: any) => member.user.email === email
    )
    const invitationBody = {
      inviteeEmail: email,
      projectId,
      organizationId,
      userRoleType: existingMember
        ? { name: existingMember.role.name }
        : { name: selectedRole },
      inviterUserId: auth.user.id,
    }

    try {
      await invitationService.inviteProjectMember(
        organizationId,
        token,
        invitationBody
      )
      toast.success("Invitation sent successfully!")
      handleClose()
    } catch (err) {
      handleClose()
      toast.error(`Error sending invitation Error: ${getErrorMessage(err)}`)
    }
  }

  const steps = [
    {
      title: "Send Invitation",
      description: "Send an invitation to your friend",
      icon: <Mail className="h-8 w-8" />,
    },
    {
      title: "Registration",
      description:
        "They can sign up and gain access to the project environment",
      icon: <UserPlus className="h-8 w-8" />,
    },
    {
      title: "Start Using",
      description:
        "Once registered, they can explore and utilize all available features!",
      icon: <CheckCircle className="h-8 w-8" />,
    },
  ]

  const isEmailExisting = members.some(
    (member: any) => member.user.email === email
  )

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[95vh] overflow-y-auto p-0">
        <div className="relative px-4 sm:px-8 pt-8 sm:pt-16 pb-4">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4"
            onClick={handleClose}
          >
            <X className="h-4 w-4" />
          </Button>

          <div className="text-center mb-4 sm:mb-10">
            <h3 className="text-xl font-semibold mb-1">
              Invite new Members
            </h3>
            <p className="text-sm text-muted-foreground">
              {project.name} project
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 justify-center">
            {steps.map((step, index) => (
              <div
                key={index}
                className="flex sm:flex-col items-center sm:text-center gap-4 sm:gap-0"
              >
                <div className="flex items-center justify-center h-16 w-16 sm:h-24 sm:w-24 rounded-full bg-primary/10 text-primary shrink-0">
                  {step.icon}
                </div>
                <div className="flex flex-col gap-1 sm:mt-3">
                  <h4 className="text-base font-semibold">{step.title}</h4>
                  <p className="text-sm text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        <div className="px-4 sm:px-8 pb-4 sm:pb-8">
          <h4 className="text-base font-semibold mb-4">Invite New Member</h4>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-0 w-full">
            <div className="flex-1 w-full sm:mr-4">
              <Input
                placeholder="name@email.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (error) setError("")
                }}
                className={error ? "border-destructive" : ""}
              />
              {error && (
                <p className="text-sm text-destructive mt-1">{error}</p>
              )}
            </div>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="w-full sm:w-auto sm:ml-2">
                    <Select
                      value={isEmailExisting ? "" : selectedRole}
                      onValueChange={setSelectedRole}
                      disabled={isEmailExisting}
                    >
                      <SelectTrigger className="w-full sm:w-auto">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        {allowedRoles.map((role: string) => (
                          <SelectItem key={role} value={role}>
                            {(memberRoleStatus as any)[role]
                              ? (memberRoleStatus as any)[role].title
                              : role}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </TooltipTrigger>
                {isEmailExisting && (
                  <TooltipContent>
                    User is already member of the Organization. Go to
                    Organization Settings to update user's role.
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>

            <Button
              onClick={handleInvitation}
              className="w-full sm:w-auto sm:ml-5"
            >
              Send
            </Button>
          </div>

          <p className="text-sm text-muted-foreground mt-4">
            {`Enter your friend's email address and invite them to join the ${project.name} project!`}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default InviteDialog
