/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */

// @ts-check

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  tutorialSidebar: [
    'intro',
    {
      type: 'category',
      label: 'Getting Started',
      collapsed: false,
      items: [
        'getting-started/overview',
        'getting-started/prerequisites',
        'getting-started/installation',
        'getting-started/quick-start',
      ],
    },
    {
      type: 'category',
      label: 'User Manual',
      collapsed: false,
      items: [
        'user-manual/registration',
      ],
    },
    {
      type: 'category',
      label: 'Developer Guide',
      collapsed: false,
      items: [
        'developer-guide/architecture',
      ],
    },
    {
      type: 'category',
      label: 'API Documentation',
      collapsed: false,
      items: [
        'api/overview',
      ],
    },
    // Add the "Full API Reference" link manually at the end
    {
      type: 'link',
      label: 'Full API Reference',
      href: 'https://app.gendox.dev/gendox/api/v1/swagger-ui/index.html',
    },
  ],
};

export default sidebars;