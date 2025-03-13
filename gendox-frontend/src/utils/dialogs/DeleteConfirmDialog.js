// ** React Imports
import React from "react";

// ** MUI Imports
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";

// ** Confirmation Dialog Component
export const DeleteConfirmDialog = ({
  open,
  onClose,
  onConfirm,
  title,
  contentText,
  confirmButtonText,
  cancelButtonText,
}) => {
  return (
    <Dialog open={open} onClose={onClose} aria-labelledby="delete-confirmation-dialog-title">
      <DialogTitle id="delete-confirmation-dialog-title" color="primary">
        {title}
      </DialogTitle>
      <DialogContent>
        <DialogContentText>{contentText}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">
          {cancelButtonText}
        </Button>
        <Button onClick={onConfirm} color="error">
          {confirmButtonText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteConfirmDialog;
