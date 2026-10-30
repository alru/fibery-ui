// Tells whether an item of a wrapping flex row has moved onto a line below the row's first item. CSS can't select a
// wrapped flex item, yet toolbars want to restyle one, e.g. a result count right-aligned at the end of the filter row
// that should sit on the left once it wraps onto a line of its own.
import {useLayoutEffect, useRef, useState} from "react";

/**
 * Watches an item of a `flex-wrap` row: `wrapped` is true while the item sits below the row's first item.
 * Put `ref` on the item; it must be a direct child of the row. Re-measures whenever the row resizes.
 *
 * ```tsx
 * const [countRef, countWrapped] = useWrapped<HTMLSpanElement>();
 * <div className="flex flex-wrap gap-3">
 *   <Filters />
 *   <span ref={countRef} className={countWrapped ? "text-left" : "ml-auto text-right"}>Найдено 3 из 40</span>
 * </div>
 * ```
 */
export function useWrapped<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [wrapped, setWrapped] = useState(false);
  // Runs after every render: the item may mount later (e.g. once data loads); the observer is cheap to re-create.
  useLayoutEffect(() => {
    const item = ref.current;
    const row = item?.parentElement;
    const first = row?.firstElementChild as HTMLElement | null | undefined;
    if (!item || !row || !first) return;
    const check = () => setWrapped(item.offsetTop >= first.offsetTop + first.offsetHeight);
    const observer = new ResizeObserver(check);
    observer.observe(row);
    check();
    return () => observer.disconnect();
  });
  return [ref, wrapped] as const;
}
