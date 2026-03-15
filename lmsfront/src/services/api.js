const API_URL = 'http://localhost:8000';

export const API = {
  base: API_URL,
  list_course: `${API_URL}/course/list`,
  detail_course: (slug) => `${API_URL}/course/?slug=${slug}`,
  token: `${API_URL}/auth/token/`,
  logout: `${API_URL}/auth/logout/`,
};
