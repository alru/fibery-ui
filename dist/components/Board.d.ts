import { type ReactNode } from "react";
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
/**
 * Columns side by side (248px each, `--fui-board-column` to change), as tall as the tallest one; the board scrolls
 * sideways inside itself when they don't fit, the page doesn't. Column header: title, count (tabular), `aside` on the
 * right, `note` under it. Drag a card onto another column to move it; the column under it gets a focus-colored ring.
 * Keyboard and touch users need the same move elsewhere, e.g. in the card's menu.
 */
export declare function Board<T>({ columns, cardId, renderCard, onMove, canDrag, limit, onMore, moreLabel, "aria-label": label, className, }: BoardProps<T>): import("react").JSX.Element;
