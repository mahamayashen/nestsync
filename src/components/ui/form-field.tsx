"use client";

interface FormFieldProps {
  id: string;
  label: string;
  type?: string;
  name: string;
  placeholder?: string;
  required?: boolean;
  defaultValue?: string;
  error?: string;
  autoComplete?: string;
}

export function FormField({
  id,
  label,
  type = "text",
  name,
  placeholder,
  required,
  defaultValue,
  error,
  autoComplete,
}: FormFieldProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-text-primary">
        {label}
      </label>
      <input
        id={id}
        type={type}
        name={name}
        placeholder={placeholder}
        required={required}
        defaultValue={defaultValue}
        autoComplete={autoComplete}
        aria-describedby={error ? `${id}-error` : undefined}
        aria-invalid={error ? true : undefined}
        className="w-full px-3 py-2.5 rounded-lg border border-border text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow"
      />
      {error && (
        <p id={`${id}-error`} className="text-sm text-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
