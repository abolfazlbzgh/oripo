# Local release verification

## Phase 8C · Nine playable lessons

The local catalog contains three Beginner, three Intermediate and three Advanced lessons. The starting point was `feat/intermediate-lessons` at `8e516c90823fee0612601d09e06b553099c8e03c`. The three new entries are independent, connected-sheet designs. The gallery, studio and text fallback all use the same stable model and step identifiers. [Nine-lesson roster](phase-8-models.md) · [Selection, maker difficulty and fold plans](decisions/0009-advanced-model-selection.md)

### Material measurements

| New model      | Actions | Vertices / edges / faces |  Poses | Maximum rigid error | Maximum seam error | Maximum independent landmark error | Candidate triangle pairs |
| -------------- | ------: | ------------------------ | -----: | ------------------: | -----------------: | ---------------------------------: | -----------------------: |
| Pinwheel calyx |       8 | 152 / 272 / 121          |  8,008 |           1.027e−15 |          1.346e−15 |                          7.499e−16 |                  711,644 |
| River tern     |      15 | 49 / 90 / 42             | 15,015 |           1.332e−15 |          1.201e−15 |                          6.990e−16 |                  370,130 |
| Amber hex iris |      20 | 108 / 204 / 97           | 20,020 |           3.664e−15 |          3.073e−15 |                          2.722e−15 |                  703,853 |

The independent material inventory checks signed face areas, adjacent face IDs, one connected boundary cycle and one connected face graph. The source areas are 8, 4.5 and 3√3/2 square units. Each action used 1,001 fractions in the rigidity and seam checks. Fixed hinge displacement was zero. Each new lesson retraced 1,000 full clock cycles with zero drift and survived 25 interrupted fractional seeks. The triangle test sampled 31 interior fractions per action and detected zero transverse penetrations across 1,785,627 candidate pairs. This is a sampled check of ideal, zero-thickness material. The display offsets and the physical thickness of a folded sheet are separate quantities.

- **Calyx.** A contact probe counted four ordered plies before the raised crimp. The held diamond stayed fixed while the lips turned. The two opposite rim landmarks finish 1.591610 world units apart.
- **Tern.** At a point inside the bill and cheek folds, the stack increases from four plies to eight, then to sixteen in the book. The eight reopened plies retain their alternating orientation and local order as the double crimp raises the neck by 0.335756 units. The left and right wings have separate material hinges.
- **Iris.** The complete six-sector ring closed flat. All six hub sides and twelve moving rails match the taught mountain/valley senses at three interior poses. The incoming height order agreed with the closed drawing stack for 2,681 contacting ply pairs. Reopening to the exhibition pose stayed within 1.118e−15 units of the original path. Relief height was 0.383371 units.

The finished palettes are coral/peach (`#df716b`, `#f3aa91`, edge `#884452`), river blue/pale blue (`#4278ae`, `#89b6d0`, edge `#294966`) and gold/violet (`#e2b52d`, `#665389`, edge `#57416f`). Each switches at the exact endpoint. Scrubbing back restores teaching pigments. All six earlier preview PNGs retain their Phase 8B SHA-256 hashes.

### Baseline and test environment

On Windows with Node 22.23.2 and npm 10.9.8, the locked install added 230 packages and reported zero vulnerabilities. The original six-lesson source passed all 96 unit tests. The first six-lesson browser run shared live source fixtures with work in progress. Its result was discarded. An isolated checkout of the starting commit then passed 237/238 cases. Its sole failure was WebKit's five-second initial camera readiness check on the airplane. That exact untouched case passed on rerun, covering all 82 Chromium, 78 Firefox and 78 WebKit baseline cases across the two isolated runs. The candidate suite allows twelve seconds for asynchronous readiness assertions and retains its geometry thresholds and zero configured retries.

The first full nine-lesson integration run passed 304/313. Its failures exposed half-millisecond rounding in the simulated clock and pixel oracles counting a focus ring or omitting shaded crease ink. The transport check now advances an integral number of milliseconds and compares with the corresponding fraction. The phone outline check moves keyboard focus to the timeline before sampling the canvas. Its shape classifier includes antialiased gold/violet mixtures, while the endpoint pigment check retains its independent hue cutoffs. All twelve affected journeys passed in the focused three-browser run.

### Final production acceptance

The locked install, typecheck, lint, formatting, unit tests, static build and complete production browser run all passed. The unit suite contained 118 tests in 20 files. The 15.9-minute browser run passed all 313 tests in one run, with zero skips, failures, flakes or retries. Chromium 159.0.8154.6 passed 109, Firefox 159.0 passed 102 and WebKit 27.2 passed 102. Seven Chromium-only cases use the DevTools touch protocol. The other journeys run on all three engines.

The production journeys cover 320px and 390px phones, tablet, 1440px desktop, short landscape, 200% root text, Light and Dark, keyboard and reduced motion. They also cover direct load and refresh, JavaScript-disabled documents and the complete text player. On a missing scene chunk, the instructions remained usable and a reload restored one canvas. Context loss preserved the current position in the text player. Leaving during a scene download or playback retired the previous scene.

| Minimum measured intersection over union across engines | Working fold | Finished oblique | Phone front | Phone rear | Gallery PNG | Gallery pigment coverage |
| ------------------------------------------------------- | -----------: | ---------------: | ----------: | ---------: | ----------: | -----------------------: |
| Pinwheel calyx                                          |       0.9825 |           0.9907 |      0.9875 |     0.9844 |      0.9895 |                    90.8% |
| River tern                                              |       0.9805 |           0.9837 |      0.9843 |     0.9825 |      0.9741 |                    88.9% |
| Amber hex iris                                          |       0.9785 |           0.9363 |      0.9821 |     0.9840 |      0.9848 |                    89.5% |

