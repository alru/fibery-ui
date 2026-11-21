// Data table in Fibery's style: ringed surface, hairline row separators, muted small header, and its sortable header
// cell (SortHeader).
// Use native <thead>/<tbody>/<tr>/<th>/<td> inside; `data-align="right"` on a cell right-aligns it with tabular digits,
// `data-indent="1" | "2"` on a first cell nests the row under group captions of that depth,
// `data-interactive` on a body <tr> gives it a pointer cursor and a focus ring (add onClick/tabIndex yourself),
// `data-selected` tints the row whose details are open (master–detail with a SidePanel). In a `responsive` table,
// `data-narrow-hide` cells drop out below 720px of the table's width and `data-narrow-only` elements show only then.
import type {CSSProperties, ReactNode, TableHTMLAttributes, ThHTMLAttributes} from "react";
import {ArrowDown, ArrowUp} from "lucide-react";
import {cx} from "../cx";

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
export function Table({
  editing,
  flat,
  header = "plain",
  stickyHeader,
  valign = "middle",
  density = "compact",
  responsive,
  className,
  ...props
}: TableProps) {
  const sticky = stickyHeader != null && stickyHeader !== false;
  return (
    <div
      className="fui-table-wrap"
      data-editing={editing ? "" : undefined}
      data-flat={flat ? "" : undefined}
      data-header={header === "tinted" ? "tinted" : undefined}
      data-sticky={sticky ? "" : undefined}
      data-valign={valign === "top" ? "top" : undefined}
      data-density={density === "comfortable" ? "comfortable" : undefined}
      data-responsive={responsive ? "" : undefined}
      style={typeof stickyHeader === "number" ? ({"--fui-sticky-top": `${stickyHeader}px`} as CSSProperties) : undefined}
    >
      <table className={cx("fui-table", className)} {...props} />
    </div>
  );
}

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
export function SortHeader({active, dir, onSort, className, children, ...props}: SortHeaderProps) {
  const Arrow = dir === "asc" ? ArrowUp : ArrowDown;
  return (
    <th
      aria-sort={active ? (dir === "asc" ? "ascending" : "descending") : undefined}
      className={cx("fui-sort-header", className)}
      {...props}
    >
      <button type="button" className="fui-sort-header__button" onClick={onSort}>
        <span className="fui-sort-header__text">{children}</span>
        <Arrow className="fui-sort-header__arrow" data-active={active ? "" : undefined} aria-hidden />
      </button>
    </th>
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
