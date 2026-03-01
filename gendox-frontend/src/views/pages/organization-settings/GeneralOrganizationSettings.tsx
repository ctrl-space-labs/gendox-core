import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import InformationGeneralOrganizationSettings from "./general-components/InformationGeneralOrganizationSettings";
import PlansGeneralOrganizationSettings from "./general-components/PlansGeneralOrganizationSettings";

const GeneralOrganizationSettings = () => {
  return (
    <Card>
      <InformationGeneralOrganizationSettings />
      <Separator className="my-10" />
      <PlansGeneralOrganizationSettings />
    </Card>
  );
};

export default GeneralOrganizationSettings;
