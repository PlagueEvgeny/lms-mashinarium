import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import ProfilePage from './pages/ProfilePage';
import RegisterPage from './pages/RegisterPage';
import MyCourse from './pages/MyCourse';
import TeacherPage from './pages/TeacherPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/my" element={<ProfilePage />} />
        <Route path="/my/course" element={<MyCourse />} />
        <Route path="/teacher" element={<TeacherPage />} />
      </Routes>
    </Router>
  );
}

export default App;