The oblique endpoint measure uses a strict finished-pigment classifier. Blended crease pixels account for part of the iris difference. Front and rear silhouette comparisons include the shaded crease ink. The moving and static contours are independent projections. The material and contact checks above establish the additional layer information that a silhouette cannot show. The complete browser run retained 294 production screenshots.

### Delivery, routes and assets

Each locale supplies the title, card and SEO summary, starting sheet, action instructions, accessible result and full static transcript for all three models. The ten locale checks exercised both script directions and the local font subsets. The 110 canonical documents comprise ten Explores, ten Guides and 90 lesson pages. The English root alias and internal noindex lab bring the prerender route count to 112. Direct and repeat HTTP fetches returned the on-disk HTML bytes 224 times. Seven withheld or unknown slugs across all ten locales returned 140 localized, noindex HTTP 404 responses. The sitemap contained the exact 110 canonical paths, and the browser checked the canonical and alternate links.

| Cold JavaScript in bytes      | Six lessons, raw / gzip | Nine lessons, raw / gzip | Gzip change |
| ----------------------------- | ----------------------: | -----------------------: | ----------: |
| All emitted client scripts    |     1,158,846 / 334,199 |      1,177,675 / 342,535 |      +8,336 |
| English Explore               |       378,936 / 121,363 |        381,520 / 121,663 |        +300 |
| English Guide                 |       377,235 / 120,786 |        379,819 / 121,086 |        +300 |
| Calyx through scene readiness |                       — |      1,138,829 / 324,425 |         New |
| Tern through scene readiness  |                       — |      1,139,271 / 324,444 |         New |
| Iris through scene readiness  |                       — |      1,138,083 / 324,180 |         New |

Cold Chromium runs at 390 and 1440 CSS pixels both recorded zero scene requests on `/`, `/en` and the Guide. The English Explore HTML was 25,544 raw bytes and 6,012 gzipped. The lazy studio still triggers Vite's chunk-size warning at approximately 722 kB minified. The drawing reuses the existing Three.js materials and buffers during playback and releases the prior scene on navigation. English manuscripts have one static server import each. Locale data are prerendered. No new runtime dependencies or hosted services were introduced.

The build emitted a 10,260-byte calyx PNG, a 4,171-byte tern PNG and an 11,195-byte iris PNG. The development preview handler returned the same bytes for all nine PNGs as the production build. Full per-file SHA-256 values are in the ignored `.local/phase-8c/final-png.json`. Root and Guide request costs, full lesson costs, warnings and observation widths are in `.local/phase-8c/bundle.json`.

### Evidence and outstanding hands-on work

The cropped contact sheet at `.local/phase-8c/contact.png` combines actual production canvases. Its front and rear views use a 390px viewport. The full, uncropped screenshots are under `.local/phase-8c/verified-browser/`. The three `fixture-*` directories retain every action at 0.25, 0.5, 0.75 and 1. The final flat-to-flat screenshot comparison is byte-exact for each model. The gallery tests read the independently derived silhouette and pigment coverage in both themes. `geometry.log`, `verified.json`, `http.json` and `dev-preview-parity.json` retain the numeric evidence.

For physical trials, check the four-ply lip and free inner tips on a 34 cm calyx sheet, the eight-ply cheek and forward bill on a 24 cm tern sheet, and whether all six rails seat in the taught order on a 24 cm hexagon. Physical folding, independent maker ratings, real phones, hardware GPU rendering, spoken screen-reader output, GitHub CI, deployed HTTP and Vercel cache behavior remain untested. Human translation and terminology review for every locale is `REVIEW_PENDING`. Published originals have project provenance. Contemporary designs with unresolved adaptation permission remain outside the collection. External pushes, pull requests, tags and deployments were outside this local release.

## Phase 8B · Six playable lessons

The catalog contains three Beginner lessons and three Intermediate lessons. The four-foot jumping frog joins Masu in the Intermediate tier alongside the four-band herringbone map. The full nine-lesson milestone still needs three verified Advanced models. The source branch for this increment was `feat/nine-lessons-finished-colors` at `6a096965fbfeb4df0850ec31a17b9befe45c9a5e`. [Model selection and rights](decisions/0008-intermediate-constructions.md)

### Paper measurements

| Model                  | Actions | Vertices / edges / faces |  Poses | Worst rigid error | Worst seam error | Worst independent landmark error | Collision candidate pairs |
| ---------------------- | ------: | ------------------------ | -----: | ----------------: | ---------------: | -------------------------------: | ------------------------: |
| Four-foot jumping frog |      20 | 145 / 344 / 200          | 20,020 |         1.055e−15 |        2.436e−16 |                        8.951e−16 |                 6,035,869 |
| Herringbone map        |      15 | 30 / 49 / 20             | 15,015 |         7.772e−16 |        8.671e−16 |                        6.497e−16 |                   156,776 |

Both material meshes are connected disks. The acceptance tolerance is 1e−6 world units. The geometry tests sampled each action at 1,001 fractions including both canonical boundaries. Fixed hinge displacement was zero. Both models returned exactly to their starting coordinates after 1,000 full traversals and passed 25 seeded interruption, reversal, seek and resume cases each. The collision oracle found zero transverse penetrations at 31 interior fractions per action. The Masu control reproduced its original 697,312 candidate pairs. Coplanar contact is part of the intended folded stack.

