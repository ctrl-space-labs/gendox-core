import { useSelector } from "react-redux";
import { cn } from "@/lib/utils";

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

const PlansGeneralOrganizationSettings = () => {
  const organizationPlan = useSelector(
    (state: any) => state.activeOrganization.organizationPlans
  );
  const isBlurring = useSelector(
    (state: any) => state.activeOrganization.isBlurring
  );

  const manageSubscription = () =>
    window.open("https://gendox.dev/my-account", "_blank");

  return (
    <>
      <div className="flex justify-between items-center p-2 pr-5">
        <CardHeader>
          <CardTitle className="text-xl">Subscription Plan Details</CardTitle>
        </CardHeader>

        {organizationPlan && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className={cn("transition-all duration-300", isBlurring && "blur-[6px]")}
                >
                  <Button
                    variant="outline"
                    onClick={manageSubscription}
                  >
                    Manage Subscription
                  </Button>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Access your subscription settings</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      <CardContent
        className={cn("transition-all duration-300", isBlurring && "blur-[6px]")}
      >
        {organizationPlan ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {organizationPlan?.status === "CANCELLED" && (
              <div className="col-span-full p-4 bg-destructive/10 text-destructive rounded-md mb-2">
                <p className="text-sm font-medium">
                  Your subscription has been cancelled. Please renew your
                  subscription to continue using the service without
                  interruption.
                </p>
              </div>
            )}

            {/* Plan Info Section */}
            <div className="col-span-full">
              <h3 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wide">
                Plan Information
              </h3>
            </div>
            <div className="space-y-2">
              <Label htmlFor="organization-subscription-plan-name">
                Subscription Plan Name
              </Label>
              <Input
                id="organization-subscription-plan-name"
                value={organizationPlan?.subscriptionPlan?.name || ""}
                readOnly
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="organization-subscription-plan-description">
                Subscription Plan Description
              </Label>
              <Input
                id="organization-subscription-plan-description"
                value={
                  organizationPlan?.subscriptionPlan?.description || ""
                }
                readOnly
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="organization-subscription-plan-price">
                Subscription Plan Price
              </Label>
              <Input
                id="organization-subscription-plan-price"
                value={
                  organizationPlan?.subscriptionPlan?.price
                    ? `${organizationPlan.subscriptionPlan.price} ${organizationPlan.subscriptionPlan.currency}`
                    : ""
                }
                readOnly
              />
            </div>

            {/* Date Section */}
            <div className="col-span-full">
              <h3 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wide">
                Subscription Dates
              </h3>
            </div>
            <div className="space-y-2">
              <Label htmlFor="organization-start-date">Start Date</Label>
              <Input
                id="organization-start-date"
                value={
                  organizationPlan?.startDate
                    ? new Date(
                        organizationPlan.startDate
                      ).toLocaleDateString()
                    : ""
                }
                readOnly
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="organization-end-date">End Date</Label>
              <Input
                id="organization-end-date"
                value={
                  organizationPlan?.endDate
                    ? new Date(
                        organizationPlan.endDate
                      ).toLocaleDateString()
                    : ""
                }
                readOnly
              />
            </div>

            {/* Rate Limits Section */}
            <div className="col-span-full">
              <h3 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wide">
                API Rate Limits
              </h3>
            </div>
            <div className="space-y-2">
              <Label htmlFor="organization-rate-limit">
                Rate Limit (Completions per Minute)
              </Label>
              <Input
                id="organization-rate-limit"
                value={
                  organizationPlan?.apiRateLimit?.completionsPerMinute || ""
                }
                readOnly
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="organization-rate-limit-public">
                Public Rate Limit (Completions per Minute)
              </Label>
              <Input
                id="organization-rate-limit-public"
                value={
                  organizationPlan?.apiRateLimit
                    ?.publicCompletionsPerMinute || ""
                }
                readOnly
              />
            </div>

            {/* Additional Info Section */}
            <div className="col-span-full">
              <h3 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wide">
                Additional Information
              </h3>
            </div>
            <div className="space-y-2">
              <Label htmlFor="organization-number-of-seats">
                Number of Seats
              </Label>
              <Input
                id="organization-number-of-seats"
                value={organizationPlan?.numberOfSeats || ""}
                readOnly
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="organization-messages-limit">
                User Message Monthly Limit
              </Label>
              <Input
                id="organization-messages-limit"
                value={
                  organizationPlan?.subscriptionPlan
                    ?.userMessageMonthlyLimitCount || ""
                }
                readOnly
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="organization-upload-limit">
                User Upload Limit (MB)
              </Label>
              <Input
                id="organization-upload-limit"
                value={
                  organizationPlan?.subscriptionPlan?.userUploadLimitMb || ""
                }
                readOnly
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-muted-foreground mb-4">
              No active subscription plan found. Manage your subscription to
              unlock features.
            </p>
            <Button
              variant="outline"
              onClick={manageSubscription}
            >
              Manage Subscription
            </Button>
          </div>
        )}
      </CardContent>
    </>
  );
};

export default PlansGeneralOrganizationSettings;
