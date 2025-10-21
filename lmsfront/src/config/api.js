const API_URL = 'http://127.0.0.1:5000';

export const API = {
  base: API_URL,
  token: `${API_URL}/auth/api/token/`,
  user: `${API_URL}/auth/users/me/`, // Только для получения данных
  logout: `${API_URL}/auth/api/logout/`,
  register: `${API_URL}/auth/users/create/`,
  check_email: `${API_URL}/auth/users/check_email/`,
  set_password: `${API_URL}/auth/users/set_password/`,
  
  // Эндпоинты для операций с пользователем
  userUpdate: (userId) => `${API_URL}/auth/users/${userId}/update/`,
  userPartialUpdate: (userId) => `${API_URL}/auth/users/${userId}/partial-update/`,
  userDelete: (userId) => `${API_URL}/auth/users/${userId}/delete/`,
};