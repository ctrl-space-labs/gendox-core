import { useState } from "react"
import { Building2, Briefcase } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import UserOrganizationTab from "src/views/pages/user-profile/UserOrganizationTab"
import UserViewOverviewProjects from "src/views/pages/user-profile/UserViewOverviewProjects"

interface OrgProjectTabProps {
  userData: any
}

const OrgProjectTab = ({ userData }: OrgProjectTabProps) => {
  const [activeTab, setActiveTab] = useState("organizations")

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="w-full justify-start border-b rounded-none bg-transparent h-auto p-0">
        <TabsTrigger
          value="organizations"
          className="flex items-center gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 pb-3"
        >
          <Building2 className="h-4 w-4" />
          ORGANIZATIONS
        </TabsTrigger>
        <TabsTrigger
          value="projects"
          className="flex items-center gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 pb-3"
        >
          <Briefcase className="h-4 w-4" />
          PROJECTS
        </TabsTrigger>
      </TabsList>
      <div className="mt-6">
        <TabsContent value="organizations" className="mt-0">
          <UserOrganizationTab userData={userData} />
        </TabsContent>
        <TabsContent value="projects" className="mt-0">
          <UserViewOverviewProjects userData={userData} />
        </TabsContent>
      </div>
    </Tabs>
  )
}

export default OrgProjectTab
