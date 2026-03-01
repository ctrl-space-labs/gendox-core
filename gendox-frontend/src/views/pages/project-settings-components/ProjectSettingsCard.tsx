import { useState } from "react"
import { Settings, Users, Bot } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import GeneralProjectSettings from "@/views/pages/project-settings-components/GeneralProjectSettings"
import MembersProjectSettings from "@/views/pages/project-settings-components/MembersProjectSettings"
import AiAgentProjectSettings from "@/views/pages/project-settings-components/AiAgentProjectSettings"

const ProjectSettingsCard = () => {
  const [value, setValue] = useState("general")

  return (
    <Card className="bg-muted/50">
      <CardHeader />
      <Tabs value={value} onValueChange={setValue} className="w-full">
        <TabsList className="w-full grid grid-cols-3 border-b rounded-none">
          <TabsTrigger value="general" className="flex items-center gap-3">
            <Settings className="h-5 w-5" />
            <span>GENERAL</span>
          </TabsTrigger>

          <TabsTrigger value="members" className="flex items-center gap-3">
            <Users className="h-5 w-5" />
            <span>MEMBERS</span>
          </TabsTrigger>

          <TabsTrigger value="ai-agent" className="flex items-center gap-3">
            <Bot className="h-5 w-5" />
            <span>AI AGENT</span>
          </TabsTrigger>
        </TabsList>

        <CardContent>
          <TabsContent value="general">
            <GeneralProjectSettings />
          </TabsContent>

          <TabsContent value="members">
            <MembersProjectSettings />
          </TabsContent>

          <TabsContent value="ai-agent">
            <AiAgentProjectSettings />
          </TabsContent>
        </CardContent>
      </Tabs>
    </Card>
  )
}

export default ProjectSettingsCard
