import React from 'react';
import '../../styles/components.css';

interface StatusBadgeProps {
  status: string;
  type?: 'estado' | 'riesgo';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type = 'estado' }) => {
  const normalized = status.toUpperCase();

  let modifierClass = 'status-badge--neutral';

  if (type === 'riesgo') {
    switch (normalized) {
      case 'BAJO':
        modifierClass = 'status-badge--success';
        break;
      case 'MEDIO':
        modifierClass = 'status-badge--warning';
        break;
      case 'ALTO':
        modifierClass = 'status-badge--high';
        break;
      case 'CRITICO':
        modifierClass = 'status-badge--critical';
        break;
    }
  } else {
    switch (normalized) {
      case 'PAGADA':
      case 'APROBADA':
        modifierClass = 'status-badge--success';
        break;
      case 'PENDIENTE':
        modifierClass = 'status-badge--warning';
        break;
      case 'RECHAZADA':
      case 'ANULADA':
        modifierClass = 'status-badge--error';
        break;
    }
  }

  return (
    <span className={`status-badge ${modifierClass}`}>
      <span className="status-badge__dot" />
      {normalized}
    </span>
  );
};
