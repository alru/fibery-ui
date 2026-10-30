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
export declare function useWrapped<T extends HTMLElement>(): readonly [import("react").RefObject<T>, boolean];
