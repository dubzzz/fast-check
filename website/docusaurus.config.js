// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const lightCodeTheme = require('prism-react-renderer/themes/github');
const darkCodeTheme = require('prism-react-renderer/themes/dracula');

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'fast-check',
  tagline: 'Property based testing for JavaScript and TypeScript',
  favicon: 'img/favicon.ico',

  // Set the production url of your site here
  url: 'https://your-docusaurus-test-site.com',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/',

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
        docs: { sidebarPath: require.resolve('./sidebars.js') },
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
          { type: 'docSidebar', sidebarId: 'tutorialSidebar', position: 'left', label: 'Tutorial' },
          { to: '/blog', label: 'Blog', position: 'left' },
          { href: 'https://github.com/dubzzz/fast-check', label: 'GitHub', position: 'right' },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Docs',
            items: [{ label: 'Tutorial', to: '/docs/intro' }],
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
