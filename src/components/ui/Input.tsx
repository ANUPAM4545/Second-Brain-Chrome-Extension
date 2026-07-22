import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', icon, error, helperText, ...props }, ref) => {
    return (
      <div className="w-full space-y-1">
        <div className="relative flex items-center group">
          {icon && (
            <div className="absolute left-4 text-gray-400 group-hover:text-primary transition-colors">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={`
              w-full bg-background border rounded-xl py-3 text-sm text-gray-900 
              placeholder-gray-500 outline-none transition-all shadow-inner
              focus:ring-1 
              ${icon ? 'pl-11 pr-4' : 'px-4'}
              ${
                error
                  ? 'border-danger focus:border-danger focus:ring-danger/50'
                  : 'border-border focus:border-primary/50 focus:ring-primary/50 group-hover:border-border/80'
              }
              ${className}
            `}
            {...props}
          />
        </div>
        {error && <p className="text-xs text-danger ml-1">{error}</p>}
        {helperText && !error && <p className="text-xs text-gray-400 ml-1">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
