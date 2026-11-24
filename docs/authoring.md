# Model authoring context

Oripo teaches an ordered, reversible fold sequence on a single sheet. An author supplies the material graph, individual actions and intended layer contacts. Use this page with the [native JSON Schema](../models/lesson.schema.json), the [Dart](../models/paper-airplane/lesson.json), [Masu box](../models/masu-box/lesson.json) and [Monarch butterfly](../models/monarch-butterfly/lesson.json) packages. The schema specifies JSON shape and limits. The compiler and offline validator check geometric preconditions.

## A reference-led draft

1. Identify the exact model and variant, original creator or traditional provenance, complete step sequence, source pages or step numbers, stock proportions, printed side and any required attribution or permission. Use links to copyrighted instructions. A finished photo or generated illustration leaves internal creases, hidden plies and their order ambiguous.
2. For each source step, identify the corresponding action IDs, directed hinges or coupled sectors, stationary faces, moving plies and their order at contact. Derive checkable landmarks independently of the implementation, including intermediate positions, front/back silhouette, distinguishing features and final coloration. Identify any departures from the reference.
3. Give the owner a candidate `lesson.json` with `status: "draft"`, a reference and rights record, the step correspondence, visual acceptance criteria and a short list of uncertain operations. If the sequence is incomplete, return a clearly labeled partial crease/geometry plan with the missing evidence. Keep unknown coordinates and physical feasibility open. Research and independent landmark drawings can travel alongside the draft as notes.
4. The owner hands these materials to Codex or a contributor for review. Trace the accessible layer at each step. Reject a conflicting seam, unsupported curl or uncertain rights before integrating a public lesson. Agree on any design adjustment with the owner. A new motion needs a reusable geometric contract, independent fixture and evidence through the full action. Keep a proposal as a draft until this work is complete.

## Native package

The directory is `models/<slug>/lesson.json`. `schemaVersion` is **1**, using JSON Schema draft-07. `pattern.version` is the **engine** capability level (1–6). Select the earliest level that supports the whole sequence. The limits are 4 MiB per input file, 4,096 vertices, 4,096 faces and 512 actions. Additional object properties are rejected. IDs match `^[a-z][a-z0-9-]*$` and are at most 96 characters. [Package types and defaults](../app/lesson/package.ts) · [Schema validation](../scripts/schema-validation.ts) · [Semantic checks](../scripts/validate-package.ts)

| Required fields                             | Meaning                                                                                                                                                                                                                                                                                                                             |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `status`, `order`, `difficulty`, `category` | `draft` or `published`, nonnegative integer sort order, maker tier (`beginner`, `intermediate`, `advanced`, or `null` for an unrated draft), and category ID. Ties sort by slug. Drafts are excluded from public indexes.                                                                                                           |
| `manuscript`, `pattern.lessonId`            | Both equal the directory slug.                                                                                                                                                                                                                                                                                                      |
| `paper.shape`, `paper.span`                 | `square`, `rectangle` or regular `hexagon`. Span is the rest XY bounding-box width and height in material units, including rotated or translated stock. Physical paper size can be described in the manuscript.                                                                                                                     |
| `finishedAppearance`                        | Three six-digit hex colors, `front`, `reverse` and `edge`. The final timeline boundary uses these pigments. Moving back from it restores the shared teaching palette.                                                                                                                                                               |
| `provenance`                                | Supply `variant`, `reference`, `rights`, `rightsStatus` (`project-authored`, `traditional`, `permission-recorded` or `unverified`) and `review`. Its `maker` is `provisional` or `independent`. Each of `physical`, `language` and `visual` is `pending` or `verified`. Public data requires actions, a tier and documented rights. |
| `pattern.sheet`, `pattern.steps`            | One welded disk and an ordered action array. Empty steps are allowed in a geometry-only draft.                                                                                                                                                                                                                                      |

