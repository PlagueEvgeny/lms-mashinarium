const API_URL = 'http://localhost:8000';

export const API = {
  base: API_URL,
  token: `${API_URL}/auth/token/`,
  user: `${API_URL}/user/me/`, // Только для получения данных
  logout: `${API_URL}/auth/logout/`,
  register: `${API_URL}/user/create/`,
  
  // Эндпоинты для операций с пользователем
  userUpdate: (userId) => `${API_URL}/auth/users/${userId}/update/`,
  userPartialUpdate: (userId) => `${API_URL}/auth/users/${userId}/partial-update/`,
  userDelete: (userId) => `${API_URL}/auth/users/${userId}/delete/`,
};
