import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import PrivateRoute from './components/PrivateRoute';
import LoginPage from './page/auth/LoginPage';
import ProfilePage from './page/profile/ProfilePage';
import CoursesPage from './page/courses/CoursesPage';
import CourseDetailPage from './page/courses/CourseDetailPage';
import DashboardPage from './page/user_courses/DashboardPage';
import UserCourse from './page/user_courses/UserCourse';
import UserLesson from './page/user_courses/UserLesson';
import TeachingPage from './page/teaching/TeachingPage';
import TeachingCoursesDetail from './page/teaching/TeachingCoursesDetail';
import CreateCoursesPage from './page/teaching/CreateCoursesPage';
import EditCoursesPage from './page/teaching/EditCoursesPage';
import EditModulePage from './page/teaching/EditModulePage';
import CreateLessonPage from './page/teaching/CreateLessonPage';
import EditLessonPage from './page/teaching/EditLessonPage';
import TeachingCourseStudentsPage from './page/teaching/TeachingCourseStudentsPage';
import TeachingPracticaCheckPage from './page/teaching/TeachingPracticaCheckPage';

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
        <Route path="/teaching/courses/:slug/modules/:module_slug/edit" element={<PrivateRoute><EditModulePage /></PrivateRoute>} />
        <Route path="/teaching/courses/:slug/modules/:module_slug/lessons/new" element={<PrivateRoute><CreateLessonPage /></PrivateRoute>} />
        <Route path="/teaching/courses/:slug/modules/:module_slug/lessons/:lesson_slug/edit" element={<PrivateRoute><EditLessonPage /></PrivateRoute>} />
        <Route path="/teaching/courses/:slug/students" element={<PrivateRoute><TeachingCourseStudentsPage /></PrivateRoute>} />
        <Route path="/teaching/courses/:slug/practica-check" element={<PrivateRoute><TeachingPracticaCheckPage /></PrivateRoute>} />
        <Route path="/user/courses/:slug" element={<PrivateRoute><UserCourse /></PrivateRoute>} />
        <Route path="/user/courses/:slug/modules/:module_slug/lessons/:lesson_slug" element={<PrivateRoute><UserLesson /></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
        <Route path="/login" element={<LoginPage />} />

      </Routes>
    </Router>
  );
}

export default App;