Only `presentation` and `fold` are optional top-level blocks. Rest coordinates in `sheet.vertices` map IDs to finite XYZ triples at Z = 0. In the right-handed frame, +X points right, +Y up the sheet and +Z toward the viewer. Each entry of `sheet.faces` has an `id` and at least three distinct `vertices` in convex counterclockwise order viewed from +Z. Adjacent panels traverse the same material edge in opposite directions. Every vertex is used, the sheet is connected and the boundary has one ring. Subdivide along every moving panel boundary. `sheet.creases` maps a crease name to two distinct **ordered vertex IDs** defining an axis. A crease can span several scored edges.

Each step requires a unique stable `id`, positive `durationMs` and `turns`. Choose one family. Put one or more turns in `turns`, or use `turns: []` and exactly one of `field`, `regions`, `crimps` or `reopenTo`. Timeline position is completed actions plus the next fraction. Each action starts at its predecessor's exact material endpoint. Face selections always name original material. Turn `guides` default to the moving crease names. Fields and crimps require explicit nonempty `guides` referencing existing creases. Retrace inherits its source guides. [Compiler and absolute pose sampler](../app/lesson/geometry.ts)

### Worked action

This is the complete first action from the validated Dart package. Insert it only in the context of that package's sheet and hinge plies.

```json
{
  "id": "mark-spine",
  "durationMs": 1600,
  "turns": [
    {
      "crease": "spine",
      "degrees": 180,
      "faces": [
        "right-0",
        "right-1",
        "right-2",
        "right-3",
        "right-4",
        "right-5",
        "right-6",
        "right-7"
      ]
    }
  ]
}
```

`spine` runs from `nose` to `tail`. At half progress the eight right panels have rotated +90° about that directed axis. The stationary panels retain the original material seam. The next action uses the folded axis positions. For a smaller runnable example, `npm run models -- new square-study` generates and validates a two-triangle square with one 75° diagonal lift.

## Motion matrix

| First engine | Action and parameters                                                                              | Geometry and composition                                                                                                                                                                                                                                                                                                                                                                                     | Working example                                                            |
| ------------ | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------- |
| 1            | `turns[]` with `crease`, `faces`, `degrees`                                                        | Signed right-hand rotation about the **current** directed axis, nonzero and at most 180° in magnitude. Independent turns within one step run together on disjoint faces. Shared vertices must lie on each incident axis.                                                                                                                                                                                     | [Dart](../models/paper-airplane/lesson.json)                               |
| 2            | Turn `corner.motion: "right-gusset"`, optional `carriedBy`                                         | Bisected right corner, signed 90° turn. A carrier names exactly one plain ±90° turn in the same action. The corner follows the nonlinear wall constraint, then rides the carrier at the same progress. All incident trajectories must agree.                                                                                                                                                                 | [Masu](../models/masu-box/lesson.json)                                     |
| 3            | `field` or `regions[]` with `{field, faces}`                                                       | One field over the sheet, or disjoint face packets with a field each. Unassigned faces stay still. Start flat in world XY, including already folded flat packets. Independent region declarations still have to agree along every common seam.                                                                                                                                                               | [Offset waterbomb fixture](../tests/fixtures/offset-waterbomb/lesson.json) |
| 3            | `kind: "waterbomb"`, `center` XY, `radius` > 0, optional integer `plies` ≥ 1 (default 1)           | Axis-aligned scored square about the center, radius its half-width. Lower triangular sector stays fixed. Side triangles and top rotate together on the inward branch. Ply count scales the landing stack.                                                                                                                                                                                                    | [Frog](../models/jumping-frog/lesson.json)                                 |
| 3            | `kind: "pocket-squash"`, `center` XY, `inward` ±1, `sector`, `landingPly`                          | Pin the pocket diagonal. Assign `lip`, `gusset` and `cover` explicitly to their material packets. They share a constrained moving rim and land on the supplied drawing plies.                                                                                                                                                                                                                                | [Squash fixture](../tests/unit/pocket-squash.test.ts)                      |
| 3            | `kind: "herringbone"`, `origin` XY, `pitch`, `band`, `stagger`, `degrees`                          | Positive grid dimensions, 0° < angle < 90°, `stagger × tan(angle) < band`. Score alternating row/column facets of that grid. One coupled corrugation.                                                                                                                                                                                                                                                        | [Archived test sheet](../tests/fixtures/legacy-map/lesson.json)            |
| 4            | `crimps[]` with `faces`, `frame`, `side`, `stations`, `halfAngle`, `hold`                          | Disjoint planar packets in their **current** planes. Three noncollinear pins are origin, positive rib direction and transverse side pin. `side` is ±1. Score the rib and oblique stations `[distance, slope]` in increasing distance, nonzero slope, up to 128 stations. Signed half-angle is nonzero and strictly between −90° and 90°. `hold` is `left` or `spine`. Distal stations ride on proximal ones. | [River tern](../models/river-tern/lesson.json)                             |
| 4            | `kind: "hex-twist"`, `radius` > 0                                                                  | A fixed regular six-sided hub centered at the origin with a vertex on +X. The six vane/gusset rail directions use the built-in sine ¼ and fixed closure multipliers. Only the hub radius varies.                                                                                                                                                                                                             | [Hex iris](../tests/fixtures/hex-iris/lesson.json)                         |
| 4            | `reopenTo` in [0,1)                                                                                | Immediately follow one chart-based action. Sample its validated path back from closure to the chosen source fraction, including its drawing stack.                                                                                                                                                                                                                                                           | [Hex iris](../tests/fixtures/hex-iris/lesson.json)                         |
| 5            | `kind: "boat-pocket"` in `regions`, `center` XY, `inward` and `outward` ±1, `sector`, `landingPly` | A flat double-boat gate and perpendicular wall meet at the center. Bisect the packet diagonally. Mirror the X and Y directions with the two signs. Explicit `wall`, `wing` and `bridge` sectors share the opening wall constraint.                                                                                                                                                                           | [Monarch](../models/monarch-butterfly/lesson.json)                         |

