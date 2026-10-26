import React, { ReactNode } from 'react';
import { LucideIcon, Inbox } from 'lucide-react';
import '../../styles/components.css';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Inbox,
  title,
  description,
  action,
}) => {
  return (
    <div className="empty-state">
      <div className="empty-state__icon-wrapper">
        <Icon className="empty-state__icon" />
      </div>
      <h3 className="empty-state__title">{title}</h3>
      <p className="empty-state__description">{description}</p>
      {action && <div className="empty-state__action">{action}</div>}
    </div>
  );
};
