# AI-assisted development

## Phase 0 skill audit

The session catalog and local skill directories were inspected on 2026-11-22. The available Sites skill had a local-checkout workflow. That workflow informed responsive layout, local preview and browser QA in the owner's existing repository. The owner's repository, stack, npm lockfile and local-only instructions governed implementation.

The catalog also exposed skill discovery and installation, Figma, image generation, computer use, artifact authoring, and hosting tools. The handoff was a read-only design reference and the implementation needed only CSS geometry and a real browser test. Project-native npm, Git, Vitest and Playwright handled the work. The installed catalog supplied no dedicated origami geometry workflow.

No third-party or repo-local skill was installed. A project skill would become worthwhile once authoring and validating several real folds produces a repeatable method. Keep repeatable checks executable in tests before writing agent-specific instructions.

## Provenance and follow-up

The preview handoff informed paper-inspired surfaces and the pine/cream palette. Its logo, source, screenshots and illustrative poses remain external. The CSS mark, figure and notation samples here are original. Fonts resolve locally from the reader's system. The MIT grant covers original code. Record the author, source, license and required attribution before importing any future artwork, typeface, tutorial diagram, model or animation.

Abolfazl owns review and release decisions. The Phase 0 build evidence and outstanding hosted checks are recorded in the [framework ADR](decisions/0001-framework-and-deployment.md).

## Phase 1 implementation and provenance

Codex implemented the single-crease model, reversible time controller, WebGL scene, English controls and production checks in the existing checkout. The paper geometry, palette assignments, code and instructions for the lab are original project work under the repository's MIT license. The lab draws its own meshes and uses local system fonts. The session skill catalog was reviewed. The work used the repository's Git, npm, Vitest and Playwright tooling directly. No packaged skill was invoked or installed in Phase 1.

