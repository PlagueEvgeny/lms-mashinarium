import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginPage from './page/LoginPage';
import CoursesPage from './page/CoursesPage';
import CourseDetailPage from './page/CourseDetailPage';


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<CoursesPage />} />
        <Route path="/courses/:slug" element={<CourseDetailPage />} />
        <Route path="/login" element={<LoginPage />} />
      </Routes>
    </Router>
  );
}

export default App;
