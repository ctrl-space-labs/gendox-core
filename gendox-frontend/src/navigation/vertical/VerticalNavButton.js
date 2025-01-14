import React from "react";
import Button from "@mui/material/Button";
import { useRouter } from "next/router";
import { styled } from "@mui/material/styles";
import { useDispatch, useSelector } from "react-redux";
import Icon from "src/@core/components/icon";
import Tooltip from "@mui/material/Tooltip";
import Box from "@mui/material/Box";
import Link from "next/link";

const StyledButton = styled(Button)(({ theme, variant }) => ({
  margin: theme.spacing(2), // Adds space around the button
  width: `calc(95% - ${theme.spacing(2)})`, // Almost full width, adjust the spacing as needed
  ...(variant === "contained" && {
    padding: theme.spacing(4), // Makes the button larger if the variant is 'contained'
    fontSize: "1.2rem",
    "& .MuiButton-startIcon": {
      marginRight: theme.spacing(5), // Adds space between icon and title for 'contained' variant
    },
  }),
}));

// Button component for Chat
const ChatButton = () => {
  const router = useRouter();
  const { organizationId, projectId } = router.query;
  const project = useSelector((state) => state.activeProject.projectDetails);

  const chatUrl = project && project.projectAgent && project.projectAgent.userId
  ? `/gendox/chat/?organizationId=${organizationId}&threadId=${project.projectAgent.userId}&projectId=${project.id}`
  : `/gendox/chat/?organizationId=${organizationId}&projectId=${projectId}`;

  return (
    <Box mt={3} mb={3}>
      {" "}
      {/* Add margin top and bottom */}
      <Link href={chatUrl} passHref>
        <StyledButton
          variant="contained"
          startIcon={<Icon icon="mdi:creation" />}
        >
          Chat
        </StyledButton>
      </Link>
    </Box>
  );
};

// Button component for New Project
const NewProjectButton = () => {
  const router = useRouter();
  const { organizationId } = router.query;

  return (
    <Box mt={3} mb={3}>
      {" "}
      {/* Add margin top and bottom */}
      <Tooltip title="New Project">
        <Link
          href={`/gendox/create-project/?organizationId=${organizationId}`}
          passHref
        >
          <StyledButton variant="outlined" startIcon={<Icon icon="mdi:plus" />}>
            {/* New Project */}
          </StyledButton>
        </Link>
      </Tooltip>
    </Box>
  );
};

export default {
  ChatButton,
  NewProjectButton,
};
