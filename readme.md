# vue print directive

## usage

- install

```sh
npm i @qiphon/vue-print
```

- vue

```ts
import { VuePrintPlugin as Printv1 } from "@qiphon/vue-print";
app.use(Printv1);
```

- print page

```vue
<template>
  <div>
    <div id="print">print</div>
    <button v-printv1="print">print button</button>
  </div>
</template>
```
