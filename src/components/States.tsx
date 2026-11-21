// Feedback placeholders: spinner, skeleton, and loading / error / empty states for React Query results, plus the
// Callout — a short note that stays visible next to the content it explains.
import type {HTMLAttributes, ReactNode} from "react";
import {CircleAlert, Inbox, Info, RotateCw, TriangleAlert} from "lucide-react";
import {cx} from "../cx";
import {friendlyErrorMessage} from "../errors";
import {Button} from "./Button";
import {useKitLang, useKitTexts} from "./KitLang";

export type SpinnerProps = {size?: "sm" | "md" | "lg"; className?: string};

/** Indeterminate spinner: 12 / 16 / 24px. */
export function Spinner({size = "md", className}: SpinnerProps) {
  return <span aria-hidden data-size={size} className={cx("fui-spinner", className)} />;
}

/** Pulsing placeholder block; size it with `className` or `style`. */
export function Skeleton({className, ...props}: HTMLAttributes<HTMLDivElement>) {
  return <div aria-hidden className={cx("fui-skeleton", className)} {...props} />;
}

export type SkeletonRowsProps = {
  /** Number of rows; 5 by default. */
  rows?: number;
  /** Row height in px, the same as the real rows so nothing jumps when data arrives; 36 by default. */
  height?: number;
  /** Width of a block in a leading column, e.g. 40 for a time column; none by default. */
  lead?: number;
  /** Block widths per text line, e.g. `[[120, 180], [240]]` for a two-line row; `[[160]]` by default. */
  lines?: number[][];
  /** Block widths at the right edge, e.g. a badge and the actions. */
  trail?: number[];
  /** Hairlines between rows, as in `<List variant="divided">`; on by default. */
  divided?: boolean;
  /** Screen-reader text; «Загрузка…» / "Loading…" by default. */
  label?: string;
  className?: string;
};

// Line widths shrink a little from row to row, so the placeholder reads as a list rather than a stamp.
const ROW_SHRINK = [1, 0.82, 0.92, 0.7, 0.88];

/** Placeholder rows in the shape of the list that is loading: same height, columns and line count as the real rows. */
export function SkeletonRows({rows = 5, height = 36, lead, lines = [[160]], trail, divided = true, label, className}: SkeletonRowsProps) {
  const t = useKitTexts();
  return (
    <div role="status" data-divided={divided ? "" : undefined} className={cx("fui-skeleton-rows", className)}>
      <span className="fui-visually-hidden">{label ?? t.loading}</span>
      {Array.from({length: rows}, (_, row) => {
        const k = ROW_SHRINK[row % ROW_SHRINK.length];
        return (
          <div key={row} className="fui-skeleton-rows__row" style={{height}}>
            {lead != null && <Skeleton className="fui-skeleton-rows__block" style={{width: lead}} />}
            <div className="fui-skeleton-rows__lines">
              {lines.map((blocks, i) => (
                <div key={i} className="fui-skeleton-rows__line">
                  {blocks.map((w, j) => (
                    <Skeleton key={j} className="fui-skeleton-rows__block" style={{width: Math.round(w * k)}} />
                  ))}
                </div>
              ))}
            </div>
            {trail?.map((w, j) => <Skeleton key={j} className="fui-skeleton-rows__block" style={{width: w}} />)}
          </div>
        );
      })}
    </div>
  );
}

export type LoadingStateProps = {children?: ReactNode; className?: string};

/** Spinner with a caption, «Загрузка…» / "Loading…" by default. */
export function LoadingState({children, className}: LoadingStateProps) {
  const t = useKitTexts();
  return (
    <div role="status" className={cx("fui-state", className)}>
      <Spinner />
      {children ?? t.loading}
    </div>
  );
}

export type ErrorStateProps = {
  error: unknown;
  title?: ReactNode;
  /** Shows a «Повторить» / "Retry" button that calls it, before `action`. */
  onRetry?: () => void;
  /** Spinner on the retry button while the retry runs. */
  retrying?: boolean;
  /** Any extra controls under the message. */
  action?: ReactNode;
  className?: string;
};

