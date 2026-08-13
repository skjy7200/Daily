import './Layout.css';

const Layout = ({ children }) => {
  return (
    <div className="layout-container">
      <header className="layout-header">Pokedaily</header>
      <main className="layout-content">{children}</main>
    </div>
  );
};

export default Layout;