The analytic field charts transport each panel's local basis and the compiler samples agreement at shared vertices (material tolerance `1e-6`). The offline validator probes corners inside centroid-classified fields for missing subdivisions. Collision/contact fixtures sample selected positions and fractions. Continuous clearance, general twist closure, automatic layer extraction and continuous petal curls remain outside demonstrated support. [Rigid fields](../app/lesson/rigid-field.ts) · [Crimps](../app/lesson/spatial-crimp.ts) · [Six-sector twist](../app/lesson/hex-twist.ts) · [Boat pockets](../app/lesson/boat-pocket.ts)

## Local pockets and open corners

For a version 6 `boat-pocket` region, optionally set `frame` to three current material vertex IDs in the order origin, point along positive X, point in the positive Y half-plane. The cross product fixes the normal. Supply the pocket center and its two signs in these local coordinates. The compiler inverse-projects every moving corner, checks planarity at `1e-6`, validates its sector and transports the rigid chart by conjugation. Drawing ply rises along the oriented frame normal. This permits a scored planar packet next to stationary material in another plane. Coincident or collinear pins, a packet outside its declared plane, and disagreement with any stationary seam produce errors. [Frame implementation](../app/lesson/chart-frame.ts) · [Lifted double-gate and adjoining-wall tests](../tests/unit/framed-packet.test.ts)

A `tray-corner` region starts flat in world XY. Its center is one floor corner and `outward` gives the signed X and Y rays into the moving corner. Score both wall hinges and the 45° diagonal in the quadrant beyond the floor. Assign every moving panel to a side wall, end wall or one of the two gusset triangles. Leave the floor unassigned. This is the side-gusset region from the complete five-panel example. [Runnable package](../tests/fixtures/tray-corner/lesson.json)

```json
{
  "faces": ["side-gusset"],
  "field": {
    "kind": "tray-corner",
    "center": [0, 0],
    "outward": [1, 1],
    "sector": "side-gusset",
    "sideAngle": 38,
    "endAngle": 73,
    "branch": 1
  }
}
```

