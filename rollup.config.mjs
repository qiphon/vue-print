import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser'; // 使用 @rollup/plugin-terser 替代 rollup-plugin-terser
import fs from 'fs';
import path from 'path';

const packageJsonPath = path.resolve(process.cwd(), 'package.json');
const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

const input = 'src/VuePrintPlugin.ts';

export default [
  // UMD build
  {
    input,
    output: {
      file: `dist/${pkg.name}.umd.js`,
      format: 'umd',
      name: 'VuePrintPlugin', // window.VuePrintPlugin
      globals: {
        vue: 'Vue' // Assuming Vue is available globally
      },
      sourcemap: true,
    },
    plugins: [
      typescript({ tsconfig: './tsconfig.json' }),
      resolve(),
      commonjs(),
      terser()
    ],
    external: ['vue'] // Mark Vue as external
  },
  // ESM build
  {
    input,
    output: {
      file: `dist/${pkg.name}.esm.js`,
      format: 'es',
      sourcemap: true,
    },
    plugins: [
      typescript({ tsconfig: './tsconfig.json' }),
      resolve(),
      commonjs(),
      terser()
    ],
    external: ['vue'] // Mark Vue as external
  },
  // CJS build
  {
    input,
    output: {
      file: `dist/${pkg.name}.cjs.js`,
      format: 'cjs',
      sourcemap: true,
    },
    plugins: [
      typescript({ tsconfig: './tsconfig.json' }),
      resolve(),
      commonjs(),
      terser()
    ],
    external: ['vue'] // Mark Vue as external
  }
];