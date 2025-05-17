import { defineConfig } from 'dumi';

export default defineConfig({
  themeConfig: {
    name: 'VuePrintPlugin',
    logo: false, // 你可以替换为你的 logo 路径
    footer: `Open-source MIT Licensed | Copyright © ${new Date().getFullYear()}-present`,
  },
  outputPath: 'docs-dist',
  // 如果你的项目是纯 ESM，可以开启此选项
  // esm: { input: 'src' },
  // 如果你的项目是 CommonJS，可以开启此选项
  // cjs: { input: 'src' },
  // 如果你的项目同时支持 ESM 和 CommonJS，可以开启此选项
  // umd: { name: 'VuePrintPlugin', entry: 'src/index' },
  // 如果你的项目是基于 TypeScript 的，可以开启此选项
  // typescript: { entry: 'src/index.ts' },
  // 配置 API 解析
  apiParser: {},
  resolve: {
    // 配置入口文件
    entryFile: './VuePrintPlugin.js',
  },
  mfsu: false, // 禁用 mfsu 以避免潜在的兼容性问题
});