# Author a lesson

A supported construction needs one `models/<slug>/lesson.json` and ten sets of copy. Start with the exact paper construction, its source and rights, ordered folds, accessible plies, intended difficulty and independent landmarks. Use a small physical or analytic fixture for a new motion. Record which physical, language, difficulty and visual reviews still need people. [Construction decisions](phase-9-candidates.md) · [Maker difficulty rubric](https://origamiusa.org/difficulty)

## From draft to preview

Run commands from the project root with the pinned Node and npm. On Windows use `npm.cmd`. Choose new output filenames. The CLI refuses to overwrite existing drafts or exports.

```sh
npm run models -- new square-study
npm run models -- preview square-study mid.png 0.5
npm run models -- export-fold square-study stock.fold
npm run models -- import-fold imported-study stock.fold
npm run models -- check
```

The template includes a working turn. An imported draft contains only its sheet and optional FOLD record. Add a motion before requesting its first preview. A preview position is a zero-based count of completed actions plus the fraction of the next action. Omitting it projects the finished model. Drafts validate locally and stay out of routes, loaders and the sitemap.

1. Set the stable slug in the directory, `pattern.lessonId` and `manuscript`. Describe the stock, pigments, camera, references, rights and review status. The public package uses `schemaVersion: 1`. Choose the lowest `pattern.version` that supports the fold.
2. Define the welded material sheet in right-handed world units. At rest, +X is right, +Y is up the sheet and +Z faces the viewer. Store finite XYZ triples with Z zero, list each convex face counterclockwise, and name the two endpoints of each directed crease. The disk has one boundary. The two extents in `paper.span` are the rest XY bounding-box dimensions, including for stock shown corner-up. A paper size in a manuscript can give a practical physical scale.
3. Give each action a stable ID and positive duration in milliseconds. A signed angle follows the right-hand rule around the **current** directed hinge. Face IDs always refer to original material. Assign every moving face, guide and dependency. Coupled fields validate incident motion across seams. Virtual ply offsets affect drawing only. The interactive eye and preview eye may differ.
4. Set `status` to `published` when local publication checks pass. Fill in a maker tier and documented rights, the model’s `title`, `short` and `summary` under `models` in every locale’s `common.json`, and `app/i18n/<locale>/<slug>.json`. Supply a `sheet` and a `steps` object keyed exactly by action ID. Every entry needs a title, instruction and observable result. Update font subsets if the new text needs more glyphs. [Font recipe](fonts.md)
5. Run `npm run models -- generate` and commit the two generated TypeScript indexes. The stable ordering is catalog order followed by slug. `npm run models -- check` validates packages and manuscripts and detects stale indexes. The build computes the PNGs from the exact endpoint mesh. Compare those PNGs and production canvas pixels against independently derived coordinates in front, oblique and back views. Include layer, collision, reversal, interruption and no-JavaScript checks. [Quality commands](../README.md#verify-changes)

## Supported operations

| Earliest engine | Action                     | Required geometry                                                                                                                                |
| --------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1               | `turns`                    | One or more disjoint rigid face packets around current crease axes. Shared stationary seams lie on the relevant axis.                            |
| 2               | `right-gusset` on a turn   | A bisected right corner and signed 90° wall rotation, optionally carried by another wall in the same action.                                     |
| 3               | `field` or `regions`       | Flat-start square waterbomb, pinned lip/gusset/cover squash, or corrugation on the specified herringbone grid. Regions own disjoint named faces. |
| 4               | `crimps`                   | Planar packet in its current pose, three noncollinear frame pins and scored oblique stations.                                                    |
| 4               | `hex-twist`, `reopenTo`    | Regular hub with the supported six-vane rail geometry. Retrace the immediately preceding chart-based action to a fraction in [0, 1).             |
| 5               | `boat-pocket` in `regions` | A flat double-boat gate pocket with perpendicular wall and gate, bisecting diagonals, mirrored signs, and wall/bridge/wing sectors.              |

One action selects one motion family. Unsupported examples include continuous petal curling, automatic layer extraction, arbitrary tessellation closure and free vertex trajectories. For an additional technique, lock its geometry and allowable parameters first. Extend the trusted TypeScript union and schema, implement the prepared turn or chart at the compiler boundary, and exercise both mirror hands, seam constraints, endpoint contacts and nontrivial intermediate landmarks on an independent fixture before publishing a lesson. The shared scene samples absolute progress. Only step endpoints and prepared operations are cached. [Engine decision](decisions/0010-declarative-lessons.md)

## FOLD interchange and compatibility

The offline validator uses JSON Schema draft-07 and strict semantic checks. Ajv 6.15.0 was already present in the toolchain. It is pinned as an MIT-licensed development dependency. Unknown significant fields, unsafe versions and unsupported encodings fail with a model, field path or step diagnostic. Each input file has a 4 MiB cap. A package admits up to 4,096 material vertices, 4,096 faces and 512 steps. Additive engine capabilities retain their earlier version semantics. Incompatible native layouts require a schema version change. [Native schema](../models/lesson.schema.json) · [JSON Schema specifications](https://json-schema.org/specification) · [Ajv license](https://github.com/ajv-validator/ajv/blob/v6.15.0/LICENSE)

Import/export supports FOLD 1.2, a single 2D crease-pattern frame, and square, rectangular or regular-hexagonal stock. Supply explicit vertex coordinates, edges and counterclockwise face cycles. Edge and vertex array order, edge orientation, supplied B/M/V/F/U assignments and the supported file/frame metadata round-trip. If assignments are supplied, boundary edges must be B. If absent, they remain absent. Optional `oripo:vertexIds`, `oripo:faceIds` and `oripo:creases` preserve native names and directed crease endpoints. Other producers may ignore those extensions.

Additional frames, folded 3D coordinates, cuts, angle arrays, face/edge orders, unknown assignments and unrecognized extensions produce an error. The native package retains its actions, layer choices, timing, provenance and presentation. Its keyed locale manuscripts supply the teaching text. A fold sequence must be authored separately from its crease pattern. [Supported FOLD fields](../models/fold.schema.json) · [Official FOLD specification](https://edemaine.github.io/fold/doc/spec.html)
