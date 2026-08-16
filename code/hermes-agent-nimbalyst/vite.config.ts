import { defineConfig } from 'vite';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.tsx'),
        agent: resolve(__dirname, 'src/agent.ts'),
      },
      formats: ['cjs'],
    },
    rollupOptions: {
      external: [
        'react',
        'react-dom',
        '@nimbalyst/extension-sdk',
        'events',
        'child_process',
      ],
    },
    outDir: 'dist',
    sourcemap: false,
    minify: false,
  },
});
