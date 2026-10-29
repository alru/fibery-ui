import { type ReactElement } from "react";
import { type InputProps } from "./Form";
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
    /** Path separator in option texts, drawn small and muted (see Highlight). */
    separator?: string;
    /** Classes for the popup, e.g. to change its 320px width. */
    className?: string;
};
/** Picker with search, groups and ↑ ↓ Enter navigation. Closes after a pick. */
export declare function Combobox({ options, onSelect, children, placeholder, emptyText, align, separator, className, }: ComboboxProps): import("react").JSX.Element;
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
export declare function Autocomplete({ value, onValueChange, options, onSelect, separator, onKeyDown, onFocus, onBlur, className, ...props }: AutocompleteProps): import("react").JSX.Element;
