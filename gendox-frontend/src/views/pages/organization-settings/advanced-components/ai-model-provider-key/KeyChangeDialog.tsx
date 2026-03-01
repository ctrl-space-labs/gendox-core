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

interface KeyChangeDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (newKey: string) => void;
  description: string;
}

const KeyChangeDialog = ({
  open,
  onClose,
  onSave,
  description,
}: KeyChangeDialogProps) => {
  const [newKey, setNewKey] = useState("");
  const [error, setError] = useState("");

  const handleKeyChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNewKey(event.target.value);
    setError("");
  };

  const handleSave = () => {
    const trimmedKey = newKey.trim();
    if (trimmedKey.length > 10) {
      onSave(trimmedKey);
      setNewKey("");
      onClose();
    } else {
      setError("Key must be over 10 characters");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Enter New Key for {description}</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 py-4">
          <Label htmlFor="new-key">{description}</Label>
          <Input
            id="new-key"
            autoFocus
            value={newKey}
            onChange={handleKeyChange}
            className={error ? "border-destructive" : ""}
          />
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default KeyChangeDialog;
