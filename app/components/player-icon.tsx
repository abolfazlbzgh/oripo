const paths = {
  previous: "m14 6-6 6 6 6",
  next: "m10 6 6 6-6 6",
  play: "m8 5 11 7-11 7Z",
  pause: "M8 5v14m8-14v14",
  plus: "M5 12h14m-7-7v14",
  minus: "M5 12h14",
  reset: "M3 10a9 9 0 1 1 1.8 8M3 4v6h6",
  info: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-10v5m0-9v.1",
  close: "m6 6 12 12M18 6 6 18",
  down: "m6 9 6 6 6-6",
  finish: "m4 12 5 5L20 6",
};
export type PlayerIconName = keyof typeof paths;
export function PlayerIcon({ name }: { name: PlayerIconName }) {
  return (
    <svg
      className="player-icon"
      aria-hidden="true"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill={name === "play" ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={paths[name]} />
    </svg>
  );
}
