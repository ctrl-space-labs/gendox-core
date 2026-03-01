import { useAuth } from "src/authentication/useAuth"
import OrgProjectTab from "src/views/pages/user-profile/OrgProjectTab"
import ProfileCard from "src/views/pages/user-profile/ProfileCard"

const UserProfile = () => {
  const auth = useAuth()

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
      <div className="md:col-span-5 lg:col-span-4">
        <ProfileCard userData={auth.user} />
      </div>
      <div className="md:col-span-7 lg:col-span-8">
        <OrgProjectTab userData={auth.user} />
      </div>
    </div>
  )
}

export default UserProfile
