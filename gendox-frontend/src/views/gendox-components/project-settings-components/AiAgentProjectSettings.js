// ** React Imports
import { useState, useEffect } from "react";

// ** MUI Imports
import Card from "@mui/material/Card";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import CardHeader from "@mui/material/CardHeader";
import InputLabel from "@mui/material/InputLabel";
import Typography from "@mui/material/Typography";
import CardContent from "@mui/material/CardContent";
import CardActions from "@mui/material/CardActions";
import FormControl from "@mui/material/FormControl";
import Icon from "src/@core/components/icon";
import Select from "@mui/material/Select";
import InputAdornment from "@mui/material/InputAdornment";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";

// ** Demo Components Imports
import CustomRadioIcons from "src/@core/components/custom-radio/icons";

import { useRouter } from "next/router";
import { useSelector, useDispatch } from "react-redux";

// ** Config and Services
import authConfig from "src/configs/auth";
import projectService from "src/gendox-sdk/projectService";

const AiAgentProjectSettings = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const storedToken = window.localStorage.getItem(
    authConfig.storageTokenKeyName
  );
  if (!storedToken) {
    console.error("No token found");
    return;
  }
  const project = useSelector((state) => state.activeProject.projectDetails);
  const provenAiUrl = process.env.NEXT_PUBLIC_PROVEN_AI_URL;

  const { id: projectId, organizationId } = project; 

  // State for AI models categorized
  const [semanticModels, setSemanticModels] = useState([]);
  const [completionModels, setCompletionModels] = useState([]);
  const [moderationModels, setModerationModels] = useState([]);

  const [semanticSearchModel, setSemanticSearchModel] = useState(
    project.projectAgent.semanticSearchModel.name
  );
  const [completionModel, setCompletionModel] = useState(
    project.projectAgent.completionModel.name
  );

  const [moderationModel, setModerationModel] = useState(
    project.projectAgent.moderation
      ? project.projectAgent.moderation.name
      : "OPENAI_MODERATION"
  );
  const [documentSplitterType, setDocumentSplitterType] = useState(
    project.projectAgent.documentSplitterType.name
  );
  const [maxToken, setMaxToken] = useState(project.projectAgent.maxToken);
  const [temperature, setTemperature] = useState(
    project.projectAgent.temperature
  );
  const [topP, setTopP] = useState(project.projectAgent.topP);
  const [agentBehavior, setAgentBehavior] = useState(
    project.projectAgent.agentBehavior
  );
  const [moderationCheck, setModerationCheck] = useState(
    project.projectAgent.moderationCheck
  );

  const [selected, setSelected] = useState(
    project.projectAgent.privateAgent ? "private" : "public"
  );
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("info");

  const AgentPrivate = [
    {
      value: "public",
      title: "Public",
      isSelected: true,
      content: "Anyone can use",
    },
    {
      value: "private",
      title: "Private",
      content: "Only within team",
    },
  ];

  const AgentPrivateIcons = [
    {
      icon: "mdi:lock-open",
      iconProps: { fontSize: "2rem", style: { marginBottom: 8 } },
    },
    {
      icon: "mdi:lock",
      iconProps: { fontSize: "2rem", style: { marginBottom: 8 } },
    },
  ];

  // Fetch AI models on component mount
  useEffect(() => {
    const fetchAiModels = async () => {
      try {
        const aiModelsResponse = await projectService.getAiModels(
          organizationId,
          projectId,
          storedToken
        );

        // Categorize AI models
        const semantic = aiModelsResponse.data.filter(
          (model) => model.aiModelType.name === "SEMANTIC_SEARCH_MODEL"
        );
        const completion = aiModelsResponse.data.filter(
          (model) => model.aiModelType.name === "COMPLETION_MODEL"
        );
        const moderation = aiModelsResponse.data.filter(
          (model) => model.aiModelType.name === "MODERATION_MODEL"
        );

        setSemanticModels(semantic);
        setCompletionModels(completion);
        setModerationModels(moderation);
      } catch (error) {
        console.error("Failed to fetch AI models", error);
        setOpenSnackbar(true);
        setSnackbarMessage("Failed to fetch AI models");
        setSnackbarSeverity("error");
      }
    };

    fetchAiModels();
  }, [organizationId, projectId, storedToken]);

  const handleSemanticSearchModelChange = (event) => {
    setSemanticSearchModel(event.target.value);
  };

  const handleCompletionModelChange = (event) => {
    setCompletionModel(event.target.value);
  };

  const handleModerationModelChange = (event) => {
    setModerationModel(event.target.value);
  };

  const handleDocumentSplitterTypeChange = (event) => {
    setDocumentSplitterType(event.target.value);
  };

  const handleAccessChange = (prop) => {
    setSelected(typeof prop === "string" ? prop : prop.target.value);
  };

  const handleMaxTokenChange = (event) => {
    setMaxToken(parseInt(event.target.value, 10));
  };

  const handleTemperatureChange = (event) => {
    setTemperature(parseFloat(event.target.value));
  };

  const handleTopPChange = (event) => {
    setTopP(parseFloat(event.target.value));
  };

  const handleAgentBehaviorChange = (event) => {
    setAgentBehavior(event.target.value);
  };

  const handleModerationCheckChange = (event) => {
    setModerationCheck(event.target.checked);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const updatedProjectPayload = {
        ...project,
        projectAgent: {
          ...project.projectAgent,
          semanticSearchModel: { name: semanticSearchModel },
          completionModel: { name: completionModel },
          moderation: { name: moderationModel },
          privateAgent: selected === "private",
          maxToken: maxToken,
          temperature: temperature,
          topP: topP,
          agentBehavior: agentBehavior,
          moderationCheck: moderationCheck,
        },
      };

      const response = await projectService.updateProject(
        organizationId,
        projectId,
        updatedProjectPayload,
        storedToken
      );

      setOpenSnackbar(true);
      setSnackbarMessage("Project updated successfully!");
      setSnackbarSeverity("success");
      const path = `/gendox/project-settings?organizationId=${organizationId}&projectId=${projectId}`;
      router.push(path);
    } catch (error) {
      console.error("Failed to update project", error);
      setOpenSnackbar(true);
      setSnackbarMessage("Failed to update project");
      setSnackbarSeverity("error");
    }
  };

  const handleCloseSnackbar = () => setOpenSnackbar(false);

  return (
    <Card>
      <CardHeader  />
      <form onSubmit={handleSubmit}>
        <CardContent>
          <Grid container spacing={5}>
            {/*******************   1 AI Model ******************/}
            <Grid item xs={12}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: "primary.main"  }}>
                1. AI Model
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Agent Name"
                value={project.projectAgent.agentName}
                placeholder="Leonard"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id="semantic-search-model">
                  Semantic Search Model
                </InputLabel>
                <Select
                  label="semantic-search-model"
                  value={semanticSearchModel}
                  id="semantic-search-model"
                  labelId="semantic-search-model"
                  onChange={handleSemanticSearchModelChange}
                >
                  {semanticModels.map((model) => (
                    <MenuItem key={model.id} value={model.name}>
                      {model.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id="completion-model">Completion Model</InputLabel>
                <Select
                  label="completion-model"
                  value={completionModel}
                  id="completion-model"
                  labelId="completion-model"
                  onChange={handleCompletionModelChange}
                >
                  {completionModels.map((model) => (
                    <MenuItem key={model.id} value={model.name}>
                      {model.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id="document-splitter-type">
                  Document Splitter{" "}
                </InputLabel>
                <Select
                  label="document-splitter-type"
                  value={documentSplitterType}
                  id="document-splitter-type"
                  labelId="document-splitter-type"
                  onChange={handleDocumentSplitterTypeChange}
                >
                  <MenuItem value="STATIC_WORD_COUNT_SPLITTER">
                    STATIC_WORD_COUNT_SPLITTER
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/*******************   2 Agent's Personality ******************/}
            <Grid item xs={12}>
              <Divider sx={{ mt: 5, mb: "0 !important" }} />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: "primary.main"  }}>
                2. Agent's Personality
              </Typography>
            </Grid>


            
            <Grid item xs={12} sm={6}>
              <Grid container spacing={4}>
              <Grid item xs={12} sm={6}>
                <TextField
                  id="max-tokens"
                  label="Max Tokens"
                  type="number"
                  defaultValue={maxToken}
                  onChange={handleMaxTokenChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">Tokens</InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  id="temperature"
                  label="Temperature"
                  type="number"
                  defaultValue={temperature}
                  onChange={handleTemperatureChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">temps °C</InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  id="top-p"
                  label="Top p"
                  type="number"
                  defaultValue={topP}
                  onChange={handleTopPChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">top P's</InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}></Grid>

              <Grid item xs={12} sm={6} sx={{ mb: 15 }}>
                <FormControlLabel
                  label="moderation-check"
                  control={
                    <Checkbox
                      checked={moderationCheck}
                      onChange={handleModerationCheckChange}
                      defaultChecked
                      name="basic-checked"
                    />
                  }
                />
              </Grid>

              {moderationCheck && (
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel id="moderation">Moderation</InputLabel>
                    <Select
                      label="moderation"
                      value={moderationModel}
                      id="moderation"
                      labelId="moderation"
                      onChange={handleModerationModelChange}
                    >
                      {moderationModels.map((model) => (
                        <MenuItem key={model.id} value={model.name}>
                          {model.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              )}
            </Grid>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
              fullWidth
                rows={10}
                multiline
                label="Agent Behavior"
                id="agent-behavior"
                defaultValue={agentBehavior}
                onChange={handleAgentBehaviorChange}
              />
            </Grid>

            {/*******************   3 Access ******************/}
            <Grid item xs={12}>
              <Divider sx={{ mt: 5, mb: "0 !important" }} />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: "primary.main"  }}>
                3. Access
              </Typography>
            </Grid>

            <Grid container spacing={4} item xs={12} sm={6}>
              {AgentPrivate.map((item, index) => (
                <CustomRadioIcons
                  key={index}
                  data={AgentPrivate[index]}
                  selected={selected}
                  icon={AgentPrivateIcons[index].icon}
                  name="custom-radios-icons"
                  handleChange={handleAccessChange}
                  gridProps={{ sm: 4, xs: 12 }}
                  iconProps={AgentPrivateIcons[index].iconProps}
                />
              ))}
            </Grid>
            <Grid item xs={12} sm={6} sx={{ display: 'flex', alignItems: 'flex-end'}}>
            
              <Button
                size="large"
                variant="outlined"
                href={`${provenAiUrl}/provenAi/agent-control/?organizationId=${organizationId}&agentId=${project.projectAgent.id}`} 
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

        <Divider sx={{ mt: 5, mb: "0 !important" }} />
        <CardActions sx={{ justifyContent: "flex-end", p: 2 }}>
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
    </Card>
  );
};

export default AiAgentProjectSettings;
