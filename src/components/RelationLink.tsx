// A link to another record (a company, a person, a deal): the record kind's icon before its name says "this is a
// relation, and to what", as Fibery's own relation fields do. Router-agnostic: `asChild` dresses the app's router
// link (e.g. TanStack's <Link>) instead of rendering an <a>.
import {cloneElement, forwardRef, isValidElement, type AnchorHTMLAttributes, type ReactElement, type ReactNode} from "react";
import {Slot} from "@radix-ui/react-slot";
import {cx} from "../cx";

export type RelationLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  /** Icon of the linked record's kind, e.g. `<Building2 />`: the same icon the app uses for that kind's section. */
  icon: ReactNode;
  /** Icon size to match the text: `"md"` (default) 14px for 14px text, `"sm"` 12px for 13px text and smaller. */
  size?: "sm" | "md";
  /**
   * Renders the single child (a router's link element) with the icon, the name wrapper and the styles merged in,
   * instead of an `<a>`. The child's own children are the name.
   */
  asChild?: boolean;
};

const content = (icon: ReactNode, name: ReactNode) => (
  <>
    <span className="fui-relation-link__icon" aria-hidden>
      {icon}
    </span>
    <span className="fui-relation-link__name">{name}</span>
  </>
);

/**
 * A link to a related record: a muted kind icon, then the name, which wraps (never "…") and alone gets the hover
 * underline. The icon stands on the name's first line. Color is inherited, so it reads in a muted line too.
 */
export const RelationLink = forwardRef<HTMLAnchorElement, RelationLinkProps>(
  ({icon, size = "md", asChild = false, className, children, ...props}, ref) => {
    if (asChild && isValidElement(children)) {
      const child = children as ReactElement<{children?: ReactNode}>;
      return (
        <Slot ref={ref} data-size={size} className={cx("fui-relation-link", className)} {...props}>
          {cloneElement(child, undefined, content(icon, child.props.children))}
        </Slot>
      );
    }
    return (
      <a ref={ref} data-size={size} className={cx("fui-relation-link", className)} {...props}>
        {content(icon, children)}
      </a>
    );
  },
);
RelationLink.displayName = "RelationLink";
