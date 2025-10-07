import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/MainLayout';
import '../css/HomePage.css';
import VKLogo from '../images/vk-logo.png';


const HomePage = () => {
  const navigate = useNavigate();
  const [courses] = useState([
    { id: 1, title: 'Искусственный интеллект на Python', logo: VKLogo },
    { id: 2, title: 'Rust — основы языка программирования', logo: VKLogo },
    { id: 3, title: 'Программирование на Arduino', logo: VKLogo },
    { id: 4, title: 'Искусственный интеллект на Python', logo: VKLogo },
    { id: 5, title: 'Rust — основы языка программирования', logo: VKLogo },
    { id: 6, title: 'Программирование на Arduino', logo: VKLogo },
  ]);

  useEffect(() => {
    const token = localStorage.getItem('access');
    if (!token) navigate('/login');
  }, [navigate]);

  return (
    <MainLayout>
      <h1 className="home-heading">Курсы</h1>

      <div className="courses-grid">
        {courses.map((course) => (
          <div key={course.id} className="course-card">
            <img src={course.logo} alt={course.title} className="course-icon" />
            <p className="course-title">{course.title}</p>
          </div>
        ))}
      </div>
    </MainLayout>
  );
};

export default HomePage;
