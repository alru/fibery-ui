import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// Kanban board: columns of cards by status, cards dragged between columns with native HTML5 drag and drop (no
// dependencies). The app owns the data: a drop only reports onMove, the app moves the card (and puts it back if the
// write is refused). Columns may start folded into a narrow strip (a queue nobody works from the board).
import { useId, useState } from "react";
import { FoldHorizontal } from "lucide-react";
import { cx } from "../cx";
import { Button, IconButton } from "./Button";
import { useKitTexts } from "./KitLang";
/**
 * Columns side by side (248px each, `--fui-board-column` to change), as tall as the tallest one; the board scrolls
 * sideways inside itself when they don't fit, the page doesn't. Column header: title, count (tabular), `aside` on the
 * right, `note` under it. Drag a card onto another column to move it; the column under it gets a focus-colored ring.
 * Keyboard and touch users need the same move elsewhere, e.g. in the card's menu.
 */
export function Board({ columns, cardId, renderCard, onMove, canDrag, limit = 50, onMore, moreLabel, "aria-label": label, className, }) {
    const t = useKitTexts();
    const baseId = useId();
    const [opened, setOpened] = useState(new Set());
    const [showAll, setShowAll] = useState(new Set());
    const [drag, setDrag] = useState(null);
    const [over, setOver] = useState(null);
    const toggle = (set, id, on) => {
        const next = new Set(set);
        if (on)
            next.add(id);
        else
            next.delete(id);
        return next;
    };
    const open = (id, on) => setOpened((s) => toggle(s, id, on));
    const endDrag = () => {
        setDrag(null);
        setOver(null);
    };
    return (_jsx("div", { className: cx("fui-board", className), role: "group", "aria-label": label, children: columns.map((column, index) => {
            const folded = column.collapsed === true && !opened.has(column.id);
            const count = column.count ?? column.cards.length;
            // By position: a column id may hold spaces, and aria-labelledby splits on them.
            const titleId = `${baseId}-column-${index}`;
            const accepts = drag != null && drag.fromId !== column.id;
            const dropProps = {
                onDragOver: (e) => {
                    if (!accepts)
                        return;
                    e.preventDefault();
                    e.dataTransfer.dropEffect = "move";
                    if (over !== column.id)
                        setOver(column.id);
                    if (folded)
                        open(column.id, true);
                },
                onDragLeave: (e) => {
                    // Moving onto a child also fires dragleave on the column: only leaving the column itself counts.
                    if (e.currentTarget.contains(e.relatedTarget))
                        return;
                    setOver((o) => (o === column.id ? null : o));
                },
                onDrop: (e) => {
                    if (!drag || drag.fromId === column.id)
                        return;
                    e.preventDefault();
                    onMove?.(drag.cardId, drag.fromId, column.id);
                    endDrag();
                },
            };
            if (folded) {
                return (_jsx("section", { className: "fui-board__column", "data-collapsed": "", "data-drop-target": over === column.id ? "" : undefined, "aria-labelledby": titleId, ...dropProps, children: _jsxs("button", { type: "button", className: "fui-board__strip", "aria-expanded": false, title: t.expandColumn, onClick: () => open(column.id, true), children: [_jsx("span", { className: "fui-board__count", children: count }), _jsx("span", { id: titleId, className: "fui-board__strip-title", children: column.title })] }) }, column.id));
            }
            const all = showAll.has(column.id);
            const shown = all ? column.cards : column.cards.slice(0, limit);
            const hidden = column.cards.length - shown.length;
            return (_jsxs("section", { className: "fui-board__column", "data-drop-target": over === column.id ? "" : undefined, "aria-labelledby": titleId, ...dropProps, children: [_jsxs("header", { className: "fui-board__header", children: [_jsxs("div", { className: "fui-board__heading", children: [_jsxs("h3", { id: titleId, className: "fui-board__title", children: [column.title, _jsx("span", { className: "fui-board__count", children: count })] }), column.aside != null && _jsx("span", { className: "fui-board__aside", children: column.aside }), column.collapsed && (_jsx(IconButton, { icon: _jsx(FoldHorizontal, {}), "aria-label": t.collapseColumn, size: "sm", className: "fui-board__fold", onClick: () => open(column.id, false) }))] }), column.note != null && _jsx("div", { className: "fui-board__note", children: column.note })] }), _jsxs("ul", { className: "fui-board__cards", children: [shown.map((card) => {
                                const id = cardId(card);
                                const draggable = onMove != null && (canDrag?.(id) ?? true);
                                return (_jsx("li", { className: "fui-board__card", draggable: draggable, "data-dragging": drag?.cardId === id ? "" : undefined, onDragStart: draggable
                                        ? (e) => {
                                            e.dataTransfer.effectAllowed = "move";
                                            // Firefox starts a drag only with some data set.
                                            e.dataTransfer.setData("text/plain", id);
                                            setDrag({ cardId: id, fromId: column.id });
                                        }
                                        : undefined, onDragEnd: draggable ? endDrag : undefined, children: renderCard(card, column.id) }, id));
                            }), column.cards.length === 0 && _jsx("li", { className: "fui-board__empty", children: column.empty ?? t.empty })] }), hidden > 0 && (_jsx("div", { className: "fui-board__more", children: _jsx(Button, { variant: "ghost", size: "sm", onClick: () => (onMore ? onMore(column.id) : setShowAll((s) => toggle(s, column.id, true))), children: moreLabel ? moreLabel(hidden) : t.moreCount(hidden) }) }))] }, column.id));
        }) }));
}
