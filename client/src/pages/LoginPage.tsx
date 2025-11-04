import React from 'react';
import { useAuth } from '../context/AuthContext';
import '../styles/LoginPage.css';

const LoginPage: React.FC = () => {
  const { login } = useAuth();

  return (
    <div className="login-page">
      <div className="login-container">
        <h1>Hydrater</h1>
        <p className="subtitle">
          X (Twitter) content automation platform
        </p>
        <button onClick={login} className="btn-primary">
          Login with X
        </button>
      </div>
    </div>
  );
};

export default LoginPage;
