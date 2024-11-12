import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
} from "@mui/material";

const CreateApiKeyDialog = ({ open, onClose, onSave }) => {
  const [name, setName] = useState("");

  const handleSave = () => {
    if (name.trim() === "") {
      return; // You can add validation or error handling here
    }
    onSave(name);
    setName("");
  };

  const handleClose = () => {
    setName("");
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Create New API Key</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="API Key Name"
          type="text"
          fullWidth
          variant="outlined"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained">
          Create
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateApiKeyDialog;
