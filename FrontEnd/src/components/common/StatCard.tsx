import React, { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import '../../styles/components.css';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color?: 'amber' | 'emerald' | 'sky' | 'rose' | 'purple';
  children?: ReactNode;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'amber',
  children,
}) => {
  return (
    <div className={`stat-card stat-card--${color}`}>
      <div className="stat-card__header">
        <div className="stat-card__info">
          <p className="stat-card__title">{title}</p>
          <p className="stat-card__value">{value}</p>
        </div>
        <div className={`stat-card__icon-wrapper stat-card__icon-wrapper--${color}`}>
          <Icon className="stat-card__icon" />
        </div>
      </div>
      {subtitle && <p className="stat-card__subtitle">{subtitle}</p>}
      {children}
    </div>
  );
};
