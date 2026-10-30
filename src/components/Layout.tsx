// Page-level structure: page title row, section headers, separators, a details side panel and the list + panel
// layout, sized like Fibery entity pages.
import type {HTMLAttributes, KeyboardEvent, ReactNode} from "react";
import {X} from "lucide-react";
import {cx} from "../cx";
import {IconButton} from "./Button";

export type PageHeaderProps = {
  title: ReactNode;
  description?: ReactNode;
  /** Small line above the title, e.g. a type Badge. */
  eyebrow?: ReactNode;
  actions?: ReactNode;
  className?: string;
};

/** Page title in Fibery's entity-title size (30px / 600) with optional actions on the right. */
export function PageHeader({title, description, eyebrow, actions, className}: PageHeaderProps) {
  return (
    <header className={cx("fui-page-header", className)}>
      <div className="fui-page-header__heading">
        {eyebrow && <div className="fui-page-header__eyebrow">{eyebrow}</div>}
        <h1 className="fui-page-header__title">{title}</h1>
        {description && <p className="fui-page-header__description">{description}</p>}
      </div>
      {actions && <div className="fui-page-header__actions">{actions}</div>}
    </header>
  );
}

export type SectionHeaderProps = {
  title: ReactNode;
  icon?: ReactNode;
  /** Number shown next to the title, e.g. the size of a collection. */
  count?: number;
  actions?: ReactNode;
  className?: string;
};

/** Muted section label like "Skills" above a relation list on a Fibery entity page. */
export function SectionHeader({title, icon, count, actions, className}: SectionHeaderProps) {
  return (
    <div className={cx("fui-section-header", className)}>
      <h2 className="fui-section-header__title">
        {icon}
        {title}
        {count != null && <span className="fui-section-header__count">{count}</span>}
      </h2>
      {actions && <div className="fui-section-header__actions">{actions}</div>}
    </div>
  );
}

export type SidePanelProps = Omit<HTMLAttributes<HTMLElement>, "title"> & {
  title: ReactNode;
  description?: ReactNode;
  /** Buttons in the header, left of the close button. */
  actions?: ReactNode;
  /** Shows a close (×) button and closes on Escape while focus is inside the panel. */
  onClose?: () => void;
  /** Accent ring and tinted header: makes an explicit edit mode obvious, so nothing is changed by accident. */
  editing?: boolean;
};

/**
 * Details panel next to a list (master–detail): header with title and actions, scrollable body.
 * Position and width come from the parent layout, e.g. `className="sticky top-6 flex-1"`.
 */
export function SidePanel({title, description, actions, onClose, editing, className, children, ...props}: SidePanelProps) {
  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === "Escape" && onClose) {
      e.stopPropagation();
      onClose();
    }
  };
  return (
    <aside
      data-editing={editing ? "" : undefined}
      className={cx("fui-side-panel", className)}
      onKeyDown={onKeyDown}
      {...props}
    >
      <header className="fui-side-panel__header">
        <div className="fui-side-panel__heading">
          <h2 className="fui-side-panel__title">{title}</h2>
          {description && <p className="fui-side-panel__description">{description}</p>}
        </div>
        <div className="fui-side-panel__actions">
          {actions}
          {onClose && <IconButton icon={<X />} aria-label="Закрыть" size="sm" onClick={onClose} />}
        </div>
      </header>
      <div className="fui-side-panel__body">{children}</div>
    </aside>
  );
}

export type PanelLayoutProps = {
  /** The list or table. */
  children: ReactNode;
  /** The open details panel (usually a SidePanel); nothing while closed. */
  panel?: ReactNode;
  /** Click on the veil over the list on narrow screens, usually the panel's close. */
  onDismiss?: () => void;
  className?: string;
};

/**
 * List + details panel. Wide (≥ 1024px): side by side, the panel's own classes set its width and stickiness.
 * Narrow: both don't fit, so the panel floats over the list on the right and the list stays behind a veil;
 * clicking the veil calls `onDismiss`.
 */
export function PanelLayout({children, panel, onDismiss, className}: PanelLayoutProps) {
  return (
    <div className={cx("fui-panel-layout", className)} data-open={panel ? "" : undefined}>
      <div className="fui-panel-layout__main">{children}</div>
      {panel && (
        <>
          <div className="fui-panel-layout__veil" aria-hidden onClick={onDismiss} />
          <div className="fui-panel-layout__panel">{panel}</div>
        </>
      )}
    </div>
  );
}

export type SeparatorProps = HTMLAttributes<HTMLDivElement> & {
  orientation?: "horizontal" | "vertical";
  /** Caption before a horizontal line, e.g. "На английском": splits one block into named parts. */
  label?: ReactNode;
};

export type InsetProps = HTMLAttributes<HTMLDivElement> & {
  /** Strip under a hairline at the bottom, for small marks that belong to the item, e.g. link states as badges. */
  footer?: ReactNode;
};

/** Raised block that sets one item apart inside a card, e.g. a record's key field together with its description. */
export function Inset({footer, className, children, ...props}: InsetProps) {
  return (
    <div className={cx("fui-inset", className)} {...props}>
      {children}
      {footer != null && footer !== false && <div className="fui-inset__footer">{footer}</div>}
    </div>
  );
}

/** Hairline divider; with `label`, a captioned one ("На английском ————"). */
export function Separator({orientation = "horizontal", label, className, ...props}: SeparatorProps) {
  if (label != null) {
    return (
      <div className={cx("fui-separator-labeled", className)} {...props}>
        <span className="fui-separator-labeled__text">{label}</span>
        <div role="separator" aria-orientation="horizontal" data-orientation="horizontal" className="fui-separator" />
      </div>
    );
  }
  return (
    <div
      role="separator"
      aria-orientation={orientation}
      data-orientation={orientation}
      className={cx("fui-separator", className)}
      {...props}
    />
  );
}
