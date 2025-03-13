import { Icon } from '@iconify/react'

const CustomIcon = ({ style, ...props }) => {
  return <Icon style={{ fontSize: '1.5rem', ...style }} {...props} />
}

export default CustomIcon
