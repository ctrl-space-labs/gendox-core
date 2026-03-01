import { Icon } from "@iconify/react"

interface UserIconProps {
  icon: string | React.ComponentType<any>
  iconProps?: Record<string, any>
}

const UserIcon = ({ icon, iconProps }: UserIconProps) => {
  if (typeof icon === "string") {
    return <Icon icon={icon} style={{ fontSize: "1.5rem" }} {...iconProps} />
  }
  const IconTag = icon
  return <IconTag {...iconProps} style={{ fontSize: "1.5rem", ...iconProps?.style }} />
}

export default UserIcon
