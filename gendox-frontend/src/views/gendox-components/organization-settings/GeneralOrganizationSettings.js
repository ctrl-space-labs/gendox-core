// ** React Imports
import React from "react";
import { Divider } from "@mui/material";

// ** MUI Imports
import Card from "@mui/material/Card";

// ** Custom Component Import
import InformationGeneralOrganizationSettings from "./general-components/InformationGeneralOrganizationSettings";
import PlansGeneralOrganizationSettings from "./general-components/PlansGeneralOrganizationSettings";

const GeneralOrganizationSettings = () => {
  return (
    <Card>
      <InformationGeneralOrganizationSettings />
      <Divider sx={{ m: 10 }} />
      <PlansGeneralOrganizationSettings />
    </Card>
    
  );
};

export default GeneralOrganizationSettings;
