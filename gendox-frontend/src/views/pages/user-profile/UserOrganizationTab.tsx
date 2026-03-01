import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/router"
import { Building2 } from "lucide-react"
import { ColumnDef } from "@tanstack/react-table"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { DataTable } from "@/components/ui/data-table"
import { Progress } from "@/components/ui/progress"

interface Organization {
  id: string
  name: string
  address?: string
  phone?: string
  projects: any[]
}

interface UserOrganizationTabProps {
  userData: any
}

const UserOrganizationTab = ({ userData }: UserOrganizationTabProps) => {
  const router = useRouter()
  const [data, setData] = useState<Organization[]>(userData.organizations || [])

  useEffect(() => {
    setData(userData.organizations || [])
  }, [userData.organizations])

  const columns: ColumnDef<Organization>[] = useMemo(
    () => [
      {
        accessorKey: "name",
        header: "ORGANIZATION",
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-primary font-medium">
              {row.original.name}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "projects",
        header: "PROJECTS",
        cell: ({ row }) => (
          <div className="w-full">
            <p className="text-sm">{row.original.projects.length}</p>
            <Progress
              value={Math.min(row.original.projects.length * 10, 100)}
              className="h-1 mt-1"
            />
          </div>
        ),
      },
      {
        accessorKey: "address",
        header: "ADDRESS",
        cell: ({ row }) => (
          <span className="text-sm">{row.original.address}</span>
        ),
      },
      {
        accessorKey: "phone",
        header: "PHONE",
        cell: ({ row }) => (
          <span className="text-sm">{row.original.phone}</span>
        ),
      },
    ],
    []
  )

  const handleRowClick = (row: Organization) => {
    router.push(`/gendox/home/?organizationId=${row.id}`)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Organizations</CardTitle>
      </CardHeader>
      <CardContent>
        <DataTable
          columns={columns}
          data={data}
          onRowClick={handleRowClick}
        />
      </CardContent>
    </Card>
  )
}

export default UserOrganizationTab
