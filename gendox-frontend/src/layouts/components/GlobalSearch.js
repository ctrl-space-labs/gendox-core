// ** React Imports
import { useEffect, useCallback, useRef, useState, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import Link from "next/link";
import { useRouter } from "next/router";
import authConfig from "src/configs/auth";

// ** MUI Imports
import Box from "@mui/material/Box";
import MuiDialog from "@mui/material/Dialog";
import ListItem from "@mui/material/ListItem";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import useMediaQuery from "@mui/material/useMediaQuery";
import { styled, useTheme } from "@mui/material/styles";
import ListItemButton from "@mui/material/ListItemButton";
import InputAdornment from "@mui/material/InputAdornment";
import MuiAutocomplete from "@mui/material/Autocomplete";
import Icon from "src/@core/components/icon";
import themeConfig from "src/configs/themeConfig";
import { fetchCloserSectionsFromProject } from "src/store/apps/globalSearch/globalSearch";

// ** Styled Autocomplete component
const Autocomplete = styled(MuiAutocomplete)(({ theme }) => ({
  "& fieldset": {
    border: 0,
  },
  "& + .MuiAutocomplete-popper": {
    "& .MuiAutocomplete-listbox": {
      paddingTop: 0,
      height: "100%",
      maxHeight: "inherit",
      "& .MuiListSubheader-root": {
        top: 0,
        fontWeight: 400,
        lineHeight: "15px",
        fontSize: "0.75rem",
        letterSpacing: "1px",
        color: theme.palette.text.disabled,
      },
    },
    "& .MuiAutocomplete-paper": {
      border: 0,
      height: "100%",
      borderRadius: 0,
      boxShadow: "none",
    },
    "& .MuiListItem-root.suggestion": {
      padding: 0,
      "& .MuiListItemSecondaryAction-root": {
        display: "flex",
      },
      "&.Mui-focused.Mui-focusVisible, &:hover": {
        backgroundColor: theme.palette.action.hover,
      },
      "& .MuiListItemButton-root: hover": {
        backgroundColor: "transparent",
      },
      "&:not(:hover)": {
        "& .MuiListItemSecondaryAction-root": {
          display: "none",
        },
        "&.Mui-focused, &.Mui-focused.Mui-focusVisible:not(:hover)": {
          "& .MuiListItemSecondaryAction-root": {
            display: "flex",
          },
        },
        [theme.breakpoints.down("sm")]: {
          "&.Mui-focused:not(.Mui-focusVisible) .MuiListItemSecondaryAction-root":
            {
              display: "none",
            },
        },
      },
    },
    "& .MuiAutocomplete-noOptions": {
      display: "grid",
      minHeight: "100%",
      alignItems: "center",
      flexDirection: "column",
      justifyContent: "center",
      padding: theme.spacing(10),
    },
  },
}));

// ** Styled Dialog component
const Dialog = styled(MuiDialog)({
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

const NoResult = () => {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      <Typography
        variant="body2"
        sx={{ mb: 2.5, color: "text.disabled", textAlign: "center" }}
      >
        No results found for your search query. <br />
        Please try a different keyword or check your spelling.
      </Typography>
    </Box>
  );
};

const GlobalSearch = ({ hidden, settings, user }) => {
  const dispatch = useDispatch();
  const { layout } = settings;
  const theme = useTheme();
  const router = useRouter();
  const storedToken = window.localStorage.getItem(
    authConfig.storageTokenKeyName
  );

  const [searchValue, setSearchValue] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [debounceTimeout, setDebounceTimeout] = useState(null);

  const fullScreenDialog = useMediaQuery(theme.breakpoints.down("sm"));
  const projectId = router.query.projectId;
  const { closerDocumentsFromProject, loading } = useSelector(
    (state) => state.globalSearch
  );

  console.log("CLOSER SECTION111111111111S", closerDocumentsFromProject);

  useEffect(() => {
    if (!openDialog) {
      setSearchValue("");
    }
  }, [openDialog]);

  // Handle click event on a list item in search result
  const handleOptionClick = (selectedOption) => {
    setSearchValue("");
    setOpenDialog(false);
    if (selectedOption.link) {
      router.push(selectedOption.link);
    }
  };

  // Handle ESC & shortcut keys keydown events
  const handleKeydown = useCallback(
    (event) => {
      // ** Shortcut keys to open searchbox (Ctrl + /)
      if (!openDialog && event.ctrlKey && event.which === 191) {
        setOpenDialog(true);
      }
    },
    [openDialog]
  );

  // Handle shortcut keys keyup events
  const handleKeyUp = useCallback(
    (event) => {
      // ** ESC key to close searchbox
      if (openDialog && event.keyCode === 27) {
        setOpenDialog(false);
      }
    },
    [openDialog]
  );

  const handleSearchChange = (event) => {
    setSearchValue(event.target.value);

    if (debounceTimeout) {
      clearTimeout(debounceTimeout); // Clear the previous timeout if there's one
    }

    // Set a new timeout to trigger after 1 seconds of inactivity
    const timeoutId = setTimeout(() => {
      if (searchValue.length > 2) {
        // Only fetch closer sections if the search value is longer than 2 characters
        dispatch(
          fetchCloserSectionsFromProject({
            message: searchValue,
            projectId: projectId, // replace with the actual project ID
            size: 5,
            storedToken: storedToken,
          })
        );
      }
    }, 1000); // 1 second delay

    setDebounceTimeout(timeoutId); // Store the timeout ID
  };

  useEffect(() => {
    document.addEventListener("keydown", handleKeydown);
    document.addEventListener("keyup", handleKeyUp);

    return () => {
      document.removeEventListener("keydown", handleKeydown);
      document.removeEventListener("keyup", handleKeyUp);
    };
  }, [handleKeyUp, handleKeydown]);

  const projectDocumentOptions = useCallback(() => {
    return (
      closerDocumentsFromProject?.map((document) => ({
        title: document.documentInstanceDTO.title,
        icon: "mdi:file-document",
        category: "Documents",
        optionId: document.documentInstanceDTO.id,
        link: `/gendox/document-instance/?organizationId=${document.documentInstanceDTO.organizationId}&documentId=${document.documentInstanceDTO.id}&projectId=${projectId}`,
      })) || []
    );
  }, [closerDocumentsFromProject]);

  const agentOptions = useCallback(() => {
    return (
      user.organizations.flatMap((org) =>
        org.projectAgents
          .filter((agent) =>
            agent.agentName.toLowerCase().includes(searchValue.toLowerCase())
          )
          .map((agent) => ({
            title: agent.agentName,
            icon: "mdi:account",
            category: "Project Agents",
            optionId: agent.id,
            link: `/gendox/chat/?organizationId=${org.id}&threadId=${agent.userId}&projectId=${agent.projectId}`,
          }))
      ) || []
    );
  }, [user, searchValue]);

  console.log("CLOSER SECTIONS", closerDocumentsFromProject);
  console.log("projectDocumentOptions", projectDocumentOptions());

  return (
    <Box
      onClick={() => !openDialog && setOpenDialog(true)}
      sx={{ display: "flex", cursor: "pointer", alignItems: "center" }}
    >
      <IconButton
        color="inherit"
        sx={!hidden && layout === "vertical" ? { mr: 1, ml: -2.75 } : {}}
      >
        <Icon icon="mdi:magnify" />
      </IconButton>
      {!hidden && layout === "vertical" ? (
        <Typography sx={{ userSelect: "none", color: "text.disabled" }}>
          Search (Ctrl+/)
        </Typography>
      ) : null}

      {/* ** Dialog component for search */}
      {openDialog && (
        <Dialog
          fullWidth
          open={openDialog}
          fullScreen={fullScreenDialog}
          onClose={() => setOpenDialog(false)}
        >
          <Box sx={{ top: 0, width: "100%", position: "sticky" }}>
            <Autocomplete
              autoHighlight
              disablePortal
              options={[...projectDocumentOptions(), ...agentOptions()]}
              id="appBar-search"
              isOptionEqualToValue={() => true}
              onInputChange={handleSearchChange}
              onChange={(event, obj) => handleOptionClick(obj)}
              noOptionsText={
                <NoResult value={searchValue} setOpenDialog={setOpenDialog} />
                // <NoResult />
              }
              getOptionLabel={(option) => option.title || ""}
              groupBy={(option) => (searchValue.length ? option.category : "")}
              sx={{
                "& + .MuiAutocomplete-popper": {
                  ...(searchValue.length
                    ? {
                        overflow: "auto",
                        maxHeight: "calc(100vh - 69px)",
                        borderTop: `1px solid ${theme.palette.divider}`,
                        height: fullScreenDialog ? "calc(100vh - 69px)" : 481,
                        "& .MuiListSubheader-root": {
                          p: theme.spacing(3.75, 6, 0.75),
                        },
                      }
                    : {
                        "& .MuiAutocomplete-listbox": { pb: 0 },
                      }),
                },
              }}
              // input searchValue field
              renderInput={(params) => {
                return (
                  <TextField
                    {...params}
                    value={searchValue}
                    onChange={handleSearchChange}
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
                      ...params.InputProps,
                      sx: { p: `${theme.spacing(3.75, 6)} !important` },
                      startAdornment: (
                        <InputAdornment
                          position="start"
                          sx={{ color: "text.primary" }}
                        >
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
                );
              }}
              // render options
              renderOption={(props, option) => {
                return searchValue.length ? (
                  <ListItem
                    {...props}
                    key={option.optionId}
                    className={`suggestion ${props.className}`}
                    onClick={() => handleOptionClick(option)}
                    secondaryAction={
                      <Icon icon="mdi:subdirectory-arrow-left" fontSize={20} />
                    }
                    sx={{
                      "& .MuiListItemSecondaryAction-root": {
                        "& svg": {
                          cursor: "pointer",
                          color: "text.disabled",
                        },
                      },
                    }}
                  >
                    <ListItemButton
                      sx={{
                        py: 2.5,
                        px: `${theme.spacing(6)} !important`,
                        "& svg": { mr: 2.5, color: "text.primary" },
                      }}
                    >
                      {option.category === "Project Agents" && (
                        <>
                          <Icon
                            fontSize={20}
                            icon={option.icon || themeConfig.navSubItemIcon}
                          />
                          <Typography
                            variant="body2"
                            sx={{ color: "text.primary" }}
                          >
                            {option.title}
                          </Typography>
                        </>
                      )}

                      {/* Right side - Document */}
                      {option.category === "Documents" && (
                        <>
                          <Icon
                            fontSize={20}
                            icon={option.icon || themeConfig.navSubItemIcon}
                          />
                          <Typography
                            variant="body2"
                            sx={{ color: "text.primary" }}
                          >
                            {option.title}
                          </Typography>
                        </>
                      )}
                    </ListItemButton>
                  </ListItem>
                ) : null;
              }}
            />
          </Box>
        </Dialog>
      )}
    </Box>
  );
};

export default GlobalSearch;
