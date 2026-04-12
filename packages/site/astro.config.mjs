import { defineConfig } from 'astro/config'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sitemap from '@astrojs/sitemap'
import tailwindcss from '@tailwindcss/vite'

const SITE_ROOT = fileURLToPath(new URL('./', import.meta.url))
const REPO_ROOT = path.resolve(SITE_ROOT, '..', '..')

process.env.HEARTH_SITE_ROOT ??= SITE_ROOT
process.env.HEARTH_REPO_ROOT ??= REPO_ROOT

export default defineConfig({
  site: 'https://theme.hearthcode.dev',
  integrations: [
    sitemap({
      i18n: {
        defaultLocale: 'en',
        locales: {
          en: 'en-US',
          zh: 'zh-CN',
          ja: 'ja-JP',
        },
      },
    }),
  ],
  vite: {
    define: {
      'process.env.HEARTH_SITE_ROOT': JSON.stringify(process.env.HEARTH_SITE_ROOT),
      'process.env.HEARTH_REPO_ROOT': JSON.stringify(process.env.HEARTH_REPO_ROOT),
    },
    plugins: [tailwindcss()],
  },
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'zh', 'ja'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
})
