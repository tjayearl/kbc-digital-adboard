import clsx from 'clsx';
import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';

type FieldShellProps = {
  label: string;
  children: React.ReactNode;
  hint?: string;
};

function FieldShell({ label, children, hint }: FieldShellProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-700">{label}</span>
      {children}
      {hint ? <span className="mt-2 block text-xs text-slate-500">{hint}</span> : null}
    </label>
  );
}

const controlClass =
  'min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-ink shadow-sm transition placeholder:text-slate-400 focus:border-gold focus:ring-2 focus:ring-gold/20';

type InputFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
};

export function InputField({ label, hint, className, ...props }: InputFieldProps) {
  return (
    <FieldShell label={label} hint={hint}>
      <input className={clsx(controlClass, className)} {...props} />
    </FieldShell>
  );
}

type SelectFieldProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  hint?: string;
  children: React.ReactNode;
};

export function SelectField({ label, hint, className, children, ...props }: SelectFieldProps) {
  return (
    <FieldShell label={label} hint={hint}>
      <select className={clsx(controlClass, className)} {...props}>
        {children}
      </select>
    </FieldShell>
  );
}

type TextareaFieldProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  hint?: string;
};

export function TextareaField({ label, hint, className, ...props }: TextareaFieldProps) {
  return (
    <FieldShell label={label} hint={hint}>
      <textarea className={clsx(controlClass, 'min-h-28', className)} {...props} />
    </FieldShell>
  );
}
