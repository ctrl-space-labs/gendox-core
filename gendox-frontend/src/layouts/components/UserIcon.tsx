import { Icon } from "@iconify/react"

interface UserIconProps {
  icon: string | React.ComponentType<any>
  iconProps?: Record<string, any>
}

const UserIcon = ({ icon, iconProps }: UserIconProps) => {
  if (typeof icon === "string") {
    return <Icon icon={icon} className="h-6 w-6" {...iconProps} />
  }
  const IconTag = icon
  return <IconTag className="h-6 w-6" {...iconProps} />
}

export default UserIcon
