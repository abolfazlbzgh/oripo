import { useSyncExternalStore } from "react";
import { useI18n } from "../i18n/context";
import { PlayerIcon } from "./player-icon";

declare global {
  interface Window {
    oripoAppearance?: (dark: boolean) => void;
  }
}
const subscribe = (notify: () => void) => {
  window.addEventListener("oripo-appearance-change", notify);
  return () => window.removeEventListener("oripo-appearance-change", notify);
};
const snapshot = () => document.documentElement.dataset.theme === "oripo-dark";
const server = () => null;

export function Appearance({ withText = false }: { withText?: boolean }) {
  const { common } = useI18n();
  const dark = useSyncExternalStore(subscribe, snapshot, server);
  return (
    <label
      className={withText ? "theme-choice" : "wide-control theme-choice"}
      title={common.nav.dark}
    >
      <span className="swap swap-rotate theme-swap">
        <input
          type="checkbox"
          className="theme-controller"
          value="oripo-dark"
          aria-label={common.nav.dark}
          checked={dark ?? false}
          disabled={dark === null}
          onChange={(e) => window.oripoAppearance?.(e.currentTarget.checked)}
        />
        <span className="swap-off">
          <PlayerIcon name="sun" />
        </span>
        <span className="swap-on">
          <PlayerIcon name="moon" />
        </span>
      </span>
      {withText && <span>{common.nav.dark}</span>}
    </label>
  );
}
