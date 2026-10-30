// Toasts: short notices in the bottom-right corner that close by themselves, with an optional action such as
// "Undo". A bar along the bottom shows the time left; hovering the toast pauses it.
import {createContext, useCallback, useContext, useState, type ReactNode} from "react";
import {createPortal} from "react-dom";

export type ToastOptions = {
  message: ReactNode;
  /** Text of the action button, e.g. "Отменить"; the toast closes when it is clicked. */
  actionLabel?: string;
  onAction?: () => void;
  /** Milliseconds until the toast closes by itself. Default 6000. */
  duration?: number;
};

type ToastItem = ToastOptions & {id: number};

const ToastContext = createContext<((options: ToastOptions) => void) | null>(null);
let nextId = 0;

/** Renders toasts shown with `useToast`. Already included in FiberyUIProvider. */
export function ToastProvider({children}: {children: ReactNode}) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const show = useCallback((options: ToastOptions) => setToasts((list) => [...list, {...options, id: ++nextId}]), []);
  const dismiss = (id: number) => setToasts((list) => list.filter((t) => t.id !== id));
  return (
    <ToastContext.Provider value={show}>
      {children}
      {createPortal(
        <div className="fui-toasts" role="region" aria-label="Уведомления">
          {toasts.map((t) => (
            <div key={t.id} className="fui-toast" role="status">
              <span className="fui-toast__message">{t.message}</span>
              {t.actionLabel && (
                <button
                  type="button"
                  className="fui-toast__action"
                  onClick={() => {
                    t.onAction?.();
                    dismiss(t.id);
                  }}
                >
                  {t.actionLabel}
                </button>
              )}
              {/* The bar's CSS animation is the timer: it pauses on hover, and its end closes the toast. */}
              <span
                className="fui-toast__progress"
                style={{["--fui-toast-duration" as string]: `${t.duration ?? 6000}ms`}}
                onAnimationEnd={() => dismiss(t.id)}
              />
            </div>
          ))}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
}

/**
 * Returns `toast(options)` to show a notice in the corner, e.g.
 * `toast({message: "Removed", actionLabel: "Undo", onAction: restore})`.
 */
export function useToast() {
  const show = useContext(ToastContext);
  if (!show) throw new Error("useToast() needs <FiberyUIProvider> (or <ToastProvider>) around the app");
  return show;
}
