# ADR 0001 · Pre-render each published route with React Router 8

Accepted 2026-11-22 for the Phase 0 static foundation.

## Decision

Use React Router Framework Mode with Vite, `ssr: false`, an explicit list of published paths, and initial route discovery. The build can render React in Node. Serving the resulting pages requires only a static file host. Initial discovery ships the small route manifest with the client and avoids requests to a route-discovery endpoint. [Framework modes](https://reactrouter.com/start/modes) · [Pre-rendering](https://reactrouter.com/how-to/pre-rendering) · [Static hosting](https://reactrouter.com/start/framework/deploying)

| Component                               | Locked choice            | Evidence used                                                                                                                                                                                                |
| --------------------------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Node / npm                              | 22.23.2 / 10.9.8         | Local runtime, also pinned for contributors. Router 8.5.2 requires Node ≥22.22.0.                                                                                                                            |
| React Router / framework CLI            | 8.5.2 / 8.5.2            | Registry stable tag. The CLI accepts Vite 7 or 8.                                                                                                                                                            |
| React / React DOM                       | 19.3.1 / 19.3.1          | Both satisfy the router's ≥19.2.7 peer floor. [React releases](https://react.dev/versions)                                                                                                                   |
| Vite                                    | 8.3.8                    | Compatible with the router and the Tailwind Vite plugin. [Vite guide](https://vite.dev/guide/)                                                                                                               |
| Tailwind / Vite plugin / daisyUI        | 4.3.5 / 4.3.5 / 5.8.2    | CSS-first configuration and two project-owned semantic themes. [Tailwind Vite integration](https://tailwindcss.com/docs/installation/using-vite) · [daisyUI installation](https://daisyui.com/docs/install/) |
| TypeScript / typescript-eslint / ESLint | 6.0.3 / 8.73.0 / 10.15.0 | Router accepts TS 7, but the lint parser requires TS <6.1. TS 6.0.3 satisfies both. [Strict mode](https://www.typescriptlang.org/tsconfig/strict.html)                                                       |
| Vitest / Playwright / sirv              | 5.1.1 / 1.65.1 / 3.0.2   | Separate unit and production-browser suites. The preview and browser fixture serve the same directory-index behavior.                                                                                        |

## Vercel compatibility

The registry listed 8.5.2 as stable and 7.18.6 on the maintained v7 tag. The released Vercel preset 1.3.7 declares `@react-router/dev: 7` and `@react-router/node: 7`. Vercel documents the preset as optional and recommends it for platform features. The historical v8 issue identified the mismatch. The published peer ranges were checked independently. [Vercel integration](https://vercel.com/docs/frameworks/frontend/react-router) · [Vercel issue #16730](https://github.com/vercel/vercel/issues/16730) · [Published preset metadata](https://registry.npmjs.org/@vercel/react-router/1.3.7)

The local spike passed using plain static output. Adopting v7 for the preset would add a dependency on server integration with no current consumer. Forcing v8 through the preset's peer constraints would leave that integration unsupported. If Oripo later needs server features, reopen this decision and test the then-current preset.

`vercel.json` selects the **Other** framework preset with `framework: null`, builds with `npm run build`, and selects `build/client` as the output directory. Every published route has its own directory index. This removes the need for a catch-all rewrite to React Router's generated `__spa-fallback.html`. A miss should serve the root `404.html` with status 404. [Vercel configuration](https://vercel.com/docs/project-configuration/vercel-json#framework) · [Directory indexes](https://vercel.com/docs/directory-listing) · [Static 404 guidance](https://github.com/vercel/vercel/discussions/4892)

## Reproduce the spike

These registry queries report the version and requirements used to choose the stack. On Windows the commands were invoked with `npm.cmd` and an explicit public registry.

```sh
npm view react-router dist-tags --json
npm view react-router@8.5.2 version engines peerDependencies --json
npm view @react-router/dev@8.5.2 version engines peerDependencies --json
npm view @vercel/react-router@1.3.7 version engines peerDependencies --json
npm view typescript-eslint@8.73.0 version engines peerDependencies --json
```

The initial lock was generated with `npm install --strict-peer-deps --no-audit --no-fund --registry=https://registry.npmjs.org`. To reproduce the production checks from the lockfile, use the following commands.

```sh
npm ci
npm run typecheck
npm run lint
npm run format:check
npm test
npm run build
npx playwright install --only-shell chromium
npm run test:smoke
```

On local Windows, `npm ci` reported 211 packages added and exited 0. Typecheck, lint, formatting and production build exited 0. Vitest passed 3 tests. Playwright passed 5 with Chromium Headless Shell 159.0.8154.6. npm audit/funding requests were disabled for the clean install. The pinned Playwright binary and npm cache were kept inside ignored `.local/` for this run. Browser setup used the installed Playwright CLI.

| Request                     | Production artifact                   | Local browser result                                              |
| --------------------------- | ------------------------------------- | ----------------------------------------------------------------- |
| `/`                         | `index.html`                          | 200 on direct load and reload, language entry in initial HTML     |
| `/en`                       | `en/index.html`                       | 200 on direct load and reload, foundation heading in initial HTML |
| `/en/guide/crease-notation` | `en/guide/crease-notation/index.html` | 200 on direct load and reload, guide heading in initial HTML      |
| `/en/missing`, `/fr`        | `404.html`                            | 404 and a working return link                                     |

The three document tests exercised the appearance control after each navigation and reload. Their checks for browser errors, hydration messages, failed requests, HTTP errors and external requests were empty. The narrow-screen journey exercised client links, system preference and both explicit themes at 320 CSS pixels. The test fixture owns its static HTTP listener directly so a successful run also closes the listener on Windows.

## Hosted checks still open

The planned host is Vercel. Its project settings, build image, directory-index resolution, edge HTTP status and caching require a separately authorized preview. Repeat the three direct-load and refresh cases there and inspect the response body and status on a miss. The GitHub-hosted Ubuntu job, Firefox and WebKit also remain unverified.
