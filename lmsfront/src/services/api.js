const API_URL = 'http://localhost:8000';

export const API = {
  base: API_URL,

  category_all: `${API_URL}/category/all/`,

  create_course: `${API_URL}/course/`,
  create_course_image: `${API_URL}/course/upload-image/`,
  list_course: `${API_URL}/course/list`,
  dashboard: `${API_URL}/course/educations`,
  teaching: `${API_URL}/course/teachers`,
  user_course: (slug) => `${API_URL}/course/educations/${slug}`,
  detail_course: (slug) => `${API_URL}/course/?slug=${slug}`,
  
  user: `${API_URL}/user/me`,
  user_change_password: `${API_URL}/user/me/change_password`,
  token: `${API_URL}/auth/token`,   
  refresh: `${API_URL}/auth/refresh`, 
  logout: `${API_URL}/auth/logout`,   
};
