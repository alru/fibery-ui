import type { ReactNode, TableHTMLAttributes, ThHTMLAttributes } from "react";
export type TableProps = TableHTMLAttributes<HTMLTableElement> & {
    /** Accent ring and tinted header, like SidePanel's: makes an explicit edit mode obvious. */
    editing?: boolean;
    /** The ring alone, without the soft shadow: a sheet on a grey page, like `Card variant="flat"`. */
    flat?: boolean;
    /** `"tinted"` — the header row on `--muted`, set apart from the rows like a ledger's head. */
    header?: "plain" | "tinted";
    /**
     * The header row sticks to the top of the scrolling page while the rows pass under it; a number is the offset in
     * px, e.g. 48 under the app's own sticky 48px bar. The table then never scrolls sideways (a sideways scroll box
     * would keep the header from sticking): fit the columns to the width, e.g. with `responsive`.
     */
    stickyHeader?: boolean | number;
    /** `"top"` — body cells align to their first line, for rows with a second line (a company and its products). */
    valign?: "middle" | "top";
    /** `"comfortable"` — 10px row padding and 16px at the outer edges, for working tables read all day. */
    density?: "compact" | "comfortable";
    /**
     * The table answers to its own width (it becomes a size container): below 720px, cells with `data-narrow-hide`
     * drop out and elements with `data-narrow-only` show, e.g. the hidden values gathered as a second line under the
     * row's anchor. Hide columns at other widths with container-query classes on the cells (`@max-[1100px]:hidden`).
     * Put `data-narrow-only` on a plain wrapper: an app `display` class on the same element would win over the kit's.
     */
    responsive?: boolean;
};
/** Table on a card-like surface; scrolls horizontally when wider than its container (unless the header sticks). */
export declare function Table({ editing, flat, header, stickyHeader, valign, density, responsive, className, ...props }: TableProps): import("react").JSX.Element;
export type SortHeaderProps = Omit<ThHTMLAttributes<HTMLTableCellElement>, "onClick"> & {
    /** The rows are sorted by this column: the arrow shows and `aria-sort` is set. */
    active: boolean;
    /** Direction of the active sort. */
    dir: "asc" | "desc";
    /** Click on the header; the app picks the next sort (usually: the same column flips, another one starts). */
    onSort: () => void;
};
/**
 * Sortable header cell: renders the `<th>` itself (so it carries `aria-sort`) with a button across the whole cell.
 * The arrow (↑ / ↓, 12px) follows the text only on the active column; the others keep its place, so headers never
 * shift when the sort changes.
 */
export declare function SortHeader({ active, dir, onSort, className, children, ...props }: SortHeaderProps): import("react").JSX.Element;
export type TableGroupRowProps = {
    label: ReactNode;
    /** Columns the label spans when the row has no cells of its own. */
    colSpan?: number;
    /** 1 — top-level group (tinted, bold); 2 — subgroup inside it (lighter). */
    level?: 1 | 2;
    /** Cells after the label (`<td>`s), e.g. group totals aligned with the columns below. */
    children?: ReactNode;
};
/** Caption row that starts a group of body rows, e.g. a category; may carry its own totals. */
export declare function TableGroupRow({ label, colSpan, level, children }: TableGroupRowProps): import("react").JSX.Element;
