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
  practica_submissions_teacher: (lesson_slug) => `${API_URL}/practica/${lesson_slug}/submissions`,
  practica_submissions_teacher_course: (course_slug) => `${API_URL}/practica/course/${course_slug}/submissions`,
  practica_grade: (lesson_slug, student_user_id) => `${API_URL}/practica/${lesson_slug}/submissions/${student_user_id}/grade`,
  test_check: (lesson_slug) => `${API_URL}/lesson/test/${lesson_slug}/check`,
  test_result: (lesson_slug) => `${API_URL}/lesson/test/${lesson_slug}/result`,
  test_submissions_teacher: (lesson_slug) => `${API_URL}/lesson/test/${lesson_slug}/submissions`,
  test_submissions_teacher_course: (course_slug) => `${API_URL}/lesson/test/course/${course_slug}/submissions`,
  complete_lesson: (lesson_slug) => `${API_URL}/lessons/complete/${lesson_slug}`,
  course_progress: (slug) => `${API_URL}/lessons/progress/${slug}`,
  course_progress_full: (slug) => `${API_URL}/lessons/progress-full/${slug}`,

  teaching: `${API_URL}/course/teachers`,
  teaching_course: (slug) => `${API_URL}/course/teachers/${slug}`,
  detail_course: (slug) => `${API_URL}/course/?slug=${slug}`,

  create_module: `${API_URL}/module`,
  get_module: (id) => `${API_URL}/module/?id=${id}`,
  get_module_slug: (slug) => `${API_URL}/module/by_slug/${slug}`,
  update_module: (id) => `${API_URL}/module/?id=${id}`,
  delete_module: (id) => `${API_URL}/module/?id=${id}`,
  
  create_lesson_image: `${API_URL}/lesson/upload-image/`,
  create_lesson: `${API_URL}/lesson/`,
  create_practica_lesson: `${API_URL}/lesson/practica/`,
  get_lesson_id: (id) => `${API_URL}/lesson/?lesson_id=${id}`,
  get_lesson_slug: (slug) => `${API_URL}/lesson/by-slug/${slug}`,
  update_lesson: (id) => `${API_URL}/lesson/?lesson_id=${id}`,
  update_practica_lesson: (slug) => `${API_URL}/lesson/practica/${slug}`,
  upload_lesson_materials: (slug) => `${API_URL}/lesson/materials/${slug}`,
  delete_lesson: (id) => `${API_URL}/lesson/?lesson_id=${id}`,

  dialogs: `${API_URL}/dialog/list`,
  dialog: (slug) => `${API_URL}/dialog/${slug}`,
  ws_dialog: (slug) => `ws://localhost:8000/ws/dialogs/${slug}`,
  
  user: `${API_URL}/user/me`,
  user_upload_image: `${API_URL}/user/upload-image/`,
  user_change_password: `${API_URL}/user/me/change_password`,

  list_user: `${API_URL}/user/all`,

  token: `${API_URL}/auth/token`,   
  refresh: `${API_URL}/auth/refresh`, 
  logout: `${API_URL}/auth/logout`,   
};
