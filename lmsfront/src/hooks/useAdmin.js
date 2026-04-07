import { useCallback } from 'react';
import { API } from '../services/api.js';
import toast from 'react-hot-toast';
import { authFetch } from '../services/authFetch';

export const useAdmin = () => {
  const getToken = () => localStorage.getItem('access_token');

  const fetchListUser = useCallback(async () => {
    try {
      const response = await authFetch(API.list_user); 

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Ошибка загрузки пользователей');
      }

      const data = await response.json();
      return data;

    } catch (err) {
      toast.error(err.message || 'Не удалось загрузить пользователей');
      throw err;
    }
  }, []);

  const setUserRole = async (user_id, roles) => {
    const response = await authFetch(`${API_URL}/user/roles/set?user_id=${user_id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roles }),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || 'Ошибка назначения роли');
    }
    toast.success('Роль назначена');
    return await response.json();
  };

  const deleteUser = async(user_id) => {
    const response = await authFetch(API.user_delete(user_id), {
      method:'DELETE',
      headers: {
        Authorization: `Bearer ${getToken()}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Ошибка удаление');
    }
    toast.success('Пользователь деактивирован');
    return await response.json();
  }

  const restoreUser = async(user_id) => {
    const response = await authFetch(API.user_restore(user_id), {
      method:'PATCH',
      headers: {
        Authorization: `Bearer ${getToken()}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Ошибка восстановления');
    }
    toast.success('Пользователь активирован');
    return await response.json();
  }
  
  const fetchListCourse = useCallback(async () => {
    try {
      const response = await authFetch(API.list_admin_course)
      if (!response.ok){
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Ошибка загрузки курсов");
      }
      const data = await response.json();
      return data;
    } catch (err) {
      toast.error(err.message || "Не удалось загрузить курсы")
      throw err;
    }
  }, []);

  const deleteCourse = async(course_id) => {
    const response = await authFetch(API.course_delete(course_id), {
      method:'DELETE',
      headers: {
        Authorization: `Bearer ${getToken()}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Ошибка удаление');
    }
    toast.success('Курс деактивирован');
    return await response.json();
  }

  const restoreCourse = async(course_id) => {
    const response = await authFetch(API.course_restore(course_id), {
      method:'PATCH',
      headers: {
        Authorization: `Bearer ${getToken()}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Ошибка восстановления');
    }
    toast.success('Курс активирован');
    return await response.json();
  }

  const addStudentToCourse = async (course_id, student_ids) => {
    const response = await authFetch(API.course_add_student(course_id), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ student_ids }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Ошибка добавления студента');
    }
    toast.success('Студент добавлен');
    return await response.json();
  };

  const removeStudentFromCourse = async (course_id, student_ids) => {
    const response = await authFetch(API.course_remove_student(course_id), {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ student_ids }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Ошибка удаления студента');
    }
    toast.success('Студент удалён');
    return await response.json();
  };

  const addTeacherToCourse = async (course_id, teacher_ids) => {
    const response = await authFetch(API.course_add_teacher(course_id), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teacher_ids }),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || 'Ошибка добавления преподавателя');
    }
    toast.success('Преподаватель добавлен');
    return await response.json();
  };

  const removeTeacherFromCourse = async (course_id, teacher_ids) => {
    const response = await authFetch(API.course_remove_teacher(course_id), {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teacher_ids }),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || 'Ошибка удаления преподавателя');
    }
    toast.success('Преподаватель удалён');
    return await response.json();
  };

  const fetchLogs = useCallback(async (lines) => {
    try {
      const response = await authFetch(API.admin_logs(lines))
      if (!response.ok){
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Ошибка загрузки log`s");
      }
      const data = await response.json();
      return data;
    } catch (err) {
      toast.error(err.message || "Не удалось загрузить log`s")
      console.log(err.message)
      throw err;
    }
  }, []);

  const fetchListLogs = useCallback(async () => {
    try {
      const response = await authFetch(API.admin_logs_all)
      if (!response.ok){
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Ошибка загрузки log`s");
      }
      const data = await response.json();
      return data;
    } catch (err) {
      toast.error(err.message || "Не удалось загрузить log`s")
      console.log(err.message)
      throw err;
    }
  }, []);

  const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch(API.admin_settings_logo, {
      method: "POST",
      headers: { "Authorization": `Bearer ${getToken()}` },
      body: formData,
    });
    if (!response.ok) throw new Error('Ошибка загрузки изображения');
    const data = await response.json();
    return data.image_url;
  };

  const fetchSettings = useCallback(async () => {
    try {
      const response = await authFetch(API.admin_settings);

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.detail || 'Ошибка загрузки настроек');
      }

      return await response.json();
    } catch (err) {
      toast.error(err.message || 'Не удалось загрузить настройки');
      throw err;
    }
  }, []);

  const updateSettings = async (form, files = {}) => {
    try {
      let logoUrl = form.logo_url;
      let logoHorizontalUrl = form.logo_horizontal_url;

      // 👇 загрузка файлов (если есть)
      if (files.logo_file) {
        logoUrl = await uploadImage(files.logo_file);
      }

      if (files.logo_horizontal_file) {
        logoHorizontalUrl = await uploadImage(files.logo_horizontal_file);
      }

      const response = await authFetch(API.admin_settings, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          logo_url: logoUrl,
          logo_horizontal_url: logoHorizontalUrl,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.detail || 'Ошибка сохранения настроек');
      }

      toast.success('Настройки сохранены');
      return await response.json();

    } catch (err) {
      toast.error(err.message || 'Ошибка сохранения');
      throw err;
    }
  };

  return {
    fetchListUser,
    setUserRole,
    restoreUser,
    deleteUser,
    fetchListCourse,
    restoreCourse,
    deleteCourse,
    addStudentToCourse,
    removeStudentFromCourse,
    addTeacherToCourse,
    removeTeacherFromCourse,
    fetchLogs,
    fetchListLogs,
    fetchSettings,
    updateSettings,
  };
};
