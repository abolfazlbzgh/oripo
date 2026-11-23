type Diagram = "paper-airplane" | "paper-heart" | "fox-face" | "first-fold" | "crease-guide";

export function FoldDiagram({ kind }: { kind: Diagram }) {
  return (
    <svg className="fold-diagram" viewBox="0 0 220 156" fill="none" aria-hidden="true">
      {kind === "paper-airplane" ? (
        <g stroke="#466453" strokeWidth="1.5" strokeLinejoin="round">
          <path d="M198 10 72 134 68 119Z" fill="#ac895f" />
          <path d="M198 10 53 62 21 90 68 119Z" fill="#a5bda9" />
          <path d="M198 10 68 119 112 148 148 118Z" fill="#92b39f" />
          <path d="M198 10 53 62 142 57Z" fill="#e4c396" />
          <path d="M198 10 142 57 148 118Z" fill="#d6b282" />
        </g>
      ) : kind === "paper-heart" ? (
        <g
          transform="translate(110 107) scale(133 -133)"
          stroke="#66503b"
          strokeWidth=".012"
          strokeLinejoin="round"
        >
          <path
            d="M0 -.25 .55 .30 .55 .45 .35 .65 .15 .65 0 .50 -.15 .65 -.35 .65 -.55 .45 -.55 .30Z"
            fill="#dfb780"
          />
          <path d="M0 -.25V.5M-.25 0V.65M.25 0V.65" />
        </g>
      ) : kind === "fox-face" ? (
        <g
          transform="translate(110 47) scale(94 -94)"
          stroke="#61523d"
          strokeWidth=".016"
          strokeLinejoin="round"
        >
          <path d="M-.667 0 -.538 .308 -.412 0 .412 0 .538 .308 .667 0 0 -1Z" fill="#d9b07b" />
          <path d="M-.667 0H.667L0 -1Z" fill="#e7c18c" />
          <path d="M0 -1 -.24 -.64 0 -.4 .24 -.64Z" fill="#98b9a5" />
          <path d="M0 -1V0M-.2 -.7H.2" />
        </g>
      ) : kind === "crease-guide" ? (
        <>
          <path d="m28 86 66-38 49 22-65 39z" fill="#dab391" />
          <path d="m78 109 65-39 48-43-61 36z" fill="#f2d6ac" />
          <path d="m78 109 65-39" stroke="#624b39" strokeWidth="2" strokeDasharray="6 4" />
          <path
            d="m49 105 29 14 49-29m-7 0 7 0-2 7"
            stroke="#84694f"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </>
      ) : (
        <>
          <path d="m27 89 69-36 56 22-68 41z" fill="#75a28b" />
          <path d="m84 116 68-41-13-47-68 38z" fill="#c7d5aa" />
          <path d="m71 66 68-38 13 47-68 41z" fill="#e6d9b3" />
          <path d="m84 116 68-41" stroke="#345a47" strokeWidth="2" strokeDasharray="5 3" />
          <path
            d="M176 98c2-17-1-31-14-44m0 8v-9l9 2"
            stroke="#48745e"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      )}
    </svg>
  );
}