| Published package          | Decision and source                                                                                                                                                                                                                                                                                                          |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `three@0.187.0`            | Runtime meshes, WebGLRenderer and the OrbitControls addon from the same MIT distribution. [Published package](https://registry.npmjs.org/three/0.187.0) · [Camera controls](https://threejs.org/docs/pages/OrbitControls.html)                                                                                               |
| `@types/three@0.187.0`     | Matching MIT declarations from DefinitelyTyped, installed as a development dependency. Its upstream dependency list includes Rapier 0.12.0. The app imports no physics code. [Published metadata](https://registry.npmjs.org/@types/three/0.187.0)                                                                           |
| `@react-three/fiber@9.8.2` | MIT, stable npm tag. Its web peer ranges are `>=19 <19.4` for React and React DOM and `>=0.156` for Three. React and React DOM both resolve to the existing 19.3.1. [Published peers](https://registry.npmjs.org/@react-three/fiber/9.8.2) · [React 19 compatibility](https://r3f.docs.pmnd.rs/tutorials/v9-migration-guide) |
| `@react-three/drei@10.7.9` | Evaluated only. Its peers accept React and React DOM `^19`, Fiber `^9.0.0` and Three `>=0.159`. OrbitControls already exposes the required rotation and dolly operations. [Published peers](https://registry.npmjs.org/@react-three/drei/10.7.9)                                                                             |

The registry versions and peers were read with `npm.cmd view` against `https://registry.npmjs.org`. npm resolved with `--strict-peer-deps`. The committed lock was generated from the foundation lock in a directory without an installed dependency tree to retain the optional platform packages. Every Phase 0 package path and version was preserved.

## Phase 1 verification

Local Windows verification used Node 22.23.2, npm 10.9.8 and the existing Playwright Chromium Headless Shell 159.0.8154.6 (revision 1255). The browser reported WebGL 2.0 via ANGLE Vulkan SwiftShader. It created a 595 × 361 drawing buffer at the 1200 × 900 desktop QA viewport.

| Command                                                                 | Local result                                                                                                                                                 |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `npm.cmd ci`                                                            | Clean install from the final lock, with strict peers and the local package cache.                                                                            |
| `npm.cmd run typecheck`, `npm.cmd run lint`, `npm.cmd run format:check` | Route types, strict TypeScript, zero-warning lint and formatting passed.                                                                                     |
| `npm.cmd test`                                                          | 23 passed, 0 failed, 0 skipped. Includes all 3 foundation tests.                                                                                             |
| `npm.cmd run build`                                                     | Produced four route documents in `build/client`. Vite reported its chunk-size advisory for the lazy scene, approximately 722 kB minified and 189 kB gzipped. |
| `npm.cmd run test:smoke`                                                | 13 passed, 0 failed, 0 skipped. Includes all 5 foundation cases.                                                                                             |

The raw lab document and JavaScript-disabled direct load and refresh showed the sheet description and controls. The hydrated route returned 200 and produced visible paper pixels. Pixel tests measured both faces, the raised half, overlap at closure, an identical intermediate pose after reversal, and restoration of the initial image. The positive WebGL cases require a live context. The no-context case deliberately returns null and the context-loss case drops a real context during motion. Separate navigation checks verified disposal of the old context and a fresh canvas after return.

The browser checks also exercised keyboard orbit and zoom, pointer dragging, wheel zoom, emulated one-finger orbit and two-finger pinch, system/light/dark appearance, instant reduced motion, 320px width and 200% text. No unexpected requests, hydration errors or uncaught page errors were observed. In the JavaScript-disabled check Chromium intentionally blocks script preloads. The hydrated checks reject all failed requests. The original `/`, `/en` and `/en/guide/crease-notation` returned 200 on direct load and refresh. Both `/fr` and `/en/missing` returned HTTP 404.

The pinned Fiber runtime constructs a Three clock and triggers its upstream deprecation warning. The fold itself samples monotonic elapsed time. Human review remains open for screen-reader speech and focus, physical touch devices, hardware GPUs, Firefox and WebKit. The Phase 1 evidence covers local Chromium. Vercel and remote CI remain unverified. The geometry error bounds and scope of the next UI phase are recorded in the [architecture handoff](architecture.md#first-3d-proof-of-concept).

## Phase 2 verification

The Sites local-checkout workflow informed the UI and production review. The external preview supplied a palette and a split text/illustration composition. The four-plane Oripo mark, crane illustration, gallery diagrams and original CSS are project work under the repository's MIT license. The study caption identifies the crane as an illustration. Only the first fold appears in the interactive catalog. All assets are local, and this phase adds no packages or fonts.

| Local production checks                                                | Coverage                                                                                                                                                                                                                                            |
| ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Node 22.23.2, npm 10.9.8                                               | Clean lockfile install with strict peers, route types, zero-warning lint, formatting and static build.                                                                                                                                              |
| Vitest                                                                 | 26 passed. Includes 1,001 sampled poses, 1,000 exact round trips, published gallery URLs and semantic theme contrast.                                                                                                                               |
| Chromium Headless Shell 159, WebGL 2 via SwiftShader                   | 19 passed. Includes one-finger orbit, two-finger pinch, ordinary page scrolling, reduced motion, context loss and context disposal.                                                                                                                 |
| Firefox 159 and WebKit 27.2 on Windows                                 | 18 passed per engine. The low-level touch test uses Chromium's DevTools Protocol. All other browser tests ran, including pixel comparisons at flat, upright and closed poses.                                                                       |
| Visible Chrome 157, NVIDIA GeForce RTX 4050 Laptop GPU via ANGLE/D3D11 | Reviewed the homepage, guide and live stage at 1440, 1280, 768, 390 and 320 CSS pixels across light and dark appearances. Captured flat, 90°, 180° and reversed poses.                                                                              |
| Static HTTP and browser monitoring                                     | All four published documents returned 200 on direct load and refresh. Both `/fr` and `/en/missing` returned 404 with recovery. Monitored journeys reported zero uncaught errors, hydration mismatches, failed required assets or external requests. |

The cross-browser runs use the normal suite with `--browser=firefox` or `--browser=webkit` and `--grep-invert "one-finger orbit"`. Install the matching local test binaries with `npx playwright install firefox webkit`. The default smoke script exercises every case in Chromium.

A delayed-hydration check reads the saved theme while the pre-rendered select is disabled. Keyboard checks follow the skip link into the main landmark and verify focus and completion announcements after Next and Previous. Layout checks measure the document and controls at 100% and 200% root text size. The visible review images are ignored local artifacts in `.local/phase-2/headed/`, including `desktop-1440-light-home.png`, `desktop-1280-dark-upright.png` and `phone-390-dark-reverse.png`.

| Client JavaScript, bytes                                       |  Phase 1 raw / gzip |  Phase 2 raw / gzip |
| -------------------------------------------------------------- | ------------------: | ------------------: |
| Lazy 3D scene                                                  |   722,429 / 187,465 |   722,463 / 187,477 |
| All emitted client scripts, including the appearance bootstrap | 1,094,014 / 306,961 | 1,100,406 / 309,430 |

Sizes use the same Node `gzipSync` settings on each file. The aggregate includes route chunks that load on demand. Camera reset adds 34 raw bytes to the scene. The rest of the growth comes from the site shell, artwork markup and studio UI. The homepage test observes zero requests for the scene until the studio opens. Vite still reports its large-chunk advisory for the renderer.

Physical phone use, spoken output from assistive technology, hosted HTTP behavior and remote CI remain open. Use the validated first fold as a regression fixture while developing the first complete model.
