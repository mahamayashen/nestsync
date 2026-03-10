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
      <label htmlFor={id} className="block text-sm font-medium text-slate-700">
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
        className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
      />
      {error && (
        <p id={`${id}-error`} className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
