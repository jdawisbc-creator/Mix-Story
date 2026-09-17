import React from 'react';

export interface PageHeaderProps {
  title: string;
  description: string;
  actions?: React.ReactNode;
  badge?: React.ReactNode;
  breadcrumbs?: { label: string; href?: string }[];
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  actions,
  badge,
  breadcrumbs,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 mb-6 border-b border-[#20202C] ${className}`}
    >
      <div className="space-y-1">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="flex items-center gap-1.5 text-xs text-zinc-400 mb-1">
            {breadcrumbs.map((crumb, i) => (
              <React.Fragment key={i}>
                {i > 0 && <span className="text-zinc-600">/</span>}
                <span className={i === breadcrumbs.length - 1 ? 'text-[#FF8A00] font-medium' : ''}>
                  {crumb.label}
                </span>
              </React.Fragment>
            ))}
          </nav>
        )}
        <div className="flex items-center gap-3">
          <h1
            className="text-2xl md:text-3xl font-extrabold uppercase tracking-wider text-white"
            style={{ fontFamily: 'var(--font-heading, sans-serif)' }}
          >
            {title}
          </h1>
          {badge && <div>{badge}</div>}
        </div>
        <p className="text-sm text-zinc-400 max-w-2xl">{description}</p>
      </div>

      {actions && (
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
};
