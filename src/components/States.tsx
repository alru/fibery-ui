// Feedback placeholders: spinner, skeleton, and loading / error / empty states for React Query results, plus the
// Callout — a short note that stays visible next to the content it explains.
import type {HTMLAttributes, ReactNode} from "react";
import {CircleAlert, Inbox, Info, RotateCw, TriangleAlert} from "lucide-react";
import {cx} from "../cx";
import {friendlyErrorMessage} from "../errors";
import {Button} from "./Button";

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

/** Spinner with a caption, `"Загрузка…"` by default. */
export function LoadingState({children = "Загрузка…", className}: LoadingStateProps) {
  return (
    <div role="status" className={cx("fui-state", className)}>
      <Spinner />
      {children}
    </div>
  );
}

export type ErrorStateProps = {
  error: unknown;
  title?: ReactNode;
  /** Shows a «Повторить» button that calls it, before `action`. */
  onRetry?: () => void;
  /** Spinner on the «Повторить» button while the retry runs. */
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
export function ErrorState({
  error,
  title = "Не удалось загрузить данные",
  onRetry,
  retrying,
  action,
  className,
}: ErrorStateProps) {
  const message = error instanceof Error ? error.message : String(error);
  const friendly = friendlyErrorMessage(error);
  return (
    <div role="alert" className={cx("fui-error", className)}>
      <CircleAlert />
      <div className="fui-error__body">
        <strong className="fui-error__title">{title}</strong>
        {friendly && <span className="fui-error__text">{friendly}</span>}
        <span className="fui-error__message" data-muted={friendly ? "" : undefined}>
          {message}
        </span>
        {(onRetry || action) && (
          <div className="fui-error__action">
            {onRetry && (
              <Button variant="outline" size="sm" icon={<RotateCw />} loading={retrying} onClick={onRetry}>
                Повторить
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
  /** `"info"` — blue (default); `"warning"` — yellow; `"neutral"` — grey. */
  tone?: "info" | "warning" | "neutral";
  /** Replaces the tone's default icon; `null` hides it. */
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
};

const CALLOUT_ICONS = {info: <Info />, warning: <TriangleAlert />, neutral: <Info />};

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
