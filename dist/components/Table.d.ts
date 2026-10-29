import type { ReactNode, TableHTMLAttributes } from "react";
/** Table on a card-like surface; scrolls horizontally when wider than its container. */
export declare function Table({ className, ...props }: TableHTMLAttributes<HTMLTableElement>): import("react").JSX.Element;
export type TableGroupRowProps = {
    label: ReactNode;
    /** Number of table columns to span. */
    colSpan: number;
};
/** Caption row that starts a group of body rows, e.g. a category. */
export declare function TableGroupRow({ label, colSpan }: TableGroupRowProps): import("react").JSX.Element;
