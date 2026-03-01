import { useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface CreateApiKeyDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
}

const CreateApiKeyDialog = ({
  open,
  onClose,
  onSave,
}: CreateApiKeyDialogProps) => {
  const [name, setName] = useState("");

  const handleSave = () => {
    if (name.trim() === "") {
      return;
    }
    onSave(name);
    setName("");
  };

  const handleClose = () => {
    setName("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New API Key</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 py-4">
          <Label htmlFor="api-key-name">API Key Name</Label>
          <Input
            id="api-key-name"
            autoFocus
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateApiKeyDialog;
