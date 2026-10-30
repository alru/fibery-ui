export type ReloadAppButtonProps = {
    className?: string;
};
/**
 * Icon button «Перезагрузить приложение» that reloads the app page (`window.location.reload()`), not just its data.
 * State kept with `usePersistentState` (remembered tab, filters) survives the reload; unsaved edits are lost.
 */
export declare function ReloadAppButton({ className }: ReloadAppButtonProps): import("react").JSX.Element;
