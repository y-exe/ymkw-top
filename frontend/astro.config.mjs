import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  site: 'https://www,ymkw.top',
  output: 'server',
  adapter: cloudflare({
    mode: 'directory',
  }),
  integrations: [react(), tailwind()],
  vite: {
    server: {
      allowedHosts: ['ymkw.top'],
      proxy: Object.fromEntries(
        ['/channels', '/snapshots', '/users', '/ranking', '/stats', '/debug'].map((path) => [
          path,
          {
            target: 'https://api.ymkw.top',
            changeOrigin: true,
            secure: true,
          },
        ])
      ),
    },
  },
});
