import { useState } from "react";
import { useRouter } from "next/router";
import { useSelector, useDispatch } from "react-redux";
import { Info, Plus, Copy, Check, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { localStorageConstants } from "@/utils/generalConstants";
import { CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import apiKeyService from "@/gendox-sdk/apiKeyService";
import CreateApiKeyDialog from "@/views/pages/organization-settings/advanced-components/api-keys/CreateApiKeyDialog";
import NameChangeDialog from "@/views/pages/organization-settings/advanced-components/api-keys/NameChangeDialog";
import DeleteConfirmDialog from "@/utils/dialogs/DeleteConfirmDialog";
import { fetchApiKeys } from "@/store/activeOrganization/activeOrganization";
import { getErrorMessage } from "@/utils/errorHandler";

interface ApiKey {
  id: string;
  name: string;
  apiKey: string;
}

const ApiKeysAdvancedOrganizationSettings = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const token = window.localStorage.getItem(
    localStorageConstants.accessTokenKey
  );

  const organizationId = router.query.organizationId as string;
  const { apiKeys } = useSelector(
    (state: any) => state.activeOrganization
  );

  const [selectedApiKeyId, setSelectedApiKeyId] = useState<string | null>(null);
  const [selectedApiKeyName, setSelectedApiKeyName] = useState("");
  const [openNameChangeDialog, setOpenNameChangeDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);

  const handleEditToggle = (apiKeyId: string, name: string) => {
    setSelectedApiKeyId(apiKeyId);
    setSelectedApiKeyName(name);
    setOpenNameChangeDialog(true);
  };

  const handleCreateClickOpen = () => {
    setOpenCreateDialog(true);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      return false;
    }
  };

  const handleCreateApiKey = async (name: string) => {
    try {
      const payload = {
        organizationId,
        name,
        durationInDays: 100 * 365,
        isActive: true,
      };

      await apiKeyService.createApiKey(organizationId, payload, token);
      (dispatch as any)(
        (fetchApiKeys as any)({
          organizationId,
          token,
        })
      );
      setOpenCreateDialog(false);
      toast.success("API Key Created Successfully");
    } catch (error: any) {
      console.error("Failed to create API Key", error);
      toast.error(
        `Failed to create API Key. Error: ${getErrorMessage(error)}`
      );
      setOpenCreateDialog(false);
    }
  };

  const handleUpdateApiKey = async (newName: string) => {
    try {
      const payload = {
        organizationId,
        name: newName,
        durationInDays: 100 * 365,
        isActive: true,
      };

      await apiKeyService.updateApiKey(
        organizationId,
        selectedApiKeyId,
        payload,
        token
      );
      (dispatch as any)(
        (fetchApiKeys as any)({
          organizationId,
          token,
        })
      );
      setOpenNameChangeDialog(false);
      toast.success("Api Key Updated Successfully");
    } catch (error: any) {
      console.error("Failed to update Api Key", error);
      toast.error(
        `Failed to update API Key. Error: ${getErrorMessage(error)}`
      );
      setOpenNameChangeDialog(false);
    }
  };

  const handleDeleteProviderKey = async () => {
    try {
      await apiKeyService.deleteApiKey(
        organizationId,
        selectedApiKeyId,
        token
      );
      (dispatch as any)(
        (fetchApiKeys as any)({
          organizationId,
          token,
        })
      );
      handleDeleteClose();
      toast.success("Api Key Deleted Successfully");
    } catch (error: any) {
      console.error("Failed to delete Api Key", error);
      toast.error(
        `Failed to delete Api Key. Error: ${getErrorMessage(error)}`
      );
      handleDeleteClose();
    }
  };

  const handleDeleteClickOpen = (apiKeyId: string, name: string) => {
    setSelectedApiKeyId(apiKeyId);
    setSelectedApiKeyName(name);
    setOpenDeleteDialog(true);
  };

  const handleDeleteClose = () => setOpenDeleteDialog(false);

  const handleCopy = (apiKeyId: string, apiKey: string) => {
    copyToClipboard(apiKey);
    setCopiedKeyId(apiKeyId);
    toast.success("API key copied to clipboard");
    setTimeout(() => {
      setCopiedKeyId(null);
    }, 2000);
  };

  return (
    <>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl flex items-center gap-2">
          <span>API Keys</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-primary"
                >
                  <Info className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  Create and manage API keys for Gendox access. Keys are secure
                  and only visible at creation, so keep them safe!
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-primary"
                onClick={handleCreateClickOpen}
              >
                <Plus className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Create New API Key</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </CardHeader>

      <CardContent>
        {apiKeys.map((item: ApiKey) => (
          <div className="mt-3 mb-4" key={item.id}>
            <div className="flex items-center gap-2">
              <div className="space-y-2 w-48">
                <Label>Name</Label>
                <Input value={item.name} disabled />
              </div>
              <div className="flex-1 space-y-2">
                <Label>Key</Label>
                <Input value={item.apiKey} disabled />
              </div>
              <div className="flex items-center gap-1 pt-6">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-8 w-8 ${
                          copiedKeyId === item.id
                            ? "text-primary"
                            : ""
                        }`}
                        onClick={() => handleCopy(item.id, item.apiKey)}
                      >
                        {copiedKeyId === item.id ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Copy</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-primary"
                        onClick={() =>
                          handleEditToggle(item?.id, item?.name)
                        }
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Change Api Key's name</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() =>
                          handleDeleteClickOpen(item?.id, item?.name)
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Delete Api Key</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </div>
        ))}
      </CardContent>

      <NameChangeDialog
        open={openNameChangeDialog}
        onClose={() => setOpenNameChangeDialog(false)}
        onSave={handleUpdateApiKey}
        name={selectedApiKeyName}
      />

      <DeleteConfirmDialog
        open={openDeleteDialog}
        onClose={handleDeleteClose}
        onConfirm={handleDeleteProviderKey}
        title="Delete Api Key"
        contentText={`Are you sure you want to delete ${selectedApiKeyName}'s  Api Key ?`}
        confirmButtonText="Delete"
        cancelButtonText="Cancel"
      />

      <CreateApiKeyDialog
        open={openCreateDialog}
        onClose={() => setOpenCreateDialog(false)}
        onSave={handleCreateApiKey}
      />
    </>
  );
};

export default ApiKeysAdvancedOrganizationSettings;
