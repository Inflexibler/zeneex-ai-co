import { forwardRef, InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = "", id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    const baseStyles =
      "w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-offset-0 transition-all disabled:opacity-50 disabled:cursor-not-allowed";

    const variantStyles = error
      ? "border-error focus:border-error focus:ring-error/20"
      : "border-neutral-300 focus:border-primary focus:ring-primary/20";

    const classes = `${baseStyles} ${variantStyles} ${className}`.trim();

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-neutral-700 mb-1">
            {label}
          </label>
        )}

        <input
          ref={ref}
          id={inputId}
          className={classes}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={
            error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
          }
          {...props}
        />

        {error && (
          <p id={`${inputId}-error`} className="mt-1 text-sm text-error">
            {error}
          </p>
        )}

        {helperText && !error && (
          <p id={`${inputId}-helper`} className="mt-1 text-sm text-neutral-500">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
