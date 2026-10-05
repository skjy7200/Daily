import React from 'react';
import './Layout.css';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="layout-container">
      <header className="layout-header">Pokedaily</header>
      <main className="layout-content">{children}</main>
    </div>
  );
};

export default Layout;
