# Architecture and lesson handoff

## Foundation

| Responsibility                                                                           | Location                                                  |
| ---------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| Document shell, language tag, skip link, shared appearance control, route error boundary | `app/root.tsx`, `app/components/shell.tsx`                |
| Product name, description, document-title format and default locale                      | `app/site.ts`                                             |
| Registered pages and canonical English URLs                                              | `app/routes.ts`, `app/navigation.ts`                      |
| Language entry, English homepage, crease guide, lab and three complete lessons           | `app/routes/`                                             |
| Semantic light/dark tokens, responsive page layout and reduced-motion rules              | `app/styles.css`                                          |
| Static output, preview and production checks                                             | `react-router.config.ts`, `scripts/preview.mjs`, `tests/` |

English has a literal URL prefix. Only published languages should gain routes. When the second genuine translation is ready, introduce a locale catalog and i18next/react-i18next, set document language and direction from the matched locale, and pre-render its actual pages. Keep stable lesson identifiers separate from translated titles and prose.

### Appearance and navigation

The daisyUI themes `oripo-light` and `oripo-dark` define paper, ink, pine, terracotta and gold roles in `app/styles.css`. Use the semantic content color for each surface. Material colors identify the paper faces in either theme. The theme tests measure foreground/background pairs against a 4.5:1 text threshold.

`public/appearance.js` runs before the stylesheet on each static document, including the 404. An explicit choice sets the root theme from local storage. System clears the override so the CSS media query can respond to OS changes. With restricted storage, the current document still honors the selection. The shared select reads the applied theme on hydration.

A skip link and client route changes move focus to the main landmark. Interactive elements use natural document order and explicit zero tab indices for WebKit keyboard navigation. The studio keeps an unavailable playback direction focusable after hydration and guards the corresponding command. Camera controls remain disabled until the scene is ready.

## First 3D proof of concept

`/en/lab/first-fold` presents one valley fold. From the opening camera position the green left panel stays still and the cream right panel rises, passes upright and closes over it.

### Geometry and precision

The right-handed XY sheet spans `[-1, 1]` on each axis at `z = 0`. Both panels include the crease vertices `(0, −1, 0)` and `(0, 1, 0)`. The pose takes one normalized progress value `p`. Finite inputs clamp to `[0, 1]`, infinities saturate at the corresponding endpoint, and NaN selects the unfolded pose. The fixed half keeps its original coordinates. For the moving half, `θ = πp` and each original `(x, y, 0)` maps to `(x cos θ, y, x sin θ)`. This is a rotation of `−θ` about world +Y. At 90° the outside edge reaches `z = 1`. At 180° it reaches `x = −1`. The pure model uses exact zero for the sine at closure.

The absolute tolerance is `1e-6` world units, one millionth of a panel width. It bounds floating-point trigonometry well below a visible displacement. Over 1,001 uniformly spaced poses the largest edge-length error was `2.220446049250313e-16` units. Both diagonals and both hinge endpoints had zero measured error. The upright outside corner differed from its ideal position by `6.123233995736766e-17` units. All 1,000 forward/reverse cycles returned exactly to the original coordinates.

### Playback and rendering

| Module                        | Responsibility                                                                                   |
| ----------------------------- | ------------------------------------------------------------------------------------------------ |
| `app/fold/geometry.ts`        | Defines immutable rest vertices, the signed hinge rotation and the analytic moving-panel pose.   |
| `app/fold/controller.ts`      | Samples a transition from its start time, starting progress and target.                          |
| `app/fold/use-fold-player.ts` | Connects commands, motion preference, the angle meter and completion announcements to the scene. |
| `app/fold/scene.client.tsx`   | Draws the two lab panels and center crease in the shared studio.                                 |
| `app/fold/studio.client.tsx`  | Owns the demand-driven WebGL root, lighting, orbit camera, resize observer and teardown.         |
| `app/routes/first-fold.tsx`   | Pre-renders English instructions, both control groups and the initial sheet description.         |

