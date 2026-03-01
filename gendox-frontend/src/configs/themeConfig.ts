export interface ThemeConfig {
  templateName: string
  isDemo: boolean
  showOrganizationDropdown: boolean
  mode: "light" | "dark"
  embeddedLayout: boolean
  contentWidth: "full" | "boxed"
  routingLoader: boolean
  menuTextTruncate: boolean
  navigationSize: number
  responsiveFontSizes: boolean
  disableRipple: boolean
  navBarContent: "default" | "hidden"
  footerContent: "default" | "poweredBy" | "hidden"
  globalSearch: boolean
}

const themeConfig: ThemeConfig = {
  templateName: "Gendox",
  isDemo: false,
  showOrganizationDropdown: true,
  mode: "dark",
  embeddedLayout: false,
  contentWidth: "boxed",
  routingLoader: true,
  menuTextTruncate: true,
  navigationSize: 260,
  responsiveFontSizes: true,
  disableRipple: false,
  navBarContent: "default",
  footerContent: "default",
  globalSearch: true,
}

export default themeConfig
