// Searchable picker: a trigger opens a popover with a search field and a grouped, keyboard-navigable option list.
// Used to pick from catalogs too long for a Select (e.g. adding a skill or a tag).
import {useId, useState, type KeyboardEvent, type ReactElement} from "react";
import {cx} from "../cx";
import {SearchInput} from "./Form";
import {Highlight, normalizeSearchText, searchTokens} from "./Highlight";
import {Popover, PopoverContent, PopoverTrigger} from "./Overlay";

export type ComboboxOption = {
  value: string;
  /** Shown in the list and searched; matches are highlighted. */
  text: string;
  /** Extra searchable text that is not shown, e.g. the group name. */
  keywords?: string;
  /** Options with the same group are listed under one caption, in order of first appearance. */
  group?: string;
};

export type ComboboxProps = {
  options: ComboboxOption[];
  onSelect: (value: string) => void;
  /** Trigger element (e.g. a Button); must accept a ref. */
  children: ReactElement;
  placeholder?: string;
  emptyText?: string;
  align?: "start" | "center" | "end";
  /** Classes for the popup, e.g. to change its 320px width. */
  className?: string;
};

/** Picker with search, groups and ↑ ↓ Enter navigation. Closes after a pick. */
export function Combobox({
  options,
  onSelect,
  children,
  placeholder = "Поиск…",
  emptyText = "Ничего не найдено",
  align = "start",
  className,
}: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const listId = useId();

  const tokens = searchTokens(query);
  const filtered = options.filter((o) => {
    const haystack = normalizeSearchText(`${o.text} ${o.keywords ?? ""}`);
    return tokens.every((t) => haystack.includes(t));
  });
  const optionId = (index: number) => `${listId}-${index}`;

  const close = () => {
    setOpen(false);
    setQuery("");
    setActive(0);
  };
  const pick = (option: ComboboxOption | undefined) => {
    if (!option) return;
    onSelect(option.value);
    close();
  };
  const moveTo = (index: number) => {
    setActive(index);
    document.getElementById(optionId(index))?.scrollIntoView({block: "nearest"});
  };
  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!filtered.length) return;
      const step = e.key === "ArrowDown" ? 1 : -1;
      moveTo((active + step + filtered.length) % filtered.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      pick(filtered[active]);
    }
  };

  let lastGroup: string | undefined;
  return (
    <Popover open={open} onOpenChange={(next) => (next ? setOpen(true) : close())}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent align={align} className={cx("fui-combobox", className)}>
        <SearchInput
          size="sm"
          role="combobox"
          aria-expanded
          aria-controls={listId}
          aria-activedescendant={filtered.length ? optionId(active) : undefined}
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
          }}
          onKeyDown={onKeyDown}
        />
        <div id={listId} role="listbox" className="fui-combobox__list">
          {filtered.length === 0 && <div className="fui-combobox__empty">{emptyText}</div>}
          {filtered.map((option, index) => {
            const caption = option.group !== lastGroup ? option.group : undefined;
            lastGroup = option.group;
            return (
              <div key={option.value} role="presentation">
                {caption && <div className="fui-menu-label">{caption}</div>}
                <div
                  id={optionId(index)}
                  role="option"
                  aria-selected={index === active}
                  data-highlighted={index === active ? "" : undefined}
                  className="fui-menu-item"
                  onMouseMove={() => index !== active && setActive(index)}
                  // Keep focus in the search field so typing and arrow keys keep working.
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pick(option)}
                >
                  <span className="fui-menu-item__text">
                    <Highlight text={option.text} query={tokens} />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
