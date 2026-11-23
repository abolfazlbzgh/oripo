# ADR 0005 · One continuous position for the lesson player

The compact studio gives Dart, Heart and Fox the same seekable timeline. A reader can stop with a flap upright, inspect its hinge and continue in either direction. The existing compiler already resolves those intermediate coordinates.

## Timing and boundaries

`app/lesson/playback.ts` represents a lesson of N actions by a position from 0 to N. In segment [i, i+1], `poseAt(model, i, position - i)` rotates the authored packet about its posed hinge. At an integer, the adjacent geometry endpoints share the same canonical coordinate array.

| Input                       | Destination                                                                                                                                                                                                                  |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Next fold                   | The end of the current segment. At rest on an integer, advance one segment.                                                                                                                                                  |
| Previous                    | The start of the current segment. At rest on an integer, reverse one segment.                                                                                                                                                |
| Play                        | Continue from the displayed position through every remaining segment at its authored duration. At the final endpoint, an explicit Play starts at zero.                                                                       |
| Pause or Info               | Hold the last displayed position. Closing Info keeps the lesson paused.                                                                                                                                                      |
| Seek                        | Replace the active motion with a paused position. Arrows on the range move 5% of one fold, Page Up/Down reach adjacent boundaries, and Home/End select the sheet or finished model.                                          |
| Reduced motion or text mode | Previous and Next settle immediately. The middle button offers **Show finished model** or **Return to starting sheet**. Switching into either mode finishes a requested single fold and pauses continuous playback in place. |

At rest on boundary k < N, k folds are complete. The indicator, guide and instruction identify the next fold, while the canvas description and completion announcement describe the paper already reached. Inside a segment the same step ID supplies the guide, title and instruction in both directions. At N the final result stays visible. During reverse travel the guide follows the segment being undone.

## Scheduler and lifetime

`commandLesson` anchors a motion to the displayed position, monotonic start time and destination. `sampleLesson` spends elapsed time across segment durations from that anchor, including on a delayed frame. `seekLesson` and Pause discard the old target. The existing demand-driven Fiber frame samples both the mesh and the native range. React changes the instruction and polite status on meaningful transitions. The camera has its own controls and never writes lesson progress.

A lost context retires its renderer and leaves the text player usable. Reloading or revisiting creates a new context at position zero. The scene mount guards delayed imports, retired frame callbacks and camera events. Route exit releases the observer, listeners, orbit controls and GPU resources.

## Studio and static reading

The approved v4 reference supplied the stage proportions, control order and responsive disclosure. Production uses the original mark, theme tokens, local stroke icons, keyed English copy and rendered paper. The model picker links to real routes. The transcript stays readable from start to finish, and the single range handles jumps between folds. The paper accepts arrow keys for orbit and tilt. The camera rail supplies zoom and reset. The layout uses the header’s intrinsic height, dynamic viewport units and safe-area padding.

The static Info button opens an HTML popover with the current instruction, paper preparation and ordered transcript. Hydration enhances it to a native modal dialog with background inertness and focus return. The dialog floats at the upper corner on desktop and opens as a scrollable sheet on phones. At enlarged text sizes Previous can use its named arrow icon to leave room for Next fold. The independent first-fold laboratory retains its original one-crease controls.
