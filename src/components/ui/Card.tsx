import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'interactive' | 'accent';
  glow?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  glow = false,
  className = '',
  ...props
}) => {
  const variantStyles = {
    default: 'bg-[#14141A] border-[#22222E]',
    elevated: 'bg-[#181820] border-[#2B2B3A] shadow-xl shadow-black/40',
    interactive:
      'bg-[#14141A] border-[#22222E] hover:border-[#7B2CF6]/50 hover:shadow-lg hover:shadow-[#7B2CF6]/10 transition-all duration-200 cursor-pointer',
    accent: 'bg-[#17141E] border-[#7B2CF6]/30 shadow-lg shadow-[#7B2CF6]/5',
  };

  const glowStyle = glow ? 'relative after:absolute after:inset-0 after:rounded-2xl after:pointer-events-none after:ring-1 after:ring-[#7B2CF6]/40' : '';

  return (
    <div
      className={`rounded-2xl border p-5 text-white ${variantStyles[variant]} ${glowStyle} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<{
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}> = ({ title, subtitle, action, className = '' }) => (
  <div className={`flex items-start justify-between gap-4 pb-4 border-b border-[#22222E] ${className}`}>
    <div>
      <h3 className="text-base font-bold text-white tracking-wide">{title}</h3>
      {subtitle && <p className="text-xs text-zinc-400 mt-0.5">{subtitle}</p>}
    </div>
    {action && <div className="shrink-0">{action}</div>}
  </div>
);

export const CardBody: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => <div className={`pt-4 ${className}`}>{children}</div>;
