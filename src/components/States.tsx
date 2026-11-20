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
