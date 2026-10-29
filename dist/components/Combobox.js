import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// Searchable pickers over a grouped option list with highlight and ↑ ↓ Enter navigation:
// - Combobox: a trigger opens a popover with its own search field (e.g. "Add skill" button);
// - Autocomplete: the page's search field itself suggests options while typing (e.g. pick an exact skill).
import { useId, useState } from "react";
import { cx } from "../cx";
import { SearchInput } from "./Form";
import { Highlight, normalizeSearchText, searchTokens } from "./Highlight";
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from "./Overlay";
const filterOptions = (options, tokens) => options.filter((o) => {
    const haystack = normalizeSearchText(`${o.text} ${o.keywords ?? ""}`);
    return tokens.every((t) => haystack.includes(t));
});
// Active-option state and the ↑ ↓ Enter handler shared by both pickers.
function useOptionNavigation(filtered, pick) {
    const [active, setActive] = useState(0);
    const listId = useId();
    const optionId = (index) => `${listId}-${index}`;
    const moveTo = (index) => {
        setActive(index);
        document.getElementById(optionId(index))?.scrollIntoView({ block: "nearest" });
    };
    /** Returns true when the key was handled. */
    const handleKey = (e) => {
        if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            if (filtered.length)
                moveTo((active + (e.key === "ArrowDown" ? 1 : -1) + filtered.length) % filtered.length);
            return true;
        }
        if (e.key === "Enter") {
            e.preventDefault();
            pick(filtered[active]);
            return true;
        }
        return false;
    };
    const inputProps = {
        role: "combobox",
        "aria-controls": listId,
        "aria-activedescendant": filtered.length ? optionId(active) : undefined,
    };
    return { active, setActive, listId, optionId, handleKey, inputProps };
}
function OptionList({ options, tokens, emptyText, separator, nav, onPick }) {
    let lastGroup;
    return (_jsxs("div", { id: nav.listId, role: "listbox", className: "fui-combobox__list", children: [options.length === 0 && emptyText && _jsx("div", { className: "fui-combobox__empty", children: emptyText }), options.map((option, index) => {
                const caption = option.group !== lastGroup ? option.group : undefined;
                lastGroup = option.group;
                return (_jsxs("div", { role: "presentation", children: [caption && _jsx("div", { className: "fui-menu-label", children: caption }), _jsx("div", { id: nav.optionId(index), role: "option", "aria-selected": index === nav.active, "data-highlighted": index === nav.active ? "" : undefined, className: "fui-menu-item", onMouseMove: () => index !== nav.active && nav.setActive(index), 
                            // Keep focus in the search field so typing and arrow keys keep working.
                            onMouseDown: (e) => e.preventDefault(), onClick: () => onPick(option), children: _jsx("span", { className: "fui-menu-item__text", children: _jsx(Highlight, { text: option.text, query: tokens, separator: separator }) }) })] }, option.value));
            })] }));
}
/** Picker with search, groups and ↑ ↓ Enter navigation. Closes after a pick. */
export function Combobox({ options, onSelect, children, placeholder = "Поиск…", emptyText = "Ничего не найдено", align = "start", separator, className, }) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const tokens = searchTokens(query);
    const filtered = filterOptions(options, tokens);
    const close = () => {
        setOpen(false);
        setQuery("");
        nav.setActive(0);
    };
    const pick = (option) => {
        if (!option)
            return;
        onSelect(option.value);
        close();
    };
    const nav = useOptionNavigation(filtered, pick);
    return (_jsxs(Popover, { open: open, onOpenChange: (next) => (next ? setOpen(true) : close()), children: [_jsx(PopoverTrigger, { asChild: true, children: children }), _jsxs(PopoverContent, { align: align, className: cx("fui-combobox", className), children: [_jsx(SearchInput, { size: "sm", ...nav.inputProps, "aria-expanded": true, placeholder: placeholder, value: query, onChange: (e) => {
                            setQuery(e.target.value);
                            nav.setActive(0);
                        }, onKeyDown: nav.handleKey }), _jsx("div", { className: "fui-combobox__list-wrap", children: _jsx(OptionList, { options: filtered, tokens: tokens, emptyText: emptyText, separator: separator, nav: nav, onPick: pick }) })] })] }));
}
/**
 * Search field that suggests matching options under itself while typing. The popup only shows when there are
 * matches; Escape closes it first, and a second Escape reaches the field's own `onKeyDown`.
 */
export function Autocomplete({ value, onValueChange, options, onSelect, separator, onKeyDown, onFocus, onBlur, className, ...props }) {
    const [focused, setFocused] = useState(false);
    const [dismissed, setDismissed] = useState(false);
    const tokens = searchTokens(value);
    const filtered = tokens.length ? filterOptions(options, tokens) : [];
    const open = focused && !dismissed && filtered.length > 0;
    const pick = (option) => {
        if (!option)
            return;
        onSelect(option.value);
        setDismissed(true);
    };
    const nav = useOptionNavigation(filtered, pick);
    return (_jsxs(Popover, { open: open, onOpenChange: (next) => !next && setDismissed(true), children: [_jsx(PopoverAnchor, { asChild: true, children: _jsx("span", { className: cx("fui-autocomplete-anchor", className), children: _jsx(SearchInput, { ...props, ...nav.inputProps, "aria-expanded": open, value: value, onChange: (e) => {
                            onValueChange(e.target.value);
                            setDismissed(false);
                            nav.setActive(0);
                        }, onFocus: (e) => {
                            setFocused(true);
                            onFocus?.(e);
                        }, onBlur: (e) => {
                            setFocused(false);
                            onBlur?.(e);
                        }, onKeyDown: (e) => {
                            if (open && e.key === "Escape") {
                                e.preventDefault();
                                setDismissed(true);
                                return;
                            }
                            if (open && nav.handleKey(e))
                                return;
                            onKeyDown?.(e);
                        } }) }) }), _jsx(PopoverContent, { align: "start", className: "fui-autocomplete", 
                // Focus stays in the field: typing continues while suggestions are shown.
                onOpenAutoFocus: (e) => e.preventDefault(), children: _jsx(OptionList, { options: filtered, tokens: tokens, separator: separator, nav: nav, onPick: pick }) })] }));
}