At half opening, each pinned frog pocket had 0.176777 units of rim clearance and 0.235702 units of tip clearance. Its unloaded Z-pleat had 0.038627 units of clearance at the return hinge. The front and rear foot pairs each span 0.6 units. Probes distinguished eight plies at each flattened outer hind foot and sixteen near its root. The map finished with two ridges 0.6 units high, a projected band spacing of √5/6 units and a minimum projected panel area of 0.083853 square units.

### Production build and static output

On Windows, Node 22.23.2 and npm 10.9.8 installed 230 locked packages with `npm.cmd ci --strict-peer-deps`. Typecheck, zero-warning ESLint, Prettier, all 96 Vitest cases in 15 files, and the production build passed. The Phase 8 baseline was 85 unit cases. The dependency manifest and lockfile have the same contents as the starting revision.

The registry generates 80 canonical pages in ten locales, 81 public HTML entries including the English root alias and 82 entries including the internal lab. The build also supplies eleven recovery documents. The production HTTP check compared direct and repeat requests for all 82 routes with the built HTML, yielding 164 matching 200 responses. Four withheld slugs in each locale, each requested twice, returned 80 real 404 responses with the correct language and `noindex`. The sitemap matched the canonical registry exactly.

The frog uses `#528236` / `#82a74e` / `#314c28` for its finished front, reverse and edge. The map uses `#7051a5` / `#ad88cb` / `#453661`. Build-time projection produced a 6,359-byte frog and a 7,336-byte map. The six PNGs total 32,860 bytes. Regenerating the four legacy previews from the starting revision produced the same SHA-256 digests as the new build. Both new manuscripts have the complete sheet and per-action instructions and results in all ten locales. The local font and CSS audit found zero missing characters.

| JavaScript measured on a cold Chromium visit, bytes |  Phase 8 raw / gzip | Phase 8B raw / gzip | Increase in gzip bytes |
| --------------------------------------------------- | ------------------: | ------------------: | ---------------------: |
| All emitted client scripts                          | 1,144,372 / 327,767 | 1,158,846 / 334,199 |                  6,432 |
| English Explore                                     |   377,259 / 121,145 |   378,936 / 121,363 |                    218 |
| Explore scene requests                              |               0 / 0 |               0 / 0 |                      0 |
| Masu through scene readiness                        | 1,123,248 / 318,718 | 1,128,439 / 320,479 |                  1,761 |
| Frog through scene readiness                        |                   — | 1,133,127 / 322,611 |                      — |
| Map through scene readiness                         |                   — | 1,127,051 / 320,002 |                      — |

The cold Explore HTML was 22,988 raw bytes and 5,633 gzipped. Both desktop and phone-width Explore requested zero scene bytes. Vite still flags the large lazy renderer chunk. Its server build also reports the shared static and dynamic imports of the three English Intermediate manuscripts. The local browser reports the existing Three.Clock deprecation and occasional SwiftShader stalls during pixel readback. Full measurements live in `.local/phase-8b/bundle.json`.

### Production browser images

`npm.cmd run test:smoke` ran the complete suite against the production output on loopback. All 238 cases passed in 10.2 minutes, up from the four-lesson baseline of 208. The final run recorded zero failed, skipped, retried or flaky cases. Four Chromium journeys use the DevTools touch protocol. Firefox ran with local host browser-process access.

| Browser               | Passed |
| --------------------- | -----: |
| Chromium 159.0.8154.6 |     82 |
| Firefox 159.0         |     78 |
| WebKit 27.2           |     78 |

The suite exercised direct load and refresh, localized metadata and transcripts, right-to-left layout, 320/390/768/1440 px widths, phone landscape, double text, reduced motion, both themes, keyboard focus return and announcements. Every new action also ran in the text player with WebGL disabled. Tests triggered context loss, delayed scene loads and scene disposal while switching across the catalog. Monitored normal journeys reported zero uncaught errors, hydration mismatches, failed required assets or unexpected outbound requests.

Six supplemental journeys forced each new scene module to return HTTP 503 in each engine. Both lessons exposed their text controls, reached the final result and stepped back. Restoring the asset and refreshing produced one live canvas at the starting sheet in all six cases. The results are in `.local/phase-8b/asset-recovery.json`.

An earlier run caught a Firefox timing issue in the gallery test when it asked a lazy image to decode before its request began. The test now waits for a positive intrinsic width before decoding and applies the original silhouette and pigment thresholds. The complete final JSON report is `.local/phase-8b/acceptance.json`, with 186 PNGs in `.local/phase-8b/acceptance-browser/`. All six thumbnails also matched byte for byte between the development server and the production assets.

The independent masks use the frog head, feet and Z-pleat coordinates and the map’s row and ridge spacing. The live canvas and transparent gallery PNGs are measured separately. The percentages below are intersections over union across Chromium, Firefox and WebKit. The last column measures the proportion of the PNG’s opaque paper pixels in the two finished pigments.

| Model           | Live oblique |  Phone front |   Phone rear | Gallery outline | Gallery pigment coverage |
| --------------- | -----------: | -----------: | -----------: | --------------: | -----------------------: |
| Jumping frog    | 96.28–97.78% | 95.80–97.73% | 96.24–97.49% |          96.32% |                   89.40% |
| Herringbone map | 98.87–98.96% | 99.02–99.59% | 98.55–99.56% |          98.08% |                   92.39% |

The last 0.001 of each new model’s timeline still contained zero finished-hue pixels in all three engines. The endpoint introduced the pigments and backing out restored the instructional stock. The suite compares the initial canvas PNG with the complete reverse traversal and checks the gallery at phone width, double text and both themes.

### Headed inspection

