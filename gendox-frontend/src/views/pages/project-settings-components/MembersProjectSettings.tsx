import React, { useEffect, useState } from "react"
import { useSelector, useDispatch } from "react-redux"
import { MoreVertical, Shield, ShieldCheck, Pencil, BookOpen, HelpCircle } from "lucide-react"
import { ColumnDef } from "@tanstack/react-table"
import { toast } from "sonner"

import { Card, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DataTable } from "@/components/ui/data-table"

import InviteDialog from "@/views/pages/project-settings-components/members-components/InviteDialog"
import DeleteConfirmDialog from "@/utils/dialogs/DeleteConfirmDialog"
import {
  fetchProjectMembersAndRoles,
  deleteProjectMember,
} from "@/store/activeProject/activeProject"
import { fetchOrganizationMembers } from "@/store/activeOrganization/activeOrganization"
import {
  userTypeStatus,
  memberRoleStatus,
  escapeRegExp,
} from "@/utils/membersUtils"
import { localStorageConstants } from "@/utils/generalConstants"

interface MemberRow {
  id: string
  name: string
  userName: string
  email: string
  phone: string
  role?: { name: string }
  userType: string
  [key: string]: any
}

const roleIconMap: Record<string, React.ReactNode> = {
  ROLE_OWNER: <Shield className="h-4 w-4 mr-2 text-purple-600" />,
  ROLE_ADMIN: <ShieldCheck className="h-4 w-4 mr-2 text-blue-600" />,
  ROLE_EDITOR: <Pencil className="h-4 w-4 mr-2 text-orange-500" />,
  ROLE_READER: <BookOpen className="h-4 w-4 mr-2 text-green-500" />,
  UNKNOWN: <HelpCircle className="h-4 w-4 mr-2 text-red-500" />,
}

const userTypeBadgeVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  GENDOX_USER: "default",
  GENDOX_AGENT: "secondary",
  DISCORD_USER: "outline",
  GENDOX_SUPER_ADMIN: "secondary",
  UNKNOWN: "destructive",
}

