
import React, { useState, useEffect } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";

const NameChangeDialog = ({ open, onClose, onSave, name }) => {
  const [newName, setNewName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setNewName(name); // Set the initial value when the dialog opens
    }
  }, [open, name]);


  const handleNameChange = (event) => {
    setNewName(event.target.value);
    setError("");
    };

    const handleSave = () => {
        onSave(newName); 
        setNewName("");
        onClose();
      };

  return (
    <Dialog fullWidth open={open} onClose={onClose}>
      <DialogTitle>Change Key's Name </DialogTitle>{" "}
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Name"
          fullWidth
          value={newName}
          onChange={handleNameChange}
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

export default NameChangeDialog;