Visible Chrome 157.0.8103.79 used ANGLE Vulkan SwiftShader. Twelve studio captures cover the starting sheet, working fold, completed oblique, front and rear views, and reversal for each model. The starting and reversed PNGs were byte-identical for both. Independent projections over the saved headed pixels gave these intersections over union.

| Model           | Oblique |  Front |   Rear |
| --------------- | ------: | -----: | -----: |
| Jumping frog    |  98.10% | 98.98% | 98.89% |
| Herringbone map |  99.42% | 99.59% | 99.24% |

The contact sheet is `.local/phase-8b/headed-contact.png` and the six pixel measurements are in `.local/phase-8b/headed/silhouettes.json`. Three additional production captures in the evidence directory show the working geometry at higher magnification. The paired pocket mouths are visible in `paired-open-pockets.png`, the frog’s Z profile in `resting-spring.png` and the alternate ridges and troughs in `open-channels.png`.

### Physical and editorial acceptance

Human linguistic review of both manuscripts in all ten locales is `REVIEW_PENDING`. Physical folding and frog launch, real-phone input, hardware-GPU acceptance, spoken screen-reader output and hosted verification are **NOT RUN** in Phase 8B. The next three lessons require maker-rated Advanced plans with documented rights and per-model proofs of the needed geometry. For example, a bird can require an inside reverse in a three-dimensional packet, and a flower can require a layer-preserving sink and nested eversion. [Feasibility record](phase-8-models.md)

## Phase 8 local verification

The local catalog adds one Intermediate lesson, the 18-action Masu box. The original three lessons retain their IDs, steps, timings and Beginner difficulty. Five candidates remain outside the registry. The [feasibility matrix](phase-8-models.md) records the construction, difficulty evidence and rights decisions for all six proposals. The nine-lesson release gate remains open.

### Paper and geometry

| Model         | Actions | Front / reverse / edge at completion | Sampled poses | Worst rigid error | Worst seam or corner-trace error | Worst canonical landmark error |
| ------------- | ------: | ------------------------------------ | ------------: | ----------------: | -------------------------------: | -----------------------------: |
| Dart airplane |       9 | `#bdcfdf` / `#90abc6` / `#49647e`    |         9,009 |         1.055e−15 |                        2.722e−15 |                      9.501e−16 |
| Paper heart   |      12 | `#b82d50` / `#d63f60` / `#771d3a`    |        12,012 |         3.331e−16 |                        7.200e−16 |                      3.140e−16 |
| Fox face      |       6 | `#efb797` / `#d5712e` / `#814521`    |         6,006 |         4.441e−16 |                        1.061e−15 |                      5.551e−16 |
| Masu box      |      18 | `#448b91` / `#64a5a0` / `#285359`    |        18,018 |         3.331e−16 |                        4.965e−16 |                0 at completion |

The threshold is 1e−6 world units. Fixed hinge error and drift after 1,000 forward/reverse trips measured zero for all four lessons. The Masu fixture evaluates two coupled end walls against an independent construction, checks the wrap and floor layer order, and confirms a connected disk of 81 vertices, 208 edges and 128 faces. It found zero transverse penetrations among 697,312 bounding-box candidate triangle pairs at 31 interior fractions per action. These samples cover discrete poses of a zero-thickness sheet. The final box has a one-unit square floor, four half-unit walls and a clear top opening.

All four studios use instructional stock `#99b9a3` / `#e4b77d` with `#374e40` edges up to the last endpoint. Endpoint pigments change on the same frame as the final pose. Reversal restores the instructional stock. A build-time projection of that same endpoint and layer stack produces four transparent PNGs totaling 19,165 bytes. The palette test changes the pigments and checks that every preview alpha sample stays fixed. [Construction and appearance decision](decisions/0007-coupled-corners-and-finished-paper.md)

### Studio and gallery evidence

The locked installation (`npm.cmd ci --strict-peer-deps`, 230 packages), `npm.cmd run typecheck`, `npm.cmd run lint`, `npm.cmd run format:check`, `npm.cmd test` (85/85 in eleven files), and `npm.cmd run build` passed on Node 22.23.2 and npm 10.9.8. `npm.cmd run test:smoke` ran against the production build on loopback. All 208 cases passed in 8.4 minutes, with zero failures, skips or retries.

| Browser               | Passed | Failed | Skipped |
| --------------------- | -----: | -----: | ------: |
| Chromium 159.0.8154.6 |     72 |      0 |       0 |
| Firefox 159.0         |     68 |      0 |       0 |
| WebKit 27.2           |     68 |      0 |       0 |

Four Chromium-only cases use emulated touch through the DevTools protocol. Firefox used host browser process access. Monitored normal journeys recorded zero uncaught exceptions, hydration errors, failed assets or external requests. The suite checked keyboard navigation, focus return, reduced motion, right-to-left reading direction, narrow portrait and landscape layouts, and 200% text. A reload resets both the timeline and its native slider to the flat sheet. The run saved 132 PNGs and its machine-readable report at `.local/phase-8/verified-smoke.json`.

All three browsers captured each studio flat, mid-fold, complete in Light and Dark, at an angle, and fully reversed. Across the twelve model/browser pairs, the final paper silhouette overlapped its independently projected outline by 96.63–98.98% (intersection over union). At 0.001 action before completion, zero sampled pixels matched the finished hues in these twelve checks. The gallery tests also checked each static alpha silhouette and the fraction of visible paper carrying its assigned pigments. Screenshots are in `.local/phase-8/verified-browser/`. The four-model contact sheet is `.local/phase-8/verified-models.png`.

### Local routes, payload and review

