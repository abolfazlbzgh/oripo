# Oripo

**Origami in Motion.** Oripo is an open-source paper studio. Try one reversible valley fold in 3D, inspect the sheet from different angles, or learn to read valley and mountain crease lines. The English collection contains one interactive demonstration.

## Run locally

Use Node.js 22.23.2 (pinned in `.nvmrc`) and npm 10.9.8. Run these commands from the repository root.

```sh
npm ci
npm run dev
```

Open the local address printed by Vite. Start at `/` to choose English, or open `/en` directly. The guide has a shareable address at `/en/guide/crease-notation`. The appearance control follows the system and remembers explicit Light or Dark choices across visits.

To try the production build, run `npm run build` and `npm run preview`, then open the [first-fold studio](http://127.0.0.1:4173/en/lab/first-fold). Next folds the sheet, Previous reverses from the current angle, and Replay begins again at flat. Drag or use the camera buttons to inspect the crease. Reduced motion settles each command immediately. A text player remains available when WebGL is unavailable.

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

Install the test browser once per Playwright version with `npx playwright install --only-shell chromium`. On a minimal Linux runner, add `--with-deps`. Build again after source changes and before the smoke test. The application itself requires no credentials or environment variables.

## How the project fits together

React Router Framework Mode and Vite generate static pages with React and TypeScript. Tailwind CSS 4 and daisyUI 5 supply the theme system. The public route definitions, links and production smoke tests evolve together. The [architecture overview](docs/architecture.md) describes those boundaries. The [framework decision](docs/decisions/0001-framework-and-deployment.md) records exact versions, peer requirements and local verification.

## Roadmap

1. Author one complete lesson with stable step identifiers and tested forward and reverse poses.
2. Check instructions and controls with physical touch devices and screen readers.
3. Expand the collection as individual models and translations are validated.

See the [Phase 2 evidence](docs/ai-development.md#phase-2-verification) for local results and the [lesson handoff](docs/architecture.md#adding-the-next-lesson) for the authoring boundary.

## Ownership and licensing

Abolfazl Bazghandi maintains Oripo. The [MIT license](LICENSE) covers original project code. The Oripo SVG mark, crane study, gallery diagrams and crease samples were drawn for this project. Typography uses locally available fonts. Dependencies retain their licenses. Review the rights and attribution for any external artwork, fonts, lesson diagrams or 3D models before adding them. The external design preview stays outside this repository.
