import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'HermesAgent',
      formats: ['es'],
      fileName: 'index'
    },
    rollupOptions: {
      external: [
        '@nimbalyst/extension-sdk',
        'react',
        'react-dom',
        'events',
        'child_process',
        'ws',
        'pg',
        'uuid'
      ],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM'
        }
      }
    },
    outDir: 'dist',
    sourcemap: true,
    minify: false
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
  }
});
