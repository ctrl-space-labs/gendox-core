import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useSelector, useDispatch } from "react-redux";
import authConfig from "src/configs/auth";
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
import DeleteConfirmDialog from "src/utils/dialogs/DeleteConfirmDialog";


const GeneralProjectSettings = () => {
  const router = useRouter();
  const storedToken = window.localStorage.getItem(
    authConfig.storageTokenKeyName
  );
  
  const dispatch = useDispatch();
  const project = useSelector((state) => state.activeProject.projectDetails);
  const provenAiUrl = process.env.NEXT_PUBLIC_PROVEN_AI_URL;

  const [autoTraining, setAutoTraining] = useState(!!project.autoTraining);
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [error, setError] = useState("");
  const [isBlurring, setIsBlurring] = useState(true);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

  useEffect(() => {
    if (project) {
      // Initialize state with project data when available
      setAutoTraining(!!project.autoTraining);
      setName(project.name);
      setDescription(project.description);
      setIsBlurring(false); 
    }
  }, [project]);


  const handleNameChange = (event) => setName(event.target.value);
  const handleDescriptionChange = (event) => setDescription(event.target.value);
  const handleAutoTrainingChange = (event) =>
    setAutoTraining(event.target.checked);
  const handleCloseSnackbar = () => setOpenSnackbar(false);
  const handleAlertClose = () => setAlertOpen(false);

  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default form submission

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
      const path = `/gendox/project-settings/?organizationId=${project.organizationId}&projectId=${project.id}`;
      router.push(path);
    } catch (error) {
      console.error("Failed to update project", error);
      setError("Failed to update project: " + error.message);
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


  const handleDeleteClickOpen = () => setOpenDeleteDialog(true);
  const handleDeleteClose = () => setOpenDeleteDialog(false);

  const handleDeleteProject = async () => {
    try {
      await projectService.deactivateProjectById(
        project.organizationId,
        project.id,
        storedToken
      );
      console.log("Project Deactivation successful");
      setAlertMessage("Project deleted successfully!");
      setAlertOpen(true);
      handleDeleteClose(false);
      setTimeout(() => {
        router.push("/gendox/home");
      }, 2000);  
    } catch (error) {
      console.error("Failed to delete project", error);
      setAlertMessage("Failed to delete the project!");
      setAlertOpen(true);

      setTimeout(() => {
        router.push("/gendox/home");
      }, 2000); 
    }
  };

  return (
    <Card>
      <CardHeader />
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
      <form onSubmit={handleSubmit}>
        <CardContent>
          <Grid container spacing={5}>
            <Grid item xs={12} sm={12} md={4}>
              <TextField
                fullWidth
                id="project-name"
                label="Name"
                value={name}                
                onChange={handleNameChange}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={2}>
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
            <Grid
              item
              xs={12}
              sm={6}
              sx={{
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "flex-end",
              }}
            >
              <Tooltip title="Training Projects">
                <Button
                  size="large"
                  variant="contained"
                  onClick={handleTrainingClick}
                  sx={{ ml: 2 }}
                >
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <Box component="span" sx={{ mr: 5 }}>
                      Training
                    </Box>
                    <Icon icon="mdi:brain" />{" "}
                  </Box>
                </Button>
              </Tooltip>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                rows={4}
                multiline
                label="Description"
                id="project-description"
                value={description}
                onChange={handleDescriptionChange}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={6}></Grid>

            <Grid
              item
              xs={12}
              sm={6}
              sx={{
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "flex-end",
              }}
            >
              <Button
                size="large"
                variant="outlined"
                href={`${provenAiUrl}/provenAI/data-pods-control/?organizationId=${project.organizationId}&dataPodId=${project.id}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Box component="span" sx={{ mr: 5 }}>
                  Go to Proven-Ai
                </Box>
                <Icon icon="mdi:arrow-right-thin" />{" "}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
        <Divider sx={{ m: "0 !important" }} />

        <CardActions sx={{ justifyContent: "flex-end", p: 2 }}>
          
        <Button
            size="large"
            variant="outlined"
            color="error"
            onClick={handleDeleteClickOpen}
            sx={{ px: 22, py: 3 }}
          >
            Delete
          </Button>
          
          <Button
            size="large"
            type="submit"
            onClick={handleSubmit}
            variant="contained"
            sx={{ px: 22, py: 3 }}
          >
            Save Changes
          </Button>
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
      <DeleteConfirmDialog
          open={openDeleteDialog}
          onClose={handleDeleteClose}
          onConfirm={handleDeleteProject}
          title="Delete Project"
          contentText={`Are you sure you want to delete ${project.name}? All member users will be removed and you will lose access to all related documents. This action cannot be undone.`}
          confirmButtonText="Delete"
          cancelButtonText="Cancel"
        />
    </Card>
  );
};

export default GeneralProjectSettings;
