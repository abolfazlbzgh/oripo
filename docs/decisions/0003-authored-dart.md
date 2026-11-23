# ADR 0003 · Fold a dart from one radial crease pattern

Accepted for the first complete English lesson. The lab demonstrates a single fixed world hinge. A dart also needs to carry several plies around a hinge that earlier folds have moved. All the creases of this dart meet at the nose. That makes a fixed subdivision of one rectangular sheet sufficient. A crane would need pockets and squash folds. A kite base alone would leave the object unfinished.

## Sheet and fold plan

Use a 2 × 3 portrait rectangle in right-handed XY, viewed from +Z. The nose is the midpoint of the short top edge at (0, 1.5, 0), and the tail edge is at y = −1.5. On either half, measure the material angle from the nose-to-tail centerline toward the side. Let A = 22.5° and B = arctan(0.1). The wing crease reaches the tail 0.3 units from the center. Positive turns follow the right-hand rule along the named crease from nose to edge.

| Action                       | Crease, moving material and endpoint                                                                                                        |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Mark the spine            | Valley-fold the whole right half +180° about the center to meet the left edge.                                                              |
| 2. Open the sheet            | Unfold the same half −180° on the same line. The real return to flat leaves a center mark.                                                  |
| 3. Bring in the left corner  | Valley-fold the material beyond the left 45° ray −180°. Its top edge reaches the spine.                                                     |
| 4. Bring in the right corner | Mirror the corner fold, +180°. The corner edges meet without crossing.                                                                      |
| 5. Narrow the left nose      | Valley-fold both plies outside the current left A ray −180°. The diagonal edge meets the spine.                                             |
| 6. Narrow the right nose     | Mirror the two-ply fold, +180°. The two leading edges now taper at A.                                                                       |
| 7. Pinch the body            | Valley-close the spine, lifting the complete left and right packets −90° and +90°. The halves meet upright with their tucked layers inside. |
| 8. Lower the left wing       | Mountain-fold the entire outboard packet +84° on the left B ray in its current upright position. Keep the narrow body still.                |
| 9. Lower the right wing      | Mirror the wing fold, −84°. The two swept wings sit slightly above level relative to their hinge, on either side of a narrow vertical keel. |

The camera initially looks down from behind the tail, slightly to one side. Both the wing spread and keel should be readable from that position. Orbit and reset belong to the viewer throughout.

## Construction and limits

On each half, crease rays at 0, B, A, 2A−B, 2A, 2A+B, 3A, 4A−B and 4A divide the sheet into eight convex faces. Include the original rear corner in the face whose outer boundary crosses it. Every face keeps its identity throughout the lesson. Reflecting a corner maps its material angle t to 90°−t. The taper then reflects angles above A to 2A−t. Those reflections identify every layer intersected by the final wing crease.

Evaluate signed rotations from canonical step-start coordinates, using the posed crease endpoints. All layers in each moving packet share its turn. Preserve a single vertex for each material junction and verify rigid distances, fixed hinges, the perimeter and boundary continuity to 1e−6 world units. The construction uses zero-thickness, rigid panels. Small depth offsets for drawing coincident plies belong to the renderer. The lesson prescribes each fold and its layer order. Paper springback, aerodynamics and arbitrary collisions would require physical modeling beyond this sequence.
