# Oripo

**Origami in Motion.** Fold a single sheet in 3D, from a first dart to a lined Masu box. Use Next fold to make one fold, Play to continue through the lesson or the timeline to stop at any angle. Drag the paper to inspect its layers.

| English lesson                                                         | Starting paper           | Actions |
| ---------------------------------------------------------------------- | ------------------------ | ------: |
| [Dart paper airplane](http://127.0.0.1:4173/en/lessons/paper-airplane) | 2 × 3 portrait rectangle |       9 |
| [Paper heart](http://127.0.0.1:4173/en/lessons/paper-heart)            | Square, corner up        |      12 |
| [Fox face](http://127.0.0.1:4173/en/lessons/fox-face)                  | Square, corner up        |       6 |
| [Masu box](http://127.0.0.1:4173/en/lessons/masu-box)                  | Square, corner up        |      18 |

## Run locally

Use Node.js 22.23.2 (pinned in `.nvmrc`) and npm 10.9.8. Run these commands from the repository root.

```sh
npm ci
npm run dev
```

Open the local address printed by Vite. Both `/` and `/en` open English Explore. The brand returns to the top and Explore opens the model gallery at `/{locale}#models`. Guide opens `/{locale}/guide/crease-notation`. The language menu preserves the page and the position of the current fold. The appearance control follows the system and remembers explicit Light or Dark choices across visits.

Run `npm run build` and `npm run preview` to serve the production lessons at the links above. Each page includes the complete ordered instructions in its static HTML. Open Info to read the current fold or expand all steps. Arrow keys scrub the focused timeline and orbit the focused paper. With reduced motion, Next and Previous settle immediately and the middle button switches between the finished model and the starting sheet. The published models and Guide are available in English, Persian, Spanish, French, Simplified Chinese, Arabic, Brazilian Portuguese, German, Japanese and Hindi. The English first-fold lab remains an internal regression fixture.

## Verify changes

| Command                | Purpose                                                                                    |
| ---------------------- | ------------------------------------------------------------------------------------------ |
| `npm run typecheck`    | Generate route types and check strict TypeScript.                                          |
| `npm run lint`         | Run ESLint with zero warnings allowed.                                                     |
| `npm run format:check` | Check source, configuration and documentation with Prettier.                               |
| `npm test`             | Check routes, catalog entries, theme contrast, rigid-panel geometry and reversible timing. |
| `npm run build`        | Pre-render the published pages into `build/client`.                                        |
| `npm run preview`      | Serve the production files at `http://127.0.0.1:4173`.                                     |
| `npm run test:smoke`   | Use Playwright against the existing production build on disposable loopback ports.         |

Install the test browsers once per locked Playwright version with `npx playwright install --only-shell chromium firefox webkit`. On a minimal Linux runner, add `--with-deps`. Build again after source changes and before the smoke test. By default it runs Chromium, Firefox and WebKit against the production files. Four Chromium DevTools Protocol touch journeys run only in Chromium. To investigate one engine, use e.g. `npm run test:smoke -- --project=firefox`. Local builds use the preview origin. Set `ORIPO_SITE_URL` to the verified HTTPS origin before building for hosting. [Locale routes and canonical metadata](docs/decisions/0006-localized-static-shell.md)

## How the project fits together

React Router Framework Mode and Vite generate static pages with React and TypeScript. Tailwind CSS 4 and daisyUI 5 supply the theme system. The public route definitions, links and production smoke tests evolve together. The [architecture overview](docs/architecture.md) describes those boundaries. The [framework decision](docs/decisions/0001-framework-and-deployment.md) records exact versions, peer requirements and local verification.

## Add a lesson

1. Draw the finished outline and work backwards to a fold plan. Record the starting proportions, intended moving plies, crease directions and landmark coordinates.
2. For straight folds that settle flat, define directed lines in the current folded plane as in `app/lesson/fox.ts`. An optional packet ID selects material moved by an earlier action. The authoring helper builds the shared version 1 pattern. Spatial finishes such as the dart can supply a pattern directly.
3. Key each transcript by the immutable step IDs. Bind the model to `LessonPage`, add its locale-independent route module and register the catalog metadata. The registry expands the static paths.
4. Check rigid distances, hinges, reversals, visible layer colors and an independently drawn silhouette. Add the verified model to the lightweight catalog and run the production journeys.

For a local demo, open a lesson in the production preview, advance to an intermediate fold, orbit the paper, then reverse to the starting sheet. Each transcript includes the expected shape after every step and opens without JavaScript. Physical paper, real touch devices, spoken screen readers and hosted behavior have separate acceptance checks. [Local verification and release checklist](docs/release.md) · [Contributing](CONTRIBUTING.md) · [Security reporting](SECURITY.md)

## Ownership and licensing

Abolfazl Bazghandi maintains Oripo. The [MIT license](LICENSE) covers original project code. The Oripo SVG mark, crane study, gallery diagrams and crease samples were drawn for this project. Typography uses six self-hosted OFL subsets and system fallbacks. [Font sources and license texts](docs/fonts.md) Dependencies retain their licenses. Review the rights and attribution for any external artwork, fonts, lesson diagrams or 3D models before adding them. The external design preview stays outside this repository.

The static build includes `third-party-licenses.txt` for bundled JavaScript and [additional notices](public/additional-notices.txt) for the styles, generated helpers and Fiber license text. The [development record](docs/ai-development.md) identifies the AI-assisted work and the owner's decisions.
