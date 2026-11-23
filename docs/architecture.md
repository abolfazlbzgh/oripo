# Architecture and Phase 1 handoff

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

The appearance control defaults to the operating system preference. An explicit choice applies to the current document and client-side navigation. The code uses logical spacing, keyboard-visible focus, a skip link, and system fonts. WCAG 2.2 AA is the design target. Phase 1 should check keyboard and screen-reader interaction, contrast, focus after transitions, zoom/reflow, and a useful reduced-motion alternative before treating a player as accessible.

## First 3D proof of concept

Choose a square sheet and one authored crease. Define the two panels, their shared edge, the rotation axis and a reversible progress value. Keep coordinates and fold math in a pure module with no React, rendering or language dependency. Verify fixed crease vertices, panel edge lengths and a forward/reverse round trip within a documented numeric tolerance.

Then render the two panels in an isolated player route. Next and Previous should traverse the same continuous motion in opposite directions. Camera rotation and zoom should preserve the fold state. Under reduced motion, offer an immediate, understandable step change. Measure behavior on a narrow touch screen and with a keyboard before expanding the model.

Use these results to choose the first feasible lesson model and evaluate Three.js, React Three Fiber and Drei versions against the pinned React major. A lesson gallery, three complete lessons, translations and timeline controls belong after an end-to-end lesson succeeds. Keep v1 static, with lesson content packaged alongside the app.

The framework decision and hosted acceptance cases live in [ADR 0001](decisions/0001-framework-and-deployment.md).
