// Bar of actions on the rows selected in a list or table: how many are selected, what to do with them, and the
// progress of a bulk write. Sticks to the bottom of the scrolling area, so it stays at hand in a long list.
import {useLayoutEffect, useRef, type ReactNode} from "react";
import {X} from "lucide-react";
import {cx} from "../cx";
import {Button} from "./Button";
import {useKitTexts} from "./KitLang";

// Heights of the open bars; the tallest lifts the toasts (overlay.css, `--fui-toasts-offset`) by itself plus a gap.
const openBars = new Map<HTMLElement, number>();
const liftToasts = () => {
  const tallest = Math.max(0, ...openBars.values());
  const root = document.documentElement.style;
  if (tallest) root.setProperty("--fui-toasts-offset", `${tallest + 12}px`);
  else root.removeProperty("--fui-toasts-offset");
};

export type SelectionBarProps = {
  /** Number of selected rows. */
  count: number;
  /** Buttons for the selected rows, e.g. "Change owner"; all disabled together while `busy` or `progress`. */
  actions: ReactNode;
  /** Clears the selection. */
  onClear: () => void;
  /** A bulk write is running: «Записано 40 из 131» / "Saving 40 of 131" and a bar in place of the actions. */
  progress?: {done: number; total: number};
  /** Disables the actions and Clear, e.g. while an action's dialog is open. */
  busy?: boolean;
  className?: string;
};

/**
 * Sticky bar at the bottom of a list with selected rows: «Выбрано: N» / "N selected", the actions, «Снять выбор» /
 * "Clear". Render it while something is selected; toasts move up above it while it is open. The count and the
 * progress have fixed widths with tabular digits, so nothing moves while they change.
 */
export function SelectionBar({count, actions, onClear, progress, busy, className}: SelectionBarProps) {
  const t = useKitTexts();
  const locked = busy || progress != null;
  const ref = useRef<HTMLDivElement>(null);
  // Measured, not assumed: the bar wraps to two lines in a narrow window.
  useLayoutEffect(() => {
    const bar = ref.current;
    if (!bar) return;
    const observer = new ResizeObserver(() => {
      openBars.set(bar, bar.offsetHeight);
      liftToasts();
    });
    observer.observe(bar);
    return () => {
      observer.disconnect();
      openBars.delete(bar);
      liftToasts();
    };
  }, []);
  return (
    <div ref={ref} role="group" aria-label={t.selectionActions} className={cx("fui-selection-bar", className)}>
      <span className="fui-selection-bar__count" aria-live="polite">
        {t.selected(count)}
      </span>
      {progress ? (
        <div className="fui-selection-bar__progress">
          <span className="fui-selection-bar__progress-label">{t.progress(progress.done, progress.total)}</span>
          <div
            className="fui-progress"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={progress.total}
            aria-valuenow={progress.done}
          >
            <div className="fui-progress__bar" style={{width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%`}} />
          </div>
        </div>
      ) : (
        // A disabled fieldset disables every button inside, whatever the app put there.
        <fieldset className="fui-selection-bar__actions" disabled={locked}>
          {actions}
        </fieldset>
      )}
      <Button variant="ghost" size="sm" icon={<X />} className="fui-selection-bar__clear" disabled={locked} onClick={onClear}>
        {t.clearSelection}
      </Button>
    </div>
  );
}
