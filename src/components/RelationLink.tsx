// A link to another record (a company, a person, a deal): one arrow after the name, the same for every relation,
// says "this leads to another record" (owner's rule). Router-agnostic: `asChild` dresses the app's router link (e.g.
// TanStack's <Link>) instead of rendering an <a>.
import {cloneElement, forwardRef, isValidElement, type AnchorHTMLAttributes, type ReactElement, type ReactNode} from "react";
import {Slot} from "@radix-ui/react-slot";
import {ArrowUpRight} from "lucide-react";
import {cx} from "../cx";

export type RelationLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  /** Arrow size to match the text: `"md"` (default) 14px after 14px text, `"sm"` 12px after 13px text and smaller. */
  size?: "sm" | "md";
  /**
   * Renders the single child (a router's link element) with the name wrapper, the arrow and the styles merged in,
   * instead of an `<a>`. The child's own children are the name.
   */
  asChild?: boolean;
};

// The word joiner (U+2060) forbids a line break between the name and the arrow, so the arrow wraps with the last word
// and never stands alone on a new line.
const content = (name: ReactNode) => (
  <>
    <span className="fui-relation-link__name">{name}</span>
    {"⁠"}
    <ArrowUpRight className="fui-relation-link__arrow" aria-hidden />
  </>
);

/**
 * A link to a related record: the name, then a muted arrow on the line of its last word. The name wraps (never "…")
 * and alone gets the hover underline; the color is inherited, so it reads in a muted line too. Anything that stands
 * before the name (a person's avatar) goes outside the link.
 */
export const RelationLink = forwardRef<HTMLAnchorElement, RelationLinkProps>(
  ({size = "md", asChild = false, className, children, ...props}, ref) => {
    if (asChild && isValidElement(children)) {
      const child = children as ReactElement<{children?: ReactNode}>;
      return (
        <Slot ref={ref} data-size={size} className={cx("fui-relation-link", className)} {...props}>
          {cloneElement(child, undefined, content(child.props.children))}
        </Slot>
      );
    }
    return (
      <a ref={ref} data-size={size} className={cx("fui-relation-link", className)} {...props}>
        {content(children)}
      </a>
    );
  },
);
RelationLink.displayName = "RelationLink";