Next targets 1 and Previous targets 0. Each command samples the current monotonic time before changing direction. A full traversal takes three seconds at constant angular speed. Repeating a target preserves its time anchor. Replay always starts a new forward traversal at 0. A throttled tab catches up on its next frame. The current target's button is disabled, the opposite direction remains available during travel, and Replay stays available throughout playback.

Hydration loads the scene through an effect. Each frame applies the absolute hinge rotation to the original mesh. Fiber requests another frame while the fold is moving or a camera or viewport change needs painting. The meter updates directly and React updates the step at phase boundaries. The live region announces completed poses. Reduced motion and the text player settle commands immediately. Enabling reduced motion or losing the context mid-fold settles the current target. Returning to the lab creates a fresh unfolded sheet.

The materials give each face its own color. A depth-buffer polygon offset draws the moving reverse side over the fixed front at closure and keeps the crease legible. A transparent plane at `z = −0.035` receives the shadow. Both are render-only treatments. The underlying sheet has zero thickness. A camera anchored at the crease can orbit through a full turn, tilt between 7.5° and 82.5° above the sheet, and zoom between 3.6 and 6.8 world units. Six native buttons provide the same operations as dragging, scrolling or pinching. Reset view restores the original OrbitControls position and zoom independently of the current pose.

### Verification

Vitest checks vertex positions, six pairwise distances, invalid inputs, repeatability, timing, reversal and interruption. Playwright serves the production output and checks both unhydrated documents and WebGL 2. Pixel measurements locate the moving face above the sheet at 90°, over the fixed face at 180°, and back at the original pixels after reversal. Separate cases exercise camera inputs, context loss, 320px reflow, motion preferences and resource release on route exit.

## Complete dart lesson

`/en/lessons/paper-airplane` folds one 2 × 3 portrait sheet into a dart in nine actions. A nose-to-tail spine, two tucked corners, two narrower nose folds and two lowered wings form the finished object. The center pre-crease includes its own animated unfold. The sequence, fold senses, moving layers and final angles are specified in [ADR 0003](decisions/0003-authored-dart.md).

### Authoring contract

| Source                                            | Contract                                                                                                                                                                                                                                                   |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `app/lesson/geometry.ts`                          | Version 1 patterns have a stable `lessonId`, a flat XY sheet and ordered steps. Name the sheet vertices, list convex faces counterclockwise by vertex ID, and name each crease by two vertex IDs.                                                          |
| `app/lesson/airplane.ts`                          | Each step has a stable ID, a positive duration in milliseconds and one or more simultaneous turns. A turn names the crease, every participating face and signed right-handed degrees. The initial sheet and these turns determine all ten canonical poses. |
| `app/lesson/airplane.en.ts`                       | The starting sheet and every step have a title, an imperative instruction and a description of the resulting pose. The step keys are checked against the pattern’s literal IDs at compile time.                                                            |
| `app/lessons.ts`, `app/routes/paper-airplane.tsx` | The English catalog owns the title, summary, difficulty, availability and URL. The route binds copy and timing by ID and provides the scene loader. It pre-renders the starting instruction, metadata, controls and complete ordered transcript.           |

The dart uses 20 material vertices, 35 edges and 16 convex faces. Every face incident to a junction reads the same vertex. The single outer rim includes both original rear corners. Compilation checks IDs, face winding, edge incidence, connectivity, durations, turns and references. A vertex shared with a stationary face or a different moving packet must lie on each applicable current hinge. Omitting a wing ply fails at this check.

Each step begins with the previous step's canonical coordinate array. Its axis is the normalized line through the crease endpoints in that pose. At progress `p`, Rodrigues' rotation applies the signed angle multiplied by `p` to the original step-start points. Both endpoints return the stored canonical array directly. The two packet turns that pinch the body share the fixed spine. Each wing then rotates four material bands about a crease in the upright body. Camera transforms never enter the pose calculation.

### Playback and drawing

`app/lesson/playback.ts` samples an action index, local start fraction, monotonic start time and target. Repeated commands toward the active destination preserve the clock. An opposite command samples the current fraction before changing direction. Replay travels back to the start of the displayed action, then forwards at its authored speed. At the opening sheet it performs the first action. A long frame can cross the replay turnaround in one sample.

