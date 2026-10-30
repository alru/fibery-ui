import type { HTMLAttributes, ReactNode } from "react";
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
    className?: string;
};
/** Muted section label like "Skills" above a relation list on a Fibery entity page. */
export declare function SectionHeader({ title, icon, count, actions, className }: SectionHeaderProps): import("react").JSX.Element;
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
    className?: string;
};
/**
 * List + details panel. Wide (≥ 1024px): side by side, the panel's own classes set its width and stickiness.
 * Narrow: both don't fit, so the panel floats over the list on the right and the list stays behind a veil;
 * clicking the veil calls `onDismiss`.
 */
export declare function PanelLayout({ children, panel, onDismiss, className }: PanelLayoutProps): import("react").JSX.Element;
export type SeparatorProps = HTMLAttributes<HTMLDivElement> & {
    orientation?: "horizontal" | "vertical";
    /** Caption before a horizontal line, e.g. "На английском": splits one block into named parts. */
    label?: ReactNode;
};
export type InsetProps = HTMLAttributes<HTMLDivElement>;
/** Grey backing that sets one item apart inside a card, e.g. a record's key field together with its description. */
export declare function Inset({ className, ...props }: InsetProps): import("react").JSX.Element;
/** Hairline divider; with `label`, a captioned one ("На английском ————"). */
export declare function Separator({ orientation, label, className, ...props }: SeparatorProps): import("react").JSX.Element;
