import { useEffect, useState, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { ColumnDef } from "@tanstack/react-table";
import {
  MoreVertical,
  ArrowLeftRight,
  Search,
  X,
  ShieldCheck,
  ShieldAlert,
  Pencil,
  BookOpen,
  HelpCircle,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import { useAuth } from "@/authentication/useAuth";
import { DataTable } from "@/components/ui/data-table";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { localStorageConstants } from "@/utils/generalConstants";
import {
  updateMemberRole,
  removeOrganizationMember,
  fetchOrganizationMembers,
} from "@/store/activeOrganization/activeOrganization";
import DeleteConfirmDialog from "@/utils/dialogs/DeleteConfirmDialog";
import { getErrorMessage } from "@/utils/errorHandler";
import {
  userTypeStatus,
  memberRoleStatus,
  escapeRegExp,
  getAllowedRoles,
  roleRankMap,
} from "@/utils/membersUtils";

interface MemberRow {
  id: string;
  user: {
    id: string;
    name: string;
    userName: string;
    email: string;
    phone: string;
    userType: {
      name: string;
    };
  };
  role: {
    name: string;
  };
}

const roleIconMap: Record<string, React.ReactNode> = {
  ROLE_OWNER: <ShieldCheck className="h-4 w-4 text-primary" />,
  ROLE_ADMIN: <ShieldAlert className="h-4 w-4 text-primary" />,
  ROLE_EDITOR: <Pencil className="h-4 w-4 text-muted-foreground" />,
  ROLE_READER: <BookOpen className="h-4 w-4 text-muted-foreground" />,
  UNKNOWN: <HelpCircle className="h-4 w-4 text-destructive" />,
};

const MembersOrganizationSettings = () => {
  const auth = useAuth();
  const dispatch = useDispatch();
  const token = window.localStorage.getItem(
    localStorageConstants.accessTokenKey
  );

  const organization = useSelector(
    (state: any) => state.activeOrganization.activeOrganization
  );
  const { id: organizationId } = organization;
  const organizationMembers = useSelector(
    (state: any) => state.activeOrganization.organizationMembers
  );
  const isFetchingMembers = useSelector(
    (state: any) => state.activeOrganization.isFetchingMembers
  );

  const [searchText, setSearchText] = useState("");
  const [filteredOrganizationMembers, setFilteredOrganizationMembers] =
    useState<MemberRow[]>([]);
  const [selectedUserForAction, setSelectedUserForAction] =
    useState<MemberRow | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const members = organizationMembers.filter(
    (member: MemberRow) => member.user.email !== null
  );
  const userRole = members.find(
    (member: MemberRow) => member.user.email === (auth as any).user.email
  )?.role?.name;
  const allowedRoles = getAllowedRoles(userRole);

  const membersWithoutAgents = organizationMembers.filter(
    (member: MemberRow) => {
      return member.user?.userType?.name !== "GENDOX_AGENT";
    }
  );

  useEffect(() => {
    if (organizationId) {
      (dispatch as any)(
        (fetchOrganizationMembers as any)({ organizationId, token })
      );
    }
  }, [organizationId]);

  useEffect(() => {
    if (!searchText) {
      setFilteredOrganizationMembers(membersWithoutAgents);
    }
  }, [organizationMembers, searchText]);

  const handleSearch = (searchValue: string) => {
    setSearchText(searchValue);
    const searchRegex = new RegExp(escapeRegExp(searchValue), "i");

    const filteredRows = membersWithoutAgents.filter((row: MemberRow) => {
      return (
        searchRegex.test(row.user.name || "") ||
        searchRegex.test(row.user.userName || "") ||
        searchRegex.test(row.user.email || "") ||
        (row.user.phone && searchRegex.test(row.user.phone)) ||
        searchRegex.test(row.role?.name || "") ||
        searchRegex.test(row.user.userType.name || "")
      );
    });

    setFilteredOrganizationMembers(
      searchValue.length ? filteredRows : membersWithoutAgents
    );
  };

  const handleDeleteConfirmOpen = (row: MemberRow) => {
    setSelectedUserForAction(row);
    setConfirmDelete(true);
  };

  const handleDeleteConfirmClose = () => {
    setConfirmDelete(false);
  };

  const handleChangeUserRole = async (
    row: MemberRow,
    newRole: string
  ) => {
    const data = {
      userOrganizationId: row.id,
      roleName: newRole,
    };

    (dispatch as any)(
      (updateMemberRole as any)({
        organizationId,
        userId: row.user.id,
        data,
        token,
      })
    )
      .unwrap()
      .then(() => {
        toast.success("Role updated successfully");
      })
      .catch((error: any) => {
        console.error("Failed to update user role:", error);
        toast.error(
          `Failed to update user role. Error: ${getErrorMessage(error)}`
        );
      });
  };

  const handleDeleteUser = async () => {
    if (selectedUserForAction) {
      (dispatch as any)(
        (removeOrganizationMember as any)({
          organizationId,
          userId: selectedUserForAction.user.id,
          token,
        })
      )
        .unwrap()
        .then(() => {
          toast.success("User deleted successfully");
          (dispatch as any)(
            (fetchOrganizationMembers as any)({ organizationId, token })
          );
        })
        .catch((error: any) => {
          console.error("Failed to delete user:", error);
        });
      setConfirmDelete(false);
    }
  };

  const columns: ColumnDef<MemberRow>[] = useMemo(
    () => [
      {
        accessorKey: "name",
        header: "NAME",
        cell: ({ row }) => {
          const member = row.original;
          return (
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-semibold">
                {(member.user.name || member.user.userName || "?")
                  .charAt(0)
                  .toUpperCase()}
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-sm">
                  {member.user.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {member.user?.userName || ""}
                </span>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "email",
        header: "EMAIL",
        cell: ({ row }) => (
          <span className="text-sm">{row.original.user.email}</span>
        ),
      },
      {
        accessorKey: "role",
        header: "ORGANIZATION ROLE",
        cell: ({ row }) => {
          const role = row.original.role?.name || "UNKNOWN";
          const status =
            memberRoleStatus[role] ||
            memberRoleStatus.UNKNOWN;

          return (
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-sm">
                {roleIconMap[role] || roleIconMap.UNKNOWN}
                {status.title}
              </span>

              {userRole !== "ROLE_READER" &&
                roleRankMap[userRole] >=
                  (roleRankMap[row.original.role?.name || "UNKNOWN"] || 0) && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <ArrowLeftRight className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="center">
                      {allowedRoles
                        .filter(
                          (roleKey: string) =>
                            roleKey !== row.original.role?.name &&
                            roleKey !== "UNKNOWN"
                        )
                        .map((roleKey: string) => {
                          const roleStatus = memberRoleStatus[roleKey];
                          return (
                            <DropdownMenuItem
                              key={roleKey}
                              onClick={() =>
                                handleChangeUserRole(row.original, roleKey)
                              }
                            >
                              <span className="mr-2">
                                {roleIconMap[roleKey] || roleIconMap.UNKNOWN}
                              </span>
                              {roleStatus ? roleStatus.title : roleKey}
                            </DropdownMenuItem>
                          );
                        })}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
            </div>
          );
        },
      },
      {
        accessorKey: "userType",
        header: "USER TYPE",
        cell: ({ row }) => {
          const userType = row.original.user.userType.name;
          const status =
            (userTypeStatus as any)[userType] ||
            (userTypeStatus as any).UNKNOWN;
          return (
            <Badge variant="outline">
              {status.title}
            </Badge>
          );
        },
      },
      {
        accessorKey: "phone",
        header: "PHONE",
        cell: ({ row }) => (
          <span className="text-sm">{row.original.user.phone}</span>
        ),
      },
      {
        id: "actions",
        header: "",
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
    ],
    [userRole, allowedRoles]
  );

  return (
    <Card
      className={cn("pt-6 pb-6 transition-all duration-300", isFetchingMembers && "blur-sm")}
    >
      {/* Search toolbar */}
      <div className="flex flex-wrap items-center justify-end gap-2 px-4 pb-4">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search members..."
            value={searchText}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-8 pr-8 h-9 w-full sm:w-64"
          />
          {searchText && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleSearch("")}
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredOrganizationMembers}
        pageSize={10}
        pageSizeOptions={[10, 25, 50]}
      />

      <DeleteConfirmDialog
        open={confirmDelete}
        onClose={handleDeleteConfirmClose}
        onConfirm={handleDeleteUser}
        title="Confirm Deletion User"
        contentText={`Are you sure you want to delete ${
          (selectedUserForAction as any)?.name ||
          (selectedUserForAction as any)?.userName ||
          "this user"
        }? This action cannot be undone.`}
        confirmButtonText="Remove Member"
        cancelButtonText="Cancel"
      />
    </Card>
  );
};

export default MembersOrganizationSettings;
