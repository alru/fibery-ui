import { type AnchorHTMLAttributes, type ReactNode } from "react";
export type RelationLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
    /** Icon of the linked record's kind, e.g. `<Building2 />`: the same icon the app uses for that kind's section. */
    icon: ReactNode;
    /** Icon size to match the text: `"md"` (default) 14px for 14px text, `"sm"` 12px for 13px text and smaller. */
    size?: "sm" | "md";
    /**
     * Renders the single child (a router's link element) with the icon, the name wrapper and the styles merged in,
     * instead of an `<a>`. The child's own children are the name.
     */
    asChild?: boolean;
};
/**
 * A link to a related record: a muted kind icon, then the name, which wraps (never "…") and alone gets the hover
 * underline. The icon stands on the name's first line. Color is inherited, so it reads in a muted line too.
 */
export declare const RelationLink: import("react").ForwardRefExoticComponent<AnchorHTMLAttributes<HTMLAnchorElement> & {
    /** Icon of the linked record's kind, e.g. `<Building2 />`: the same icon the app uses for that kind's section. */
    icon: ReactNode;
    /** Icon size to match the text: `"md"` (default) 14px for 14px text, `"sm"` 12px for 13px text and smaller. */
    size?: "sm" | "md";
    /**
     * Renders the single child (a router's link element) with the icon, the name wrapper and the styles merged in,
     * instead of an `<a>`. The child's own children are the name.
     */
    asChild?: boolean;
} & import("react").RefAttributes<HTMLAnchorElement>>;
