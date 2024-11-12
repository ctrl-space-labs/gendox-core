import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
} from "@mui/material";

const OrganizationWebSiteDialog = ({ open, onClose, onSave, name, url }) => {
  const [siteName, setSiteName] = useState(name || "");
  const [siteUrl, setSiteUrl] = useState(url || "");
  const [urlError, setUrlError] = useState("");

  useEffect(() => {
    // Update local state whenever the props change
    setSiteName(name || "");
    setSiteUrl(url || "");
  }, [name, url]);

  const validateUrl = (url) => {
    // Regex to check for http(s)://, at least one letter before ".", and at least two letters after "."
    const urlPattern = /^(https?:\/\/)([A-Za-z0-9.-]+)\.([A-Za-z]{2,})(\/.*)?$/;
    return urlPattern.test(url);
  };

  const handleSave = () => {
    if (siteName.trim() === "" || siteUrl.trim() === "") {
      return; // Validation - Ensure both fields are filled
    }
    if (!validateUrl(siteUrl)) {
      setUrlError("URL must start with http:// or https:// and be a valid domain.");
      return;
    }
    onSave(siteName, siteUrl);
    handleClose(); // Reset fields and close dialog after save
  };

  const handleClose = () => {
    setSiteName("");
    setSiteUrl("");
    setUrlError("");
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{url ? "Update Organization Website" : "Create New Organization Website"}</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Website Name"
          type="text"
          fullWidth
          variant="outlined"
          value={siteName}
          onChange={(e) => setSiteName(e.target.value)}
          required
        />
        <TextField
          margin="dense"
          label="Website URL"
          type="url"
          fullWidth
          variant="outlined"
          value={siteUrl}
          onChange={(e) => setSiteUrl(e.target.value)}
          required
          error={!!urlError}
          helperText={urlError}
          sx={{ mt: 2 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained">
          {url ? "Update" : "Create"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default OrganizationWebSiteDialog;