const MembersProjectSettings = () => {
  const dispatch = useDispatch()
  const token = window.localStorage.getItem(localStorageConstants.accessTokenKey)

  const {
    projectDetails: project,
    projectMembersAndRoles: projectMembers,
    isMembersLoading,
    isDeletingMember,
  } = useSelector((state: any) => state.activeProject)

  const { id: projectId, organizationId } = project || {}
  const [searchText, setSearchText] = useState("")
  const [filteredProjectMembers, setFilteredProjectMembers] = useState<MemberRow[]>([])
  const [selectedUser, setSelectedUser] = useState<MemberRow | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [showInviteDialog, setShowInviteDialog] = useState(false)

  const membersWithoutAgents = (projectMembers as MemberRow[]).filter(
    (member) => member.userType !== "GENDOX_AGENT"
  )

  useEffect(() => {
    if (projectId) {
      ;(dispatch as any)(
        (fetchProjectMembersAndRoles as any)({ organizationId, projectId, token })
      )
    }
    if (organizationId) {
      ;(dispatch as any)(
        (fetchOrganizationMembers as any)({ organizationId, token })
      )
    }
  }, [projectId, organizationId, token, dispatch])

  useEffect(() => {
    setFilteredProjectMembers(membersWithoutAgents)
  }, [projectMembers])

  const handleSearch = (searchValue: string) => {
    setSearchText(searchValue)
    const searchRegex = new RegExp(escapeRegExp(searchValue), "i")

    const filteredRows = membersWithoutAgents.filter((row: MemberRow) => {
      return Object.keys(row).some((field) => {
        const fieldValue = row[field]
        return fieldValue && searchRegex.test(fieldValue.toString())
      })
    })
    setFilteredProjectMembers(
      searchValue.length ? filteredRows : membersWithoutAgents
    )
  }

  const handleDeleteUser = async () => {
    if (selectedUser) {
      ;(dispatch as any)(
        (deleteProjectMember as any)({
          organizationId,
          projectId,
          userId: selectedUser.id,
          token,
        })
      )
        .unwrap()
        .then(() => {
          toast.success("User deleted successfully")
          ;(dispatch as any)(
            (fetchProjectMembersAndRoles as any)({ organizationId, projectId, token })
          )
        })
        .catch((error: any) => {
          console.log("Failed to delete user:", error)
        })
      setConfirmDelete(false)
    }
  }

  const handleDeleteConfirmOpen = (user: MemberRow) => {
    setSelectedUser(user)
    setConfirmDelete(true)
  }

  const handleDeleteConfirmClose = () => {
    setConfirmDelete(false)
  }

  const handleInviteNewMembers = () => {
    setShowInviteDialog(true)
  }

  const columns: ColumnDef<MemberRow>[] = [
    {
      accessorKey: "userName",
      header: "NAME",
      cell: ({ row }) => {
        const member = row.original
        return (
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-semibold">
              {(member.name || member.userName || "?").charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-foreground">
                {member.name}
              </span>
              <span className="text-xs text-muted-foreground">
                {member.userName}
              </span>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "email",
      header: "EMAIL",
      cell: ({ row }) => (
        <span className="text-sm text-foreground">{row.original.email}</span>
      ),
    },
    {
      accessorKey: "role",
      header: "ORGANIZATION ROLE",
      enableSorting: false,
      cell: ({ row }) => {
        if (isMembersLoading) {
          return <span className="text-sm">Loading...</span>
        }
        const role = row.original.role?.name || "UNKNOWN"
        const status =
          (memberRoleStatus as any)[role] ||
          (memberRoleStatus as any).UNKNOWN
        return (
          <span className="text-sm flex items-center">
            {roleIconMap[role] || roleIconMap.UNKNOWN}
            {status.title}
          </span>
        )
      },
    },
    {
      accessorKey: "userType",
      header: "USER TYPE",
      enableSorting: false,
      cell: ({ row }) => {
        const userType = row.original.userType
        const status =
          (userTypeStatus as any)[userType] ||
          (userTypeStatus as any).UNKNOWN
        return (
          <Badge
            variant={userTypeBadgeVariant[userType] || "destructive"}
            className="capitalize"
          >
            {status.title}
          </Badge>
        )
      },
    },
    {
      accessorKey: "phone",
      header: "PHONE",
      enableSorting: false,
      cell: ({ row }) => (
        <span className="text-sm text-foreground">
          {row.original.phone}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      enableSorting: false,
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => handleDeleteConfirmOpen(row.original)}
            >
              Remove User
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  const displayData =
    filteredProjectMembers.length > 0
      ? filteredProjectMembers
      : membersWithoutAgents

  return (
    <Card>
      <CardHeader />
      <div className="relative">
        <div
          className={`${
            isMembersLoading || isDeletingMember ? "blur-sm" : ""
          } transition-all duration-300`}
        >
          <div className="px-4">
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search members..."
                value={searchText}
                onChange={(e) => handleSearch(e.target.value)}
                className="flex h-9 w-full max-w-sm rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
            <DataTable
              columns={columns}
              data={displayData}
              pageSize={10}
              pageSizeOptions={[10, 25, 50]}
            />
          </div>
        </div>
      </div>

      <DeleteConfirmDialog
        open={confirmDelete}
        onClose={handleDeleteConfirmClose}
        onConfirm={handleDeleteUser}
        title="Confirm Deletion User"
        contentText={`Are you sure you want to delete ${
          selectedUser?.name || selectedUser?.userName || "this user"
        } from the project? This action cannot be undone.`}
        confirmButtonText="Remove Member"
        cancelButtonText="Cancel"
      />

      {/* Invite New Members Button */}
      <div className="p-4 flex justify-end py-6">
        <Button size="lg" onClick={handleInviteNewMembers}>
          Invite new members
        </Button>
      </div>

      {/* Invite Dialog */}
      <InviteDialog
        open={showInviteDialog}
        handleClose={() => setShowInviteDialog(false)}
      />
    </Card>
  )
}

export default MembersProjectSettings
