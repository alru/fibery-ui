// Joins truthy class names; kit classes are plain CSS, so no Tailwind merging is needed.
export const cx = (...classes: (string | false | null | undefined)[]) => classes.filter(Boolean).join(" ");
