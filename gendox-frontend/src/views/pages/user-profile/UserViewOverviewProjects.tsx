import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/router"
import { Briefcase } from "lucide-react"
import { ColumnDef } from "@tanstack/react-table"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { DataTable } from "@/components/ui/data-table"

interface Project {
  id: string
  name: string
  description?: string
  organizationId: string
}

interface UserViewOverviewProjectsProps {
  userData: any
}

const UserViewOverviewProjects = ({ userData }: UserViewOverviewProjectsProps) => {
  const router = useRouter()
  const [data, setData] = useState<Project[]>([])

  useEffect(() => {
    const projects = userData.organizations.flatMap((org: any) =>
      org.projects.map((project: any) => ({
        ...project,
        organizationId: org.id,
      }))
    )
    setData(projects)
  }, [userData.organizations])

  const columns: ColumnDef<Project>[] = useMemo(
    () => [
      {
        accessorKey: "name",
        header: "PROJECT",
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <Briefcase className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-primary font-medium">
              {row.original.name}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "description",
        header: "DESCRIPTION",
        cell: ({ row }) => (
          <span className="text-sm">{row.original.description}</span>
        ),
      },
    ],
    []
  )

  const handleRowClick = (row: Project) => {
    router.push(
      `/gendox/home/?organizationId=${row.organizationId}&projectId=${row.id}`
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Projects</CardTitle>
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

export default UserViewOverviewProjects
