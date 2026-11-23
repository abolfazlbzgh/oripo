# Oripo

Oripo is a step-by-step origami tutorial for the web. The English foundation includes a crease-notation guide and a laboratory where you can orbit a square sheet as it makes one reversible half-fold.

## Run locally

Use Node.js 22.23.2 (pinned in `.nvmrc`) and npm 10.9.8. Run these commands from the repository root.

```sh
npm ci
npm run dev
```

Open the local address printed by Vite. Start at `/` to choose English, or open `/en` directly. The guide has a shareable address at `/en/guide/crease-notation`. The appearance control follows the system until a reader chooses Light or Dark.

The English foundation links to the lab. To try it from the production build, run `npm run build` and `npm run preview`, then open the [first-fold laboratory](http://127.0.0.1:4173/en/lab/first-fold).

## Verify changes

| Command                | Purpose                                                                            |
| ---------------------- | ---------------------------------------------------------------------------------- |
| `npm run typecheck`    | Generate route types and check strict TypeScript.                                  |
| `npm run lint`         | Run ESLint with zero warnings allowed.                                             |
| `npm run format:check` | Check source, configuration and documentation with Prettier.                       |
| `npm test`             | Check route coverage, rigid-panel geometry and reversible timing with Vitest.      |
| `npm run build`        | Pre-render the published pages into `build/client`.                                |
| `npm run preview`      | Serve the production files at `http://127.0.0.1:4173`.                             |
| `npm run test:smoke`   | Use Playwright against the existing production build on disposable loopback ports. |

Install the test browser once per Playwright version with `npx playwright install --only-shell chromium`. On a minimal Linux runner, add `--with-deps`. Build again after source changes and before the smoke test. The application itself requires no credentials or environment variables.

## How the project fits together

React Router Framework Mode and Vite generate static pages with React and TypeScript. Tailwind CSS 4 and daisyUI 5 supply the theme system. The public route definitions, links and production smoke tests evolve together. The [architecture overview](docs/architecture.md) describes those boundaries. The [framework decision](docs/decisions/0001-framework-and-deployment.md) records exact versions, peer requirements and local verification.

## Roadmap

1. Refine the player UI using the verified single-fold lab.
2. Author and verify one complete lesson with Next, Previous, pause and replay.
3. Expand toward three validated lessons, the gallery, translations and further accessibility testing.

The foundation and first fold have been verified locally. The first hosted preview requires separate authorization.

## Ownership and licensing

Abolfazl Bazghandi maintains Oripo. The [MIT license](LICENSE) covers original project code. The CSS mark and crease samples were drawn for this scaffold. Dependencies retain their licenses. Review the rights and attribution for any external artwork, fonts, lesson diagrams or 3D models before adding them. The external design preview stays outside this repository.
