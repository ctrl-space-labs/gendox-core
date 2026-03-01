import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import { useSelector, useDispatch } from "react-redux"
import { useAuth } from "src/authentication/useAuth"
import { localStorageConstants } from "src/utils/generalConstants"
import { Card } from "@/components/ui/card"
import { ResponsiveCardContent } from "src/utils/responsiveCardContent"
import {
  fetchOrganization,
  fetchAiModelProviders,
  fetchOrganizationAiModelKeys,
  fetchOrganizationPlans,
  fetchApiKeys,
  fetchOrganizationWebSites,
} from "src/store/activeOrganization/activeOrganization"
import OrganizationSettingsCard from "src/views/pages/organization-settings/OrganizationSettingsCard"
import { isValidOrganization } from "src/utils/validators"

const OrganizationSettings = () => {
  const { user } = useAuth() as any
  const dispatch = useDispatch()
  const router = useRouter()
  const { organizationId } = router.query
  const [isBlurring, setIsBlurring] = useState(false)

  const organization = useSelector(
    (state: any) => state.activeOrganization.activeOrganization
  )

  const token =
    typeof window !== "undefined"
      ? window.localStorage.getItem(localStorageConstants.accessTokenKey)
      : null

  useEffect(() => {
    if (isValidOrganization(organizationId, user)) {
      ;(dispatch as any)(fetchOrganization({ organizationId, token }))
      ;(dispatch as any)(fetchAiModelProviders({ organizationId, token }))
      ;(dispatch as any)(
        fetchOrganizationAiModelKeys({ organizationId, token })
      )
      ;(dispatch as any)(fetchOrganizationPlans({ organizationId, token }))
      ;(dispatch as any)(fetchApiKeys({ organizationId, token }))
      ;(dispatch as any)(fetchOrganizationWebSites({ organizationId, token }))
    }
  }, [organizationId, router, dispatch])

  return (
    <Card
      className={`bg-transparent shadow-none border-none ${
        isBlurring ? "blur-sm" : ""
      } transition-all duration-300`}
    >
      <ResponsiveCardContent className="bg-card">
        <div className="text-left">
          <h4 className="text-2xl font-semibold text-muted-foreground mb-2">
            Organization Settings
          </h4>
          <h6 className="text-lg font-normal text-primary">
            {organization?.name || "No Selected"}
          </h6>
        </div>
      </ResponsiveCardContent>
      <div className="h-5" />
      <OrganizationSettingsCard />
    </Card>
  )
}

export default OrganizationSettings
