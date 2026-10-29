// Data table in Fibery's style: ringed surface, hairline row separators, muted small header.
// Use native <thead>/<tbody>/<tr>/<th>/<td> inside; `data-align="right"` on a cell right-aligns it with tabular digits,
// `data-indent="1" | "2"` on a first cell nests the row under group captions of that depth.
import type {ReactNode, TableHTMLAttributes} from "react";
import {cx} from "../cx";

/** Table on a card-like surface; scrolls horizontally when wider than its container. */
export function Table({className, ...props}: TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="fui-table-wrap">
      <table className={cx("fui-table", className)} {...props} />
    </div>
  );
}

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
export function TableGroupRow({label, colSpan, level = 1, children}: TableGroupRowProps) {
  return (
    <tr className="fui-table__group" data-level={level}>
      <th colSpan={children ? undefined : colSpan} scope={children ? "row" : "colgroup"}>
        {label}
      </th>
      {children}
    </tr>
  );
}
