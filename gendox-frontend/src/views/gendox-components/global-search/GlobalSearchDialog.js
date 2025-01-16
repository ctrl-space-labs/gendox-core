// ** React Imports
import { useEffect, useCallback, useRef, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useRouter } from "next/router";
import CustomAvatar from "src/@core/components/mui/avatar";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import Box from "@mui/material/Box";
import MuiDialog from "@mui/material/Dialog";
import Typography from "@mui/material/Typography";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import List from "@mui/material/List";
import ListItemText from "@mui/material/ListItemText";
import IconButton from "@mui/material/IconButton";
import useMediaQuery from "@mui/material/useMediaQuery";
import Icon from "src/@core/components/icon";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import Button from "@mui/material/Button";
import Tooltip from "@mui/material/Tooltip";
import authConfig from "src/configs/auth";
import { styled, useTheme } from "@mui/material/styles";
import themeConfig from "src/configs/themeConfig";
import CircularProgress from "@mui/material/CircularProgress";
import { fetchCloserSectionsFromProject, resetCloserDocuments } from "src/store/apps/globalSearch/globalSearch";

// Custom Styled Components
const StyledDialog = styled(MuiDialog)({
  "& .MuiBackdrop-root": {
    backdropFilter: "blur(4px)",
  },
  "& .MuiDialog-paper": {
    overflow: "hidden",
    "&:not(.MuiDialog-paperFullScreen)": {
      height: "100%",
      maxHeight: 550,
    },
  },
});

