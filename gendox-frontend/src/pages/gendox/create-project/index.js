import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useSelector, useDispatch } from "react-redux";
import { useAuth } from "src/hooks/useAuth";
import authConfig from "src/configs/auth";
import projectService from "src/gendox-sdk/projectService";

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
import CircularProgress from "@mui/material/CircularProgress";

const ProjectCreate = () => {
  const auth = useAuth();
  const dispatch = useDispatch();
  const router = useRouter();
  const { organizationId } = router.query;

  const storedToken = window.localStorage.getItem(
    authConfig.storageTokenKeyName
  );
  console.log("AUTH", auth);

  const [autoTraining, setAutoTraining] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });

  const handleNameChange = (event) => setName(event.target.value);
  const handleDescriptionChange = (event) => setDescription(event.target.value);
  const handleAutoTrainingChange = (event) =>
    setAutoTraining(event.target.checked);
  const handleCloseSnackbar = () => setSnackbar({ ...snackbar, open: false });

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    const newProjectPayload = {
      organizationId,
      name,
      description,
      autoTraining,
    };

    try {
      const response = await projectService.createProject(
        organizationId,
        newProjectPayload,
        storedToken
      );

      
      

      setSnackbar({ open: true, message: 'Project created successfully!', severity: 'success' });
      router.push(`/gendox/project-settings?organizationId=${organizationId}&projectId=${response.data.id}`);
      
    } catch (error) {
      console.error("Failed to update project", error);
      setSnackbar({ open: true, message: 'Failed to create project', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader title="Create New Project" />
      <Divider sx={{ m: "0 !important" }} />
      <form onSubmit={handleSubmit}>
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                id="project-name"
                label="Name"
                value={name}
                onChange={handleNameChange}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                label="Auto-Training"
                control={<Checkbox checked={autoTraining} onChange={handleAutoTrainingChange} name="autoTraining" />}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                multiline
                rows={4}
                label="Description"
                id="project-description"
                value={description}
                onChange={handleDescriptionChange}
                fullWidth
              />
            </Grid>
          </Grid>
        </CardContent>
        <CardActions>
          {loading ? (
            <CircularProgress size={24} />
          ) : (
            <>
              <Button size="large" type="submit" sx={{ mr: 2 }} variant="contained">
                Submit
              </Button>
              <Button size="large" type="reset" color="secondary" variant="outlined">
                Reset
              </Button>
            </>
          )}
        </CardActions>
      </form>
      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Card>
  );
}


export default ProjectCreate;
