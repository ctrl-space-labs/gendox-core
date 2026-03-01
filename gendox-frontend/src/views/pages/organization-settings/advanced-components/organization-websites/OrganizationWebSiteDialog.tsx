import { useState, useEffect } from "react";

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

interface OrganizationWebSiteDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (name: string, url: string) => void;
  name: string;
  url: string | null;
}

const OrganizationWebSiteDialog = ({
  open,
  onClose,
  onSave,
  name,
  url,
}: OrganizationWebSiteDialogProps) => {
  const [siteName, setSiteName] = useState(name || "");
  const [siteUrl, setSiteUrl] = useState(url || "");
  const [urlError, setUrlError] = useState("");

  useEffect(() => {
    setSiteName(name || "");
    setSiteUrl(url || "");
  }, [name, url]);

  const validateUrl = (urlValue: string) => {
    const urlPattern =
      /^(https?:\/\/)([A-Za-z0-9.-]+)\.([A-Za-z]{2,})(\/.*)?$/;
    return urlPattern.test(urlValue);
  };

  const handleSave = () => {
    if (siteName.trim() === "" || siteUrl.trim() === "") {
      return;
    }
    if (!validateUrl(siteUrl)) {
      setUrlError(
        "URL must start with http:// or https:// and be a valid domain."
      );
      return;
    }
    onSave(siteName, siteUrl);
    handleClose();
  };

  const handleClose = () => {
    setSiteName("");
    setSiteUrl("");
    setUrlError("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {url
              ? "Update Organization Website"
              : "Create New Organization Website"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="website-name">Website Name</Label>
            <Input
              id="website-name"
              autoFocus
              type="text"
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="website-url">Website URL</Label>
            <Input
              id="website-url"
              type="url"
              value={siteUrl}
              onChange={(e) => setSiteUrl(e.target.value)}
              required
              className={urlError ? "border-destructive" : ""}
            />
            {urlError && (
              <p className="text-sm text-destructive">{urlError}</p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>{url ? "Update" : "Create"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OrganizationWebSiteDialog;
