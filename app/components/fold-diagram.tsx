export function FoldDiagram({ guide = false }: { guide?: boolean }) {
  return (
    <svg className="fold-diagram" viewBox="0 0 220 156" fill="none" aria-hidden="true">
      {guide ? (
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
