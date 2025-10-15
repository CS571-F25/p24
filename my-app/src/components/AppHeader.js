import './AppHeader.css';

const AppHeader = () => (
  <header className="app-header">
    <div className="app-header__titles">
      <h1>SafeCommute</h1>
      <p>Plan safer walks with community-powered insights.</p>
    </div>
    <div className="app-header__meta">
      <span className="app-badge">Beta</span>
      <span className="app-version">v0.1</span>
    </div>
  </header>
);

export default AppHeader;
