import React from 'react';
import { ShieldCheck, Cpu, KeyRound } from 'lucide-react';
import '../../styles/layout.css';

export const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="footer__container">
        <div className="footer__copyright">
          <span className="footer__brand">APPRESSO</span> &copy; {new Date().getFullYear()} — Plataforma de Café Especial y POS Seguro.
        </div>

        <div className="footer__badges">
          <div className="footer__badge footer__badge--success">
            <ShieldCheck className="footer__badge-icon" />
            <span>Anti-Price Tampering Activo</span>
          </div>
          <div className="footer__badge footer__badge--warning">
            <KeyRound className="footer__badge-icon" />
            <span>Firma HMAC-SHA256</span>
          </div>
          <div className="footer__badge footer__badge--info">
            <Cpu className="footer__badge-icon" />
            <span>Detección por Ventana Deslizante</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
