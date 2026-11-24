import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// A link to another record (a company, a person, a deal): one arrow after the name, the same for every relation,
// says "this leads to another record" (owner's rule). Router-agnostic: `asChild` dresses the app's router link (e.g.
// TanStack's <Link>) instead of rendering an <a>.
import { cloneElement, forwardRef, isValidElement } from "react";
import { Slot } from "@radix-ui/react-slot";
import { ArrowRight } from "lucide-react";
import { cx } from "../cx";
// The word joiner (U+2060) forbids a line break between the name and the arrow, so the arrow wraps with the last word
// and never stands alone on a new line.
const content = (name) => (_jsxs(_Fragment, { children: [_jsx("span", { className: "fui-relation-link__name", children: name }), "⁠", _jsx(ArrowRight, { className: "fui-relation-link__arrow", "aria-hidden": true })] }));
/**
 * A link to a related record: the name, then a muted arrow on the line of its last word. The name wraps (never "…")
 * and alone gets the hover underline; the color is inherited, so it reads in a muted line too. Anything that stands
 * before the name (a person's avatar) goes outside the link.
 */
export const RelationLink = forwardRef(({ size = "md", asChild = false, className, children, ...props }, ref) => {
    if (asChild && isValidElement(children)) {
        const child = children;
        return (_jsx(Slot, { ref: ref, "data-size": size, className: cx("fui-relation-link", className), ...props, children: cloneElement(child, undefined, content(child.props.children)) }));
    }
    return (_jsx("a", { ref: ref, "data-size": size, className: cx("fui-relation-link", className), ...props, children: content(children) }));
});
RelationLink.displayName = "RelationLink";