`use-lesson-player.ts` publishes instructions and polite announcements on state changes. The reusable studio hook owns the media query, lazy mount and camera handle. Reduced motion or context loss settles the selected destination. The text player supports the same actions. Leaving and re-entering starts a fresh sheet and releases the prior scene.

`airplane-scene.client.tsx` supplies the dart view and ply heights to `lesson-scene.client.tsx`. That shared drawing updates position and normal buffers on the same 16 dart panels throughout playback. Green and gold identify the two paper faces. A dashed line marks the active or upcoming crease. Rim lines follow real material edges. A seam gains ink when its incident panels first fold apart. For depth ordering only, a virtual ply is 0.0007 world units thick. The drawing rotates prior offsets about virtual hinges half a ply above a single layer, 1.5 plies above the nose fold and four plies above the closing spine. Exact geometry remains zero-thickness. The renderer explicitly disposes its buffers and materials.

## Three-lesson collection

`app/lessons.ts` contains three playable entries and a separate list of studio resources. The catalog gives each lesson a title, actual paper format, difficulty, action count and literal English URL. A unit check compares those lightweight counts with the fold data. The homepage renders original SVG diagrams. Its module graph contains the catalog and UI without importing Three.js.

All three route modules bind stable data to `app/components/lesson-page.tsx`. Each route pre-renders its transcript and loads the studio after hydration. Route exit disposes the old scene and input listeners. A fresh lesson starts at zero with its own motion state. Reduced motion and the text fallback use the same clock endpoints. The lab retains its own analytic hinge and player.

### Authoring flat packets

The heart and fox use a square of side √2 and diagonal 2 in world units. `flat-pattern.ts` interprets a directed line in the **current** flat pose. The material on its left moves. The fold sense specifies whether it travels in front of or behind the fixed sheet. A packet reference limits a cut to material moved in an earlier step. Opening a mark applies the opposite line direction to the previously folded packet.

Each convex panel carries paired material and posed coordinates during subdivision. A cut splits every selected ply where it crosses the crease. Reflection locates the next flat endpoint and propagates the material identities. Intersections separated by numerical roundoff are welded on a 1e−10 material-coordinate grid. A later cut ending on a neighboring panel’s edge inserts the same boundary vertex on both sides. The result is a single fixed disk with registered material hinges and moving face IDs. The existing version 1 compiler and `poseAt` execute all 3D motion from those endpoints. The heart has 22 panels. The fox has 12.

`flat-scene.client.ts` uses the production lesson drawing with an initial camera at (0, −0.75, 3.4) aimed at the origin, +Z up, vertical field of view 40°. Orbit can pass below these models to inspect the back folds. The shadow receiver sits at z = −0.4, clear of the rear packets. Per-step virtual hinge heights reverse the order of a stack as it turns. The surface depth bias is one buffer unit with zero slope factor to keep buried crease strokes behind the top ply. Drawing offsets are separate from the exact material coordinates. The plans prescribe layer order for these folds. Friction, elastic creasing and pocket-opening mechanics are outside this model. [Fold plans and landmarks](decisions/0004-flat-packet-lessons.md)

### Adding the next lesson

1. Choose paper proportions, an ordered sequence, the moving layers and finished landmarks. Work out where each crease lies after earlier actions.
2. Supply a `FlatFold[]` and per-step English copy for an all-flat sequence, or supply an explicit `LessonPattern` for spatial endpoints. Use `flatPlayer` or the existing lesson clock, shared drawing and route template. Retain the step IDs when editing instructions.
3. Register the literal route and pre-render path. Compare every canonical endpoint to an independent construction. Check rigid distances, seams, closure and reversal within 1e−6 world units at this scale.
4. Compare production paper pixels to independently projected outlines. Inspect oblique and reverse views, interrupt motion, switch models, and exercise the text player. Then publish its catalog entry.

### Release verification

The three lessons share a static transcript with instructions and expected poses. The one-crease lab retains its own geometry and player. The default production suite exercises all three browser engines, including route exit during playback and before the scene module finishes downloading. The [release record](release.md) includes the measured route costs, paper protocols and hosted acceptance steps.
