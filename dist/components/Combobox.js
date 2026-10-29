import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// Searchable picker: a trigger opens a popover with a search field and a grouped, keyboard-navigable option list.
// Used to pick from catalogs too long for a Select (e.g. adding a skill or a tag).
import { useId, useState } from "react";
import { cx } from "../cx";
import { SearchInput } from "./Form";
import { Highlight, normalizeSearchText, searchTokens } from "./Highlight";
import { Popover, PopoverContent, PopoverTrigger } from "./Overlay";
/** Picker with search, groups and ↑ ↓ Enter navigation. Closes after a pick. */
export function Combobox({ options, onSelect, children, placeholder = "Поиск…", emptyText = "Ничего не найдено", align = "start", className, }) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [active, setActive] = useState(0);
    const listId = useId();
    const tokens = searchTokens(query);
    const filtered = options.filter((o) => {
        const haystack = normalizeSearchText(`${o.text} ${o.keywords ?? ""}`);
        return tokens.every((t) => haystack.includes(t));
    });
    const optionId = (index) => `${listId}-${index}`;
    const close = () => {
        setOpen(false);
        setQuery("");
        setActive(0);
    };
    const pick = (option) => {
        if (!option)
            return;
        onSelect(option.value);
        close();
    };
    const moveTo = (index) => {
        setActive(index);
        document.getElementById(optionId(index))?.scrollIntoView({ block: "nearest" });
    };
    const onKeyDown = (e) => {
        if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            if (!filtered.length)
                return;
            const step = e.key === "ArrowDown" ? 1 : -1;
            moveTo((active + step + filtered.length) % filtered.length);
        }
        else if (e.key === "Enter") {
            e.preventDefault();
            pick(filtered[active]);
        }
    };
    let lastGroup;
    return (_jsxs(Popover, { open: open, onOpenChange: (next) => (next ? setOpen(true) : close()), children: [_jsx(PopoverTrigger, { asChild: true, children: children }), _jsxs(PopoverContent, { align: align, className: cx("fui-combobox", className), children: [_jsx(SearchInput, { size: "sm", role: "combobox", "aria-expanded": true, "aria-controls": listId, "aria-activedescendant": filtered.length ? optionId(active) : undefined, placeholder: placeholder, value: query, onChange: (e) => {
                            setQuery(e.target.value);
                            setActive(0);
                        }, onKeyDown: onKeyDown }), _jsxs("div", { id: listId, role: "listbox", className: "fui-combobox__list", children: [filtered.length === 0 && _jsx("div", { className: "fui-combobox__empty", children: emptyText }), filtered.map((option, index) => {
                                const caption = option.group !== lastGroup ? option.group : undefined;
                                lastGroup = option.group;
                                return (_jsxs("div", { role: "presentation", children: [caption && _jsx("div", { className: "fui-menu-label", children: caption }), _jsx("div", { id: optionId(index), role: "option", "aria-selected": index === active, "data-highlighted": index === active ? "" : undefined, className: "fui-menu-item", onMouseMove: () => index !== active && setActive(index), 
                                            // Keep focus in the search field so typing and arrow keys keep working.
                                            onMouseDown: (e) => e.preventDefault(), onClick: () => pick(option), children: _jsx("span", { className: "fui-menu-item__text", children: _jsx(Highlight, { text: option.text, query: tokens }) }) })] }, option.value));
                            })] })] })] }));
}
