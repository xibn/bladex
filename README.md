# BladeX

[![npm version][npm-version-src]][npm-href]
[![npm downloads][npm-downloads-src]][npm-href]
[![npm license][npm-license-src]][npm-href]

Build standalone Laravel Blade templates using React and Bun.

> ⚠️ INFO: BladeX is experimental. There are no tests and no guarantees that it will work in a specific environment.

## 🤔 Why BladeX?

- Use React for your UI
- Keep Laravel Blade for routing & backend
- No SPA complexity

## ✨ Features

- ⚡ Hot Module Reloading during development
- 📄 Standalone Blade pages & components
- 🧠 Custom HTML head API
- 🔌 Blade ↔ React data bridge

## 🚀 Setup

Inside your Laravel project's root directory, run the following commands:

```sh
bunx bladex create
cd bladex
bun run dev
```

This will create a `bladex` directory inside your Laravel project containing your BladeX codebase.
After running `bun run dev`, a new `examplePage.blade.php` page & `exampleComponent.blade.php` component will be generated and ready to use.

> All pages generated via BladeX are grouped in a `bladex` directory inside your Laravel project's `resources/views` directory.
> All components generated via BladeX are grouped in a `bladex` directory inside your Laravel project's `resources/views/components` directory.
> Therefore, you need to use the `bladex.` prefix when trying to access the generated pages & components.

Set up a Laravel route that returns the following view:

```php
return view('bladex.examplePage', [
  'title' => 'Hi from Laravel!',
  'name' => 'John Doe',
]);
```

When accessing your new Laravel route, you will see the example page, showcasing all of BladeX's features.

To test the example component, you can just paste the following Blade component into one of your existing Blade views:

```
<x-bladex.exampleComponent name="John Doe" />
```

When accessing this Blade view, you will see the example component.

**🎉 You have now successfully set up BladeX! 🎉**

## 📂 Project Structure

```
bladex/
├── .gitignore
├── bladex.config.ts
├── package.json
├── tsconfig.json
├── bun.lock (generated automatically)
├── src/
│   └── assets/
│   │   └── app.css
│   └── components/
│   │   └── counter.tsx
│   └── lib/
│   │   └── example.ts
│   └── exports/
│       └── exampleComponent.tsx
│       └── examplePage.tsx
```

## ⌨️ Commands

```sh
bun run dev    # start development with HMR
bun run build  # build Blade views
```

## ⚙️ Config

In BladeX's config you can define the exports directory and the views directory.
By default the exports directory points to the automatically created `bladex/src/exports` directory.
For the views directory it points to the `resources/views` directory in your Laravel project. Please make sure it actually points to your Blade-views directory if you have manually changed it.

## 🤝 Runtime Helpers

- **useBladeData** – Access Blade variables safely in React.
- **setPageTitle** – Change the page title at runtime.
- **bladeVar** – Reference Blade variables inside the head configuration.

## 📄 Example Page

```tsx
import { definePage, useBladeData, bladeVar, setPageTitle, title, meta } from 'bladex';
import { useState } from 'react';
import Counter from '@components/counter';
import { example } from '@lib/example';
import '@assets/app.css';

export default definePage({
    head: [title().content(\`BladeX Page | \${bladeVar('title')}\`), meta().name('description').content('A Blade view, built using BladeX.')],

    component() {
        const data = useBladeData<{ name: string }>();
        const [exampleLibFnResult, setExampleLibFnResult] = useState('');

        const useExampleLibFn = () => {
            setExampleLibFnResult(example());
        };

        const useSetPageTitleFn = () => {
            setPageTitle('BladeX Page | Updated');
        };

        return (
            <div>
                <h1>Hello World</h1>
                <h1>Blade-View-Data: {data.name}</h1>
                <button onClick={useSetPageTitleFn}>Update title from the client</button>
                <Counter />
                <button onClick={useExampleLibFn}>Use example @lib function</button>
                <h1>{exampleLibFnResult}</h1>
            </div>
        );
    },
});
```

## 🧠 HTML Head

BladeX provides a chainable API to define your `<head>`:

```tsx
import { definePage, title, meta, link } from "bladex";

export default definePage({
    head: [
        title().content("My Page"),
        meta().name("description").content("My page"),
        link().rel("stylesheet").href("/app.css"),
      ],

    component() {...},
});
```

## ↔️ Data Flow

BladeX separates server and client data:

- Use `useBladeData()` inside React components to access Blade data.
- Use `bladeVar()` inside the `head` to reference Blade variables.

```tsx
const data = useBladeData<{ name: string }>();
```

```tsx
title().content(bladeVar("title"));
```

## 👥 Contributing

Feel free to contribute to this project as you see fit.

## 📃 License

This project is licensed under the MIT License.

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/bladex
[npm-license-src]: https://img.shields.io/npm/l/bladex
[npm-downloads-src]: https://img.shields.io/npm/d18m/bladex
[npm-href]: https://www.npmjs.com/package/bladex
