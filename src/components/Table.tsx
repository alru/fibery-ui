// Data table in Fibery's style: ringed surface, hairline row separators, muted small header.
// Use native <thead>/<tbody>/<tr>/<th>/<td> inside; `data-align="right"` on a cell right-aligns it with tabular digits.
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
  /** Number of table columns to span. */
  colSpan: number;
};

/** Caption row that starts a group of body rows, e.g. a category. */
export function TableGroupRow({label, colSpan}: TableGroupRowProps) {
  return (
    <tr className="fui-table__group">
      <th colSpan={colSpan} scope="colgroup">
        {label}
      </th>
    </tr>
  );
}
