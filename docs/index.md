# VuePrintPlugin

这是一个用于在 Vue.js 应用中实现打印功能的插件。

## 快速上手

### 安装

```bash
npm install vue-print
# 或者
yarn add vue-print
```

### 使用

首先，在你的 Vue 项目中引入并注册插件：

```javascript
import Vue from 'vue';
import VuePrintPlugin from 'vue-print'; // 假设你的插件入口是 VuePrintPlugin.js

Vue.use(VuePrintPlugin);
```

然后，你可以在你的组件中使用 `$print` 方法：

```html
<template>
  <div>
    <div id="printable-area">
      <h1>需要打印的内容</h1>
      <p>这是一段需要打印的文本。</p>
    </div>
    <button @click="printContent">打印</button>
  </div>
</template>

<script>
export default {
  methods: {
    printContent() {
      this.$print('#printable-area', {
        // 可选配置项
        popTitle: '打印预览',
        // 更多配置项请参考插件文档
      });
    }
  }
};
</script>
```

## API

详细的 API 文档正在建设中。

### `this.$print(elementSelector, options)`

- `elementSelector` (String,必选): 需要打印的 HTML 元素的选择器 (例如 `#myElement`, `.my-class`)。
- `options` (Object,可选): 打印配置项。

#### `options` 详解

| 参数名                      | 类型     | 默认值    | 描述                                                                 |
| --------------------------- | -------- | --------- | -------------------------------------------------------------------- |
| `ids`                       | String   | -         | (内部使用，通常由 elementSelector 自动生成) 要打印的元素的 ID。        |
| `standard`                  | String   | `'html5'` | HTML 标准 ('strict', 'loose', 'html5')。                             |
| `url`                       | String   | `null`    | 要在 iframe 中加载以进行打印的 URL。                                   |
| `asyncUrl`                  | Function | `null`    | 异步加载打印内容的函数。                                               |
| `preview`                   | Boolean  | `false`   | 是否显示打印预览。                                                     |
| `popTitle`                  | String   | `''`      | 打印窗口或预览的标题。                                                 |
| `extraHead`                 | String   | `''`      | 要添加到打印文档 `<head>` 中的额外 HTML 内容。                         |
| `extraCss`                  | String   | `''`      | 要包含的 CSS 文件 URL 的逗号分隔列表。                                 |
| `zIndex`                    | Number   | `20000`   | 预览框的 z-index。                                                   |
| `previewTitle`              | String   | `'Preview'` | 预览框头部的标题。                                                     |
| `previewPrintBtnLabel`      | String   | `'Print'` | 预览框中打印按钮的标签。                                               |
| `previewBeforeOpenCallback` | Function | `null`    | 预览打开前的回调。                                                     |
| `previewOpenCallback`       | Function | `null`    | 预览打开后的回调。                                                     |
| `openCallback`              | Function | `null`    | 打印对话框打开后的回调。                                               |
| `closeCallback`             | Function | `null`    | 打印对话框关闭后的回调。                                               |
| `beforeOpenCallback`        | Function | `null`    | (非预览模式下) 打印对话框打开前的回调。                                |

更多用法和示例请参考后续文档。