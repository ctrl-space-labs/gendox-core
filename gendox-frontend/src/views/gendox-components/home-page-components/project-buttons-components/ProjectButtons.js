import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useRouter } from "next/router";
import { useSettings } from "src/@core/hooks/useSettings";
import Modal from "@mui/material/Modal";
import Box from "@mui/material/Box";
import CardContent from "@mui/material/CardContent";
import Grid from "@mui/material/Grid";
import Button from "@mui/material/Button";
import Icon from "src/@core/components/icon";
import Link from "next/link";
import Tooltip from "@mui/material/Tooltip";

import UploaderDocument from "src/views/gendox-components/home-page-components/project-buttons-components/UploaderDocument";

const ProjectButtons = () => {
  const project = useSelector((state) => state.activeProject.projectDetails);
  const router = useRouter();
  const { settings } = useSettings();
  const isDemo = settings.isDemo;
  const [showUploader, setShowUploader] = useState(false);
  const handleOpenUploader = () => setShowUploader(true);
  const handleCloseUploader = () => setShowUploader(false);

  const handleCreateDocument = () => {
    router.push(
      `/gendox/create-document/?organizationId=${project.organizationId}&projectId=${project.id}`
    );
  };

  const buttons = [
    {
      text: "NEW DOCUMENT",
      action: handleCreateDocument,
      href: `/gendox/create-document/?organizationId=${project.organizationId}&projectId=${project.id}`,
      isDemoOff: true,
    },
    {
      text: "UPLOAD DOCUMENT",
      action: handleOpenUploader,
      href: "#",
      isDemoOff: false,
    },
    // { text: "NEW TEMPLATE", action: () => {}, href: "#", isDemoOff: true },
    // { text: "UPLOAD TEMPLATE", action: () => {}, href: "#", isDemoOff: true },
  ];

  return (
    <Grid container spacing={6}>
      <CardContent>
        <Grid container spacing={2}>
          {buttons.map((button, index) => (
            <Grid item key={index}>
              {isDemo && button.isDemoOff ? (
                <Tooltip title="Feature not available in demo mode">
                  <span>
                    <Button
                      variant="outlined"
                      color="primary"
                      size="large"
                      fullWidth
                      disabled={isDemo}
                    >
                      <Icon icon="mdi:plus" />
                      {button.text}
                    </Button>
                  </span>
                </Tooltip>
              ) : (
                <Link href={button.href} passHref>
                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={button.action}
                    fullWidth
                  >
                    <Icon icon="mdi:plus" />
                    {button.text}
                  </Button>
                </Link>
              )}
            </Grid>
          ))}
        </Grid>
      </CardContent>
      <Modal
        open={showUploader}
        onClose={handleCloseUploader}
        aria-labelledby="simple-modal-title"
        aria-describedby="simple-modal-description"
        disableEnforceFocus
        disableAutoFocus
        sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        <Box sx={{ outline: "none", p: 2, bgcolor: "background.paper" }}>
          <UploaderDocument closeUploader={handleCloseUploader} />
        </Box>
      </Modal>
    </Grid>
  );
};

export default ProjectButtons;
