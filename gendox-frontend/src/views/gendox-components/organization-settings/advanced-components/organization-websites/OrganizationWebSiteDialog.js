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

  useEffect(() => {
    // Update local state whenever the props change
    setSiteName(name || "");
    setSiteUrl(url || "");
  }, [name, url]);

  const handleSave = () => {
    if (siteName.trim() === "" || siteUrl.trim() === "") {
      return; // Validation - Ensure both fields are filled
    }
    onSave(siteName, siteUrl);
    handleClose(); // Reset fields and close dialog after save
  };

  const handleClose = () => {
    setSiteName("");
    setSiteUrl("");
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
