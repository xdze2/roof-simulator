import { defineConfig } from 'vitest/config';

// GitHub Pages project site: https://xdze2.github.io/roof-simulator/
export default defineConfig({
  base: '/roof-simulator/',
  test: {
    environment: 'node',
  },
});
