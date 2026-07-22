import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  pulse?: boolean;
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className = '', variant = 'default', pulse = false, children, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-widest uppercase transition-colors';
    
    const variants = {
      default: 'bg-gray-100 text-gray-700 border border-gray-200',
      primary: 'bg-primary/10 text-primary border border-primary/20',
      success: 'bg-success/10 text-success border border-success/20',
      warning: 'bg-warning/10 text-warning border border-warning/20',
      danger: 'bg-danger/10 text-danger border border-danger/20',
    };

    const pulseColors = {
      default: 'bg-gray-500',
      primary: 'bg-primary',
      success: 'bg-success',
      warning: 'bg-warning',
      danger: 'bg-danger',
    };

    return (
      <span
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${className}`}
        {...props}
      >
        {pulse && (
          <span className={`w-1.5 h-1.5 rounded-full mr-1.5 animate-pulse ${pulseColors[variant]}`}></span>
        )}
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';
