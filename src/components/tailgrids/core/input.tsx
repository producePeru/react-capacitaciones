"use client";

import { cn } from "@/utils/cn";
import { cva, type VariantProps } from "class-variance-authority";
import {
  Input as AriaInput,
  type InputProps as AriaInputProps,
} from "react-aria-components";

export const inputStyles = cva(
  "w-full rounded-lg border bg-input-background px-4 py-2.5 text-sm text-[#124e78] placeholder:text-input-placeholder-text outline-none transition focus:ring-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      state: {
        default:
          "border-[#c9d4dc] focus:border-input-primary-focus-border focus:ring-input-primary-focus-border/20",
        error:
          "border-input-error focus:border-input-error focus:ring-input-error/20",
        success:
          "border-input-success focus:border-input-success focus:ring-input-success/20",
      },
    },
    defaultVariants: {
      state: "default",
    },
  }
);

export interface InputProps
  extends Omit<AriaInputProps, "children">,
    VariantProps<typeof inputStyles> {
  state?: "default" | "error" | "success";
}

export function Input({ state, className, ...props }: InputProps) {
  return (
    <AriaInput
      className={cn(inputStyles({ state }), className)}
      {...props}
    />
  );
}
