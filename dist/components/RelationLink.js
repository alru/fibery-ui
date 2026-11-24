import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// A link to another record (a company, a person, a deal): the record kind's icon before its name says "this is a
// relation, and to what", as Fibery's own relation fields do. Router-agnostic: `asChild` dresses the app's router
// link (e.g. TanStack's <Link>) instead of rendering an <a>.
import { cloneElement, forwardRef, isValidElement } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cx } from "../cx";
const content = (icon, name) => (_jsxs(_Fragment, { children: [_jsx("span", { className: "fui-relation-link__icon", "aria-hidden": true, children: icon }), _jsx("span", { className: "fui-relation-link__name", children: name })] }));
/**
 * A link to a related record: a muted kind icon, then the name, which wraps (never "…") and alone gets the hover
 * underline. The icon stands on the name's first line. Color is inherited, so it reads in a muted line too.
 */
export const RelationLink = forwardRef(({ icon, size = "md", asChild = false, className, children, ...props }, ref) => {
    if (asChild && isValidElement(children)) {
        const child = children;
        return (_jsx(Slot, { ref: ref, "data-size": size, className: cx("fui-relation-link", className), ...props, children: cloneElement(child, undefined, content(icon, child.props.children)) }));
    }
    return (_jsx("a", { ref: ref, "data-size": size, className: cx("fui-relation-link", className), ...props, children: content(icon, children) }));
});
RelationLink.displayName = "RelationLink";
