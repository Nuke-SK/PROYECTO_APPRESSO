import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Coffee, ShoppingCart, ShieldAlert, FileText, Layers, LayoutDashboard } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import '../../styles/layout.css';

export const Navbar: React.FC = () => {
  const { totalArticulos } = useCart();

  const navLinks = [
    { to: '/', label: 'Catálogo', icon: ShoppingCart },
    { to: '/admin', label: 'Gestión Admin', icon: LayoutDashboard },
    { to: '/admin/categorias', label: 'Categorías', icon: Layers },
    { to: '/facturas', label: 'Facturas', icon: FileText },
    { to: '/seguridad', label: 'Anomalías / Seguridad', icon: ShieldAlert },
  ];

  return (
    <header className="navbar">
      <div className="navbar__container">
        <div className="navbar__inner">
          {/* Logo & Brand */}
          <Link to="/" className="navbar__brand">
            <div className="navbar__logo-icon">
              <Coffee className="navbar__coffee-icon" />
            </div>
            <div className="navbar__brand-text">
              <span className="navbar__brand-name">
                APPRESSO
              </span>
              <span className="navbar__brand-tag">
                POS & E-COMMERCE
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="navbar__nav">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === '/' || link.to === '/admin'}
                  className={({ isActive }) =>
                    `navbar__nav-link ${isActive ? 'navbar__nav-link--active' : ''}`
                  }
                >
                  <Icon className="navbar__nav-icon" />
                  {link.label}
                </NavLink>
              );
            })}
          </nav>

          {/* Actions: Cart Button */}
          <div className="navbar__actions">
            <Link
              to="/checkout"
              className="navbar__cart-btn"
            >
              <ShoppingCart className="navbar__cart-icon" />
              <span>Carrito</span>
              {totalArticulos > 0 && (
                <span className="navbar__cart-badge">
                  {totalArticulos}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};
