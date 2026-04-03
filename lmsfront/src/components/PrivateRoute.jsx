import { useAuthUser } from '../hooks/useAuthUser';
import { Navigate, useLocation } from 'react-router-dom';
import { roleHelpers } from '../utility/roles';
import toast from 'react-hot-toast';
import { useEffect, useRef } from 'react';

const PrivateRoute = ({ children, allowedRoles = null }) => {
  const { user, loading } = useAuthUser();
  const location = useLocation();
  const shownRef = useRef(false);

  const isAuthenticated = !!user;
  const hasAccess =
    isAuthenticated &&
    (!allowedRoles || roleHelpers.hasAnyRole(user.roles, allowedRoles));

  useEffect(() => {
    if (!loading && isAuthenticated && !hasAccess && !shownRef.current) {
      toast.error('У вас нет доступа к этой странице');
      shownRef.current = true;
    }
  }, [loading, isAuthenticated, hasAccess]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!hasAccess) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return children;
};

export default PrivateRoute;
