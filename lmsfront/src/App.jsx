import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import PrivateRoute from './components/PrivateRoute';
import { PORTAL_ROLES } from './utility/roles';
import LoginPage from './page/auth/LoginPage';
import ProfilePage from './page/profile/ProfilePage';
import AdminPage from './page/admin/AdminPage';
import UserAdminPage from './page/admin/UserAdminPage';
import CourseAdminPage from './page/admin/CourseAdminPage';
import SettingAdminPage from './page/admin/SettingAdminPage';
import LogsAdminPage from './page/admin/LogsAdminPage';
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
import TeachingTestResultsPage from './page/teaching/TeachingTestResultsPage';
import CourseMessagesPage from './page/messages/CourseMessagesPage';
import DialogMessagePage from './page/messages/DialogMessagePage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<PrivateRoute><CoursesPage /></PrivateRoute>} />
        <Route path="/courses/:slug" element={<PrivateRoute><CourseDetailPage /></PrivateRoute>} />
        <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />

        <Route path="/teaching" element={<PrivateRoute allowedRoles={[PORTAL_ROLES.teacher, PORTAL_ROLES.moderator, PORTAL_ROLES.admin]}> <TeachingPage /> </PrivateRoute> } />
        <Route path="/teaching/courses/:slug" element={<PrivateRoute allowedRoles={[PORTAL_ROLES.teacher, PORTAL_ROLES.moderator, PORTAL_ROLES.admin]}><TeachingCoursesDetail /></PrivateRoute>} />
        <Route path="/teaching/courses/new" element={<PrivateRoute allowedRoles={[PORTAL_ROLES.teacher, PORTAL_ROLES.moderator, PORTAL_ROLES.admin]}><CreateCoursesPage /></PrivateRoute>} />
        <Route path="/teaching/courses/:slug/edit" element={<PrivateRoute allowedRoles={[PORTAL_ROLES.teacher, PORTAL_ROLES.moderator, PORTAL_ROLES.admin]}><EditCoursesPage /></PrivateRoute>} />
        <Route path="/teaching/courses/:slug/modules/:module_slug/edit" element={<PrivateRoute allowedRoles={[PORTAL_ROLES.teacher, PORTAL_ROLES.moderator, PORTAL_ROLES.admin]}><EditModulePage /></PrivateRoute>} />
        <Route path="/teaching/courses/:slug/modules/:module_slug/lessons/new" element={<PrivateRoute allowedRoles={[PORTAL_ROLES.teacher, PORTAL_ROLES.moderator, PORTAL_ROLES.admin]}><CreateLessonPage /></PrivateRoute>} />
        <Route path="/teaching/courses/:slug/modules/:module_slug/lessons/:lesson_slug/edit" element={<PrivateRoute allowedRoles={[PORTAL_ROLES.teacher, PORTAL_ROLES.moderator, PORTAL_ROLES.admin]}><EditLessonPage /></PrivateRoute>} />
        <Route path="/teaching/courses/:slug/students" element={<PrivateRoute allowedRoles={[PORTAL_ROLES.teacher, PORTAL_ROLES.moderator, PORTAL_ROLES.admin]}><TeachingCourseStudentsPage /></PrivateRoute>} />
        <Route path="/teaching/courses/:slug/practica-check" element={<PrivateRoute allowedRoles={[PORTAL_ROLES.teacher, PORTAL_ROLES.moderator, PORTAL_ROLES.admin]}><TeachingPracticaCheckPage /></PrivateRoute>} />
        <Route path="/teaching/courses/:slug/test-results" element={<PrivateRoute allowedRoles={[PORTAL_ROLES.teacher, PORTAL_ROLES.moderator, PORTAL_ROLES.admin]}><TeachingTestResultsPage /></PrivateRoute>} />

        <Route path="/user/courses/:slug" element={<PrivateRoute><UserCourse /></PrivateRoute>} />
        <Route path="/user/courses/:slug/modules/:module_slug/lessons/:lesson_slug" element={<PrivateRoute><UserLesson /></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
        
        <Route path="/admin" element={<PrivateRoute allowedRoles={[PORTAL_ROLES.moderator, PORTAL_ROLES.admin]}><AdminPage /></PrivateRoute>} />
        <Route path="/admin/users" element={<PrivateRoute allowedRoles={[PORTAL_ROLES.moderator, PORTAL_ROLES.admin]}><UserAdminPage /></PrivateRoute>} />
        <Route path="/admin/courses" element={<PrivateRoute allowedRoles={[PORTAL_ROLES.moderator, PORTAL_ROLES.admin]}><CourseAdminPage /></PrivateRoute>} />
        <Route path="/admin/logs" element={<PrivateRoute allowedRoles={[PORTAL_ROLES.moderator, PORTAL_ROLES.admin]}><LogsAdminPage /></PrivateRoute>} />
        <Route path="/admin/settings" element={<PrivateRoute allowedRoles={[PORTAL_ROLES.moderator, PORTAL_ROLES.admin]}><SettingAdminPage /></PrivateRoute>} />

        <Route path="/login" element={<LoginPage />} />

        <Route path="/dialog" element={<PrivateRoute><CourseMessagesPage /></PrivateRoute>} />
        <Route path="/dialog/:dialog_slug" element={<PrivateRoute><DialogMessagePage /></PrivateRoute>} />
      </Routes>
    </Router>
  );
}

export default App;
