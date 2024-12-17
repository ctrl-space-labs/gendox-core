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
import toast from "react-hot-toast";
import CircularProgress from "@mui/material/CircularProgress";
import { getErrorMessage } from "src/utils/errorHandler";

const ProjectCreate = () => {
  const auth = useAuth();
  const dispatch = useDispatch();
  const router = useRouter();
  const { organizationId } = router.query;

  const storedToken = window.localStorage.getItem(
    authConfig.storageTokenKeyName
  );

  const [autoTraining, setAutoTraining] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleNameChange = (event) => setName(event.target.value);
  const handleDescriptionChange = (event) => setDescription(event.target.value);
  const handleAutoTrainingChange = (event) =>
    setAutoTraining(event.target.checked);

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
      toast.success("Project created successfully");
      router.reload(
        `/gendox/project-settings/?organizationId=${organizationId}&projectId=${response.data.id}`
      );
    } catch (error) {
      toast.error(`Project did not create. Error: ${getErrorMessage(error)}`);
      console.error("Failed to update project", error);
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
              <Button
                size="large"
                type="submit"
                sx={{ mr: 2 }}
                variant="contained"
              >
                Submit
              </Button>
              <Button
                size="large"
                type="reset"
                color="secondary"
                variant="outlined"
              >
                Reset
              </Button>
            </>
          )}
        </CardActions>
      </form>
    </Card>
  );
};

export default ProjectCreate;