The ten locales have 60 canonical pages, 61 public entry documents including the English root alias, one internal noindex lab and eleven 404 documents. Two requests to each of the 62 entry paths returned the actual generated HTML, yielding 124 HTTP 200 responses. Two requests to each of five withheld paths in each locale returned 100 localized HTTP 404 responses. The Masu transcript has a starting sheet plus all 18 titled actions in every locale. The Japanese and Simplified Chinese font subsets were regenerated. A cmap and CSS range audit found zero missing characters across the ten dictionaries.

| English cold visit or build total | Phase 7 rebuilt, raw / gzip bytes | Phase 8, raw / gzip bytes |
| --------------------------------- | --------------------------------: | ------------------------: |
| All emitted client JavaScript     |               1,138,259 / 325,004 |       1,144,372 / 327,767 |
| Explore JavaScript                |                 377,419 / 121,262 |         377,259 / 121,145 |
| Explore HTML                      |                    20,992 / 5,435 |            21,363 / 5,380 |
| Explore scene JavaScript          |                             0 / 0 |                     0 / 0 |
| Masu through scene readiness      |                                 — |       1,123,248 / 318,718 |

Desktop and phone-width Explore each requested zero scene bytes. The dev server served the same PNG bytes as the production build for all four previews. The production renderer continues to account for the large lazy chunk advisory. Receipt files are under the ignored `.local/phase-8/` directory.

**REVIEW_PENDING** covers human linguistic review and fold terminology. **NOT RUN** covers physical-paper trials, real mobile devices, hardware GPU acceptance, spoken screen readers and hosted verification. The third-party references and diagrams stay at their publishers. The geometry, manuscripts, previews and tests contributed here are original project work.

The next construction to test is a waterbomb base with a pocket spread. Verify its moving seams from an independent crease pattern, then check an actual folded frog's spring and reassess its maker tier. The bird and flower candidates need separate evidence for layer order, human difficulty and adaptation rights where applicable. After a balanced nine pass, a twelve-lesson roster could add a beginner boat, an intermediate corrugated map and an advanced single-sheet sculptural animal with a rights-cleared sequence.

## Phase 7 local verification

Phase 7 starts at `a27782881a3eda34fa617132a9f845c2ddc1a1bc`. The public catalog contains Dart airplane, Paper heart and Fox face. Their 9, 12 and 6 steps use the original fold patterns and timings. The English first-fold lab remains available at `/en/lab/first-fold` for regression.

### Local build

On Windows with Node 22.23.2 and npm 10.9.8, `npm.cmd ci --strict-peer-deps` installed 230 packages from the existing offline cache. `npm.cmd run typecheck`, `npm.cmd run lint`, `npm.cmd run format:check`, `npm.cmd test` and `npm.cmd run build` passed. Vitest ran 78 tests in nine files. A clean source copy with its own locked install reproduced all 168 production files byte for byte.

`npm.cmd run test:smoke` passed 187/187 against the production output on loopback. Chromium 159.0.8154.6 passed 65/65, Firefox 159.0 passed 61/61 and WebKit 27.2 passed 61/61. Four touch journeys use Chromium’s DevTools Protocol. The final run recorded zero failures, retries and skips. Firefox used local host process access. Monitored public journeys completed without uncaught errors, hydration warnings, missing assets or requests to other origins.

### Static content and navigation

English Explore is available directly at `/` and canonically at `/en`. Each of the ten locales has an Explore page, a Guide and three complete lessons. The build writes 51 public HTML documents, the internal lab, and matching navigation data. Its sitemap lists the 50 canonical public URLs. A localized recovery document handles unknown paths under each supported locale. Other unknown paths use the English 404.

JavaScript-disabled production checks request and reload each localized page. They verify language, direction, title, description, canonical and alternate URLs, gallery links, guide definitions and every transcript instruction and expected pose. Dictionary parity tests compare all keys, substitution fields, nonempty strings and the 27 English step IDs. Persian and Arabic use RTL. The scrubber and paper coordinates retain their physical direction. [Localized shell ADR](decisions/0006-localized-static-shell.md)

The brand returns to the localized hero. Explore focuses the worktable at `#models` with clearance beneath the sticky header. Production tests cover repeated activation, transitions from Guide and all three lessons, reload and browser history. Switching language preserves the logical page, canvas, camera, fractional fold and active Play all clock. Choosing a different model starts a fresh sheet.

The geometry checks sampled each fold at 1,001 poses. All three models and the lab completed 1,000 forward/reverse trips. The largest measured rigid-distance error among the three public lessons was 1.055e−15 world units. Maximum hinge displacement was zero and maximum seam error was 2.722e−15. The production suite also checks rendered outlines, intermediate seeks, context loss, reduced motion and the text fallback.

### Responsive and accessibility evidence

At a 16 px root font size the header drops the native language name at 1,216 px, shortens model names at 1,040 px and uses the mobile menu at 736 px. At a container width of 18 rem even the wordmark text yields to its accessible icon. Container queries respond to enlarged text. The phone header is 68 px tall plus its border and top safe area. Mobile lessons keep their model picker beside the menu.

Local review covered 320×568, 360×800, 390×844, 768×1024, 1024×768, 1440×900 and 667×375. The checks cover 100% and 200% text, both appearances, next/previous, focus, menu dismissal, touch gestures and the Info sheet. The 24 screenshots and 12 accessibility snapshots are under the ignored `.local/phase-7/screens/` directory. Examples include `en-1440-hero.png`, `fa-320-menu.png`, `ar-320-zoom.png` and `ja-360-info.png`.

