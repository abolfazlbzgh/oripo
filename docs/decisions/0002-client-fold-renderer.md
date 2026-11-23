# ADR 0002 · Mount the fold renderer after hydration

Accepted 2026-11-22 for the English first-fold laboratory.

The static build renders routes in Node. Readers also need fold instructions and playback when a GPU context cannot be created. The route therefore owns its English document and accessible controls. A client effect imports a dedicated scene module, requests WebGL 2 on a single canvas and mounts a demand-driven React Three Fiber root. This keeps the 3D download specific to visits to the lab.

Use stable Fiber 9 with the existing React 19 runtime. Use Three's bundled OrbitControls for pointer gestures and the six camera buttons. The authoring contract is an immutable panel plus a scalar hinge rotation. The same absolute transform drives each frame in both directions. [Fiber introduction](https://r3f.docs.pmnd.rs/getting-started/introduction) · [Fiber v9 migration guide](https://r3f.docs.pmnd.rs/tutorials/v9-migration-guide) · [Three OrbitControls](https://threejs.org/docs/pages/OrbitControls.html)

On context failure the DOM player settles the target and offers both end states. Route exit disconnects resize and input listeners, unmounts the root and releases its renderer. The main trade-off is a separate Three/Fiber download on first use. Revisit this boundary if future lesson geometry requires a different renderer or first-load cost becomes a measured problem.
