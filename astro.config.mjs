import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://kokomasoft.com',
  i18n: {
    defaultLocale: 'ko',
    locales: ['ko', 'en', 'zh', 'ja'],
    routing: {
      prefixDefaultLocale: true,
      redirectToDefaultLocale: false,
    },
  },
});