The body and muted text tokens on the page background measure 12.70:1 and 6.46:1 in light mode, and 14.39:1 and 9.17:1 in dark mode. The primary action measures 7.80:1 and 8.94:1 respectively. A local keyboard check exercised Home, End, Tab out of the language menu and a French-to-Persian Guide switch. At 320 px with JavaScript disabled, the native menu changed a French Heart lesson to Japanese and then opened Fox in Japanese.

### Production payloads

Cold Chromium visits measured the local scripts and per-file gzip sizes. The English homepage fetched zero scene bytes at 390 and 1440 px. The English Guide also fetched zero scene bytes, with 373,990 raw / 120,131 gzip bytes of JavaScript. The seven-viewport production exercise checked scene isolation on localized Explore and Guide pages in all three browsers.

| Payload in bytes                                                 |  Phase 6 raw / gzip |  Phase 7 raw / gzip |
| ---------------------------------------------------------------- | ------------------: | ------------------: |
| All JavaScript files                                             | 1,143,227 / 326,822 | 1,138,259 / 325,004 |
| English Explore JavaScript                                       |   374,278 / 119,883 |   377,419 / 121,262 |
| English Explore HTML                                             |       9,383 / 3,179 |      20,992 / 5,435 |
| All stylesheets, including the script-specific font declarations |     59,748 / 13,399 |     80,403 / 17,638 |

Phase 6 used system fonts. Phase 7 ships 519,828 bytes of WOFF2 in six OFL subsets. Cold English Explore fetched only the 43,732-byte Inter file. Each tested script fetched its own face. Font cmap and CSS range checks found zero missing characters in the current dictionaries and English manuscripts. The build serves only the selected locale’s common copy and the current lesson transcript. [Font attribution and reproducible subsets](fonts.md)

Vite reports a lazy scene chunk above 500 kB. Fiber uses the deprecated Three.Clock, and the software GPU reported ReadPixels stalls on some 3D visits. Playwright’s Node process also reported conflicting terminal color settings. Local logs include `.local/phase-7/release-smoke.log`, `.local/phase-7/release-bundle.log` and `.local/phase-7/release-hashes.json`.

### Owner review

**REVIEW_PENDING** covers human linguistic review of the interface, translated fold directions and terminology in all ten locales. **NOT RUN** covers physical-paper trials, real mobile hardware, spoken screen readers, remote CI and hosted HTTP, caching and redirects. **DEFERRED** covers publication, custom domain and DNS/TLS. Set `ORIPO_SITE_URL` to the verified public HTTPS origin before producing a hosted build. The local build uses `http://127.0.0.1:4173`.

## Phase 6 historical evidence

The release baseline was `6f0d176d47919423fe63a5f160cdcf2d0556995e`. The shared studio is at `f99f246cb933f8a27a72090454e8ddb733ddbd76`. The release application is at `64c17556a3dcd031c471bce8776bcdd79fd3d0f0` on `feat/final-studio-player`. The browser fixture binds its disposable loopback servers in the private port range. This keeps browser restrictions on service ports from intercepting a test navigation.

| Local check                   | Observed result                                                                                                                                                                                                                                                                                                                                                                                                    |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Locked installation and build | Node 22.23.2 and npm 10.9.8. `npm ci --strict-peer-deps` installed 230 packages using the existing offline npm cache. A second clean installation from the candidate Git archive passed all 67 unit tests and reproduced all 44 client files byte for byte.                                                                                                                                                        |
| Source and unit gates         | `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm test` and `npm run build` passed.                                                                                                                                                                                                                                                                                                                |
| Production browser matrix     | `npm run test:smoke` ran against the static build on loopback. Chromium 159.0.8154.6 passed 48/48, Firefox 159.0 passed 44/44 and WebKit 27.2 passed 44/44. The four Chromium-only journeys used emulated touch. The final matrix had zero failures, retries or skips. Firefox crashed before opening a page inside the Windows sandbox, so the matrix used host browser process access with the pinned toolchain. |
| HTTP, fallback and lifecycle  | Seven published pages returned 200 on direct load and reload. Seven unsupported paths returned 404 on both visits. All three transcripts opened with JavaScript disabled. Missing WebGL, context loss, model changes, aborted mounts and renderer teardown passed. Monitored normal journeys produced zero hydration errors, failed assets or external requests.                                                   |
| Geometry                      | At 1,001 samples per action the maximum rigid-distance errors for Dart, Heart, Fox and the lab were 1.055e−15, 3.331e−16, 4.441e−16 and 2.220e−16 world units. Maximum hinge displacement was zero and maximum seam error was 2.722e−15. Each completed 1,000 forward/reverse cycles with zero measured drift. Fractional seeks were also checked against independent coordinates and projected silhouettes.       |

The Phase 5 checkout was reverified at 61 unit and 115 production-browser checks. Phase 6 retains the lab and all three authored lessons. The timeline can pause on a partial reverse or continue across folds of different durations. [Transport and boundary semantics](decisions/0005-continuous-lesson-transport.md)

### Viewport and accessibility evidence

Screenshots cover 320×568, 360×800, 390×844, 768×1024, 1024×768, 1440×900 and 667×375. Review included Light and Dark, partial and finished folds, open instructions, enlarged text and keyboard focus. The layout suite exercised the stage and open model picker at all seven sizes at 100% and 200% root text size. The rail and transport stayed clear of the paper area. At 390×844 the Fox canvas grew from about 215px to 351px tall with all three playback actions in view. The mobile sheet scrolls independently and dismisses after a touch fling. The labeled reading area, transcript and Close control are keyboard-reachable, and closing returns focus to Info. With reduced motion, the user can inspect either endpoint immediately. The Chromium visual review used WebGL 2 with SwiftShader.

