# ADR 0004 · A folded heart and a fox face

## Selection gate

Both designs start from one square seen from +Z, with material corners at N (0,1), E (1,0), S (0,−1) and W (−1,0). The side is √2 units. Coordinates below describe the paper **after** the preceding action, with +Y toward the top. Fold the entire packet on the indicated side unless a single ply is specified. Each closure is 180°. A front fold lifts into +Z and lays the reversed packet above the fixed paper. A back fold carries the packet through −Z and lays it underneath. Hold the model clear of the table for the back folds.

The dart compiler already accepts named convex material faces, arbitrary current hinges and selected plies. The heart needs intersections of later creases with earlier folded layers. The fox needs its upper triangle to move independently at the muzzle. Partition the original material once, using planar reflections to find crease preimages for these flat endpoints. Feed the resulting version 1 pattern to the existing continuous 3D rotations. Each action below has free space in the indicated half-space. The left and right ear packets stay on their respective sides of the centerline. A pocket-opening boat would require a different motion. An envelope would add another flat closure but fewer distinct outline landmarks than the fox.

## Paper heart

1. Bring E to W about x = 0, lifting the right half. Mark the centerline.
2. Open the same half along that crease.
3. Bring N to S about y = 0 to locate the crossing of the diagonals.
4. Open that half. The two crease marks locate the center without a ruler.
5. Bring N to (0,0), turning the top corner forward about y = 1/2.
6. Bring S to (0,1/2), turning the bottom corner forward about y = −1/4. This flap rests over the top flap.
7. Lift the left end of the new bottom edge to the vertical centerline about y = −x − 1/4. Carry every layer outside the crease. W lands at (−1/4,3/4).
8. Mirror the fold on the right about y = x − 1/4. The folded bottom edges meet at x = 0. The new bottom tip is (0,−1/4) and the cleft is (0,1/2).
9. Bend the projecting left side behind all layers about x = −0.55.
10. Fold the matching right side behind about x = 0.55.
11. Bend only the left lobe tip behind about y = 0.65.
12. Fold the matching right lobe tip behind on the same horizontal. Each top now spans |x| = 0.15 to 0.35. The two short outer edges span y = 0.30 to 0.45. These flats, the central V and the lower point define the finished heart.

## Fox face

1. Bring N down to S about y = 0. The long folded edge is at the top, with two loose tips pointing down.
2. Bring the right corner to the left, folding the entire doubled triangle about x = 0.
3. Open those two plies together. The vertical crease locates the center of the forehead.
4. Lift **only the upper loose tip** to (0,−0.4), folding about y = −0.7. The lower tip stays at S. The exposed green lower ply and turned-up green triangle mark the muzzle against the gold face.
5. Fold the whole left corner behind about the line from S to (−2/3,0). Its tip lands at (−7/13,4/13). All plies intersected by the crease, including the sides of the muzzle, travel together.
6. Mirror the ear behind about the line from S to (2/3,0). The two ears stand above the straight crown, which runs from x = −7/17 to 7/17 at y = 0. The cheek corners at (±2/3,0) taper to the original S. No drawn features are needed.

## Verification boundary

These are original coordinate constructions and instructions for common straight-fold forms. There are no imported diagrams or models. The analytic targets above are independent of triangulation. Compare them with the final material footprint and the production canvas. Zero-thickness panels model the motion of an ideal crease. Small virtual hinge offsets serve only to draw the ply stack. Physical handling, friction and springback require a separate paper trial.
