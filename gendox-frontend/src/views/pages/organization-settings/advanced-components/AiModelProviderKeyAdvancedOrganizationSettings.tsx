import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useSelector, useDispatch } from "react-redux";
import { Info, Pencil, Trash2 } from "lucide-react";
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
import aiModelService from "@/gendox-sdk/aiModelService";
import KeyChangeDialog from "@/views/pages/organization-settings/advanced-components/ai-model-provider-key/KeyChangeDialog";
import DeleteConfirmDialog from "@/utils/dialogs/DeleteConfirmDialog";
import { fetchOrganizationAiModelKeys } from "@/store/activeOrganization/activeOrganization";
import { getErrorMessage } from "@/utils/errorHandler";

interface AiModelProvider {
  id: string;
  description: string;
}

interface AiModelKey {
  id: string;
  key: string;
  aiModelProvider: {
    id: string;
  };
}

const AiModelProviderKeyAdvancedOrganizationSettings = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const token = window.localStorage.getItem(
    localStorageConstants.accessTokenKey
  );

  const organizationId = router.query.organizationId as string;
  const { aiModelProviders, aiModelKeys: initialAiModelKeys } = useSelector(
    (state: any) => state.activeOrganization
  );

  const [selectedKeyId, setSelectedKeyId] = useState<string | null>(null);
  const [openKeyChangeDialog, setOpenKeyChangeDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedProviderDescription, setSelectedProviderDescription] =
    useState("");
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(
    null
  );
  const [aiModelKeys, setAiModelKeys] = useState<AiModelKey[]>([]);

  useEffect(() => {
    if (initialAiModelKeys) {
      setAiModelKeys(initialAiModelKeys);
    }
  }, [initialAiModelKeys]);

  const handleEditToggle = (description: string, providerId: string) => {
    setSelectedProviderDescription(description);
    setSelectedProviderId(providerId);
    setOpenKeyChangeDialog(true);
  };

  const handleSaveNewKey = async (newKey: string) => {
    try {
      const provider = aiModelProviders.find(
        (p: AiModelProvider) => p.id === selectedProviderId
      );

      if (!provider) {
        console.error("Provider not found");
        return;
      }

      const existingKey = aiModelKeys.find(
        (key) => key.aiModelProvider.id === provider.id
      );

      const payload = {
        organizationId,
        aiModelProvider: provider,
        key: newKey,
      };

      if (!existingKey) {
        await aiModelService.createAiModelKey(organizationId, token, payload);
        toast.success("AI Model Key Created Successfully");
      } else {
        await aiModelService.updateAiModelKey(
          organizationId,
          existingKey.id,
          token,
          payload
        );
        toast.success("AI Model Key Updated Successfully");
      }

      ;(dispatch as any)(
        (fetchOrganizationAiModelKeys as any)({
          organizationId,
          token,
        })
      );
      setOpenKeyChangeDialog(false);
    } catch (error: any) {
      console.error("Failed to create AI Model Keys", error);
      toast.error(
        `Failed to create AI Model Keys. Error: ${getErrorMessage(error)}`
      );
      setOpenKeyChangeDialog(false);
    }
  };

  const handleDeleteProviderKey = async () => {
    try {
      await aiModelService.deleteAiModelKey(
        organizationId,
        selectedKeyId,
        token
      );
      (dispatch as any)(
        (fetchOrganizationAiModelKeys as any)({
          organizationId,
          token,
        })
      );
      handleDeleteClose();
      toast.success("AI Model Key Deleted Successfully");
    } catch (error: any) {
      console.error("Failed to delete AI Model Key", error);
      toast.error(
        `Failed to delete AI Model Key. Error: ${getErrorMessage(error)}`
      );
      handleDeleteClose();
    }
  };

  const handleDeleteClickOpen = (description: string, keyId: string) => {
    setSelectedProviderDescription(description);
    setSelectedKeyId(keyId);
    setOpenDeleteDialog(true);
  };

  const handleDeleteClose = () => setOpenDeleteDialog(false);

  return (
    <>
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <span>AI Model Provider Key</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-primary">
                  <Info className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  Add or update API keys for AI services like OpenAI. Only the
                  first and the last few characters of each key are shown for
                  security.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
      </CardHeader>

      <CardContent>
        {aiModelProviders.map((item: AiModelProvider) => (
          <div className="mt-3 mb-4 max-w-2xl" key={item.id}>
            <div className="flex items-center gap-2">
              <div className="flex-1 space-y-2">
                <Label>{item.description}</Label>
                <Input
                  value={
                    aiModelKeys.find(
                      (key) => key.aiModelProvider.id === item.id
                    )?.key || ""
                  }
                  disabled
                />
              </div>
              <div className="flex items-center gap-1 pt-6">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-primary"
                        onClick={() =>
                          handleEditToggle(item.description, item.id)
                        }
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Add New Key</p>
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
                        onClick={() => {
                          const matchingKey = aiModelKeys.find(
                            (key) => key.aiModelProvider.id === item.id
                          );
                          handleDeleteClickOpen(
                            item.description,
                            matchingKey?.id || ""
                          );
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Delete Key</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </div>
        ))}
      </CardContent>

      <KeyChangeDialog
        open={openKeyChangeDialog}
        onClose={() => setOpenKeyChangeDialog(false)}
        onSave={handleSaveNewKey}
        description={selectedProviderDescription}
      />

      <DeleteConfirmDialog
        open={openDeleteDialog}
        onClose={handleDeleteClose}
        onConfirm={handleDeleteProviderKey}
        title="Delete AI Model Key"
        contentText={`Are you sure you want to delete the AI Model Key for ${selectedProviderDescription}?`}
        confirmButtonText="Delete"
        cancelButtonText="Cancel"
      />
    </>
  );
};

export default AiModelProviderKeyAdvancedOrganizationSettings;
