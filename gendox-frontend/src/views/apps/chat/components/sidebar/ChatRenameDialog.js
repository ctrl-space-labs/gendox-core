import React from "react";
import PropTypes from "prop-types";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";

const ChatRenameDialog = ({ open, onClose, onRename, newName, setNewName }) => {
  return (
    <Dialog fullwidth open={open} onClose={onClose}>
      <DialogTitle>Rename Chat</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          fullWidth
          margin="dense"
          label="New Name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={onRename} variant="contained">
          Rename
        </Button>
      </DialogActions>
    </Dialog>
  );
};

ChatRenameDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onRename: PropTypes.func.isRequired,
  newName: PropTypes.string.isRequired,
  setNewName: PropTypes.func.isRequired,
};

export default ChatRenameDialog;
