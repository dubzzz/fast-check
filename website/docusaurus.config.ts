// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';
import { themes } from 'prism-react-renderer';
const lightCodeTheme = themes.github;
const darkCodeTheme = themes.dracula;

const config: Config = {
  title: 'fast-check',
  tagline:
    "fast-check is a Property-based Testing framework for JavaScript and TypeScript. It works with Jest, Mocha, Vitest, and others. Let's fuzz!",
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

  onBrokenAnchors: 'throw',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'throw',

  // Even if you don't use internalization, you can use this field to set useful
  // metadata like html lang. For example, if your site is Chinese, you may want
  // to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  future: {
    // More details at https://docusaurus.io/blog/releases/3.6#docusaurus-faster
    experimental_faster: true,
    v4: true,
  },

  presets: [
    [
      'classic',
      {
        docs: {
          showLastUpdateAuthor: true,
          showLastUpdateTime: true,
          sidebarPath: require.resolve('./sidebars.js'),
          remarkPlugins: [[require('@docusaurus/remark-plugin-npm2yarn'), { sync: true }]],
        },
        blog: { showReadingTime: true },
        sitemap: { lastmod: 'date' },
        theme: { customCss: require.resolve('./src/css/custom.css') },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    // Replace with your project's social card
    image: 'img/social.png',
    navbar: {
      title: 'fast-check',
      logo: { alt: 'fast-check Logo', src: 'img/mug.svg', width: '40px' },
      items: [
        { to: '/docs/introduction/', label: 'Documentation' },
        { to: '/docs/tutorials/quick-start/', label: 'Quick Start' },
        { to: '/docs/tutorials/', label: 'All Tutorials' },
        { to: '/docs/support-us/', 'aria-label': 'Support us', label: '❤️' },
        { to: '/blog', label: 'Blog', position: 'right' },
        { href: 'https://fast-check.dev/api-reference/index.html', label: 'API', position: 'right' },
        {
          href: 'https://bsky.app/profile/fast-check.dev',
          'aria-label': 'Bluesky account',
          position: 'right',
          className: 'header-bluesky-link',
        },
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
            { label: 'Bluesky 🦋', href: 'https://bsky.app/profile/fast-check.dev' },
            { label: 'Become a contributor', href: 'https://github.com/dubzzz/fast-check/blob/main/CONTRIBUTING.md' },
            { label: 'Sponsor us', href: 'https://github.com/sponsors/dubzzz' },
          ],
        },
        {
          title: 'More',
          items: [
            { label: 'Blog', to: '/blog' },
            { label: 'API Reference', href: 'https://fast-check.dev/api-reference/index.html' },
            { label: 'GitHub', href: 'https://github.com/dubzzz/fast-check' },
            { label: 'Work with me @Pigment', href: 'https://refer.hellotrusty.io/kz48qf0nh7' },
            {
              html: `<a href="https://www.netlify.com" target="_blank" rel="noreferrer noopener" aria-label="Deploys via Netlify"><img src="https://www.netlify.com/v3/img/components/netlify-color-accent.svg" alt="Deploys by Netlify" width="114" height="51" loading="lazy" /></a>`,
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Nicolas Dubien. Built with Docusaurus.`,
    },
    prism: { theme: lightCodeTheme, darkTheme: darkCodeTheme, additionalLanguages: ['bash', 'diff', 'json'] },
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
  } satisfies Preset.ThemeConfig,

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

export default config;
