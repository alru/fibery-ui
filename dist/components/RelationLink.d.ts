import { type AnchorHTMLAttributes } from "react";
export type RelationLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
    /** Arrow size to match the text: `"md"` (default) 14px after 14px text, `"sm"` 12px after 13px text and smaller. */
    size?: "sm" | "md";
    /**
     * Renders the single child (a router's link element) with the name wrapper, the arrow and the styles merged in,
     * instead of an `<a>`. The child's own children are the name.
     */
    asChild?: boolean;
};
/**
 * A link to a related record: the name, then a muted arrow on the line of its last word. The name wraps (never "…")
 * and alone gets the hover underline; the color is inherited, so it reads in a muted line too. Anything that stands
 * before the name (a person's avatar) goes outside the link.
 */
export declare const RelationLink: import("react").ForwardRefExoticComponent<AnchorHTMLAttributes<HTMLAnchorElement> & {
    /** Arrow size to match the text: `"md"` (default) 14px after 14px text, `"sm"` 12px after 13px text and smaller. */
    size?: "sm" | "md";
    /**
     * Renders the single child (a router's link element) with the name wrapper, the arrow and the styles merged in,
     * instead of an `<a>`. The child's own children are the name.
     */
    asChild?: boolean;
} & import("react").RefAttributes<HTMLAnchorElement>>;
