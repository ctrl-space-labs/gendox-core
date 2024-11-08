// ** React Imports
import React from "react";
import { Divider } from "@mui/material";

// ** MUI Imports
import Card from "@mui/material/Card";

// ** Custom Component Import
import ApiKeysAdvancedOrganizationSettings from "./advanced-components/ApiKeysAdvancedOrganizationSettings";
import AiModelProviderKeyAdvancedOrganizationSettings from "./advanced-components/AiModelProviderKeyAdvancedOrganizationSettings";

const AdvancedOrganizationSettings = () => {
  return (
    <Card>
      <ApiKeysAdvancedOrganizationSettings />
      <Divider sx={{ m: 10 }} />
      <AiModelProviderKeyAdvancedOrganizationSettings />
    </Card>
  );
};

export default AdvancedOrganizationSettings;
