import { useI18n } from "../i18n/context";
import { numberLocale } from "../i18n/messages";
import type { KeyboardEvent, RefObject } from "react";
import type { LessonCommand } from "../lesson/playback";
import { PlayerIcon } from "./player-icon";

type Props = {
  total: number;
  completedFolds: number;
  title: string;
  complete: boolean;
  moving: boolean;
  canPrevious: boolean;
  canNext: boolean;
  instant: boolean;
  loading: boolean;
  range: RefObject<HTMLInputElement | null>;
  command: (command: LessonCommand) => void;
  seek: (p: number) => void;
};

export function LessonTransport({
  total,
  completedFolds,
  title,
  complete,
  moving,
  canPrevious,
  canNext,
  instant,
  loading,
  range,
  command,
  seek,
}: Props) {
  const {
    common: { player: p },
    locale,
  } = useI18n();
  const numericLocale = numberLocale(locale);
  function rangeKey(event: KeyboardEvent<HTMLInputElement>) {
    const p = event.currentTarget.valueAsNumber;
    const targets: Record<string, number> = {
      ArrowRight: p + 0.05,
      ArrowUp: p + 0.05,
      ArrowLeft: p - 0.05,
      ArrowDown: p - 0.05,
      Home: 0,
      End: total,
      PageUp: Math.floor(p) + 1,
      PageDown: Math.ceil(p) - 1,
    };
    const target = targets[event.key];
    if (target === undefined) return;
    event.preventDefault();
    seek(Math.round(target * 1e6) / 1e6);
  }
  const play = moving
    ? p.pause
    : instant
      ? complete
        ? p.toStart
        : p.toEnd
      : complete
        ? p.replay
        : p.play;
  return (
    <section className="lesson-transport" aria-label={p.playback}>
      <div className="transport-caption">
        <strong>{complete ? p.modelComplete : title}</strong>
        <span aria-hidden="true" dir="ltr">
          {completedFolds.toLocaleString(numericLocale)} / {total.toLocaleString(numericLocale)}
        </span>
      </div>
      <input
        ref={range}
        className="lesson-range"
        type="range"
        min="0"
        max={total}
        step="any"
        defaultValue="0"
        dir="ltr"
        aria-label={p.progress}
        aria-valuetext={p.starting}
        disabled={loading}
        onPointerDown={() => command("pause")}
        onInput={(event) => seek(event.currentTarget.valueAsNumber)}
        onKeyDown={rangeKey}
      />
      <div className="transport-actions">
        <button
          type="button"
          tabIndex={0}
          className="fold-button"
          title={p.previousFold}
          aria-label={p.previous}
          disabled={loading}
          aria-disabled={!canPrevious || loading}
          onClick={() => canPrevious && command("previous")}
        >
          <PlayerIcon name="previous" />
          <span>{p.previous}</span>
        </button>
        <button
          type="button"
          tabIndex={0}
          className="fold-button toggle-play"
          disabled={loading}
          title={play}
          aria-label={play}
          onClick={() => command(moving ? "pause" : "play")}
        >
          <PlayerIcon
            name={moving ? "pause" : instant ? (complete ? "reset" : "finish") : "play"}
          />
        </button>
        <button
          type="button"
          tabIndex={0}
          className="fold-button primary-fold"
          aria-label={p.next}
          disabled={loading}
          aria-disabled={!canNext || loading}
          onClick={() => canNext && command("next")}
        >
          <span>{complete ? p.done : p.next}</span>
          <PlayerIcon name="next" />
        </button>
      </div>
    </section>
  );
}
