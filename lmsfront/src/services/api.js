const API_URL = 'http://localhost:8000';

export const API = {
  base: API_URL,

  category_all: `${API_URL}/category/all/`,

  create_course: `${API_URL}/course/`,
  update_course: `${API_URL}/course/`,
  create_course_image: `${API_URL}/course/upload-image/`,
  list_course: `${API_URL}/course/list`,
  dashboard: `${API_URL}/course/educations`,
  teaching: `${API_URL}/course/teachers`,
  teaching_course: (slug) => `${API_URL}/course/teachers/${slug}`,
  user_course: (slug) => `${API_URL}/course/educations/${slug}`,
  detail_course: (slug) => `${API_URL}/course/?slug=${slug}`,
  
  create_module: `${API_URL}/module`,
  get_module: (id) => `${API_URL}/module/?id=${id}`,
  get_module_slug: (slug) => `${API_URL}/module/by_slug/${slug}`,
  update_module: (id) => `${API_URL}/module/?id=${id}`,
  delete_module: (id) => `${API_URL}/module/?id=${id}`,

  create_lesson: `${API_URL}/lesson`,
  get_lesson_id: (id) => `${API_URL}/lesson/?lesson_id=${id}`,
  get_lesson_slug: (slug) => `${API_URL}/lesson/by-slug/${slug}`,
  delete_lesson: (id) => `${API_URL}/lesson/?lesson_id=${id}`,
  
  user: `${API_URL}/user/me`,
  user_change_password: `${API_URL}/user/me/change_password`,
  token: `${API_URL}/auth/token`,   
  refresh: `${API_URL}/auth/refresh`, 
  logout: `${API_URL}/auth/logout`,   
};
