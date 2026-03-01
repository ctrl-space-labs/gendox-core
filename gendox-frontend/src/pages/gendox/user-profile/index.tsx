import { User } from "lucide-react"
import { useAuth } from "src/authentication/useAuth"
import OrgProjectTab from "src/views/pages/user-profile/OrgProjectTab"
import ProfileCard from "src/views/pages/user-profile/ProfileCard"

const UserProfile = () => {
  const auth = useAuth()

  return (
    <div className="space-y-6 py-6 px-4 sm:px-8">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <User className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            User Profile
          </h2>
          <p className="text-sm text-muted-foreground">
            Manage your account and view your organizations
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-5 lg:col-span-4">
          <ProfileCard userData={auth.user} />
        </div>
        <div className="md:col-span-7 lg:col-span-8">
          <OrgProjectTab userData={auth.user} />
        </div>
      </div>
    </div>
  )
}

export default UserProfile
