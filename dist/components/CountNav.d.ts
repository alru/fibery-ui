import { type ReactNode } from "react";
import type { Hue } from "../colors";
export type CountNavItem = {
    /** Section id: CountNav scrolls to the element with this DOM id (e.g. a SectionHeader's `id`). */
    id: string;
    /** Short name; it hides on narrow containers and stays in the anchor's title and accessible name. */
    label: string;
    /** Lucide icon of the section. */
    icon: ReactNode;
    count: number;
    /** Icon hue while the count is above 0, the section's code (e.g. red for overdue); neutral at 0. */
    hue?: Hue;
};
export type CountNavProps = {
    items: CountNavItem[];
    /** Called on click before scrolling, e.g. to expand the section. */
    onSelect?: (id: string) => void;
    /** Scrolls to the section and flashes its header after `onSelect`; on by default. */
    scroll?: boolean;
    /** «Разделы» / "Sections" by default. */
    "aria-label"?: string;
    /**
     * What the sticky row sits on, so its band matches the page: `"background"` (default, white) or `"muted"` (a grey
     * desk; the anchors' frame turns card-white).
     */
    surface?: "background" | "muted";
    className?: string;
};
/**
 * Sticky row of section anchors "icon · name · count" in one segmented frame. Each anchor keeps one width whatever
 * its count (room for "999", tabular digits); a zero count turns muted and its icon neutral. Below 700px of
 * container width only icons and counts remain.
 */
export declare function CountNav({ items, onSelect, scroll, surface, className, ...props }: CountNavProps): import("react").JSX.Element;
