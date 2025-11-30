import { defineConfig } from 'tsdown'

export default defineConfig([
  // CommonJS build
  {
    entry: ['src/index.ts'],
    format: ['cjs'],
    dts: true,
    outDir: 'lib',
    platform: 'neutral',
    unbundle: true,
    sourcemap: true,
    external: [/^overmind/],
  },
  // ESM build
  {
    entry: ['src/index.ts'],
    format: ['esm'],
    dts: false,
    outDir: 'es',
    outExtensions: () => ({ js: '.js' }),
    platform: 'neutral',
    unbundle: true,
    sourcemap: true,
    external: [/^overmind/],
  },
])