Use the same angles, center, signs and branch in the four regions of a corner. Both angles are positive and strictly below 90°. In outward coordinates the side and end unit rays are U = (cos α, 0, sin α) and V = (0, cos β, sin β). The shared diagonal D satisfies D·U = D·V = 1 and D·D = 2. The two solutions differ along U × V. Choose +1 for its positive side and −1 for the other. At flat start the branches coincide. The example's toes of the two wall hinges stay on the floor, its free diagonal remains √2 units long, and its facets retain their areas throughout the lift. A panel across a sector boundary is rejected. A missing neighbor that needs to move gives a moving-field-seam diagnostic. Inspect the chosen branch and stack order for the actual paper packet. [Corner solution](../app/lesson/tray-corner.ts) · [Mirrored and negative fixtures](../tests/unit/tray-corner.test.ts)

## Presentation and review in the studio

`presentation.hingePlies` maps a turn step ID to a scalar Z pivot, an XYZ pivot, or an object mapping each moving crease to either kind of pivot. Coordinates here are **drawing offsets in ply units**. The multiplier `plyThickness` defaults to 0.0007 and must be positive. Free turns default to zero when the map is omitted. Author explicit pivots for flat 180° turns and gussets. If supplying a map, cover every turn. Charts transport prior offsets as vectors and add their progress-scaled landing rank along display Z or the normal of a framed pocket. Physical vertices never acquire this separation. [Layer calculation](../app/lesson/drawing.ts)

The default `view` is centered on the stock bounds via `materialFrame` and scaled by `2 / max(span)`. Its `position` is [1.2, −2, 2.8], with distances 0.8 and 8 and `inspectBack` enabled. A supplied `view` requires `position`, `minDistance` and `maxDistance` and can specify `inspectBack`, `shadowZ` and `materialFrame: {center, scale}`. It replaces the entire default view. The separate nonzero `previewEye` defaults to [1, −2, 3].

Use the CLI from the repository root. Choose unused IDs and output filenames.

```sh
npm run models -- new square-study
npm run models -- preview square-study midpoint.png 0.5
npm run models -- export-fold square-study stock.fold
npm run models -- import-fold imported-study stock.fold
npm run models -- check
```

After validating rights and geometry, add `models.<slug>.{title,short,summary}` in every `app/i18n/<locale>/common.json`. Each `app/i18n/<locale>/<slug>.json` contains `sheet` and `steps` keyed by exact step ID. The sheet and each action require `title`, `instruction` and `result`. Check glyph coverage in every locale. For the reviewed integration set `status` to `published`, run `npm run models -- generate` and commit both generated indexes. Build the thumbnail from the actual finished mesh. Inspect front, back and oblique views, both themes, fractional seeks, reversal, contact order and keyboard operation in the production studio. Obtain owner visual acceptance against the independent landmarks before release. Record physical, linguistic and independent difficulty reviews as pending until performed. [CLI](../scripts/model-commands.ts) · [Catalog checks](../scripts/model-catalog.ts) · [Font recipe](fonts.md) · [Verification commands](../README.md#verify-changes)

## FOLD interoperability

The offline CLI reads one FOLD 1.2 planar crease-pattern frame. It requires `file_spec: 1.2`, `vertices_coords` (XY pairs), `edges_vertices` and counterclockwise `faces_vertices`. Use the same supported stock outlines. Edges must describe every face edge exactly once. Optional `edges_assignment` supports B/M/V/F/U, one per edge, with B exactly on the boundary. Arrays preserve vertex order, face cycles, edge order and directions, and supplied assignments. Absent assignments stay absent. Export includes `oripo:vertexIds`, `oripo:faceIds` and `oripo:creases` for native IDs and directed endpoints. Import assigns IDs when extensions are absent.

Supported metadata includes file creator/author/title/description, frame author/title/description, `file_classes: ["singleModel"]`, `frame_classes: ["creasePattern"]` and the enumerated `frame_unit`. The optional native `fold` record retains `metadata`, `edges` and optional `assignments`. Additional frames, 3D poses, cuts, angle arrays, layer-order arrays and unknown extensions are rejected. A crease pattern describes the sheet. The lesson author must supply the sequence, changing fold senses, accessible plies, timing, presentation and instructions. [FOLD schema](../models/fold.schema.json) · [Conversion](../scripts/fold.ts) · [Round-trip tests](../tests/unit/fold-interchange.test.ts)
