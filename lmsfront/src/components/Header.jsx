import React from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../images/logo.jpg';
import '../css/Header.css';

const Header = () => {
  const navigate = useNavigate();

  return (
    <header className="header">
      <div className="header-left" onClick={() => navigate('/home')}>
        <img src={logo} alt="Mashinarium IT-School" className="header-logo" />
        <span className="header-title">МАШИНАРИУМ IT-SCHOOL</span>
      </div>

      <nav className="header-nav">
        <button onClick={() => navigate('/home')}>Каталог курсов</button>
        <button onClick={() => navigate('/profile')}>Профиль</button>
      </nav>
    </header>
  );
};

export default Header;
