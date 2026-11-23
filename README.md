# Oripo

**Origami in Motion.** Fold a dart paper airplane from one rectangular sheet in nine reversible steps. Orbit the live paper to see the layers, the wings and the keel. The English worktable also includes a single-crease laboratory and a guide to valley and mountain folds.

## Run locally

Use Node.js 22.23.2 (pinned in `.nvmrc`) and npm 10.9.8. Run these commands from the repository root.

```sh
npm ci
npm run dev
```

Open the local address printed by Vite. Start at `/` to choose English, or open `/en` directly. The guide has a shareable address at `/en/guide/crease-notation`. The appearance control follows the system and remembers explicit Light or Dark choices across visits.

To try the production build, run `npm run build` and `npm run preview`. Open the [dart paper airplane lesson](http://127.0.0.1:4173/en/lessons/paper-airplane). Next performs one action. Previous reverses from the current angle. Replay rewinds the current action and plays it again. Drag, pinch, scroll or use the camera buttons to inspect the paper. Reduced motion settles commands immediately. All nine instructions are also available in the static document. The [first-fold lab](http://127.0.0.1:4173/en/lab/first-fold) remains available as a one-hinge demonstration.

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

## Roadmap

1. Author the next model against the same topology, reversal and visual checks.
2. Check the lessons with physical paper, physical touch devices and spoken screen readers.
3. Expand the collection as individual models and translations are validated.

See the [Phase 3 evidence](docs/ai-development.md#phase-3-verification) for local results and the [lesson handoff](docs/architecture.md#adding-the-next-lesson) for the authoring workflow.

## Ownership and licensing

Abolfazl Bazghandi maintains Oripo. The [MIT license](LICENSE) covers original project code. The Oripo SVG mark, crane study, gallery diagrams and crease samples were drawn for this project. Typography uses locally available fonts. Dependencies retain their licenses. Review the rights and attribution for any external artwork, fonts, lesson diagrams or 3D models before adding them. The external design preview stays outside this repository.
