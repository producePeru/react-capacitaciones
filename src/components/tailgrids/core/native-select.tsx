"use client";

import { cn } from "@/utils/cn";
import { cva, type VariantProps } from "class-variance-authority";
import type {
  OptgroupHTMLAttributes,
  OptionHTMLAttributes,
  SelectHTMLAttributes,
} from "react";

export const nativeSelectStyles = cva(
  "w-full appearance-none rounded-lg border bg-none bg-input-background py-2.5 pl-4 pr-10 text-sm text-[#124e78] outline-none transition focus:ring-2 disabled:pointer-events-none disabled:opacity-50 [&>option]:text-[#124e78]",
  {
    variants: {
      variant: {
        default:
          "border-[#c9d4dc] invalid:text-[#8a9aa6] focus:border-input-primary-focus-border focus:ring-input-primary-focus-border/20",
        error:
          "border-input-error invalid:text-[#8a9aa6] focus:border-input-error focus:ring-input-error/20",
        success:
          "border-input-success invalid:text-[#8a9aa6] focus:border-input-success focus:ring-input-success/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface NativeSelectProps
  extends SelectHTMLAttributes<HTMLSelectElement>,
    VariantProps<typeof nativeSelectStyles> {
  variant?: "default" | "error" | "success";
  placeholder?: string;
  wrapperClassName?: string;
}

export function NativeSelect({
  variant,
  placeholder,
  className,
  wrapperClassName,
  children,
  required,
  ...props
}: NativeSelectProps) {
  return (
    <div className={cn("relative w-full", wrapperClassName)}>
      <select
        required={required ?? !!placeholder}
        className={cn(nativeSelectStyles({ variant }), className)}
        {...props}
      >
        {placeholder && (
          <option value="" disabled hidden>
            {placeholder}
          </option>
        )}
        {children}
      </select>
      <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#5a7585]">
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 4.5L6 7.5L9 4.5" />
        </svg>
      </span>
    </div>
  );
}

export interface NativeSelectOptionProps
  extends OptionHTMLAttributes<HTMLOptionElement> {}

export function NativeSelectOption(props: NativeSelectOptionProps) {
  return <option {...props} />;
}

export interface NativeSelectOptGroupProps
  extends OptgroupHTMLAttributes<HTMLOptGroupElement> {}

export function NativeSelectOptGroup(props: NativeSelectOptGroupProps) {
  return <optgroup {...props} />;
}
