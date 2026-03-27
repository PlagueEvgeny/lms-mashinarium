const API_URL = 'http://localhost:8000';

export const API = {
  base: API_URL,

  category_all: `${API_URL}/category/all/`,

  create_course: `${API_URL}/course/`,
  update_course: `${API_URL}/course/`,
  create_course_image: `${API_URL}/course/upload-image/`,
  list_course: `${API_URL}/course/list`,

  dashboard: `${API_URL}/course/educations`,
  user_course: (slug) => `${API_URL}/course/educations/${slug}`,
  user_course_lesson: (slug) => `${API_URL}/lesson/student/${slug}`,
  practica_my_submission: (lesson_slug) => `${API_URL}/practica/${lesson_slug}/submissions/me`,
  practica_submit: (lesson_slug) => `${API_URL}/practica/${lesson_slug}/submissions`,
  complete_lesson: (lesson_slug) => `${API_URL}/lessons/complete/${lesson_slug}`,
  course_progress: (slug) => `${API_URL}/lessons/progress/${slug}`,

  teaching: `${API_URL}/course/teachers`,
  teaching_course: (slug) => `${API_URL}/course/teachers/${slug}`,
  detail_course: (slug) => `${API_URL}/course/?slug=${slug}`,

  create_module: `${API_URL}/module`,
  get_module: (id) => `${API_URL}/module/?id=${id}`,
  get_module_slug: (slug) => `${API_URL}/module/by_slug/${slug}`,
  update_module: (id) => `${API_URL}/module/?id=${id}`,
  delete_module: (id) => `${API_URL}/module/?id=${id}`,
  
  create_lesson_image: `${API_URL}/lesson/upload-image/`,
  create_lesson: `${API_URL}/lesson`,
  create_practica_lesson: `${API_URL}/lesson/practica/`,
  get_lesson_id: (id) => `${API_URL}/lesson/?lesson_id=${id}`,
  get_lesson_slug: (slug) => `${API_URL}/lesson/by-slug/${slug}`,
  update_lesson: (id) => `${API_URL}/lesson/?lesson_id=${id}`,
  update_practica_lesson: (slug) => `${API_URL}/lesson/practica/${slug}`,
  upload_lesson_materials: (slug) => `${API_URL}/lesson/materials/${slug}`,
  delete_lesson: (id) => `${API_URL}/lesson/?lesson_id=${id}`,
  
  user: `${API_URL}/user/me`,
  user_change_password: `${API_URL}/user/me/change_password`,
  token: `${API_URL}/auth/token`,   
  refresh: `${API_URL}/auth/refresh`, 
  logout: `${API_URL}/auth/logout`,   
};
