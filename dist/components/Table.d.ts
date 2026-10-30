import type { ReactNode, TableHTMLAttributes } from "react";
export type TableProps = TableHTMLAttributes<HTMLTableElement> & {
    /** Accent ring and tinted header, like SidePanel's: makes an explicit edit mode obvious. */
    editing?: boolean;
};
/** Table on a card-like surface; scrolls horizontally when wider than its container. */
export declare function Table({ editing, className, ...props }: TableProps): import("react").JSX.Element;
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
