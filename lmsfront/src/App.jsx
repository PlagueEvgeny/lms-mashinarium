import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import PrivateRoute from './components/PrivateRoute';
import LoginPage from './page/auth/LoginPage';
import ProfilePage from './page/profile/ProfilePage';
import CoursesPage from './page/courses/CoursesPage';
import CourseDetailPage from './page/courses/CourseDetailPage';
import DashboardPage from './page/user_courses/DashboardPage';
import UserCourse from './page/user_courses/UserCourse';
import TeachingPage from './page/teaching/TeachingPage';
import TeachingCoursesDetail from './page/teaching/TeachingCoursesDetail';
import CreateCoursesPage from './page/teaching/CreateCoursesPage';
import EditCoursesPage from './page/teaching/EditCoursesPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<PrivateRoute><CoursesPage /></PrivateRoute>} />
        <Route path="/courses/:slug" element={<PrivateRoute><CourseDetailPage /></PrivateRoute>} />
        <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
        <Route path="/teaching" element={<PrivateRoute><TeachingPage /></PrivateRoute>} />
        <Route path="/teaching/courses/:slug" element={<PrivateRoute><TeachingCoursesDetail /></PrivateRoute>} />
        <Route path="/teaching/courses/new" element={<PrivateRoute><CreateCoursesPage /></PrivateRoute>} />
        <Route path="/teaching/courses/:slug/edit" element={<PrivateRoute><EditCoursesPage /></PrivateRoute>} />
        <Route path="/user/courses/:slug" element={<PrivateRoute><UserCourse /></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><ProfilePage / > </PrivateRoute>} / >
        <Route path="/login" element={<LoginPage />} />

      </Routes>
    </Router>
  );
}

export default App;
