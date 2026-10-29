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
};
/**
 * Details panel next to a list (master–detail): header with title and actions, scrollable body.
 * Position and width come from the parent layout, e.g. `className="sticky top-6 flex-1"`.
 */
export declare function SidePanel({ title, description, actions, onClose, className, children, ...props }: SidePanelProps): import("react").JSX.Element;
export type SeparatorProps = HTMLAttributes<HTMLDivElement> & {
    orientation?: "horizontal" | "vertical";
};
/** Hairline divider. */
export declare function Separator({ orientation, className, ...props }: SeparatorProps): import("react").JSX.Element;
