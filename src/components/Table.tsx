// Data table in Fibery's style: ringed surface, hairline row separators, muted small header.
// Use native <thead>/<tbody>/<tr>/<th>/<td> inside; `data-align="right"` on a cell right-aligns it with tabular digits,
// `data-indent="1" | "2"` on a first cell nests the row under group captions of that depth,
// `data-interactive` on a body <tr> gives it a pointer cursor and a focus ring (add onClick/tabIndex yourself).
import type {ReactNode, TableHTMLAttributes} from "react";
import {cx} from "../cx";

export type TableProps = TableHTMLAttributes<HTMLTableElement> & {
  /** Accent ring and tinted header, like SidePanel's: makes an explicit edit mode obvious. */
  editing?: boolean;
};

/** Table on a card-like surface; scrolls horizontally when wider than its container. */
export function Table({editing, className, ...props}: TableProps) {
  return (
    <div className="fui-table-wrap" data-editing={editing ? "" : undefined}>
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
