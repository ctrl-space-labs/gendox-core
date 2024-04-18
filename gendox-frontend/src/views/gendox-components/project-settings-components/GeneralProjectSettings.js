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

import projectService from "src/gendox-sdk/projectService";

const GeneralProjectSettings = () => {
  const router = useRouter();
  const storedToken = window.localStorage.getItem(authConfig.storageTokenKeyName);
    if (!storedToken) {
      console.error('No token found');      
      return;
    }
  const project = useSelector((state) => state.activeProject.activeProject);

  // Explicitly handle all falsey values (including undefined and null) as false
  const [autoTraining, setAutoTraining] = useState(!!project.autoTraining);
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description);
  const [openSnackbar, setOpenSnackbar] = useState(false);

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
      const path = `/gendox/project-settings?organizationId=${project.organizationId}&projectId=${project.id}`
      router.push(path);
    } catch (error) {
      console.error("Failed to update project", error);
    }
  };

  return (
    <Card>
      <CardHeader title="Project s Agent settings" />
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
          <Grid>
            <Grid item xs={12} sm={6} sx={{ mb: 15 }}>
              <TextField
                required
                id="project-name"
                label="Name"
                value={project.name}
                onChange={handleNameChange}
              />
            </Grid>

            <Grid item xs={12} sm={6} sx={{ mb: 15 }}>
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
        </CardActions>
      </form>
    </Card>
  );
};

export default GeneralProjectSettings;
