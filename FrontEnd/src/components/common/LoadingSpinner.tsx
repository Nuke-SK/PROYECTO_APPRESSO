import React from 'react';
import { Loader2 } from 'lucide-react';
import '../../styles/components.css';

interface LoadingSpinnerProps {
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  label = 'Cargando datos...',
  size = 'md',
}) => {
  return (
    <div className="loading-spinner">
      <Loader2 className={`loading-spinner__icon loading-spinner__icon--${size}`} />
      {label && <p className="loading-spinner__label">{label}</p>}
    </div>
  );
};
