// Copy-to-clipboard icon button: copies a value and confirms with a short toast. Compact (20px) like InlineEdit's
// button, so it fits a text line; where hover exists it shows only on hover of its row or parent, so long lists
// don't fill up with icons.
import type {KeyboardEvent, MouseEvent, ReactNode} from "react";
import {Copy} from "lucide-react";
import {cx} from "../cx";
import {IconButton} from "./Button";
import {useToast} from "./Toast";

export type CopyButtonProps = {
  /** Text put on the clipboard. */
  value: string;
  /** Toast after copying, e.g. "Номер скопирован". */
  message?: ReactNode;
  "aria-label"?: string;
  className?: string;
};

/** Icon button that copies `value` and shows `message` in a toast; clicks don't reach a clickable row around it. */
export function CopyButton({value, message = "Скопировано", "aria-label": ariaLabel = "Копировать", className}: CopyButtonProps) {
  const toast = useToast();
  const copy = (e: MouseEvent) => {
    // Rows around it usually open a panel on click; copying must not.
    e.stopPropagation();
    navigator.clipboard.writeText(value).then(
      () => toast({message, duration: 2500}),
      () => toast({message: "Не удалось скопировать"}),
    );
  };
  return (
    <IconButton
      icon={<Copy />}
      aria-label={ariaLabel}
      className={cx("fui-copy-button", className)}
      onClick={copy}
      // A row's Enter / Space handler would otherwise swallow the key and open the row instead.
      onKeyDown={(e: KeyboardEvent) => e.stopPropagation()}
    />
  );
}
