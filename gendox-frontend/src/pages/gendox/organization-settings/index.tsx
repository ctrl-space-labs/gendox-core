import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import { useSelector, useDispatch } from "react-redux"
import { useAuth } from "src/authentication/useAuth"
import { Building2 } from "lucide-react"
import { localStorageConstants } from "src/utils/generalConstants"
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
    <div className="space-y-6 py-6 px-4 sm:px-8">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Building2 className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            Organization Settings
          </h2>
          <p className="text-sm text-muted-foreground">
            {organization?.name || "No organization selected"}
          </p>
        </div>
      </div>

      <OrganizationSettingsCard />
    </div>
  )
}

export default OrganizationSettings
