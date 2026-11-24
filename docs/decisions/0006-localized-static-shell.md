# ADR 0006. Localized static documents and a shared lesson player

## Decision

English Explore is the default document at `/`. Its shareable canonical is `/en`. The ten locale codes in `app/i18n/locales.ts` are case-sensitive BCP 47 tags. Each has an Explore page, a crease guide and one route per published model. The prerender list also contains the independent English diagnostic lab.

The route modules and fold patterns are shared across languages. At build time the root loader identifies the logical page from React Router's normalized loader URL. It reads that locale’s common dictionary and, on a lesson, the transcript for that model. React Router emits finished HTML and a matching static data response for subsequent in-app navigation. English uses the original keyed lesson manuscripts. All other transcripts preserve their step IDs. A typed catalog, interpolation formatter and parity tests cover the current vocabulary without an extra runtime translation dependency. [React Router pre-rendering](https://reactrouter.com/how-to/pre-rendering)

## Sharing and recovery

Each public document links to its own canonical and all ten versions of the same logical page. Explore’s `x-default` is `/`. Guides and lessons use their English equivalents as `x-default`. The sitemap lists all canonical public URLs. At the original localization milestone it contained 50. The nine-lesson catalog contains 110. The lab and recovery documents carry `noindex`.

Set `ORIPO_SITE_URL` to the verified HTTPS origin **before building for hosting**. It sets absolute URLs in both the page head and the sitemap. The default for pre-launch builds is the local preview origin `http://127.0.0.1:4173`. Rebuild on any origin change. The planned domain can be selected after the owner verifies it. [Google guidance on localized versions](https://developers.google.com/search/docs/specialty/international/localized-versions)

The build writes one standalone recovery document per language, plus the English default 404. The preview serves the matching recovery body with status 404. The static hosting configuration looks up files first, then selects a localized error body for a known prefix. Verify that configuration on the eventual host.

## Interactions

A brand link targets the locale root. An Explore link targets `#models`, the keyboard-focusable worktable heading. The heading’s scroll margin clears the sticky header. Repeated activations, direct fragments and history traversal use the same target. Ordinary page visits retain the router's scroll restoration.

Changing language on a lesson replaces its labels and transcript in place. The same model route keeps its fold position, in-flight clock, canvas and camera. Changing models starts with the new sheet. Camera coordinates and the progress slider retain their physical directions in RTL. The document establishes language and base direction in the first response. [W3C direction guidance](https://www.w3.org/International/questions/qa-html-dir)

The shell uses a centered three-column navbar, native nonmodal popovers with links, and a compact mobile menu. A pre-paint script resolves the saved or system palette. Both daisyUI checkbox swaps subscribe to that document state. Keyboard users can tab through links, use arrows within a list, or dismiss a popover with Escape. [daisyUI theme-controller swap](https://daisyui.com/components/theme-controller/#theme-controller-using-a-swap)

## Adding reviewed content

Register the stable model ID, sheet characteristics and action count in the lightweight catalog. Add the model route module, its English manuscript and a complete keyed transcript and model metadata for each supported language. The route registry expands all locale paths and sitemap entries. Recheck font coverage, independent geometry evidence, no-JavaScript instructions and all three production browsers. Human review of the Phase 7 multilingual drafts remains pending. [Font sources and subsetting procedure](../fonts.md)
