import React from 'react';

export type BadgeVariant =
  | 'purple'
  | 'orange'
  | 'success'
  | 'warning'
  | 'danger'
  | 'neutral'
  | 'outline';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  className?: string;
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  className = '',
  dot = false,
}) => {
  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 gap-1.5',
    md: 'text-xs px-2.5 py-1 gap-1.5',
  };

  const variantClasses = {
    purple: 'bg-[#7B2CF6]/15 text-[#A76BFF] border border-[#7B2CF6]/30',
    orange: 'bg-[#FF8A00]/15 text-[#FF9E2C] border border-[#FF8A00]/30',
    success: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
    warning: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
    danger: 'bg-rose-500/15 text-rose-400 border border-rose-500/30',
    neutral: 'bg-zinc-800/70 text-zinc-300 border border-zinc-700/60',
    outline: 'bg-transparent text-zinc-300 border border-zinc-700',
  };

  const dotColors = {
    purple: 'bg-[#7B2CF6]',
    orange: 'bg-[#FF8A00]',
    success: 'bg-emerald-400',
    warning: 'bg-amber-400',
    danger: 'bg-rose-400',
    neutral: 'bg-zinc-400',
    outline: 'bg-zinc-300',
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full whitespace-nowrap select-none ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColors[variant]}`} />
      )}
      {children}
    </span>
  );
};
