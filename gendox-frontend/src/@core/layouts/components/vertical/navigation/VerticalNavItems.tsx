import VerticalNavLink from "./VerticalNavLink"
import VerticalNavSectionTitle from "./VerticalNavSectionTitle"

interface NavItem {
  sectionTitle?: string
  [key: string]: any
}

interface VerticalNavItemsProps {
  verticalNavItems?: NavItem[]
  [key: string]: any
}

const VerticalNavItems = (props: VerticalNavItemsProps) => {
  const { verticalNavItems } = props

  const RenderMenuItems = verticalNavItems?.map((item, index) => {
    if (item.sectionTitle) {
      return <VerticalNavSectionTitle key={index} item={item as any} />
    }
    return <VerticalNavLink {...props} key={index} item={item as any} />
  })

  return <>{RenderMenuItems}</>
}

export default VerticalNavItems
