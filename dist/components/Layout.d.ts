import type { HTMLAttributes, ReactNode } from "react";
import type { Hue } from "../colors";
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
export declare function Page({ width, className, children, ...props }: PageProps): import("react").JSX.Element;
export type PageHeaderProps = {
    title: ReactNode;
    description?: ReactNode;
    /** Small line above the title, e.g. a type Badge. */
    eyebrow?: ReactNode;
    actions?: ReactNode;
    className?: string;
};
/** Page title in Fibery's entity-title size (30px / 600) with optional actions on the right. */
export declare function PageHeader({ title, description, eyebrow, actions, className }: PageHeaderProps): import("react").JSX.Element;
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
export declare function SectionHeader({ title, icon, count, actions, tone, iconHue, collapsible, open, onOpenChange, id, "aria-controls": controls, className, }: SectionHeaderProps): import("react").JSX.Element;
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
export declare function ShowMore({ shown, total, onShowAll, className }: ShowMoreProps): import("react").JSX.Element | null;
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
export declare function SidePanel({ title, description, actions, onClose, editing, className, children, ...props }: SidePanelProps): import("react").JSX.Element;
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
export declare function PanelLayout({ children, panel, onDismiss, divider, className }: PanelLayoutProps): import("react").JSX.Element;
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
export declare function Inset({ footer, className, children, ...props }: InsetProps): import("react").JSX.Element;
/** Hairline divider; with `label`, a captioned one ("На английском ————"); `tone="alert"` makes it the "now" line. */
export declare function Separator({ orientation, label, tone, as: Tag, className, ...props }: SeparatorProps): import("react").JSX.Element;
