// Page-level structure: page title row, section headers, separators and a details side panel,
// sized like Fibery entity pages.
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
};

/**
 * Details panel next to a list (master–detail): header with title and actions, scrollable body.
 * Position and width come from the parent layout, e.g. `className="sticky top-6 flex-1"`.
 */
export function SidePanel({title, description, actions, onClose, className, children, ...props}: SidePanelProps) {
  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === "Escape" && onClose) {
      e.stopPropagation();
      onClose();
    }
  };
  return (
    <aside className={cx("fui-side-panel", className)} onKeyDown={onKeyDown} {...props}>
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

export type SeparatorProps = HTMLAttributes<HTMLDivElement> & {orientation?: "horizontal" | "vertical"};

/** Hairline divider. */
export function Separator({orientation = "horizontal", className, ...props}: SeparatorProps) {
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
