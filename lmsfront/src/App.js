// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/login" element={<LoginPage />} />
          {/* Добавьте другие маршруты здесь */}
          {/* <Route path="/dashboard" element={<DashboardPage />} /> */}
          {/* <Route path="/courses" element={<CoursesPage />} /> */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;