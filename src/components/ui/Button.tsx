import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'accent' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0D0D0D] disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98] whitespace-nowrap cursor-pointer';

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2.5',
  };

  const variantClasses = {
    // Roxo Principal #7B2CF6
    primary:
      'bg-[#7B2CF6] hover:bg-[#6D20E8] text-white shadow-lg shadow-[#7B2CF6]/25 hover:shadow-[#7B2CF6]/40 focus:ring-[#7B2CF6]',
    // Laranja Oficial #FF8A00 para ações de destaque e alertas
    accent:
      'bg-[#FF8A00] hover:bg-[#E67C00] text-black font-bold shadow-lg shadow-[#FF8A00]/25 hover:shadow-[#FF8A00]/40 focus:ring-[#FF8A00]',
    // Grafite escuro com borda suave roxa
    secondary:
      'bg-[#1A1A22] hover:bg-[#23232E] text-zinc-100 border border-[#2F2F3D] hover:border-[#7B2CF6]/60 focus:ring-zinc-600',
    // Destrutivo com confirmação
    danger:
      'bg-red-600/90 hover:bg-red-600 text-white shadow-lg shadow-red-600/20 focus:ring-red-500',
    ghost:
      'bg-transparent hover:bg-white/5 text-zinc-300 hover:text-white focus:ring-zinc-700',
    outline:
      'bg-transparent border border-[#7B2CF6] text-white hover:bg-[#7B2CF6]/10 focus:ring-[#7B2CF6]',
  };

  return (
    <button
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current" />
      ) : (
        icon && <span className="shrink-0">{icon}</span>
      )}
      {children}
    </button>
  );
};
