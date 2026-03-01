import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import ApiKeysAdvancedOrganizationSettings from "./advanced-components/ApiKeysAdvancedOrganizationSettings";
import AiModelProviderKeyAdvancedOrganizationSettings from "./advanced-components/AiModelProviderKeyAdvancedOrganizationSettings";
import WebsitesAdvancedOrganizationSettings from "./advanced-components/WebsitesAdvancedOrganizationSettings";

const AdvancedOrganizationSettings = () => {
  return (
    <Card>
      <ApiKeysAdvancedOrganizationSettings />
      <Separator className="my-10" />
      <WebsitesAdvancedOrganizationSettings />
      <Separator className="my-10" />
      <AiModelProviderKeyAdvancedOrganizationSettings />
    </Card>
  );
};

export default AdvancedOrganizationSettings;
