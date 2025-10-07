import React from 'react';
import '../css/MainLayout.css';

const MainLayout = ({ children }) => {
  return (
    <div className="main-layout">
      {/* Верхняя панель навигации */}
      <div className="top-nav">
        <div className="nav-left">
          <span className="lms-title">Mashinarium</span>
        </div>
        <div className="nav-center">
          <div className="nav-submenu">
            <span>Assets</span>
            <span>Pages</span>
            <span>Desktop</span>
            <span>Mobile</span>
          </div>
        </div>
        <div className="nav-right">
          <div className="upgrade-banner">
            <span>You page left.</span>
            <span className="upgrade-text">Get unlimited pages & more</span>
          </div>
        </div>
      </div>

      {/* Легенда/навигация */}
      <div className="legend-nav">
        {[
          'Badmz',
          'Kype - подробнее',
          'Прочие',
          'Регистрация',
          'Профиль - Личная информация',
          'Чет',
          'Четы',
          'Профиль - Авторизация',
          'Каталог курсов',
          'Моя обучение - курс (тестирование)',
          'Моя обучение - курс (практика)'
        ].map((item, index) => (
          <span key={index} className="legend-item">{item}</span>
        ))}
      </div>

      {/* Основной контент */}
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

export default MainLayout;