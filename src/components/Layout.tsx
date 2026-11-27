// Page-level structure: the page's content column, page title row, section headers (also collapsible, with a "show
// all" row under a cut list), separators (also the "now" line), a details side panel and the list + panel layout,
// sized like Fibery entity pages.
import type {HTMLAttributes, KeyboardEvent, ReactNode} from "react";
import {ChevronRight, X} from "lucide-react";
import {cx} from "../cx";
import type {Hue} from "../colors";
import {Button, IconButton} from "./Button";
import {useKitTexts} from "./KitLang";

export type PageProps = HTMLAttributes<HTMLDivElement> & {
  /** `"default"` — a column up to 1440px, centered; `"wide"` — the full width (e.g. a board that needs every pixel). */
  width?: "default" | "wide";
};

/**
 * The content column of an app page: centered up to 1440px with 24px sides (16px below 720px), so rows and tables
 * don't stretch across a 1600px screen. It is a size container: container-query classes inside
 * (`@max-[720px]:…`) answer to the column's width, not the window's. Put the page background (e.g. `bg-muted`) on the
 * element around it.
 */
export function Page({width = "default", className, children, ...props}: PageProps) {
  return (
    <div data-width={width === "wide" ? "wide" : undefined} className={cx("fui-page", className)} {...props}>
      <div className="fui-page__body">{children}</div>
    </div>
  );
}

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
  /**
   * `"muted"` (default) — a quiet label above a relation list, as on Fibery entity pages. `"strong"` — a 600-weight
   * title in the text color, for screens made of several lists (a worklist's sections).
   */
  tone?: "muted" | "strong";
  /** Puts the icon on a 20px plate of this highlight hue, like a database icon in Fibery's sidebar: the section's code. */
  iconHue?: Hue;
  /** Chevron before the title; the title becomes a toggle. Controlled: render the content while `open`. */
  collapsible?: boolean;
  /** Open state of a collapsible header; open when omitted. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Anchor for CountNav and links; the header keeps clear of a sticky bar above when scrolled to. */
  id?: string;
  /** `id` of the content a collapsible header shows and hides. */
  "aria-controls"?: string;
  className?: string;
};

/**
 * Section label above a list: muted like "Skills" on a Fibery entity page, or strong with a hued icon plate and a
 * collapse chevron for the sections of a worklist.
 */
export function SectionHeader({
  title,
  icon,
  count,
  actions,
  tone = "muted",
  iconHue,
  collapsible,
  open = true,
  onOpenChange,
  id,
  "aria-controls": controls,
  className,
}: SectionHeaderProps) {
  const heading = (
    <>
      {icon && iconHue ? (
        <span className="fui-section-header__plate" data-hue={iconHue}>
          {icon}
        </span>
      ) : (
        icon
      )}
      {title}
      {count != null && <span className="fui-section-header__count">{count}</span>}
    </>
  );
  return (
    <div id={id} data-tone={tone} className={cx("fui-section-header", className)}>
      <h2 className="fui-section-header__title">
        {collapsible ? (
          <button
            type="button"
            className="fui-section-header__toggle"
            aria-expanded={open}
            aria-controls={controls}
            onClick={() => onOpenChange?.(!open)}
          >
            <ChevronRight className="fui-section-header__chevron" aria-hidden />
            {heading}
          </button>
        ) : (
          heading
        )}
      </h2>
      {actions && <div className="fui-section-header__actions">{actions}</div>}
    </div>
  );
}

export type ShowMoreProps = {
  /** Rows on screen. */
  shown: number;
  /** Rows in all. Nothing renders once everything is shown. */
  total: number;
  onShowAll: () => void;
  className?: string;
};

/**
 * Row under a list cut short: «Показано 15 из 37» / "Showing 15 of 37" (fixed width, tabular digits) and
 * «Показать все» / "Show all".
 */
export function ShowMore({shown, total, onShowAll, className}: ShowMoreProps) {
  const t = useKitTexts();
  if (shown >= total) return null;
  return (
    <div className={cx("fui-show-more", className)}>
      <span className="fui-show-more__count">{t.shownOf(shown, total)}</span>
      <Button variant="ghost" size="sm" onClick={onShowAll}>
        {t.showAll}
      </Button>
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
  const t = useKitTexts();
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
          {onClose && <IconButton icon={<X />} aria-label={t.close} size="sm" onClick={onClose} />}
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
  /**
   * A vertical line between the list and the open panel, the full height of the layout (side by side only). For
   * content that runs on under the panel, e.g. a board scrolling sideways, so its cut edge reads as a border.
   */
  divider?: boolean;
  className?: string;
};

/**
 * List + details panel. Wide (≥ 1024px): side by side, the panel's own classes set its width and stickiness.
 * Narrow: both don't fit, so the panel floats over the list on the right and the list stays behind a veil;
 * clicking the veil calls `onDismiss`.
 */
export function PanelLayout({children, panel, onDismiss, divider, className}: PanelLayoutProps) {
  return (
    <div className={cx("fui-panel-layout", className)} data-open={panel ? "" : undefined}>
      <div className="fui-panel-layout__main">{children}</div>
      {panel && (
        <>
          {divider && <div className="fui-panel-layout__divider" aria-hidden />}
          <div className="fui-panel-layout__veil" aria-hidden onClick={onDismiss} />
          <div className="fui-panel-layout__panel">{panel}</div>
        </>
      )}
    </div>
  );
}

export type SeparatorProps = HTMLAttributes<HTMLElement> & {
  orientation?: "horizontal" | "vertical";
  /** Caption before a horizontal line, e.g. "На английском": splits one block into named parts. */
  label?: ReactNode;
  /** `"alert"` — a red line and caption, e.g. «сейчас 11:42» between past and coming rows of a time-ordered list. */
  tone?: "default" | "alert";
  /** `"li"` to stand between the rows of a List. */
  as?: "div" | "li";
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

/** Hairline divider; with `label`, a captioned one ("На английском ————"); `tone="alert"` makes it the "now" line. */
export function Separator({orientation = "horizontal", label, tone = "default", as: Tag = "div", className, ...props}: SeparatorProps) {
  const tint = tone === "alert" ? "alert" : undefined;
  if (label != null) {
    return (
      <Tag data-tone={tint} className={cx("fui-separator-labeled", className)} {...props}>
        <span className="fui-separator-labeled__text">{label}</span>
        <div role="separator" aria-orientation="horizontal" data-orientation="horizontal" className="fui-separator" />
      </Tag>
    );
  }
  return (
    <Tag
      role="separator"
      aria-orientation={orientation}
      data-orientation={orientation}
      data-tone={tint}
      className={cx("fui-separator", className)}
      {...props}
    />
  );
}
