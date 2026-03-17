import { useAuthUser } from '../hooks/useAuthUser';
import { Navigate } from 'react-router-dom';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuthUser();

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!user) return <Navigate to="/login" replace />;

  return children;
};

export default PrivateRoute;
