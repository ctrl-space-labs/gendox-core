const themeConfig = {
  // ** Layout Configs
  templateName: 'Gendox' /* App Name */,

  isDemo: false /* Change it to false to disable the demo */,
  showOrganizationDropdown: true,
  mode: 'dark' /* light | dark */,
  embeddedLayout: false, /* true | false */ /* When the application is embedded in another window*/
  contentWidth: 'boxed' /* full | boxed */,
  // ** Routing Configs
  routingLoader: true /* true | false */,
  // ** Navigation (Menu) Configs
  menuTextTruncate: true /* true | false */,
  navigationSize: 260 /* Number in PX(Pixels) /*! Note: This is for Vertical navigation menu only */,
  // ** Other Configs
  responsiveFontSizes: true /* true | false */,
  disableRipple: false /* true | false */,
  navBarContent: 'default' /* default | hidden */,
  footerContent: 'default' /* default | poweredBy | hidden */,
  globalSearch: true /* true | false */,
  provenAiEnabled: process.env.NEXT_PUBLIC_PROVEN_AI_ENABLED? process.env.NEXT_PUBLIC_PROVEN_AI_ENABLED === 'true' : false /* true | false */,
}

export default themeConfig