Chromium measured Next label contrast at 7.80:1 in Light and 8.94:1 in Dark. The unfilled range track measured 4.00:1 and 6.27:1 against its surface. Keyboard focus on Next had a solid 3px outline. Before/after screenshots, browser reports, layout measurements and output hashes are in ignored `.local/phase-6/`.

### Bundle evidence

`node scripts/measure.mjs` measured raw bytes and gzip bytes per script. The homepage fetched zero scene chunks in fresh Chromium contexts at 390px and 1440px. `npm ls three --all` resolved one shared Three 0.187.0.

| JavaScript bytes, raw / gzip |             Phase 5 |             Phase 6 |
| ---------------------------- | ------------------: | ------------------: |
| All scripts                  | 1,136,556 / 324,358 | 1,143,227 / 326,822 |
| Homepage, cold               |   372,093 / 118,939 |   374,278 / 119,883 |
| Dart, cold                   | 1,111,501 / 314,024 | 1,117,033 / 316,105 |
| Heart, cold                  | 1,113,833 / 314,816 | 1,119,365 / 316,887 |
| Fox, cold                    | 1,112,552 / 314,541 | 1,118,084 / 316,612 |

The player, instruction disclosure, input handling and shared model navigation added 6,671 raw / 2,464 gzip bytes across scripts. All emitted CSS rose from 46,425 / 10,245 to 59,748 / 13,399 bytes, including the responsive studio stylesheet. Each lesson drew from at most one callback per animation frame in the Chromium probe, with zero additional frames during a 350 ms observation after settling. The project continues to use the Phase 5 lockfile and dependency notices. Vite still reports the large lazy scene chunk, Fiber still uses the deprecated Three.Clock, and SwiftShader can report ReadPixels stalls.

### Owner-managed publication

1. From the release repository in Git Bash, verify the private origin and its remote main history. Once the tested local main is ready and the remote accepts a fast-forward or is empty, the owner's command is `git push -u origin main`. Preserve unexpected remote work.
2. Review GitHub's hosted Quality run for that SHA. Then import `abolfazlbzgh/oripo` in Vercel using **Other**, project root `./`, install `npm ci`, build `npm run build` and output `build/client`. These settings are recorded in `vercel.json`.
3. On the assigned preview URL, check the seven pages and their refreshes, missing routes, model playback, and the response/cache headers for HTML, hashed assets and `appearance.js`. Record physical-paper, real-device and spoken screen-reader trials separately.

**NOT RUN** covers GitHub-hosted CI, Vercel HTTP and caching, real devices, spoken screen readers and the paper trials below. Custom domain, DNS/TLS, public visibility and release tagging are deferred to the owner.

## Phase 5 historical evidence

Phase 5 passed locally on Windows with Node 22.23.2 and npm 10.9.8. The starting commit was `645abdd83018c511af41973abd2085e0823e6787` on `feat/origami-lesson-collection`. The tested application and build tooling are at `64d79f7d94fdcd234fc16c2c3529aab3d6634cf8` on `chore/release-hardening`. The subsequent handoff commit contains documentation. Preview, publication and promotion require owner approval.

### Phase 5 gates

| Gate                | Command or method                                                                                                                                                                                                                              | Result                                                                                                                                                                                                                                                                                                |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Install             | Export the commit with `git archive` into a fresh directory outside any project. With the pinned toolchain, run `npm ci --strict-peer-deps --cache .npm-cache --registry=https://registry.npmjs.org --no-audit --no-fund` with an empty cache. | 230 packages installed in 12 s. The isolated build produced all 41 client files byte-identically and passed all 61 unit tests. Lockfile SHA-256 `13738b5b57a1deeebcbba223aeb9cfff4f14c44ca5b7066bfed55951aabd8d74`.                                                                                   |
| Source quality      | `npm run typecheck`, `npm run lint`, `npm run format:check`                                                                                                                                                                                    | All passed. ESLint allows zero warnings.                                                                                                                                                                                                                                                              |
| Model and playback  | `npm test`                                                                                                                                                                                                                                     | 61/61 passed. Each model and the lab completed 1,000 full round trips with zero drift.                                                                                                                                                                                                                |
| Static documents    | `npm run build`, then `npm run preview`                                                                                                                                                                                                        | All seven registered pages returned 200 on direct GET and reload, with an English document, title, description and main heading. Seven missing/unsupported addresses returned 404 on both visits with recovery links. Canonical tags await a public origin decision. Both license files returned 200. |
| Production browsers | `npx playwright install --only-shell chromium firefox webkit`, then `npm run test:smoke`. Individual engines use `-- --project=chromium`, `firefox` or `webkit`.                                                                               | Chromium 159.0.8154.6 **41/41**, Firefox 159.0 **37/37**, WebKit 27.2 **37/37**. Zero final failures, skips or retries. Four CDP touch tests run in Chromium.                                                                                                                                         |
| Console and network | Production browser listeners and an additional interrupted scene-download check                                                                                                                                                                | Zero exceptions, hydration errors, unexpected failed assets or external requests in the monitored normal journeys. Blocking the heart scene download on purpose left text playback usable. Reloading after access returned created one working canvas.                                                |
| Dependency review   | `npm audit --omit=dev`, `npm audit`, `npm ls three --all`                                                                                                                                                                                      | Zero registry advisories for either scope at review time. One deduplicated Three 0.187.0.                                                                                                                                                                                                             |

