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
  url: 'https://dubzzz.github.io/',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/fast-check/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'dubzzz', // Usually your GitHub org/user name.
  projectName: 'fast-check', // Usually your repo name.

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

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
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      // Replace with your project's social card
      image: 'img/docusaurus-social-card.jpg',
      navbar: {
        title: 'fast-check',
        logo: { alt: 'fast-check Logo', src: 'img/mug.svg' },
        items: [
          { to: '/docs/category/introduction', label: 'Getting Started', position: 'right' },
          { to: '/docs/category/quick-start', label: 'Quick Start', position: 'right' },
          //{ to: '/blog', label: 'Blog', position: 'right' },
          { href: 'https://dubzzz.github.io/fast-check/api-reference/index.html', label: 'API', position: 'right' },
          { href: 'https://github.com/dubzzz/fast-check', label: 'GitHub', position: 'right' },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Docs',
            items: [
              { label: 'Getting Started', to: '/docs/category/introduction' },
              { label: 'Quick Start', to: '/docs/category/quick-start' },
              { label: 'All Tutorials', to: '/docs/category/tutorials' },
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
              //{ label: 'Blog', to: '/blog' },
              { label: 'API Reference', href: 'https://dubzzz.github.io/fast-check/api-reference/index.html' },
              { label: 'GitHub', href: 'https://github.com/dubzzz/fast-check' },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} Nicolas Dubien. Built with Docusaurus.`,
      },
      prism: { theme: lightCodeTheme, darkTheme: darkCodeTheme },
    }),
};

module.exports = config;
