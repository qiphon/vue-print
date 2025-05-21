import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser'; // 使用 @rollup/plugin-terser 替代 rollup-plugin-terser
import fs from 'fs';
import path from 'path';

const packageJsonPath = path.resolve(process.cwd(), 'package.json');
const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

const input = 'src/index.ts';

const isProd = process.env.NODE_ENV === 'production';
const sourcemap = isProd? false : true;
export default [
  // UMD build
  {
    input,
    output: {
      file: `dist/vue-print.umd.js`,
      format: 'umd',
      name: 'VuePrintPlugin', // window.VuePrintPlugin
      globals: {
        vue: 'Vue' // Assuming Vue is available globally
      },
      sourcemap,
    },
    plugins: [
      typescript({ tsconfig: './tsconfig.json', declaration: true, declarationDir: 'dist', rootDir: 'src' }),
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
      file: pkg.module,
      format: 'es',
      sourcemap,
    },
    plugins: [
      typescript({ tsconfig: './tsconfig.json', declaration: true, declarationDir: 'dist', rootDir: 'src' }),
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
      file: pkg.main,
      format: 'cjs',
      sourcemap,
    },
    plugins: [
      typescript({ tsconfig: './tsconfig.json', declaration: true, declarationDir: 'dist', rootDir: 'src' }),
      resolve(),
      commonjs(),
      terser()
    ],
    external: ['vue'] // Mark Vue as external
  }
];