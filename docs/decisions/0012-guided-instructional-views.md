# 0012. Keep instructional views on the playback clock

## Decision

A sparse list of action IDs selects the teaching eye for an action and its successors. The finished object can have its own eye. The lazy scene resolves those views once and gives them to the transport when the camera becomes available. This keeps camera vectors out of route data and makes direct seeks independent of visit order.

A demand frame samples elapsed time from the current command. A change of eye consumes presentation time with the paper held still. Native action durations still measure material progress. The controls, guide, instruction and scrubber consume that same sample. A reader can interrupt the turn, orbit under a packet or seek directly to the recommended view. The first-fold lab retains its own reset behavior.

Scores can be carried by a folded packet or split across several panel edges. The studio resolves them to incident plies once, then draws their displaced edges against the opaque panels' depth buffer. The regular paper polygon depth offset separates a coplanar stroke from its own surface. An intervening ply covers it. A buried hinge can become visible only after the pocket starts opening.

## Consequences

Authors inspect the actual drawing at boundaries and midfold. The camera follows a short orbit about the framed object's origin, which keeps the paths bounded and the data small. The teaching view expresses an inspection direction. Physical manipulations belong in the native pattern and manuscript. [Coordinates, example and review procedure](../authoring.md#instructional-camera)
