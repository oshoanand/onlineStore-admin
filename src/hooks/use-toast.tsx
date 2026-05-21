"use client";

import { toast as sonnerToast, type ExternalToast } from "sonner";
import { CheckCircle, AlertCircle, Info } from "lucide-react";

// Define the shape of the Action used in your app
type ToastAction = {
  label: string;
  onClick: () => void;
};

// Combine Sonner's native props with your custom variants
type ToastProps = {
  title?: React.ReactNode;
  description?: React.ReactNode;
  variant?: "default" | "destructive" | "success" | "info";
  action?: ToastAction;
} & ExternalToast;

function toast({ title, description, variant, action, ...props }: ToastProps) {
  // 1. Handle "Destructive" (Error) Variant - Red
  if (variant === "destructive") {
    return sonnerToast.error(title, {
      description,
      action,
      icon: <AlertCircle className="w-5 h-5 text-red-600!" />,
      className:
        "group !border-red-200 !bg-red-50 !text-red-800 dark:!bg-red-900/20 dark:!border-red-900 dark:!text-red-200",
      ...props,
    });
  }

  // 2. Handle "Success" Variant - Green
  if (variant === "success") {
    return sonnerToast.success(title, {
      description,
      action,
      icon: <CheckCircle className="w-5 h-5 text-green-600!" />,
      className:
        "group !border-green-200 !bg-green-50 !text-green-800 dark:!bg-green-900/20 dark:!border-green-900 dark:!text-green-200",
      ...props,
    });
  }

  // 3. Handle "Info" Variant - Blue
  if (variant === "info") {
    return sonnerToast.info(title, {
      description,
      action,
      icon: <Info className="w-5 h-5 text-blue-600!" />,
      className:
        "group !border-blue-200 !bg-blue-50 !text-blue-800 dark:!bg-blue-900/20 dark:!border-blue-900 dark:!text-blue-200",
      ...props,
    });
  }

  // 4. Default Variant (Standard/White/Black)
  return sonnerToast(title, {
    description,
    action,
    ...props,
  });
}

function useToast() {
  return {
    toast,
    dismiss: (toastId?: string | number) => sonnerToast.dismiss(toastId),
  };
}

export { useToast, toast };
