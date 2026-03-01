import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Settings, Users, Wrench } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

import GeneralOrganizationSettings from "@/views/pages/organization-settings/GeneralOrganizationSettings";
import MembersOrganizationSettings from "@/views/pages/organization-settings/MembersOrganizationSettings";
import AdvancedOrganizationSettings from "@/views/pages/organization-settings/AdvancedOrganizationSettings";

const OrganizationSettingsCard = () => {
  const [value, setValue] = useState("general");

  const router = useRouter();
  const { tab } = router.query;

  useEffect(() => {
    if (
      tab === "advancedSettings" ||
      tab === "members" ||
      tab === "general"
    ) {
      setValue(tab as string);
    }
  }, [tab]);

  return (
    <Card className="bg-accent/50 pt-8">
      <Tabs value={value} onValueChange={setValue}>
        <TabsList className="w-full grid grid-cols-3 border-b border-border rounded-none bg-transparent h-auto p-0">
          <TabsTrigger
            value="general"
            className="flex items-center gap-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none py-3"
          >
            <Settings className="h-5 w-5" />
            <span>GENERAL</span>
          </TabsTrigger>

          <TabsTrigger
            value="members"
            className="flex items-center gap-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none py-3"
          >
            <Users className="h-5 w-5" />
            <span>MEMBERS</span>
          </TabsTrigger>

          <TabsTrigger
            value="advancedSettings"
            className="flex items-center gap-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none py-3"
          >
            <Wrench className="h-5 w-5" />
            <span>ADVANCED SETTINGS</span>
          </TabsTrigger>
        </TabsList>

        <CardContent className="pt-6">
          <TabsContent value="general">
            <GeneralOrganizationSettings />
          </TabsContent>

          <TabsContent value="members">
            <MembersOrganizationSettings />
          </TabsContent>

          <TabsContent value="advancedSettings">
            <AdvancedOrganizationSettings />
          </TabsContent>
        </CardContent>
      </Tabs>
    </Card>
  );
};

export default OrganizationSettingsCard;