const GlobalSearchDialog = ({ openDialog, setOpenDialog, user }) => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const router = useRouter();
  const storedToken = window.localStorage.getItem(
    authConfig.storageTokenKeyName
  );
  const fullScreenDialog = useMediaQuery(theme.breakpoints.down("sm"));

  const [searchValue, setSearchValue] = useState("");
  const [debounceTimeout, setDebounceTimeout] = useState(null);
  const [activeTab, setActiveTab] = useState("agents");
  const [projectDocumentOptions, setProjectDocumentOptions] = useState([]);
  const [agentOptions, setAgentOptions] = useState([]);
  const [documentsPage, setDocumentsPage] = useState(1);
  const projectId = router.query.projectId;
  const { closerDocumentsFromProject, loading } = useSelector(
    (state) => state.globalSearch
  );

  console.log("PROJECTDOC", projectDocumentOptions);
 

  const resetDialogState = () => {
    console.log("Dialog closed, resetting documents");
    setSearchValue("");
    setProjectDocumentOptions([]);
    setAgentOptions([]);
    setDocumentsPage(1);
    dispatch(resetCloserDocuments());
    };

  const handleSearchChange = (event) => {
    setSearchValue(event.target.value);
    if (activeTab !== "documents") return;
    if (debounceTimeout) {
      clearTimeout(debounceTimeout); 
    }    
    const timeoutId = setTimeout(() => {
      if (searchValue.length > 2) {        
        fetchCloserSections();
      }
    }, 1000); 
    setDebounceTimeout(timeoutId); 
  };

  const fetchCloserSections = () => {
    dispatch(
      fetchCloserSectionsFromProject({
        message: searchValue,
        projectId: projectId, // replace with the actual project ID
        size: 5 * documentsPage,
        storedToken: storedToken,
      })
    );
  };

  
  useEffect(() => {
    if (user?.organizations) {
      const agents = user.organizations.flatMap((org) =>
        org.projectAgents
          .filter((agent) =>
            agent.agentName.toLowerCase().includes(searchValue.toLowerCase())
          )
          .map((agent) => ({
            title: agent.agentName,
            orgTitle: org.name,
            icon: "mdi:account",
            category: "Project Agents",
            optionId: agent.id,
            link: `/gendox/chat/?organizationId=${org.id}&threadId=${agent.userId}&projectId=${agent.projectId}`,
          }))
      );
      setAgentOptions(agents);
    }
  }, [user, searchValue]);

  useEffect(() => {
    if (closerDocumentsFromProject?.length > 0) {
      const documents = closerDocumentsFromProject.map((documentSection) => {
        // Split the sectionValue into words and take the first 10 words
        const sectionValue = documentSection.sectionValue
          .split(" ") // Split by spaces
          .slice(0, 20) // Take the first 10 words
          .join(" "); // Join them back into a string

        return {
          title: documentSection.documentInstanceDTO.title,
          sectionOrder: documentSection.documentSectionMetadata.sectionOrder,
          sectionValue: sectionValue, // Limited to the first 10 words
          icon: "mdi:file-document",
          category: "Documents",
          optionId: documentSection.id,
          link: `/gendox/document-instance/?organizationId=${documentSection.documentInstanceDTO.organizationId}&documentId=${documentSection.documentInstanceDTO.id}&sectionId=${documentSection.id}&projectId=${projectId}`,
        };
      });
      setProjectDocumentOptions((prevDocuments) => [
        ...prevDocuments,
        ...documents,
      ]);
    }
  }, [closerDocumentsFromProject, projectId, dispatch]);

  const handleOptionClick = (selectedOption) => {
    setSearchValue("");
    setOpenDialog(false);
    if (selectedOption.link) {
      router.push(selectedOption.link);
    }
  };


  const handleLoadMore = () => {
    setDocumentsPage((prevPage) => prevPage + 1); // Increase the page number when "More" is clicked
    fetchCloserSections(); // Fetch the next set of documents
  };

  return (
    <StyledDialog
      fullWidth
      open={openDialog}
      fullScreen={fullScreenDialog}
      onClose={() => {
        setOpenDialog(false);
        resetDialogState();
      }}
    >
      <DialogContent sx={{ padding: 2 }}>
        <TextField
          fullWidth
          value={searchValue}
          onChange={handleSearchChange}
          placeholder="Search "
          variant="standard"
          sx={{
            marginTop: 2,
            height: 50,
            "& .MuiInputBase-root": {
              border: "none",
              boxShadow: "none",
              height: "100%", 
            },
          }}
          // blair the input field
          inputRef={(input) => {
            if (input) {
              if (openDialog) {
                input.focus();
              } else {
                input.blur();
              }
            }
          }}
          // input field props
          InputProps={{
            sx: { p: `${theme.spacing(3.75, 6)} !important` },
            startAdornment: (
              <InputAdornment position="start" sx={{ color: "text.primary" }}>
                <Icon icon="mdi:magnify" />
              </InputAdornment>
            ),

            endAdornment: (
              <InputAdornment
                position="end"
                onClick={() => setOpenDialog(false)}
                sx={{
                  display: "flex",
                  cursor: "pointer",
                  alignItems: "center",
                }}
              >
                <Typography sx={{ mr: 2.5, color: "text.disabled" }}>
                  [esc]
                </Typography>
                <IconButton size="small" sx={{ p: 1 }}>
                  <Icon icon="mdi:close" fontSize={20} />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        <Box sx={{ display: "flex", ml: 2, mt: 3, justifyContent: "flex-end" }}>
          <Button
            variant={activeTab === "agents" ? "contained" : "outlined"}
            onClick={() => setActiveTab("agents")}
            sx={{ marginRight: 1, fontSize: 12, padding: "4px 12px" }}
            size="small" // Make button small
          >
            Agents
          </Button>
          <Button
            variant={activeTab === "documents" ? "contained" : "outlined"}
            onClick={() => {
              setActiveTab("documents"); // Change active tab
              fetchCloserSections(); // Fetch closer sections
            }}
            sx={{ fontSize: 12, padding: "4px 12px" }}
            size="small" // Make button small
          >
            Documents
          </Button>
        </Box>

        <Box sx={{ marginTop: 2 }}>
          {searchValue.length > 2 ? (
            <List>
              {activeTab === "agents" &&
                agentOptions.map((option) => (
                  <ListItem
                    key={option.optionId}
                    onClick={() => handleOptionClick(option)}
                    sx={{ padding: "0px" }}
                  >
                    <ListItemButton>
                      <CustomAvatar
                        skin="light"
                        variant="rounded"
                        sx={{ mr: 3, height: 20, width: 20 }}
                      >
                        <Icon icon="mdi:account" />
                      </CustomAvatar>

                      <ListItemText
                        primary={option.title}
                        secondary={option.orgTitle + " - Organization"}
                        sx={{
                          ml: 3,
                          "& .MuiTypography-body1": {
                            color: theme.palette.primary.main,
                          },
                        }}
                      />
                      <Tooltip title="Chat with Agent">
                        <CustomAvatar
                          skin="light"
                          variant="rounded"
                          sx={{ mr: 3, height: 20, width: 20 }}
                        >
                          <Icon
                            icon="mdi:subdirectory-arrow-left"
                            fontSize={20}
                            sx={{ p: 2 }}
                          />
                        </CustomAvatar>
                      </Tooltip>
                    </ListItemButton>
                  </ListItem>
                ))}

              {activeTab === "documents" &&
                projectDocumentOptions.map((option) => (
                  <ListItem
                    key={`${option.optionId}-${option.title}`}
                    onClick={() => handleOptionClick(option)}
                    sx={{ padding: "0px" }}
                  >
                    <ListItemButton
                      sx={{ display: "flex", alignItems: "center" }}
                    >
                      <CustomAvatar
                        skin="light"
                        variant="rounded"
                        sx={{ mr: 3, height: 20, width: 20 }}
                      >
                        <Icon icon="mdi:file-document" />
                      </CustomAvatar>
                      <ListItemText
                        primary={option.title}
                        secondary={option.sectionValue + "..."}
                        sx={{
                          ml: 3,
                          mr: 3,
                          "& .MuiTypography-body1": {
                            color: theme.palette.primary.main,
                          },
                        }}
                      />
                      <Tooltip title="Access Document">
                        <CustomAvatar
                          skin="light"
                          variant="rounded"
                          sx={{ mr: 3, height: 20, width: 20 }}
                        >
                          <Icon
                            icon="mdi:subdirectory-arrow-left"
                            fontSize={20}
                          />
                        </CustomAvatar>
                      </Tooltip>
                    </ListItemButton>
                  </ListItem>
                ))}
            </List>
          ) : null}



          {/* Show loader only if more documents are loading */}
          {searchValue.length > 2 && activeTab === "documents"  && loading && (
            <Box sx={{ display: "flex", justifyContent: "center", marginTop: 2 }}>
              <CircularProgress />
            </Box>
          )}

          {/* Load more button */}
          {searchValue.length > 2 && activeTab === "documents" && !loading && (
            <Box sx={{ display: "flex", justifyContent: "center", marginTop: 2 }}>
              <Button
                onClick={handleLoadMore}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  fontSize: 14,
                  textTransform: "none",
                }}
                variant="outlined"
              >
                <Typography sx={{ marginRight: 1 }}>Load More</Typography>
                <Icon icon="mdi:arrow-down" />
              </Button>
            </Box>
          )}
         

        </Box>
      </DialogContent>
    </StyledDialog>
  );
};

export default GlobalSearchDialog;
