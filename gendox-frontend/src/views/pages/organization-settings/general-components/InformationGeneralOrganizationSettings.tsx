import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useSelector } from "react-redux";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";

import { localStorageConstants } from "@/utils/generalConstants";
import { CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import organizationService from "@/gendox-sdk/organizationService";
import DeleteConfirmDialog from "@/utils/dialogs/DeleteConfirmDialog";
import { getErrorMessage } from "@/utils/errorHandler";
import { useAuth } from "@/authentication/useAuth";
import commonConfig from "@/configs/common.config.js";

const InformationGeneralOrganizationSettings = () => {
  const auth = useAuth();
  const router = useRouter();
  const token = window.localStorage.getItem(localStorageConstants.accessTokenKey);
  const { provenAiEnabled, provenAiUrl } = commonConfig as any;
  const organization = useSelector(
    (state: any) => state.activeOrganization.activeOrganization
  );
  const isBlurring = useSelector(
    (state: any) => state.activeOrganization.isBlurring
  );
  const [name, setName] = useState(organization.name || "");
  const [displayName, setDisplayName] = useState(
    organization.displayName || ""
  );
  const [address, setAddress] = useState(organization.address || "");
  const [phone, setPhone] = useState(organization.phone || "");
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

  useEffect(() => {
    setName(organization.name || "");
    setDisplayName(organization.displayName || "");
    setAddress(organization.address || "");
    setPhone(organization.phone || "");
  }, [organization]);

  // Handlers for form inputs
  const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) =>
    setName(event.target.value);
  const handleDisplayNameChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => setDisplayName(event.target.value);
  const handleAddressChange = (event: React.ChangeEvent<HTMLInputElement>) =>
    setAddress(event.target.value);
  const handlePhoneChange = (event: React.ChangeEvent<HTMLInputElement>) =>
    setPhone(event.target.value);

  // Handle Delete dialog
  const handleDeleteClickOpen = () => setOpenDeleteDialog(true);
  const handleDeleteClose = () => setOpenDeleteDialog(false);

  // Submit PUT request
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const updatedOrganizationPayload = {
      id: organization.id,
      name,
      displayName,
      address,
      phone,
    };

    try {
      const response = await organizationService.updateOrganization(
        organization.id,
        updatedOrganizationPayload,
        token
      );
      toast.success("Organization updated successfully!");
      const path = `/gendox/organization-settings/?organizationId=${response.data.id}`;
      router.reload();
    } catch (error: any) {
      console.error("Failed to update organization", error);
      toast.error(
        `Organization update failed. Error: ${getErrorMessage(error)}`
      );
    }
  };

  // Handler for deleting organization
  const handleDeleteOrganization = async () => {
    handleDeleteClose();
    try {
      await organizationService.deactivateOrganizationById(
        organization.id,
        token
      );
      toast.success("Organization deleted successfully!");
      const updatedOrganization = (auth as any).user.organizations;
      const firstActiveOrganization = updatedOrganization[0];

      if (firstActiveOrganization) {
        window.location.href = "/gendox/home";
      } else {
        window.location.href = "/gendox/create-organization";
      }
    } catch (error: any) {
      toast.error(
        `Organization deletion failed. Error: ${getErrorMessage(error)}`
      );
      router.push("/gendox/home");
    }
  };

  return (
    <>
      <div className="flex justify-between items-center p-2">
        <CardHeader>
          <CardTitle className="text-xl">Information</CardTitle>
        </CardHeader>
      </div>
      <form onSubmit={handleSubmit}>
        <CardContent
          className={`${
            isBlurring ? "blur-[6px]" : ""
          } transition-all duration-300`}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label htmlFor="organization-name">Name</Label>
              <Input
                id="organization-name"
                value={name}
                onChange={handleNameChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="organization-displayName">Display Name</Label>
              <Input
                id="organization-displayName"
                value={displayName}
                onChange={handleDisplayNameChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="organization-address">Address</Label>
              <Input
                id="organization-address"
                value={address}
                onChange={handleAddressChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="organization-phone">Phone</Label>
              <Input
                id="organization-phone"
                value={phone}
                onChange={handlePhoneChange}
              />
            </div>

            {/* Empty spacer */}
            <div />

            {provenAiEnabled && (
              <div className="flex items-end justify-end">
                <Button
                  variant="outline"
                  size="lg"
                  asChild
                >
                  <a
                    href={`${provenAiUrl}/provenAI/home/?organizationId=${organization.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-5"
                  >
                    <span>Go to Proven-Ai</span>
                    <ArrowRight className="h-5 w-5" />
                  </a>
                </Button>
              </div>
            )}
          </div>
        </CardContent>

        <CardFooter
          className={`justify-end gap-2 p-2 ${
            isBlurring ? "blur-[6px]" : ""
          } transition-all duration-300`}
        >
          <Button
            variant="outline"
            size="lg"
            className="text-destructive border-destructive hover:bg-destructive/10 px-5 py-1"
            onClick={handleDeleteClickOpen}
            type="button"
          >
            Delete
          </Button>

          <Button type="submit" size="lg" className="px-5 py-1">
            Save Changes
          </Button>
        </CardFooter>
      </form>

      <DeleteConfirmDialog
        open={openDeleteDialog}
        onClose={handleDeleteClose}
        onConfirm={handleDeleteOrganization}
        title="Delete"
        contentText={`Are you sure you want to delete ${organization.name}? All member users will be removed, and you will lose access to all related documents. This action cannot be undone.`}
        confirmButtonText="Delete"
        cancelButtonText="Cancel"
      />
    </>
  );
};

export default InformationGeneralOrganizationSettings;
