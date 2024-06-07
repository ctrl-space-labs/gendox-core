// ** React Imports
import { useState, useEffect } from "react";

// ** Next Import
import { useRouter } from "next/router";

// ** Redux
import { useSelector, useDispatch } from "react-redux";

// ** Config
import authConfig from "src/configs/auth";

// ** MUI Imports
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import Card from "@mui/material/Card";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import CardHeader from "@mui/material/CardHeader";
import CardContent from "@mui/material/CardContent";
import CardActions from "@mui/material/CardActions";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Icon from "src/@core/components/icon";
import Tooltip from "@mui/material/Tooltip";

import projectService from "src/gendox-sdk/projectService";
import documentService from "src/gendox-sdk/documentService";

const GeneralProjectSettings = () => {
  const router = useRouter();
  const storedToken = window.localStorage.getItem(
    authConfig.storageTokenKeyName
  );
  if (!storedToken) {
    console.error("No token found");
    return;
  }
  const project = useSelector((state) => state.activeProject.projectDetails);

  // Explicitly handle all falsey values (including undefined and null) as false
  const [autoTraining, setAutoTraining] = useState(!!project.autoTraining);
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");

  // Handlers for form inputs
  const handleNameChange = (event) => setName(event.target.value);
  const handleDescriptionChange = (event) => setDescription(event.target.value);
  const handleAutoTrainingChange = (event) =>
    setAutoTraining(event.target.checked);
  const handleCloseSnackbar = () => setOpenSnackbar(false);

  // submit put request
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default form submission

    // Construct the JSON project
    const updatedProjectPayload = {
      id: project.id,
      organizationId: project.organizationId,
      name,
      description,
      autoTraining,
      projectAgent: project.projectAgent,
    };

    try {
      const response = await projectService.updateProject(
        project.organizationId,
        project.id,
        updatedProjectPayload,
        storedToken
      );
      console.log("Update successful", response);
      setOpenSnackbar(true);
      const path = `/gendox/project-settings?organizationId=${project.organizationId}&projectId=${project.id}`;
      router.push(path);
    } catch (error) {
      console.error("Failed to update project", error);
    }
  };

  const handleTrainingClick = () => {
    documentService
      .triggerJobs(project.organizationId, project.id, storedToken)
      .then((response) => {
        console.log(response);
        setAlertMessage("Training triggered successfully!");
        setAlertOpen(true);
      })
      .catch((error) => {
        console.log(error);
        setAlertMessage("Error triggering training: " + error.message);
        setAlertOpen(true);
      });
  };

  const handleAlertClose = () => {
    setAlertOpen(false);
  };

  return (
    <Card>
      <CardHeader title="Project s settings" />
      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity="success"
          sx={{ width: "100%" }}
        >
          Project updated successfully!
        </Alert>
      </Snackbar>
      <Divider sx={{ m: "0 !important" }} />
      <form onSubmit={handleSubmit}>
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                id="project-name"
                label="Name"
                // value={project.name}
                defaultValue={project.name}
                onChange={handleNameChange}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControlLabel
                label="auto-training"
                control={
                  <Checkbox
                    checked={autoTraining}
                    onChange={handleAutoTrainingChange}
                    name="autoTraining"
                  />
                }
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                rows={4}
                multiline
                label="Description"
                id="project-description"
                defaultValue={project.description}
                onChange={handleDescriptionChange}
              />
            </Grid>
          </Grid>
        </CardContent>
        <Divider sx={{ m: "0 !important" }} />
        <CardActions>
          <Box sx={{ flexGrow: 1 }}>
            <Button
              size="large"
              type="submit"
              sx={{ mr: 2 }}
              onClick={handleSubmit}
              variant="contained"
            >
              Submit
            </Button>
            <Button
              type="reset"
              size="large"
              color="secondary"
              variant="outlined"
            >
              Reset
            </Button>
          </Box>

          <Tooltip title="Training Projects">
            <Button
              size="large"
              variant="contained"
              onClick={handleTrainingClick}
              sx={{ ml: 2 }}
            >
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Icon icon="mdi:brain" />{" "}
                <Box component="span" sx={{ ml: 5 }}>
                  Training
                </Box>
              </Box>
            </Button>
          </Tooltip>
        </CardActions>
      </form>
      <Snackbar
        open={alertOpen}
        autoHideDuration={6000}
        onClose={handleAlertClose}
      >
        <Alert
          onClose={handleAlertClose}
          severity="success"
          sx={{ width: "100%" }}
        >
          {alertMessage}
        </Alert>
      </Snackbar>
    </Card>
  );
};

export default GeneralProjectSettings;
