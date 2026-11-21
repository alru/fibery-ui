import { type HTMLAttributes, type LiHTMLAttributes, type ReactNode } from "react";
import type { Hue } from "../colors";
import { type IconButtonProps } from "./Button";
export type AvatarProps = {
    /** Used for initials and as the image alt text. */
    name: string;
    /** Image URL, e.g. `makeFileUrl(secret)` of a Fibery avatar. */
    src?: string;
    size?: "sm" | "md" | "lg";
    /** Initials on a highlight hue, e.g. `hueFor(user.id)`, so people are told apart at a glance; neutral by default. */
    hue?: Hue;
    className?: string;
};
/** Round avatar, 20 / 24 / 32px; falls back to initials. */
export declare function Avatar({ name, src, size, hue, className }: AvatarProps): import("react").JSX.Element;
export type CardProps = HTMLAttributes<HTMLDivElement> & {
    /** Adds hover elevation and pointer cursor; pair with `onClick`. */
    interactive?: boolean;
};
/** Surface with Fibery's card ring and soft shadow, radius 8px. */
export declare const Card: import("react").ForwardRefExoticComponent<HTMLAttributes<HTMLDivElement> & {
    /** Adds hover elevation and pointer cursor; pair with `onClick`. */
    interactive?: boolean;
} & import("react").RefAttributes<HTMLDivElement>>;
export type CardHeaderProps = Omit<HTMLAttributes<HTMLDivElement>, "title"> & {
    title: ReactNode;
    description?: ReactNode;
    /** Right-aligned controls, e.g. an IconButton with a menu. */
    actions?: ReactNode;
};
/** Card title row with optional description and actions. */
export declare function CardHeader({ title, description, actions, className, ...props }: CardHeaderProps): import("react").JSX.Element;
/** Padded card body. */
export declare function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>): import("react").JSX.Element;
export type ListProps = HTMLAttributes<HTMLUListElement> & {
    /**
     * `"default"` — Fibery relation rows: ringed boxes with a 4px gap. `"divided"` — a worklist: rows edge to edge
     * with a hairline between them, no rings, 13px text; for long lists that are scanned and worked through.
     */
    variant?: "default" | "divided";
};
/** Vertical stack of ListItem rows. */
export declare const List: import("react").ForwardRefExoticComponent<HTMLAttributes<HTMLUListElement> & {
    /**
     * `"default"` — Fibery relation rows: ringed boxes with a 4px gap. `"divided"` — a worklist: rows edge to edge
     * with a hairline between them, no rings, 13px text; for long lists that are scanned and worked through.
     */
    variant?: "default" | "divided";
} & import("react").RefAttributes<HTMLUListElement>>;
export type ListItemProps = Omit<LiHTMLAttributes<HTMLLIElement>, "onClick"> & {
    /** Icon, avatar or badge before the text. */
    leading?: ReactNode;
    /** Muted content at the right edge: counts, dates, badges. */
    trailing?: ReactNode;
    /** Makes the row focusable and clickable (Enter / Space too), e.g. to `openEntity`. */
    onClick?: () => void;
    /** Lets the content wrap onto several lines and top-aligns leading/trailing, for rows with nested lists. */
    multiline?: boolean;
    /** Accent-tinted state for the row whose details are open, e.g. in a SidePanel. */
    selected?: boolean;
    /**
     * Row verbs at the right edge, usually RowActions and a "⋯" menu. The first is the main verb and always shows;
     * the others show on hover, focus inside the row, while selected and on touch screens, and keep their place
     * otherwise. Clicks and keys inside never reach the row's `onClick`.
     */
    actions?: ReactNode[];
    /** Slots (28px each) the actions column reserves, so rows with fewer verbs keep the column at one width. */
    actionSlots?: number;
    /** Shows every action all the time, e.g. in a short list where each row matters. */
    actionsVisible?: boolean;
    /** The row's action is being saved: a spinner in place of the first action, the others disabled. */
    busy?: boolean;
};
/**
 * Row in the style of Fibery relation lists: ringed, radius 6px, single-line text with ellipsis; inside
 * `<List variant="divided">`, a flat worklist row.
 */
