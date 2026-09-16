'use client';

import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from '@dissafyt/ui';

export interface PasswordInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  id?: string;
}

export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className = '', id = 'password', ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
      <div className="relative w-full">
        <Input
          ref={ref}
          id={id}
          type={showPassword ? 'text' : 'password'}
          className={`pr-10 ${className}`}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShowPassword((prev) => !prev)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded p-0.5 transition-colors"
          aria-label={showPassword ? 'Hide password' : 'Show password'}
          title={showPassword ? 'Hide password' : 'Show password'}
          tabIndex={-1}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4 text-amber-500" />
          ) : (
            <Eye className="h-4 w-4 text-zinc-400" />
          )}
        </button>
      </div>
    );
  }
);

PasswordInput.displayName = 'PasswordInput';