The sandboxed cold install encountered registry `EACCES`. An initial host run selected npm 11.6.2 via PATH. Both the Phase 4 comparison build and the isolated Phase 5 proof used the explicitly selected npm 10.9.8 with separate fresh caches. The Firefox sandbox probe crashed at `browserContext.newPage` before Oripo loaded. All 37 Firefox cases then ran once with host process access. Raw browser reports and diagnostic logs are local evidence under ignored `.local/phase-5/`.

### Geometry and accessibility

At 1,001 samples per action, the maximum rigid-distance errors for Dart, Heart, Fox and lab were 1.055e−15, 3.331e−16, 4.441e−16 and 2.220e−16 world units. Fixed hinge error was zero. The largest lesson seam error was 2.722e−15. The 1e−6 tolerance is one millionth of a lab panel width and accommodates floating-point rotations at this model scale. Independent landmark and projected-outline tests also ran. Repeated endpoint equality alone would miss a consistently wrong fold.

The browser journeys cover skip-link and route focus, keyboard playback, status updates, camera alternatives, Light/Dark/System persistence, reduced motion and operable text after context loss. Every page was checked at 320, 390, 768 and 1440 CSS pixels with 100% and 200% root text. With scripting disabled, all 27 lesson actions and expected shapes were readable inside native disclosures. A Chromium check at 390px operated the camera by keyboard in both explicit themes. The focused control had a 3px solid outline and all ten studio button targets had a minimum dimension of 44 CSS pixels. Semantic text pairs met 4.5:1 in both themes. These checks cover specific behaviors. Spoken output and device usability have their own acceptance steps below. [WCAG 2.2](https://www.w3.org/TR/WCAG22/)

### Bundle and provenance

Run `node scripts/measure.mjs` after the production build for cold Chromium requests and first contentful paint. The comparison used the same script on a fresh build of the starting commit. Values below are raw / gzip bytes, compressed separately per file.

| JavaScript         |             Phase 4 |             Phase 5 |    Change |
| ------------------ | ------------------: | ------------------: | --------: |
| All client scripts | 1,136,519 / 324,350 | 1,136,556 / 324,358 |  +37 / +8 |
| English homepage   |   372,093 / 118,938 |   372,093 / 118,939 |    0 / +1 |
| Lab cold           | 1,100,056 / 308,775 | 1,100,056 / 308,776 |    0 / +1 |
| Dart cold          | 1,111,464 / 314,016 | 1,111,501 / 314,024 |  +37 / +8 |
| Heart cold         | 1,113,796 / 314,806 | 1,113,833 / 314,816 | +37 / +10 |
| Fox cold           | 1,112,515 / 314,532 | 1,112,552 / 314,541 |  +37 / +9 |

The homepage fetched 11 scripts and zero scene chunks at both widths. At 1440×900, first contentful paint was 112 ms for the homepage and 64 ms for Heart. At 390×844 both were 60 ms. These are single, unthrottled loopback observations with headless Chromium and SwiftShader. The large hashed studio chunk still triggers Vite's 500 kB warning. Fiber 9.8.2 internally creates a deprecated Three.Clock. The headless driver also reported ReadPixels stalls. The demand-driven renderer shares Three across lessons, skips unchanged drawing positions and disposes the retired contexts, geometry, materials and input listeners.

The original mark, crane, gallery diagrams, procedural folds and English text have project provenance. Fonts resolve locally. All 22 runtime lockfile entries declare MIT (21) or BSD-3-Clause (1). All 256 development entries have license metadata, including bundled and platform-specific packages. Build-time packages and the browser distribution have different contents. Vite emits 11 bundled JavaScript package notices. The additional notices include the upstream Fiber license, absent from its npm tarball, plus the CSS libraries and generated runtime helpers. Check both notice files when updating these packages. [Upstream Fiber license](https://github.com/pmndrs/react-three-fiber/blob/v9.8.2/LICENSE)

The workflow keeps the existing read-only token, disables persisted checkout credentials and caches npm downloads keyed by the lockfile. It uses `pull_request` and a main-branch push trigger. There are no secrets or event fields interpolated into shell commands. GitHub's public tag refs resolved to the existing full checkout and setup-node commit pins. Pattern and filename checks of reachable Git blobs, commit messages and the candidate tree found no recognized credentials, private keys, tracked local artifacts or absolute user/workspace paths. The owner email in `AGENTS.md` and Git history is intentional and needs the owner's review before visibility changes. [GitHub Actions secure use](https://docs.github.com/en/actions/reference/security/secure-use)

## Physical paper protocol

All trials below are **NOT RUN**. Use one two-sided sheet per trial and follow the English instructions in order. Record the commit, paper dimensions, first ambiguous step and any layer that needs repositioning. Compare the finished front and back with the model, then unfold in reverse. Record photos only from an actual trial.

| Model          | Sheet and observable checks                                                                                                                                                                                                                                                                |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Dart           | Start with a 2 × 3 portrait rectangle. At steps 3–6, check that the tucked edges meet the spine. Pinch the whole body at step 7. Lower each outer wing packet while the narrow keel stays upright. Compare the two wings from the tail and check which plies stayed in the body.           |
| Heart          | Start with a square, corner up. Open the two diagonal marks and use their crossing for the top flap. After step 8, check that the two folded lower edges meet and leave a central V. Turn the side and lobe tips behind. Look for two level lobe tops, an open notch and one bottom point. |
| Fox            | Start with a square, corner up. Check the doubled triangle after opening the forehead crease. Lift just the upper loose chin tip at step 4. Fold both ear packets behind and compare the two pointed ears, straight forehead and visible lower chin ply.                                   |
| First-fold lab | On a square, leave the left half still, bring the right outside edge to the left edge, then open it along the same crease. Record whether the color descriptions match both endpoints.                                                                                                     |
