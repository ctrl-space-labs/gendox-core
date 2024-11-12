
import React, { useState } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";

const KeyChangeDialog = ({ open, onClose, onSave, description }) => {
  const [newKey, setNewKey] = useState("");
  const [error, setError] = useState("");


  const handleKeyChange = (event) => {
    setNewKey(event.target.value);
    setError("");
    };

  const handleSave = () => {
    const trimmedKey = newKey.trim(); // Trim both leading and trailing spaces
    if (trimmedKey.length > 10) {
      onSave(trimmedKey);
      setNewKey("");
      onClose();
    } else {
      setError("Key must be over 10 characters"); // Extra check in case of direct save attempt
    }
  };

  return (
    <Dialog fullWidth open={open} onClose={onClose}>
      <DialogTitle>Enter New Key for {description}</DialogTitle>{" "}
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label={description}
          fullWidth
          value={newKey}
          onChange={handleKeyChange}
          error={!!error}
          helperText={error}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Cancel
        </Button>
        <Button onClick={handleSave} color="primary" variant="contained">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default KeyChangeDialog;
