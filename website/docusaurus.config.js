// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const lightCodeTheme = require('prism-react-renderer/themes/github');
const darkCodeTheme = require('prism-react-renderer/themes/dracula');

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'fast-check',
  tagline: 'Property-based testing for JavaScript and TypeScript',
  favicon: 'img/favicon.ico',

  // Set the production url of your site here
  url: 'https://fast-check.dev/',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/',
  trailingSlash: true,

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'dubzzz', // Usually your GitHub org/user name.
  projectName: 'fast-check', // Usually your repo name.

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'throw',

  // Even if you don't use internalization, you can use this field to set useful
  // metadata like html lang. For example, if your site is Chinese, you may want
  // to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          remarkPlugins: [[require('@docusaurus/remark-plugin-npm2yarn'), { sync: true }]],
        },
        blog: { showReadingTime: true },
        theme: { customCss: require.resolve('./src/css/custom.css') },
        gtag: {
          trackingID: 'G-PHXW2XCMCL',
          anonymizeIP: true,
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      // Replace with your project's social card
      image: 'img/social.png',
      navbar: {
        title: 'fast-check',
        logo: { alt: 'fast-check Logo', src: 'img/mug.svg', width: '40px' },
        items: [
          { to: '/docs/introduction/', label: 'Documentation' },
          { to: '/docs/tutorials/quick-start/', label: 'Quick Start' },
          { to: '/docs/tutorials/', label: 'All Tutorials' },
          { to: '/blog', label: 'Blog', position: 'right' },
          { href: 'https://fast-check.dev/api-reference/index.html', label: 'API', position: 'right' },
          {
            href: 'https://github.com/dubzzz/fast-check',
            'aria-label': 'GitHub repository',
            position: 'right',
            className: 'header-github-link',
          },
        ],
      },
      docs: {
        sidebar: {
          autoCollapseCategories: true,
        },
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Guides',
            items: [
              { label: 'Documentation', to: '/docs/introduction/' },
              { label: 'Quick Start', to: '/docs/tutorials/quick-start/' },
              { label: 'All Tutorials', to: '/docs/tutorials/' },
            ],
          },
          {
            title: 'Community',
            items: [
              { label: 'Mastodon', href: 'https://fosstodon.org/@ndubien' },
              { label: 'Twitter', href: 'https://twitter.com/ndubien' },
            ],
          },
          {
            title: 'More',
            items: [
              { label: 'Blog', to: '/blog' },
              { label: 'API Reference', href: 'https://fast-check.dev/api-reference/index.html' },
              { label: 'GitHub', href: 'https://github.com/dubzzz/fast-check' },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} Nicolas Dubien. Built with Docusaurus.`,
      },
      prism: { theme: lightCodeTheme, darkTheme: darkCodeTheme },
      algolia: {
        // The application ID provided by Algolia
        appId: 'XIUK9DGBYC',
        // Public API key: it is safe to commit it
        apiKey: '3d6340d4de21361b286217d4edd1ef52',
        indexName: 'fast-check',
        // Optional: see doc section below
        contextualSearch: true,
        // Optional: Specify domains where the navigation should occur through window.location instead on history.push. Useful when our Algolia config crawls multiple documentation sites and we want to navigate with window.location.href to them.
        //externalUrlRegex: 'external\\.com|domain\\.com',
        // Optional: Replace parts of the item URLs from Algolia. Useful when using the same search index for multiple deployments using a different baseUrl. You can use regexp or string in the `from` param. For example: localhost:3000 vs myCompany.com/docs
        //replaceSearchResultPathname: {
        //  from: '/docs/', // or as RegExp: /\/docs\//
        //  to: '/',
        //},
        // Optional: Algolia search parameters
        searchParameters: {},
        // Optional: path for search page that enabled by default (`false` to disable it)
        searchPagePath: 'search',
        //... other Algolia params
      },
    }),

  plugins: [
    [
      '@docusaurus/plugin-pwa',
      {
        offlineModeActivationStrategies: ['appInstalled', 'standalone', 'queryString'],
        pwaHead: [
          {
            tagName: 'link',
            rel: 'icon',
            href: '/img/favicon.ico',
          },
          {
            tagName: 'link',
            rel: 'manifest',
            href: '/manifest.json',
          },
          {
            tagName: 'meta',
            name: 'theme-color',
            content: 'rgb(40, 46, 169)',
          },
          {
            tagName: 'meta',
            name: 'apple-mobile-web-app-capable',
            content: 'yes',
          },
          {
            tagName: 'meta',
            name: 'apple-mobile-web-app-status-bar-style',
            content: '#000',
          },
          {
            tagName: 'link',
            rel: 'apple-touch-icon',
            href: '/img/favicon.ico',
          },
          {
            tagName: 'link',
            rel: 'mask-icon',
            href: '/img/mug.svg',
            color: 'rgb(40, 46, 169)',
          },
          {
            tagName: 'meta',
            name: 'msapplication-TileImage',
            content: '/img/favicon.ico',
          },
          {
            tagName: 'meta',
            name: 'msapplication-TileColor',
            content: '#000',
          },
        ],
      },
    ],
  ],
};

module.exports = config;
