const paths = {
  menu: "M3 6h18M3 12h18M3 18h18",
  globe: "M21 12a9 9 0 1 1-18 0 9 9 0 1 1 18 0ZM3 12h18M12 3c-5 5-5 13 0 18 5-5 5-13 0-18Z",
  sun: "M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5",
  moon: "M20.5 15.2A9 9 0 0 1 8.8 3.5a9 9 0 1 0 11.7 11.7Z",
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
