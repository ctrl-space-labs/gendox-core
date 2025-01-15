// ** React Imports
import { useEffect, useCallback, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Icon from "src/@core/components/icon";
import GlobalSearchDialog from "src/views/gendox-components/global-search/GlobalSearchDialog";

const GlobalSearch = ({ hidden, settings, user }) => {
  const { layout } = settings; 
  const [openDialog, setOpenDialog] = useState(false);

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

  useEffect(() => {
    document.addEventListener("keydown", handleKeydown);
    document.addEventListener("keyup", handleKeyUp);

    return () => {
      document.removeEventListener("keydown", handleKeydown);
      document.removeEventListener("keyup", handleKeyUp);
    };
  }, [handleKeyUp, handleKeydown]);
  
  

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

      {openDialog && (
        <GlobalSearchDialog
          openDialog={openDialog}
          setOpenDialog={setOpenDialog}
          user={user}
        />
      )}
    </Box>
  );
};

export default GlobalSearch;
