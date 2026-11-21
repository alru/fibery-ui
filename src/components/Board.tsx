// Kanban board: columns of cards by status, cards dragged between columns with native HTML5 drag and drop (no
// dependencies). The app owns the data: a drop only reports onMove, the app moves the card (and puts it back if the
// write is refused). Columns may start folded into a narrow strip (a queue nobody works from the board).
import {useId, useState, type DragEvent, type ReactNode} from "react";
import {FoldHorizontal} from "lucide-react";
import {cx} from "../cx";
import {Button, IconButton} from "./Button";
import {useKitTexts} from "./KitLang";

export type BoardColumn<T> = {
  id: string;
  /** Column name, e.g. the status. */
  title: ReactNode;
  /** Cards in their order; the board shows the first `limit` of them. */
  cards: T[];
  /** Number after the title; `cards.length` by default (pass the full number when `cards` is a filtered set). */
  count?: number;
  /** Muted content at the right of the title, e.g. "Σ 640 h". */
  aside?: ReactNode;
  /** Second header line, e.g. a filter button "no step 23". */
  note?: ReactNode;
  /** Starts folded into a 56px strip with the count and the title; a click or a card dragged over opens it. */
  collapsed?: boolean;
  /** Text of an empty column; «Пусто» / "Empty" by default. */
  empty?: ReactNode;
};

export type BoardProps<T> = {
  columns: BoardColumn<T>[];
  /** Stable id of a card, the one `onMove` and `canDrag` get. */
  cardId: (card: T) => string;
  /** The card itself, usually a `<Card variant="flat" interactive>`; the board adds only the drag handling around it. */
  renderCard: (card: T, columnId: string) => ReactNode;
  /** A card was dropped on another column. Without it nothing is draggable. */
  onMove?: (cardId: string, fromColumnId: string, toColumnId: string) => void;
  /** Whether a card may be dragged, e.g. the user can edit it; all by default. Others stay put, cursor unchanged. */
  canDrag?: (cardId: string) => boolean;
  /** Cards shown per column before «Ещё N» / "N more"; default 50. */
  limit?: number;
  /** The «Ещё N» button: e.g. switch to a list view filtered by the column. Without it the button shows the rest. */
  onMore?: (columnId: string) => void;
  /** Text of that button, e.g. `(n) => \`${n} more in the list\``; «Ещё N» / "N more" by default. */
  moreLabel?: (hidden: number) => ReactNode;
  "aria-label"?: string;
  className?: string;
};

type Drag = {cardId: string; fromId: string};

/**
 * Columns side by side (248px each, `--fui-board-column` to change), as tall as the tallest one; the board scrolls
 * sideways inside itself when they don't fit, the page doesn't. Column header: title, count (tabular), `aside` on the
 * right, `note` under it. Drag a card onto another column to move it; the column under it gets a focus-colored ring.
 * Keyboard and touch users need the same move elsewhere, e.g. in the card's menu.
 */
export function Board<T>({
  columns,
  cardId,
  renderCard,
  onMove,
  canDrag,
  limit = 50,
  onMore,
  moreLabel,
  "aria-label": label,
  className,
}: BoardProps<T>) {
  const t = useKitTexts();
  const baseId = useId();
  const [opened, setOpened] = useState<ReadonlySet<string>>(new Set());
  const [showAll, setShowAll] = useState<ReadonlySet<string>>(new Set());
  const [drag, setDrag] = useState<Drag | null>(null);
  const [over, setOver] = useState<string | null>(null);

  const toggle = (set: ReadonlySet<string>, id: string, on: boolean) => {
    const next = new Set(set);
    if (on) next.add(id);
    else next.delete(id);
    return next;
  };
  const open = (id: string, on: boolean) => setOpened((s) => toggle(s, id, on));
  const endDrag = () => {
    setDrag(null);
    setOver(null);
  };

  return (
    <div className={cx("fui-board", className)} role="group" aria-label={label}>
      {columns.map((column, index) => {
        const folded = column.collapsed === true && !opened.has(column.id);
        const count = column.count ?? column.cards.length;
        // By position: a column id may hold spaces, and aria-labelledby splits on them.
        const titleId = `${baseId}-column-${index}`;
        const accepts = drag != null && drag.fromId !== column.id;
        const dropProps = {
          onDragOver: (e: DragEvent<HTMLElement>) => {
            if (!accepts) return;
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
            if (over !== column.id) setOver(column.id);
            if (folded) open(column.id, true);
          },
          onDragLeave: (e: DragEvent<HTMLElement>) => {
            // Moving onto a child also fires dragleave on the column: only leaving the column itself counts.
            if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
            setOver((o) => (o === column.id ? null : o));
          },
          onDrop: (e: DragEvent<HTMLElement>) => {
            if (!drag || drag.fromId === column.id) return;
            e.preventDefault();
            onMove?.(drag.cardId, drag.fromId, column.id);
            endDrag();
          },
        };

        if (folded) {
          return (
            <section
              key={column.id}
              className="fui-board__column"
              data-collapsed=""
              data-drop-target={over === column.id ? "" : undefined}
              aria-labelledby={titleId}
              {...dropProps}
            >
              <button
                type="button"
                className="fui-board__strip"
                aria-expanded={false}
                title={t.expandColumn}
                onClick={() => open(column.id, true)}
              >
                <span className="fui-board__count">{count}</span>
                <span id={titleId} className="fui-board__strip-title">
                  {column.title}
                </span>
              </button>
            </section>
          );
        }

        const all = showAll.has(column.id);
        const shown = all ? column.cards : column.cards.slice(0, limit);
        const hidden = column.cards.length - shown.length;
        return (
          <section
            key={column.id}
            className="fui-board__column"
            data-drop-target={over === column.id ? "" : undefined}
            aria-labelledby={titleId}
            {...dropProps}
          >
            <header className="fui-board__header">
              <div className="fui-board__heading">
                <h3 id={titleId} className="fui-board__title">
                  {column.title}
                  <span className="fui-board__count">{count}</span>
                </h3>
                {column.aside != null && <span className="fui-board__aside">{column.aside}</span>}
                {column.collapsed && (
                  <IconButton
                    icon={<FoldHorizontal />}
                    aria-label={t.collapseColumn}
                    size="sm"
                    className="fui-board__fold"
                    onClick={() => open(column.id, false)}
                  />
                )}
              </div>
              {column.note != null && <div className="fui-board__note">{column.note}</div>}
            </header>
            <ul className="fui-board__cards">
              {shown.map((card) => {
                const id = cardId(card);
                const draggable = onMove != null && (canDrag?.(id) ?? true);
                return (
                  <li
                    key={id}
                    className="fui-board__card"
                    draggable={draggable}
                    data-dragging={drag?.cardId === id ? "" : undefined}
                    onDragStart={
                      draggable
                        ? (e) => {
                            e.dataTransfer.effectAllowed = "move";
                            // Firefox starts a drag only with some data set.
                            e.dataTransfer.setData("text/plain", id);
                            setDrag({cardId: id, fromId: column.id});
                          }
                        : undefined
                    }
                    onDragEnd={draggable ? endDrag : undefined}
                  >
                    {renderCard(card, column.id)}
                  </li>
                );
              })}
              {column.cards.length === 0 && <li className="fui-board__empty">{column.empty ?? t.empty}</li>}
            </ul>
            {hidden > 0 && (
              <div className="fui-board__more">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => (onMore ? onMore(column.id) : setShowAll((s) => toggle(s, column.id, true)))}
                >
                  {moreLabel ? moreLabel(hidden) : t.moreCount(hidden)}
                </Button>
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