/**
 * Error box. For transient failures (Fibery unavailable, rate limit, no connection) it explains them in plain
 * words; the underlying message is always shown too, small and muted under that text: Fibery API errors carry
 * the exact diagnostic needed to report the problem.
 */
export function ErrorState({error, title, onRetry, retrying, action, className}: ErrorStateProps) {
  const lang = useKitLang();
  const t = useKitTexts();
  const message = error instanceof Error ? error.message : String(error);
  const friendly = friendlyErrorMessage(error, lang);
  return (
    <div role="alert" className={cx("fui-error", className)}>
      <CircleAlert />
      <div className="fui-error__body">
        <strong className="fui-error__title">{title ?? t.loadFailed}</strong>
        {friendly && <span className="fui-error__text">{friendly}</span>}
        <span className="fui-error__message" data-muted={friendly ? "" : undefined}>
          {message}
        </span>
        {(onRetry || action) && (
          <div className="fui-error__action">
            {onRetry && (
              <Button variant="outline" size="sm" icon={<RotateCw />} loading={retrying} onClick={onRetry}>
                {t.retry}
              </Button>
            )}
            {action}
          </div>
        )}
      </div>
    </div>
  );
}

export type EmptyStateProps = {
  title: ReactNode;
  description?: ReactNode;
  /** Lucide icon element; an inbox by default. */
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
};

/** Centered placeholder for an empty list or view. */
export function EmptyState({title, description, icon = <Inbox />, action, className}: EmptyStateProps) {
  return (
    <div className={cx("fui-empty", className)}>
      <span className="fui-empty__icon">{icon}</span>
      <strong className="fui-empty__title">{title}</strong>
      {description && <p className="fui-empty__description">{description}</p>}
      {action && <div className="fui-empty__action">{action}</div>}
    </div>
  );
}

export type CalloutProps = {
  /** `"info"` — blue (default); `"warning"` — yellow; `"error"` — red, a problem that blocks the action (e.g. a form
   *  error not tied to one field); `"neutral"` — grey; `"plain"` — no fill, a thin ring and muted text: the quietest
   *  note, for a rule that applies to several fields at once. */
  tone?: "info" | "warning" | "error" | "neutral" | "plain";
  /** Replaces the tone's default icon; `null` hides it. */
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
};

const CALLOUT_ICONS = {info: <Info />, warning: <TriangleAlert />, error: <CircleAlert />, neutral: <Info />, plain: <Info />};

/** Always-visible note in the workspace highlight palette, e.g. how a form behaves. */
export function Callout({tone = "info", icon, children, className}: CalloutProps) {
  const shown = icon === undefined ? CALLOUT_ICONS[tone] : icon;
  return (
    <div data-tone={tone} className={cx("fui-callout", className)}>
      {shown && <span className="fui-callout__icon">{shown}</span>}
      <div className="fui-callout__text">{children}</div>
    </div>
  );
}

export type RefreshWarningProps = {
  error: unknown;
  onRetry: () => void;
  /** Spinner on the retry button while the refetch runs. */
  retrying?: boolean;
  /** Lead text; default «Не удалось обновить данные.» / "Couldn't refresh data." */
  title?: ReactNode;
  className?: string;
};

/**
 * Compact warning above a screen whose background refetch failed. The data already on screen stays usable (it may
 * only be stale), so a full-screen ErrorState would hide it for nothing; ErrorState is for screens with no data yet.
 * Shows the plain-words reason, a retry button, and the raw message (clamped: a gateway error may carry a whole page).
 */
export function RefreshWarning({error, onRetry, retrying, title, className}: RefreshWarningProps) {
  const lang = useKitLang();
  const t = useKitTexts();
  const message = error instanceof Error ? error.message : String(error);
  const friendly = friendlyErrorMessage(error, lang);
  return (
    <Callout tone="warning" className={cx("fui-refresh-warning", className)}>
      <div className="fui-refresh-warning__row">
        <span>
          {title ?? t.refreshFailed}
          {friendly && ` ${friendly}`}
        </span>
        <Button variant="outline" size="sm" icon={<RotateCw />} loading={retrying} onClick={onRetry}>
          {t.retry}
        </Button>
      </div>
      <div className="fui-refresh-warning__message" title={message}>
        {message}
      </div>
    </Callout>
  );
}
