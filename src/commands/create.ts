import { mkdir } from "node:fs/promises";

export {};

const name = process.argv[3] || "bladex";

try {
  await mkdir(name);
} catch (err) {
  if ((err as NodeJS.ErrnoException).code === "EEXIST") {
    console.error(`❌ Directory "${name}" already exists.`);
    process.exit(1);
  }
}

process.chdir(name);

await Bun.write(
  "bladex.config.ts",
  `import { defineConfig } from "bladex";

export default defineConfig({
  pagesDir: "src/pages",
  outDir: "../resources/views",
});
`,
);

await Bun.write(
  "src/pages/index.tsx",
  `import { useBladeData, bladeVar, setPageTitle, title, meta } from 'bladex';
import { useState } from 'react';
import Counter from '@components/counter';
import { example } from '@lib/example';

export const head = [
  title().content(\`BladeX Page | \${bladeVar('title')}\`),
  meta().name('description').content('A Blade view, built using BladeX.'),
];

export default function Page() {
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
}
`,
);

await Bun.write(
  "src/components/counter.tsx",
  `import { useState } from 'react';

export default function Counter() {
    const [counter, setCounter] = useState(0);

    const incrementCounter = () => {
        setCounter(counter + 1);
    };

    const decrementCounter = () => {
        setCounter(counter - 1);
    };

    return (
        <div>
            <h1>{counter}</h1>
            <button onClick={incrementCounter}>+</button>
            <button onClick={decrementCounter}>-</button>
        </div>
    );
}
`,
);

await Bun.write(
  "src/lib/example.ts",
  `export function example() {
    console.log('This code runs in the browser (on the client).');
    return 'Example ' + Math.random();
}`,
);

await Bun.write(
  "tsconfig.json",
  JSON.stringify(
    {
      compilerOptions: {
        baseUrl: ".",
        paths: {
          "@pages/*": ["src/pages/*"],
          "@components/*": ["src/components/*"],
          "@lib/*": ["src/lib/*"],
        },
        jsx: "react-jsx",
        moduleResolution: "Bundler",
        types: ["bun"],
        lib: ["ESNext", "DOM"],
      },
    },
    null,
    2,
  ),
);

await Bun.write(
  "package.json",
  JSON.stringify(
    {
      private: true,
      scripts: {
        dev: "bladex dev",
        build: "bladex build",
      },
      dependencies: {
        react: "^18",
        "react-dom": "^18",
        bladex: "^0.1.2",
      },
    },
    null,
    2,
  ),
);

await Bun.write(".gitignore", `node_modules`);

await Bun.spawn(["bun", "install"], {
  stdio: ["inherit", "inherit", "inherit"],
}).exited;

console.log("✅ BladeX app ready");
