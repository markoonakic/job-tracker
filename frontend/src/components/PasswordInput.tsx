import { useState } from 'react';

interface Props {
  value: string;
  onChange: (value: string) => void;
  label: string;
  required?: boolean;
  autoComplete?: string;
}

export default function PasswordInput({ value, onChange, label, required = false, autoComplete }: Props) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div>
      <label className="block mb-1 text-sm font-semibold text-muted">
        {label}
      </label>
      <div className="relative">
        <input
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          autoComplete={autoComplete}
          className="w-full px-3 py-2 pr-10 bg-[#3c3836] border border-transparent rounded text-[#ebdbb2] placeholder-[#928374] focus:outline-none focus:border-[#8ec07c] transition-all duration-200"
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[#928374] hover:text-[#ebdbb2] transition-colors duration-200"
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'} text-lg`} />
        </button>
      </div>
    </div>
  );
}
