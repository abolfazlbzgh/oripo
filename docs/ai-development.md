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

## Phase 3 verification

Codex authored the dart pattern, layer choreography, English instructions, gallery diagram and verification code in the existing checkout. The work began at `f22e11cd70fb495f30c478eee7862f82bfe47ca7` on `feat/studio-ui`. The Sites local-checkout workflow informed responsive review. The project’s MIT license covers the new original work. All geometry is procedural. Dependency versions, the lockfile and the lab’s pure geometry and timing fixtures match the base.

### Local production and geometry checks

| Command                                                                        | Result                                                                                                                                                                                   |
| ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm.cmd ci`                                                                   | Installed 230 packages from the existing lock and local npm cache, with strict peer checks. Used Node 22.23.2 and npm 10.9.8 on Windows.                                                 |
| `npm.cmd run typecheck`                                                        | Generated route types and passed strict TypeScript.                                                                                                                                      |
| `npm.cmd run lint`                                                             | Passed with zero warnings.                                                                                                                                                               |
| `npm.cmd run format:check`                                                     | Passed for source, tests and documentation.                                                                                                                                              |
| `npm.cmd test`                                                                 | 49 passed across six files, up from 26. Includes the original 1,001-pose and 1,000-cycle lab checks. The verbose reporter with `--disableConsoleIntercept` prints the dart measurements. |
| `npm.cmd run build`                                                            | Emitted five published HTML documents in `build/client`, including the full English dart lesson. Vite emitted its 500 kB chunk advisory for the lazy renderer.                           |
| `npm.cmd run test:smoke`                                                       | 27 Chromium cases passed, up from 19.                                                                                                                                                    |
| `npm.cmd run test:smoke -- --browser=firefox --grep-invert "one-finger orbit"` | 25 Firefox cases passed, up from 18.                                                                                                                                                     |
| `npm.cmd run test:smoke -- --browser=webkit --grep-invert "one-finger orbit"`  | 25 WebKit cases passed, up from 18.                                                                                                                                                      |

The Windows Git Bash runs used the repository’s static preview fixture, one browser worker and per-engine output directories. The two native-protocol touch cases ran in Chromium. The final browser reports contain 77 passes with zero failures, retries or skipped cases among the selected tests. An initial restricted Firefox process crashed on blank-page creation. The stock browser ran successfully with local host process permissions. An early Chromium theme test left the guide while its script was loading. It now waits for the guide heading before leaving and retains its failed-request assertion.

The dart’s rest mesh has area 6 and a single boundary of length 10. The tests independently compute flat-fold reflections and the two rotated wing cross-sections for all ten canonical poses. The finished wingspan is 1.501358025 units and the tail keel is 0.3 units high.

| Measurement, in world units                                                  | Maximum absolute error |
| ---------------------------------------------------------------------------- | ---------------------: |
| Rigid face edges and diagonals over 9,009 poses (1,001 per action)           |          1.055 × 10⁻¹⁵ |
| Current hinge endpoints                                                      |                      0 |
| Shared and moving vertices against an independent per-face rotation          |          2.722 × 10⁻¹⁵ |
| Canonical landmarks against independent geometry                             |          9.501 × 10⁻¹⁶ |
| Drift after 1,000 complete forward/backward traversals, including half-steps |                      0 |

Adjacent actions share the exact stored endpoint. A missing ply in the left wing fails validation. A separate Chromium run used the real animation clock for all nine actions and observed 89–108 distinct intermediate progress values per action.

### Browser and visual evidence

The pixel oracle projects independent wing, keel and rectangle outlines into the production camera. It compares their union with the two paper colors in a canvas screenshot. The middle sample has the left wing 42° out and the right packet upright. The final sample has both wings 84° out. Percentages are intersection over union.

| Browser                              | Initial sheet | Intermediate wing | Finished dart |
| ------------------------------------ | ------------: | ----------------: | ------------: |
| Chromium Headless Shell 159.0.8154.6 |        99.00% |            92.95% |        95.90% |
| Firefox 159.0                        |        99.16% |            90.31% |        94.52% |
| WebKit 27.2                          |        98.88% |            90.38% |        94.69% |

The catalog journey checks every instruction going forward and backward, reverse from a moving wing, replay of the last action and restoration of the original paper pixels. Direct requests and refreshes of the lesson returned HTTP 200 with metadata and all nine instructions even with JavaScript disabled. All five published routes passed direct-load and refresh checks. Both visits to each of `/fr`, `/en/missing`, `/en/lessons/missing-dart` and `/fr/lessons/paper-airplane` returned HTTP 404 and a working recovery link.

Light, Dark and System passed. The reflow suite checked 320, 390, 768 and 1440 CSS pixels at 100% and 200% text size. Both phone widths also passed an actual painted-silhouette check. Keyboard activation retained focus and the polite status identified the completed step. Chromium showed a solid 3px keyboard-focus outline with a 3px offset on Next. Orbit, zoom and reset preserved the pose. Chromium emulated orbit, pinch and a swipe on the notes to scroll. Reduced motion, unavailable WebGL, loss during a wing fold and release of the old context on route exit all passed.

Headed Chrome 157 used WebGL 2 on an NVIDIA RTX 4050 via ANGLE/D3D11. The review covered the initial sheet, folded corners, narrow nose, upright body, moving left wing and finished dart. A low-angle view exposed the keel beneath the wings. The desktop initial and fully reversed PNGs were byte-identical. A full-page screenshot with a paused clock cleared the mobile canvas during capture. The retained mobile images use the actual viewport. Local captures in `.local/phase-3/headed/` include the following files.

- `catalog.png`, `1440-light-initial.png`, `1440-light-left-wing-in-motion.png`
- `1440-light-finished.png`, `1440-light-keel.png`, `1440-light-reversed.png`
- `320-light-finished.png`, `390-dark-finished.png`

The monitored journeys reported zero uncaught exceptions, hydration errors, failed required assets or external requests. Fiber emitted its upstream Three.Clock deprecation warning. A headless Chromium driver also reported readback performance warnings. The headed review reported the Clock warning alone.

### JavaScript sizes and handoff

| Client JavaScript in bytes                                            |  Phase 2 raw / gzip |  Phase 3 raw / gzip | Change raw / gzip |
| --------------------------------------------------------------------- | ------------------: | ------------------: | ----------------: |
| Lazy scene for the complete dart, compared with the Phase 2 lab scene |   722,463 / 187,477 |   725,589 / 188,997 |   +3,126 / +1,520 |
| Lazy scene for the lab                                                |   722,463 / 187,477 |   723,807 / 188,087 |     +1,344 / +610 |
| All emitted client scripts, including the appearance bootstrap        | 1,100,406 / 309,430 | 1,123,055 / 318,903 |  +22,649 / +9,473 |

Sizes use Node’s default `gzipSync` separately on each file, as in Phase 2. Each scene row counts the shared studio plus that model’s drawing module. The aggregate also counts route code, pure geometry, English copy and the route manifest. The live homepage requested 11 scripts and zero scene chunks. Entering the dart fetched the drawing module and shared WebGL studio on demand.

The straight-crease authoring contract is ready for another individually validated model. Physical paper handling and flight, physical-phone input, spoken assistive technology, other GPU hardware, Vercel and remote CI remain unverified. [Authoring handoff](architecture.md#adding-the-next-lesson)

## Phase 4 verification

The clean `feat/complete-origami-lesson` tip was `4b2a04c600eba949a86146a0531d88119a98436e`. The collection branch started there. The baseline rebuild emitted five documents and all 49 baseline unit tests passed. The heart and fox use original coordinate constructions, English instructions and SVG catalog studies. All paper in the studio is a procedural mesh of the starting sheet. [Model plans and provenance](decisions/0004-flat-packet-lessons.md)

### Commands and scope

Windows used the pinned Node 22.23.2, npm 10.9.8, the existing lockfile and strict peer resolution. A native Lightning CSS binary prevented removal of the old dependency directory. The partially removed directory was preserved under ignored `.local/phase-4/previous-node-modules/`. A clean offline install then completed from the repository cache.

| Command                                                                                    | Local result                                                                                          |
| ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| `npm.cmd ci --offline`                                                                     | Installed 230 packages. Dependency and lockfile diffs were empty.                                     |
| `npm.cmd run typecheck`, `npm.cmd run lint`, `npm.cmd run format:check`                    | Route type generation, strict TypeScript, ESLint and Prettier passed.                                 |
| `npm.cmd test -- --reporter=verbose --disableConsoleIntercept`                             | 61 tests passed across eight files.                                                                   |
| `npm.cmd run build`                                                                        | Seven pre-rendered HTML documents in `build/client`, with the existing Vite lazy-chunk size advisory. |
| `npm.cmd run test:smoke -- --workers=1`                                                    | 40 Chromium cases passed.                                                                             |
| `npm.cmd run test:smoke -- --workers=1 --browser=firefox --grep-invert "one-finger orbit"` | 36 Firefox cases passed.                                                                              |
| `npm.cmd run test:smoke -- --workers=1 --browser=webkit --grep-invert "one-finger orbit"`  | 36 WebKit cases passed.                                                                               |

The browser runs used the repository’s production static server on disposable loopback ports, separate output directories and list/JSON reporters. The four Chromium-protocol touch journeys ran in Chromium. Firefox needed host process permissions to create a content page. An initial Firefox reflow sweep left a document during its studio download. The test now waits for enabled camera controls before resizing or leaving each studio and still checks every failed request. The final selected runs had 112 passes, zero failures, zero retries and zero skips.

### Geometry

Each action was sampled at 1,001 evenly spaced fractions, endpoints included. Rigid error covers all pairwise distances on each material panel, including diagonals. Seam error compares each incident face’s independently evaluated position with the shared vertex. The tolerance is 1e−6 world units. Every adjacent action shared the exact stored endpoint.

| Model | Faces / vertices / edges | Sampled poses | Max rigid error | Max hinge error | Max seam error | Max canonical landmark error | Drift over 1,000 round trips |
| ----- | ------------------------ | ------------: | --------------: | --------------: | -------------: | ---------------------------: | ---------------------------: |
| Dart  | 16 / 20 / 35             |         9,009 |       1.055e−15 |               0 |      2.722e−15 |                    9.501e−16 |                            0 |
| Heart | 22 / 29 / 50             |        12,012 |       3.331e−16 |               0 |      7.201e−16 |                    3.140e−16 |                            0 |
| Fox   | 12 / 14 / 25             |         6,006 |       4.441e−16 |               0 |      1.061e−15 |                    5.551e−16 |                            0 |

The square lessons each cover area 2 with one boundary of length 4√2. Independent planar constructions predict every material vertex after each action, including the separate upper muzzle and the final lobe or ear positions. Dropping a moving panel fails the seam check for both lessons. Playback tests also retraced every half-step and exercised interruption, replay turnaround and instant settling. The separate lab’s 1,001 samples gave a maximum rigid error of 2.220e−16, with zero hinge error, diagonal error and drift across 1,000 cycles.

### Production rendering and interaction

The screenshot oracle projects hand-constructed 3D outlines with the recorded camera and compares their union against paper-colored pixels. It also checks front/back colors at interior landmarks. The two heart samples are the center mark and lower flap at 90°. The two fox samples are the doubled triangle and left ear at 90°. The dart retains its independent wing-and-keel oracle. Values are silhouette intersection over union, in percent.

| Engine   | Model |  Flat | First midpoint | Second midpoint | Finished |
| -------- | ----- | ----: | -------------: | --------------: | -------: |
| Chromium | Dart  | 99.00 |          95.83 |               — |    97.23 |
| Chromium | Heart | 99.32 |          99.24 |           97.64 |    96.46 |
| Chromium | Fox   | 99.32 |          98.83 |           97.83 |    97.22 |
| Firefox  | Dart  | 99.16 |          94.86 |               — |    95.79 |
| Firefox  | Heart | 98.74 |          98.19 |           97.81 |    95.47 |
| Firefox  | Fox   | 98.71 |          98.34 |           97.30 |    96.69 |
| WebKit   | Dart  | 98.89 |          95.25 |               — |    96.78 |
| WebKit   | Heart | 98.68 |          99.34 |           97.45 |    95.43 |
| WebKit   | Fox   | 98.65 |          97.86 |           97.62 |    96.96 |

Direct loads and refreshes returned HTTP 200 for all seven published paths. Each lesson included its entire transcript before JavaScript. Seven unknown or unsupported paths returned HTTP 404 on both visits with working recovery. The catalog journeys exercised every action forward and backward. Switching Dart → Heart → Fox → Dart during motion left one fresh canvas on entry. Every retired GL context was lost, and the monitored wheel, document key and reduced-motion listeners returned to their baseline.

Keyboard commands, retained focus, polite status updates, Light/Dark/System, reduced motion, camera orbit/zoom/reset, unavailable WebGL and mid-fold context loss passed. Layout was checked at 320, 390, 768 and 1440 CSS pixels at both 100% and 200% text, including the live studios. The two new lessons also passed phone-width painted-outline checks. Emulated touch could orbit and pinch on the canvas and scroll the page from the instructions. The monitored final journeys observed zero application exceptions, hydration errors, failed required assets or external requests.

### Local captures

Headed Chrome 157.0.8103.79 used WebGL 2 on an NVIDIA GeForce RTX 4050 Laptop GPU through ANGLE/D3D11. Chromium Headless Shell 159.0.8154.6 reported SwiftShader. Firefox 159.0 and Playwright WebKit 27.2 returned generic renderer identifiers. The headed browser emitted the upstream Three.Clock deprecation. Headless screenshot readback also produced a driver performance warning.

| Folder inside `.local/phase-4/headed/` | Reviewed PNGs                                                                            | Visible landmarks                                                                                                                                                             |
| -------------------------------------- | ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `paper-heart/`                         | `flat`, `mid-6`, `mid-7`, `finished`, `angled`, `back`, `reversed`, `worktable`          | Bottom flap and left packet lift separately. Two clipped lobes flank the notch above one lower tip. The underside exposes the little back folds.                              |
| `fox-face/`                            | `flat`, `mid-1`, `mid-4`, `mid-5`, `finished`, `angled`, `back`, `reversed`, `worktable` | One loose muzzle ply rises above the stationary chin. The ear packet swings behind. Both ears rise above a level crown and the green muzzle remains visible on the gold face. |

The initial and reversed headed PNGs were byte-identical for each model, including all 356,655 pixels of each canvas capture. A separate Chromium run using the real animation clock observed 66–96 distinct intermediate readings per heart action and 78–96 per fox action. The local evidence directory also contains the catalog, 320px/light and 390px/dark viewport images for both lessons, numerical logs, GPU reports and final browser JSON.

### Bundle and route measurements

Sizes are bytes, shown as raw / gzip. Cold JavaScript counts the distinct successful scripts requested by a fresh browser context through scene readiness. The lazy row counts the studio and the lesson drawing/authoring chunks. Aggregate JavaScript includes every emitted client script and the appearance bootstrap. Gzip was measured separately on each file with Node’s default `gzipSync` on both builds.

| JavaScript              |             Phase 3 |             Phase 4 |           Change |
| ----------------------- | ------------------: | ------------------: | ---------------: |
| All emitted scripts     | 1,123,055 / 318,903 | 1,136,519 / 324,350 | +13,464 / +5,447 |
| Homepage cold           |   369,566 / 118,335 |   372,093 / 118,938 |    +2,527 / +603 |
| Lab cold                | 1,098,711 / 308,619 | 1,100,056 / 308,775 |    +1,345 / +156 |
| Dart cold               | 1,108,875 / 313,145 | 1,111,464 / 314,016 |    +2,589 / +871 |
| Heart cold              |           New route | 1,113,796 / 314,806 |                — |
| Fox cold                |           New route | 1,112,515 / 314,532 |                — |
| Lab lazy scene          |   723,807 / 188,087 |   723,842 / 188,110 |        +35 / +23 |
| Dart lazy scene         |   725,589 / 188,997 |   725,777 / 189,185 |      +188 / +188 |
| Heart or fox lazy scene |          New routes |   728,137 / 190,304 |   Shared by both |

The homepage requested 11 scripts and zero scene chunks on each build. Static homepage HTML grew by 1,690 / 404 bytes, the lab by 9 / 9 and the dart by 94 / 22. New static lesson HTML measured 9,145 / 3,143 for the heart and 8,776 / 3,081 for the fox. The numerical receipts are `.local/phase-4/baseline-sizes.json` and `final-sizes.json`.

Physical folding and handling, actual phone input, spoken screen-reader output, Vercel routing/caching and remote GitHub CI remain open release checks. All Phase 4 Git operations were local.

## Phase 5 review and authorship

The owner selected three English lessons, retained the static stack and required physical, assistive-technology and hosted evidence before making release claims. Codex reviewed the repository, exposed the existing expected-pose copy in the static transcripts, extended the production tests and CI workflow, and prepared the license notices and contributor handoff. Git records the owner's requested local commit identity. Human review of the final changes and hands-on acceptance remain open.

The isolated build reproduced all 41 client files byte for byte. The local browser checks used the real production renderer, including independent projected silhouettes and forward/reverse journeys. The [Phase 5 verification record](release.md#phase-5-historical-evidence) gives commands, scope, exceptions and the later release gates.

## Phase 6 studio handoff

The owner selected Oripo Studio Compact UX v4. Codex implemented the viewport layout, continuous transport, instruction disclosure and release checks against the existing React and Three.js application. The reference stayed in the design archive. The production mesh, lesson sequences and English step IDs come from the project. The icons are original strokes covered by the project's MIT license.

The prerendered popover, motion-free finish/start controls and keyboard orbit adapt the reference for static documents, reduced motion and keyboard use. Independent coordinate and silhouette tests cover intermediate poses. Physical sheets, real device input and spoken output still need hands-on review. [Transport decision](decisions/0005-continuous-lesson-transport.md) · [Local release evidence](release.md)

## Phase 7 localization and provenance

The owner’s approved design preview guided the layout and interactions. Oripo supplies the production artwork, geometry, timing and English fold manuscripts. Codex drafted the localized interface and lesson text against those manuscripts. Automated checks compare step IDs, interpolation fields and published content in all ten locales. Human linguistic review is `REVIEW_PENDING`, including fold terminology and spoken control labels. The six self-hosted font derivatives carry the SIL Open Font License. [Font sources and licenses](fonts.md) · [Local release evidence](release.md)
