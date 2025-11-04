import React from 'react';
import { useAuth } from '../../context/AuthContext';
import '../../styles/Navbar.css';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <h2>Hydrater</h2>
      </div>
      <div className="navbar-user">
        <span className="username">{user?.username || user?.displayName}</span>
        <button onClick={logout} className="btn-secondary btn-small">
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
