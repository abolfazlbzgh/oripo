# Oripo <img src="public/oripo.svg" alt="" width="32" height="32">

Oripo is a 3D origami studio with a folding engine written in TypeScript. Follow a crease from a flat sheet to a finished model, then scrub backward to see which layers moved together.

**[Live demo](https://oripo.byabolfazl.com/)** · [Fold the Monarch butterfly](https://oripo.byabolfazl.com/en/lessons/monarch-butterfly)

[Quick start](#quick-start) · [Architecture](docs/architecture.md) · [Model authoring](docs/authoring.md) · [Contributing](CONTRIBUTING.md)

![The Monarch butterfly in Oripo’s Light studio, with four violet wings, the completed 18-fold timeline and the camera controls.](docs/monarch-studio.png)

## In the studio

Choose a model from the gallery and open its instructions. Each action tells you what to fold and what you should see afterward. Play the sequence, pause halfway through a fold, use Previous or Next, or seek to any point on the timeline. Orbit and zoom to inspect a layer, then use **Reset view** to return to the teaching angle.

Try the second action of the Reed Runner dinosaur. The paper holds still as the camera swings underneath to show the leading leg. A dashed crease appears on the exposed layer before the leg moves. At the end of a lesson the model takes on its finished colors. You can still turn it over.

| Gallery tier | Lessons                                               |
| ------------ | ----------------------------------------------------- |
| Beginner     | Dart paper airplane · Paper heart · Fox face          |
| Intermediate | Masu box · Four-foot jumping frog · Monarch butterfly |
| Advanced     | Twin-stern junk · River tern · Reed Runner dinosaur   |

The nine lessons cover **138 fold actions**. The Twin-stern junk follows the historical Chinese Junk preparation before branching into Oripo’s own hull and seats. The Reed Runner is an original waterbomb-based dinosaur. Its construction notes explain why Oripo developed its own sequence after reviewing Jo Nakashima’s Velociraptor. The tiers are editorial and await independent maker ratings. [Construction notes and references](docs/decisions/0011-framed-pockets-and-tray-corners.md)

Switch between English, Persian, Spanish, French, Simplified Chinese, Arabic, Brazilian Portuguese, German, Japanese and Hindi. Persian and Arabic use right-to-left layouts. All 90 localized manuscripts are readable without JavaScript or an account. A fresh visit starts in Light, and the studio remembers an explicit Light or Dark choice.

## How the folding engine works

```text
Lesson package
  └─ Validate sheet and actions
     └─ Compile folds
        ├─ Pose → layers → studio
        └─ Finish → gallery PNG
```

**One sheet, shared edges.** A lesson describes the sheet as connected faces and names the creases between them. In the Dart’s first action, eight faces rotate 180° around the directed spine. Their shared vertices stay joined. Later folds can carry earlier hinges into a new position. Other operations need a geometric constraint of their own. For example, the junk’s corner triangles have to meet along one diagonal while its two walls rise to different angles. [Dart package](models/paper-airplane/lesson.json) · [Geometry compiler](app/lesson/geometry.ts) · [Tray-corner solver](app/lesson/tray-corner.ts)

**One pose for any point in a fold.** The player gives the compiler an action and an absolute fraction. Seeking directly to its midpoint and reversing back to it use the same material pose. The drawing code offsets touching plies just enough to distinguish them. The teaching camera shares the playback clock and can turn while the material stays fixed. Three.js and React Three Fiber render the result in a shared studio. [Playback](app/lesson/playback.ts) · [Drawing layers](app/lesson/drawing.ts) · [Camera cues](app/lesson/camera.ts) · [Scene](app/lesson/lesson-scene.client.tsx)

**Two ways to read the same lesson.** At build time, the projector draws each gallery thumbnail from the finished geometry. React Router prerenders the localized gallery, guides and written lessons as static HTML. Opening the interactive studio loads the scene and the selected model on demand. [Gallery projector](scripts/lesson-previews.ts) · [Lesson route](app/routes/lesson.tsx) · [Architecture and source map](docs/architecture.md)

Each `lesson.json` uses schema version 1 and declares the pattern version its folds require. Authors can reuse rigid turns and supported coupled motions, including pocket squashes, framed pockets, spatial crimps and a constrained twist. A new fold technique can require a new solver and fixtures. The engine plays authored sequences on piecewise-rigid paper. Physical foldability and clearance between sampled poses require separate evidence. [Supported operations and planar FOLD interchange](docs/authoring.md) · [Verification record](docs/release.md)

## Quick start

Use Node **22.23.2** and npm **10.9.8**. On Windows, use `npm.cmd` if PowerShell blocks the npm script.

```sh
git clone https://github.com/abolfazlbzgh/oripo.git
cd oripo
npm ci --strict-peer-deps
npm run dev
```

Open the address Vite prints, usually [localhost:5173](http://localhost:5173). To try the production build, stop the dev server and run the following commands.

```sh
npm run build
npm run preview
```

Open the [local production gallery](http://127.0.0.1:4173/en#models). By default, builds use that loopback origin for canonical links, language alternates and the sitemap. For production, set `ORIPO_SITE_URL` to `https://oripo.byabolfazl.com` **before** building. Rebuild when the origin changes. [Static hosting and localized 404s](docs/release.md#owner-operated-hosting)

## Verify changes

```sh
npm run models -- check
npm run typecheck
npm run lint
npm run format:check
npm test
```

After a production build, run `npm run test:smoke` for four journeys per browser covering the Dart’s fold and reversal, the dinosaur’s hidden crease, localized 404 recovery and theme persistence. Run `npm run test:browser` for every Chromium, Firefox and WebKit case. Both commands accept `-- --project=firefox` to select one browser. [Browser installation and verification](docs/release.md#local-acceptance) · [Quality workflow](.github/workflows/quality.yml)

## Contributing

Start with a reference sequence, its rights and a few landmarks you can check independently. Run `npm run models -- new my-fold` to create a draft in `models/my-fold/lesson.json`. The native schema, CLI and review guide cover supported motions, manuscripts and manual integration. Human language review, physical paper trials, real-device and spoken screen-reader checks are still open. [Native schema](models/lesson.schema.json) · [Authoring guide](docs/authoring.md) · [Pull request guide](CONTRIBUTING.md) · [AI-assisted development](docs/ai-development.md) · [Security reporting](SECURITY.md)

## License and credits

The original software is MIT-licensed. The mark, crane illustration, lesson geometry and generated previews are project assets. Each model records its construction, references and rights. The six bundled font subsets carry their own SIL Open Font Licenses. The static build includes dependency licenses and additional notices. [MIT license](LICENSE) · [Model packages](models) · [Font credits](docs/fonts.md) · [Additional notices](public/additional-notices.txt)
