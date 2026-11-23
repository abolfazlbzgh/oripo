# Oripo

**Origami in Motion.** Choose one of three beginner lessons and fold a single sheet in 3D. Next folds the paper, Previous reverses it and Replay repeats the current action. Orbit and zoom to inspect the layers.

| English lesson                                                         | Starting paper           | Actions |
| ---------------------------------------------------------------------- | ------------------------ | ------: |
| [Dart paper airplane](http://127.0.0.1:4173/en/lessons/paper-airplane) | 2 × 3 portrait rectangle |       9 |
| [Paper heart](http://127.0.0.1:4173/en/lessons/paper-heart)            | Square, corner up        |      12 |
| [Fox face](http://127.0.0.1:4173/en/lessons/fox-face)                  | Square, corner up        |       6 |

## Run locally

Use Node.js 22.23.2 (pinned in `.nvmrc`) and npm 10.9.8. Run these commands from the repository root.

```sh
npm ci
npm run dev
```

Open the local address printed by Vite. Start at `/` to choose English, or open `/en` directly. The guide has a shareable address at `/en/guide/crease-notation`. The appearance control follows the system and remembers explicit Light or Dark choices across visits.

Run `npm run build` and `npm run preview` to serve the production lessons at the links above. Each page includes the complete ordered instructions in its static HTML. Keyboard buttons operate both playback and camera. Reduced motion settles each command immediately. The worktable also includes the independent [first-fold laboratory](http://127.0.0.1:4173/en/lab/first-fold) and [crease guide](http://127.0.0.1:4173/en/guide/crease-notation).

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

Install the Chromium test browser once per Playwright version with `npx playwright install --only-shell chromium`. The cross-browser suites also use `npx playwright install firefox webkit`. On a minimal Linux runner, add `--with-deps`. Build again after source changes and before the smoke test. The application itself requires no credentials or environment variables.

## How the project fits together

React Router Framework Mode and Vite generate static pages with React and TypeScript. Tailwind CSS 4 and daisyUI 5 supply the theme system. The public route definitions, links and production smoke tests evolve together. The [architecture overview](docs/architecture.md) describes those boundaries. The [framework decision](docs/decisions/0001-framework-and-deployment.md) records exact versions, peer requirements and local verification.

## Add a lesson

1. Draw the finished outline and work backwards to a fold plan. Record the starting proportions, intended moving plies, crease directions and landmark coordinates.
2. For straight folds that settle flat, define directed lines in the current folded plane as in `app/lesson/fox.ts`. An optional packet ID selects material moved by an earlier action. The authoring helper builds the shared version 1 pattern. Spatial finishes such as the dart can supply a pattern directly.
3. Key the English instructions by the immutable step IDs. Bind the data to `LessonPage`, add a literal English route and list it for static pre-rendering.
4. Check rigid distances, hinges, reversals, visible layer colors and an independently drawn silhouette. Add the verified model to the lightweight catalog and run the production journeys.

The next release checks cover physical paper, actual touch devices, spoken screen readers and authorized hosting. [Architecture and authoring](docs/architecture.md#adding-the-next-lesson) · [Fold plans](docs/decisions/0004-flat-packet-lessons.md) · [Phase 4 verification](docs/ai-development.md#phase-4-verification)

## Ownership and licensing

Abolfazl Bazghandi maintains Oripo. The [MIT license](LICENSE) covers original project code. The Oripo SVG mark, crane study, gallery diagrams and crease samples were drawn for this project. Typography uses locally available fonts. Dependencies retain their licenses. Review the rights and attribution for any external artwork, fonts, lesson diagrams or 3D models before adding them. The external design preview stays outside this repository.
