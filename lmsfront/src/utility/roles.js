export const PORTAL_ROLES = {
  user: "ROLE_PORTAL_USER",
  teacher: "ROLE_PORTAL_TEACHER", 
  moderator: "ROLE_PORTAL_MODERATOR",
  admin: "ROLE_PORTAL_ADMIN"
};

// Хелпер для проверки ролей
export const roleHelpers = {
  // Проверка конкретной роли
  hasRole: (userRole, targetRole) => {
    return userRole === targetRole;
  },

  // Проверка, является ли пользователь админом
  isAdmin: (userRole) => {
    return userRole === PORTAL_ROLES.admin;
  },

  // Проверка, является ли пользователь модератором или админом
  isModeratorOrHigher: (userRole) => {
    return userRole === PORTAL_ROLES.moderator || userRole === PORTAL_ROLES.admin;
  },

  // Проверка, является ли пользователь учителем или выше
  isTeacherOrHigher: (userRole) => {
    return userRole === PORTAL_ROLES.teacher || 
           userRole === PORTAL_ROLES.moderator || 
           userRole === PORTAL_ROLES.admin;
  },

  // Проверка на несколько ролей
  hasAnyRole: (userRole, allowedRoles) => {
    return allowedRoles.includes(userRole);
  },

  // Получение приоритета роли (для сравнения)
  getRolePriority: (userRole) => {
    const priorities = {
      [PORTAL_ROLES.user]: 1,
      [PORTAL_ROLES.teacher]: 2,
      [PORTAL_ROLES.moderator]: 3,
      [PORTAL_ROLES.admin]: 4
    };
    return priorities[userRole] || 0;
  },

  // Проверка, имеет ли пользователь больший или равный приоритет
  hasMinPriority: (userRole, minRole) => {
    return roleHelpers.getRolePriority(userRole) >= roleHelpers.getRolePriority(minRole);
  }
};

// React компонент для защиты контента по ролям
export const RoleGuard = ({ userRole, allowedRoles, children, fallback = null }) => {
  if (roleHelpers.hasAnyRole(userRole, allowedRoles)) {
    return children;
  }
  return fallback;
};

// Хук для работы с ролями
export const useRole = (userRole) => {
  return {
    role: userRole,
    isAdmin: roleHelpers.isAdmin(userRole),
    isModeratorOrHigher: roleHelpers.isModeratorOrHigher(userRole),
    isTeacherOrHigher: roleHelpers.isTeacherOrHigher(userRole),
    hasRole: (targetRole) => roleHelpers.hasRole(userRole, targetRole),
    hasAnyRole: (allowedRoles) => roleHelpers.hasAnyRole(userRole, allowedRoles),
    hasMinPriority: (minRole) => roleHelpers.hasMinPriority(userRole, minRole)
  };
};
