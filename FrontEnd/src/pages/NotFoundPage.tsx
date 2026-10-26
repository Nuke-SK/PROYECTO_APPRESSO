import React from 'react';
import { Link } from 'react-router-dom';
import { Coffee, ArrowLeft } from 'lucide-react';
import '../styles/notfound.css';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="notfound-page">
      <div className="notfound-page__icon-wrap">
        <Coffee className="notfound-page__icon" />
      </div>
      <h1 className="notfound-page__code">404</h1>
      <h2 className="notfound-page__title">Página no encontrada</h2>
      <p className="notfound-page__desc">
        La ruta solicitada no existe o ha sido movida dentro de la plataforma APPRESSO.
      </p>
      <Link
        to="/"
        className="notfound-page__btn"
      >
        <ArrowLeft className="notfound-page__btn-icon" />
        Volver al Inicio
      </Link>
    </div>
  );
};
