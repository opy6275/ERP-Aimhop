"use client";

import { useState } from "react";
import { Eye, EyeOff } from "@/components/ui/icons";
import { inputClass } from "@/lib/form-styles";
import { cn } from "@/lib/utils";

type PasswordInputProps = {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  name?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  minLength?: number;
  className?: string;
  autoComplete?: string;
};

/**
 * Reusable enterprise password input with professional show/hide eye toggle.
 */
export function PasswordInput({
  value,
  onChange,
  id,
  name,
  placeholder = "Enter password",
  required = false,
  disabled = false,
  minLength,
  className,
  autoComplete = "new-password",
}: PasswordInputProps) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative">
      <input
        id={id}
        name={name}
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        minLength={minLength}
        autoComplete={autoComplete}
        className={cn(inputClass, "font-mono pr-10", className)}
      />
      <button
        type="button"
        tabIndex={-1}
        disabled={disabled}
        onClick={() => setShow(!show)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer p-0.5 rounded focus:outline-hidden disabled:opacity-40"
        title={show ? "Hide password" : "Show password"}
        aria-label={show ? "Hide password" : "Show password"}
      >
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}