export declare const ListItem: import("react").ForwardRefExoticComponent<Omit<LiHTMLAttributes<HTMLLIElement>, "onClick"> & {
    /** Icon, avatar or badge before the text. */
    leading?: ReactNode;
    /** Muted content at the right edge: counts, dates, badges. */
    trailing?: ReactNode;
    /** Makes the row focusable and clickable (Enter / Space too), e.g. to `openEntity`. */
    onClick?: () => void;
    /** Lets the content wrap onto several lines and top-aligns leading/trailing, for rows with nested lists. */
    multiline?: boolean;
    /** Accent-tinted state for the row whose details are open, e.g. in a SidePanel. */
    selected?: boolean;
    /**
     * Row verbs at the right edge, usually RowActions and a "⋯" menu. The first is the main verb and always shows;
     * the others show on hover, focus inside the row, while selected and on touch screens, and keep their place
     * otherwise. Clicks and keys inside never reach the row's `onClick`.
     */
    actions?: ReactNode[];
    /** Slots (28px each) the actions column reserves, so rows with fewer verbs keep the column at one width. */
    actionSlots?: number;
    /** Shows every action all the time, e.g. in a short list where each row matters. */
    actionsVisible?: boolean;
    /** The row's action is being saved: a spinner in place of the first action, the others disabled. */
    busy?: boolean;
} & import("react").RefAttributes<HTMLLIElement>>;
export type RowActionProps = Omit<IconButtonProps, "aria-label" | "size" | "variant"> & {
    /** The verb, e.g. "Done": the tooltip and the accessible name. */
    label: string;
};
/**
 * Icon-only verb for a ListItem's `actions`: a small ghost IconButton with a tooltip. Also works as a menu trigger
 * (`<DropdownMenuTrigger asChild><RowAction … /></DropdownMenuTrigger>`).
 */
export declare const RowAction: import("react").ForwardRefExoticComponent<Omit<IconButtonProps, "aria-label" | "size" | "variant"> & {
    /** The verb, e.g. "Done": the tooltip and the accessible name. */
    label: string;
} & import("react").RefAttributes<HTMLButtonElement>>;
export type PropertyListProps = HTMLAttributes<HTMLDListElement> & {
    /** Leaves out the properties without a value (see Property `empty`); pair with PropertyAdd to fill one in. */
    hideEmpty?: boolean;
};
/** Two-column label/value grid, like the field list on a Fibery entity page. */
export declare const PropertyList: import("react").ForwardRefExoticComponent<HTMLAttributes<HTMLDListElement> & {
    /** Leaves out the properties without a value (see Property `empty`); pair with PropertyAdd to fill one in. */
    hideEmpty?: boolean;
} & import("react").RefAttributes<HTMLDListElement>>;
export type PropertyProps = {
    label: ReactNode;
    /** Lucide icon shown before the label, e.g. `<Mail />` for an email field. */
    icon?: ReactNode;
    /**
     * The value is empty, so a `hideEmpty` list leaves the row out. By default: children are null, false or "".
     * Set it when the value is a component, e.g. `empty={deal.closeDate == null}` around an InlineDate.
     */
    empty?: boolean;
    children: ReactNode;
};
/** One row of a PropertyList. */
export declare function Property({ label, icon, empty, children }: PropertyProps): import("react").JSX.Element | null;
export type PropertyAddProps = {
    /** The empty fields a `hideEmpty` list left out. Nothing renders while there are none. */
    fields: {
        id: string;
        label: ReactNode;
        icon?: ReactNode;
    }[];
    /** The user picked a field: show its row, usually with its editor open (`startEditing` of an Inline* control). */
    onAdd: (id: string) => void;
    /** Button text after the plus; «Поле» / "Field" by default. */
    label?: ReactNode;
    className?: string;
};
/** «+ Поле» / "+ Field" button with a menu of the empty fields, e.g. in a PropertyGroup's `actions`. */
export declare function PropertyAdd({ fields, onAdd, label, className }: PropertyAddProps): import("react").JSX.Element | null;
export type PropertyGroupProps = {
    title: ReactNode;
    /** Lucide icon before the title: the anchor the eye finds when scanning a long card. */
    icon?: ReactNode;
    actions?: ReactNode;
    /** A PropertyList (rows get denser inside a group), form fields or any other content. */
    children: ReactNode;
    /** Adds a chevron at the right end of the header; the whole header then toggles the content. */
    collapsible?: boolean;
    /** Controlled open state of a collapsible group, e.g. from `usePersistentState` to keep it across cards. */
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    /** Initial state when uncontrolled. Default true. */
    defaultOpen?: boolean;
    className?: string;
};
/**
 * Titled block of a details card ("Работа", "Контакты"): a bold title with an icon, a hairline above every group but
 * the first, and denser property rows with smaller muted labels, so groups read apart at a glance. With
 * `collapsible`, the header becomes a toggle with a chevron on the right.
 */
export declare function PropertyGroup({ title, icon, actions, children, collapsible, open: openProp, onOpenChange, defaultOpen, className, }: PropertyGroupProps): import("react").JSX.Element;
