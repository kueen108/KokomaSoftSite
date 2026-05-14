import { defineConfig } from 'astro/config';

export default defineConfig({
  i18n: {
    defaultLocale: 'ko',
    locales: ['ko', 'en', 'zh', 'ja'],
    routing: {
      prefixDefaultLocale: true,
      redirectToDefaultLocale: false,
    },
  },
});
