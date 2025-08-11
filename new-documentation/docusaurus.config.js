// @ts-check
// `@type` JSDoc annotations allow editor autocompletion and type checking
// (when paired with `@ts-check`).
// There are various equivalent ways to declare your Docusaurus config.
// See: https://docusaurus.io/docs/api/docusaurus-config

import {themes as prismThemes} from 'prism-react-renderer';

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Gendox Complete Documentation',
  tagline: 'Comprehensive Developer and User Documentation for the RAG-enabled AI Agent Platform',
  favicon: 'img/gendoxLogo.svg',

  // Set the production url of your site here
  url: 'https://ctrl-space-labs.github.io',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/gendox-core/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'ctrl-space-labs', // Usually your GitHub org/user name.
  projectName: 'gendox-core', // Usually your repo name.

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },
  scripts: [
    {
      src: 'https://app.gendox.dev/gendox-sdk/gendox-widget-plugin.js',
      async: true,
      id: 'gendox-chat-script',
      'data-gendox-src': 'https://app.gendox.dev',
      'data-organization-id': 'e3035bad-5df6-46dc-8703-2ad0942a4bed',
      'data-project-id': '282382a6-fda2-48fa-948f-cc6c2bd0da21',
    },
  ],

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: './sidebars.js',
          routeBasePath: '/docs',
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            'https://github.com/ctrl-space-labs/gendox-core/tree/main/new-documentation/',
        },
        blog: {
          showReadingTime: true,
          feedOptions: {
            type: ['rss', 'atom'],
            xslt: true,
          },
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            'https://github.com/ctrl-space-labs/gendox-core/tree/main/new-documentation/',
          // Useful options to enforce blogging best practices
          onInlineTags: 'warn',
          onInlineAuthors: 'warn',
          onUntruncatedBlogPosts: 'warn',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
  ],
  themes: ['@docusaurus/theme-mermaid'],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      // Replace with your project's social card
      image: 'img/docusaurus-social-card.jpg',
      navbar: {
        title: '',
        logo: {
          alt: 'Gendox Logo',
          src: 'img/gendox-logo-final-01.png',
        },
        items: [
          {
            type: 'docSidebar',
            sidebarId: 'tutorialSidebar',
            position: 'left',
            label: 'Documentation',
          },
          {to: '/blog', label: 'Blog', position: 'left'},
          {
            href: 'https://github.com/ctrl-space-labs/gendox-core',
            label: 'GitHub',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Documentation',
            items: [
              {
                label: 'Getting Started',
                to: '/getting-started',
              },
              {
                label: 'User Manual',
                to: '/user-manual',
              },
              {
                label: 'Developer Guide',
                to: '/developer-guide',
              },
            ],
          },
          {
            title: 'Community',
            items: [
              {
                label: 'Discord',
                href: 'https://discord.gg/jWes2urauW',
              },
              {
                label: 'Instagram',
                href: 'https://instagram.com/ctrlspace.dev',
              },
              {
                label: 'LinkedIn',
                href: 'https://www.linkedin.com/company/ctrl-space-labs',
              },
            ],
          },
          {
            title: 'More',
            items: [
              {
                label: 'Blog',
                to: '/blog',
              },
              {
                label: 'GitHub',
                href: 'https://github.com/ctrl-space-labs/gendox-core',
              },
              {
                label: 'API Reference',
                href: 'https://app.gendox.dev/gendox/api/v1/swagger-ui/index.html',
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} Ctrl+Space Labs. Built with Docusaurus.`,
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
        additionalLanguages: ['java', 'bash', 'yaml', 'json'],
      },
      mermaid: {
            theme: { light: 'default', dark: 'dark' },
          },
    }),
};

export default config;