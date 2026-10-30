// Last-resort "hard refresh": reloads the whole app page when it is stuck (a refetch would not help — e.g. a broken
// render or a hung request), so users don't have to know how to reload a Fibery app frame themselves.
import {RefreshCw} from "lucide-react";
import {IconButton} from "./Button";
import {Tooltip} from "./Overlay";

export type ReloadAppButtonProps = {className?: string};

/**
 * Icon button «Перезагрузить приложение» that reloads the app page (`window.location.reload()`), not just its data.
 * State kept with `usePersistentState` (remembered tab, filters) survives the reload; unsaved edits are lost.
 */
export function ReloadAppButton({className}: ReloadAppButtonProps) {
  return (
    <Tooltip content="Перезагрузить приложение">
      <IconButton
        icon={<RefreshCw />}
        aria-label="Перезагрузить приложение"
        className={className}
        onClick={() => window.location.reload()}
      />
    </Tooltip>
  );
}
