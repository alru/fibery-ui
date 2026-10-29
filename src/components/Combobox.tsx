// Searchable pickers over a grouped option list with highlight and ↑ ↓ Enter navigation:
// - Combobox: a trigger opens a popover with its own search field (e.g. "Add skill" button);
// - Autocomplete: the page's search field itself suggests options while typing (e.g. pick an exact skill).
import {useId, useState, type KeyboardEvent, type ReactElement} from "react";
import {cx} from "../cx";
import {SearchInput, type InputProps} from "./Form";
import {Highlight, normalizeSearchText, searchTokens} from "./Highlight";
import {Popover, PopoverAnchor, PopoverContent, PopoverTrigger} from "./Overlay";

export type ComboboxOption = {
  value: string;
  /** Shown in the list and searched; matches are highlighted. */
  text: string;
  /** Extra searchable text that is not shown, e.g. the group name. */
  keywords?: string;
  /** Options with the same group are listed under one caption, in order of first appearance. */
  group?: string;
};

const filterOptions = (options: ComboboxOption[], tokens: string[]) =>
  options.filter((o) => {
    const haystack = normalizeSearchText(`${o.text} ${o.keywords ?? ""}`);
    return tokens.every((t) => haystack.includes(t));
  });

// Active-option state and the ↑ ↓ Enter handler shared by both pickers.
function useOptionNavigation(filtered: ComboboxOption[], pick: (option: ComboboxOption | undefined) => void) {
  const [active, setActive] = useState(0);
  const listId = useId();
  const optionId = (index: number) => `${listId}-${index}`;
  const moveTo = (index: number) => {
    setActive(index);
    document.getElementById(optionId(index))?.scrollIntoView({block: "nearest"});
  };
  /** Returns true when the key was handled. */
  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (filtered.length) moveTo((active + (e.key === "ArrowDown" ? 1 : -1) + filtered.length) % filtered.length);
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
  return {active, setActive, listId, optionId, handleKey, inputProps};
}

type OptionListProps = {
  options: ComboboxOption[];
  tokens: string[];
  emptyText?: string;
  separator?: string;
  nav: ReturnType<typeof useOptionNavigation>;
  onPick: (option: ComboboxOption) => void;
};

function OptionList({options, tokens, emptyText, separator, nav, onPick}: OptionListProps) {
  let lastGroup: string | undefined;
  return (
    <div id={nav.listId} role="listbox" className="fui-combobox__list">
      {options.length === 0 && emptyText && <div className="fui-combobox__empty">{emptyText}</div>}
      {options.map((option, index) => {
        const caption = option.group !== lastGroup ? option.group : undefined;
        lastGroup = option.group;
        return (
          <div key={option.value} role="presentation">
            {caption && <div className="fui-menu-label">{caption}</div>}
            <div
              id={nav.optionId(index)}
              role="option"
              aria-selected={index === nav.active}
              data-highlighted={index === nav.active ? "" : undefined}
              className="fui-menu-item"
              onMouseMove={() => index !== nav.active && nav.setActive(index)}
              // Keep focus in the search field so typing and arrow keys keep working.
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onPick(option)}
            >
              <span className="fui-menu-item__text">
                <Highlight text={option.text} query={tokens} separator={separator} />
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export type ComboboxProps = {
  options: ComboboxOption[];
  onSelect: (value: string) => void;
  /** Trigger element (e.g. a Button); must accept a ref. */
  children: ReactElement;
  placeholder?: string;
  emptyText?: string;
  align?: "start" | "center" | "end";
  /** Path separator in option texts, drawn small and muted (see Highlight). */
  separator?: string;
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
  separator,
  className,
}: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const tokens = searchTokens(query);
  const filtered = filterOptions(options, tokens);

  const close = () => {
    setOpen(false);
    setQuery("");
    nav.setActive(0);
  };
  const pick = (option: ComboboxOption | undefined) => {
    if (!option) return;
    onSelect(option.value);
    close();
  };
  const nav = useOptionNavigation(filtered, pick);

  return (
    <Popover open={open} onOpenChange={(next) => (next ? setOpen(true) : close())}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent align={align} className={cx("fui-combobox", className)}>
        <SearchInput
          size="sm"
          {...nav.inputProps}
          aria-expanded
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            nav.setActive(0);
          }}
          onKeyDown={nav.handleKey}
        />
        <div className="fui-combobox__list-wrap">
          <OptionList options={filtered} tokens={tokens} emptyText={emptyText} separator={separator} nav={nav} onPick={pick} />
        </div>
      </PopoverContent>
    </Popover>
  );
}

export type AutocompleteProps = Omit<InputProps, "value" | "onChange" | "onSelect" | "icon"> & {
  value: string;
  onValueChange: (value: string) => void;
  /** Full option set; the field's text filters it. */
  options: ComboboxOption[];
  /** Called when a suggestion is picked; the caller decides what happens to the text. */
  onSelect: (value: string) => void;
  /** Path separator in option texts, drawn small and muted (see Highlight). */
  separator?: string;
};

/**
 * Search field that suggests matching options under itself while typing. The popup only shows when there are
 * matches; Escape closes it first, and a second Escape reaches the field's own `onKeyDown`.
 */
export function Autocomplete({
  value,
  onValueChange,
  options,
  onSelect,
  separator,
  onKeyDown,
  onFocus,
  onBlur,
  className,
  ...props
}: AutocompleteProps) {
  const [focused, setFocused] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const tokens = searchTokens(value);
  const filtered = tokens.length ? filterOptions(options, tokens) : [];
  const open = focused && !dismissed && filtered.length > 0;

  const pick = (option: ComboboxOption | undefined) => {
    if (!option) return;
    onSelect(option.value);
    setDismissed(true);
  };
  const nav = useOptionNavigation(filtered, pick);

  return (
    <Popover open={open} onOpenChange={(next) => !next && setDismissed(true)}>
      <PopoverAnchor asChild>
        <span className={cx("fui-autocomplete-anchor", className)}>
          <SearchInput
            {...props}
            {...nav.inputProps}
            aria-expanded={open}
            value={value}
            onChange={(e) => {
              onValueChange(e.target.value);
              setDismissed(false);
              nav.setActive(0);
            }}
            onFocus={(e) => {
              setFocused(true);
              onFocus?.(e);
            }}
            onBlur={(e) => {
              setFocused(false);
              onBlur?.(e);
            }}
            onKeyDown={(e) => {
              if (open && e.key === "Escape") {
                e.preventDefault();
                setDismissed(true);
                return;
              }
              if (open && nav.handleKey(e)) return;
              onKeyDown?.(e);
            }}
          />
        </span>
      </PopoverAnchor>
      <PopoverContent
        align="start"
        className="fui-autocomplete"
        // Focus stays in the field: typing continues while suggestions are shown.
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <OptionList options={filtered} tokens={tokens} separator={separator} nav={nav} onPick={pick} />
      </PopoverContent>
    </Popover>
  );
}
