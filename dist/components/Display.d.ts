import { type HTMLAttributes, type LiHTMLAttributes, type ReactNode } from "react";
export type AvatarProps = {
    /** Used for initials and as the image alt text. */
    name: string;
    /** Image URL, e.g. `makeFileUrl(secret)` of a Fibery avatar. */
    src?: string;
    size?: "sm" | "md" | "lg";
    className?: string;
};
/** Round avatar, 20 / 24 / 32px; falls back to initials. */
export declare function Avatar({ name, src, size, className }: AvatarProps): import("react").JSX.Element;
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
/** Vertical stack of ListItem rows. */
export declare const List: import("react").ForwardRefExoticComponent<HTMLAttributes<HTMLUListElement> & import("react").RefAttributes<HTMLUListElement>>;
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
};
/** Row in the style of Fibery relation lists: ringed, radius 6px, single-line text with ellipsis. */
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
} & import("react").RefAttributes<HTMLLIElement>>;
/** Two-column label/value grid, like the field list on a Fibery entity page. */
export declare const PropertyList: import("react").ForwardRefExoticComponent<HTMLAttributes<HTMLDListElement> & import("react").RefAttributes<HTMLDListElement>>;
export type PropertyProps = {
    label: ReactNode;
    /** Lucide icon shown before the label, e.g. `<Mail />` for an email field. */
    icon?: ReactNode;
    children: ReactNode;
};
/** One row of a PropertyList. */
export declare function Property({ label, icon, children }: PropertyProps): import("react").JSX.Element;
export type PropertyGroupProps = {
    title: ReactNode;
    /** Lucide icon before the title: the anchor the eye finds when scanning a long card. */
    icon?: ReactNode;
    actions?: ReactNode;
    /** A PropertyList (rows get denser inside a group), form fields or any other content. */
    children: ReactNode;
    className?: string;
};
/**
 * Titled block of a details card ("Работа", "Контакты"): a bold title with an icon, a hairline above every group but
 * the first, and denser property rows with smaller muted labels, so groups read apart at a glance.
 */
export declare function PropertyGroup({ title, icon, actions, children, className }: PropertyGroupProps): import("react").JSX.Element;
