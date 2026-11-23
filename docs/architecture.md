# Architecture and Phase 2 handoff

## Foundation

| Responsibility                                                                           | Location                                                  |
| ---------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| Document shell, language tag, skip link, shared appearance control, route error boundary | `app/root.tsx`                                            |
| Product name, description, document-title format and default locale                      | `app/site.ts`                                             |
| Registered pages and canonical English URLs                                              | `app/routes.ts`, `app/navigation.ts`                      |
| Language entry, English foundation and crease guide                                      | `app/routes/`                                             |
| Semantic light/dark tokens, layout, reduced-motion rules and original CSS illustrations  | `app/styles.css`                                          |
| Static output, preview and production checks                                             | `react-router.config.ts`, `scripts/preview.mjs`, `tests/` |

English has a literal URL prefix. Only published languages should gain routes. When the second genuine translation is ready, introduce a locale catalog and i18next/react-i18next, set document language and direction from the matched locale, and pre-render its actual pages. Keep stable lesson identifiers separate from translated titles and prose.

The appearance control defaults to the operating system preference. An explicit choice applies to the current document and client-side navigation. The code uses logical spacing, keyboard-visible focus, a skip link, and system fonts. WCAG 2.2 AA is the design target.

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
| `app/fold/scene.client.tsx`   | Owns the WebGL root, two triangle meshes, crease line, lighting, camera and teardown.            |
| `app/routes/first-fold.tsx`   | Pre-renders English instructions, both control groups and the initial sheet description.         |

Next targets 1 and Previous targets 0. Each command samples the current monotonic time before changing direction. A full traversal takes three seconds at constant angular speed. Repeating a target preserves its time anchor. Replay always starts a new forward traversal at 0. A throttled tab catches up on its next frame. The current target's button is disabled, the opposite direction remains available during travel, and Replay stays available throughout playback.

Hydration loads the scene through an effect. Each frame applies the absolute hinge rotation to the original mesh. Fiber requests another frame while the fold is moving or a camera or viewport change needs painting. The meter updates directly and React updates the step at phase boundaries. The live region announces completed poses. Reduced motion and the text player settle commands immediately. Enabling reduced motion or losing the context mid-fold settles the current target. Returning to the lab creates a fresh unfolded sheet.

The materials give each face its own color. A depth-buffer polygon offset draws the moving reverse side over the fixed front at closure and keeps the crease legible. A transparent plane at `z = −0.035` receives the shadow. Both are render-only treatments. The underlying sheet has zero thickness. A camera anchored at the crease can orbit through a full turn, tilt between 7.5° and 82.5° above the sheet, and zoom between 3.6 and 6.8 world units. Six native buttons provide the same operations as dragging, scrolling or pinching.

### Verification and Phase 2

Vitest checks vertex positions, six pairwise distances, invalid inputs, repeatability, timing, reversal and interruption. Playwright serves the production output and checks both unhydrated documents and WebGL 2. Pixel measurements locate the moving face above the sheet at 90°, over the fixed face at 180°, and back at the original pixels after reversal. Separate cases exercise camera inputs, context loss, 320px reflow, motion preferences and resource release on route exit.

Phase 2 can use this route to refine playback, orientation instructions, focus and announcements. Check the experience with a screen reader and physical touch devices before authoring a complete lesson. A second hinge, multiple layers, paper thickness and collision handling fall outside this model. The local device results and open checks are recorded in the [development evidence](ai-development.md#phase-1-verification).

The rendering boundary and static hosting decisions are recorded in [ADR 0002](decisions/0002-client-fold-renderer.md) and [ADR 0001](decisions/0001-framework-and-deployment.md).
