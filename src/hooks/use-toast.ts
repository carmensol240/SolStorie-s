import * as React from "react";
import { toast as sonnerToast } from "sonner";

/**
 * Compatibility shim — the entire app now uses `sonner` for toasts.
 * This hook preserves the legacy `useToast()` / `toast()` API so existing
 * call sites keep working while only one toast system actually renders.
 */

type ToastVariant = "default" | "destructive" | "success" | undefined;

type ToastInput = {
  title?: React.ReactNode;
  description?: React.ReactNode;
  variant?: ToastVariant;
  duration?: number;
  action?: unknown;
};

function renderToast({ title, description, variant, duration }: ToastInput) {
  const message = (title ?? description ?? "") as React.ReactNode;
  const opts: { description?: React.ReactNode; duration?: number } = {};
  if (title && description) opts.description = description;
  if (typeof duration === "number") opts.duration = duration;

  const id =
    variant === "destructive"
      ? sonnerToast.error(message, opts)
      : variant === "success"
        ? sonnerToast.success(message, opts)
        : sonnerToast(message, opts);

  return {
    id: String(id),
    dismiss: () => sonnerToast.dismiss(id),
    update: (next: ToastInput) => {
      sonnerToast.dismiss(id);
      renderToast(next);
    },
  };
}

function toast(input: ToastInput) {
  return renderToast(input);
}

function useToast() {
  return {
    toast,
    dismiss: (toastId?: string | number) => sonnerToast.dismiss(toastId),
    toasts: [] as never[],
  };
}

export { useToast, toast };
