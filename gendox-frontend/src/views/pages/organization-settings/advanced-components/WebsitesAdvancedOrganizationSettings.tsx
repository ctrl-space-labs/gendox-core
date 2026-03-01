import { useState } from "react";
import { useRouter } from "next/router";
import { useSelector, useDispatch } from "react-redux";
import { Info, Plus, Pencil, Trash2 } from "lucide-react";
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
import OrganizationWebSiteDialog from "./organization-websites/OrganizationWebSiteDialog";
import DeleteConfirmDialog from "@/utils/dialogs/DeleteConfirmDialog";
import { fetchOrganizationWebSites } from "@/store/activeOrganization/activeOrganization";
import organizationWebSiteService from "@/gendox-sdk/organizationWebSiteService";
import { getErrorMessage } from "@/utils/errorHandler";

interface WebSite {
  id: string;
  name: string;
  url: string;
}

const WebsitesAdvancedOrganizationSettings = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const token = window.localStorage.getItem(
    localStorageConstants.accessTokenKey
  );

  const organizationId = router.query.organizationId as string;
  const { organizationWebSites } = useSelector(
    (state: any) => state.activeOrganization
  );

  const [selectedWebSiteUrl, setSelectedWebSiteUrl] = useState<string | null>(
    null
  );
  const [selectedWebSiteName, setSelectedWebSiteName] = useState("");
  const [selectedWebSiteId, setSelectedWebSiteId] = useState<string | null>(
    null
  );
  const [openWebSiteDialog, setOpenWebSiteDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

  const handleEditToggle = (id: string, name: string, url: string) => {
    setSelectedWebSiteId(id);
    setSelectedWebSiteUrl(url);
    setSelectedWebSiteName(name);
    setOpenWebSiteDialog(true);
  };

  const handleCreateClickOpen = () => {
    setSelectedWebSiteUrl(null);
    setSelectedWebSiteName("");
    setOpenWebSiteDialog(true);
  };

  const handleDeleteClickOpen = (id: string, name: string, url: string) => {
    setSelectedWebSiteId(id);
    setSelectedWebSiteUrl(url);
    setSelectedWebSiteName(name);
    setOpenDeleteDialog(true);
  };

  const handleCreateOrganizationWebsite = async (
    name: string,
    url: string
  ) => {
    try {
      const payload = {
        organizationId,
        name,
        url,
      };

      await organizationWebSiteService.createOrganizationWebSite(
        organizationId,
        payload,
        token
      );
      (dispatch as any)(
        (fetchOrganizationWebSites as any)({
          organizationId,
          token,
        })
      );
      setOpenWebSiteDialog(false);
      toast.success("Organization Website Created Successfully");
    } catch (error: any) {
      console.error("Failed to create Organization Website", error);
      toast.error(
        `Failed to create Organization Website. Error: ${getErrorMessage(
          error
        )}`
      );
      setOpenWebSiteDialog(false);
    }
  };

  const handleUpdateOrganizationWebsite = async (
    newName: string,
    newUrl: string
  ) => {
    try {
      const payload = {
        organizationId,
        name: newName,
        url: newUrl,
      };

      await organizationWebSiteService.updateOrganizationWebSite(
        organizationId,
        selectedWebSiteId,
        payload,
        token
      );
      (dispatch as any)(
        (fetchOrganizationWebSites as any)({
          organizationId,
          token,
        })
      );
      setOpenWebSiteDialog(false);
      toast.success("Organization Website Updated Successfully");
    } catch (error: any) {
      console.error("Failed to update Organization Website", error);
      toast.error(
        `Failed to update Organization Website. Error: ${getErrorMessage(
          error
        )}`
      );
      setOpenWebSiteDialog(false);
    }
  };

  const handleDeleteOrganizationWebsite = async () => {
    try {
      await organizationWebSiteService.deleteOrganizationWebSite(
        organizationId,
        selectedWebSiteId,
        token
      );
      (dispatch as any)(
        (fetchOrganizationWebSites as any)({
          organizationId,
          token,
        })
      );
      handleDeleteClose();
      toast.success("Organization Website Deleted Successfully");
    } catch (error: any) {
      console.error("Failed to delete Organization Website", error);
      toast.error(
        `Failed to delete Organization Website. Error: ${getErrorMessage(
          error
        )}`
      );
      handleDeleteClose();
    }
  };

  const handleDeleteClose = () => setOpenDeleteDialog(false);

  return (
    <>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl flex items-center gap-2">
          <span>Websites</span>
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
                  Add trusted websites here to allow embedding the Gendox
                  widget. Only listed websites can host the widget.
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
              <p>Create New Website</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </CardHeader>

      <CardContent>
        {organizationWebSites.map((item: WebSite) => (
          <div className="mt-3 mb-4" key={item.id}>
            <div className="flex items-center gap-2">
              <div className="space-y-2 w-48">
                <Label>Name</Label>
                <Input value={item.name} disabled />
              </div>
              <div className="flex-1 space-y-2">
                <Label>URL</Label>
                <Input value={item.url} disabled />
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
                          handleEditToggle(
                            item?.id,
                            item?.name,
                            item?.url
                          )
                        }
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Update Web Site</p>
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
                          handleDeleteClickOpen(
                            item?.id,
                            item?.name,
                            item?.url
                          )
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Delete Web Site</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </div>
        ))}
      </CardContent>

      <OrganizationWebSiteDialog
        open={openWebSiteDialog}
        onClose={() => setOpenWebSiteDialog(false)}
        onSave={
          selectedWebSiteUrl
            ? handleUpdateOrganizationWebsite
            : handleCreateOrganizationWebsite
        }
        name={selectedWebSiteName}
        url={selectedWebSiteUrl}
      />

      <DeleteConfirmDialog
        open={openDeleteDialog}
        onClose={handleDeleteClose}
        onConfirm={handleDeleteOrganizationWebsite}
        title="Delete Organization Website"
        contentText={`Are you sure you want to delete ${selectedWebSiteName}'s  Organization Website ?`}
        confirmButtonText="Delete"
        cancelButtonText="Cancel"
      />
    </>
  );
};

export default WebsitesAdvancedOrganizationSettings;
