import { API } from '../services/api.js';
import toast from 'react-hot-toast';
import { authFetch } from '../services/authFetch';

export const useTeacher = () => {
  const getToken = () => localStorage.getItem('access_token');

  const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch(API.create_course_image, {
      method: "POST",
      headers: { "Authorization": `Bearer ${getToken()}` },
      body: formData,
    });
    if (!response.ok) throw new Error('Ошибка загрузки изображения');
    const data = await response.json();
    return data.image_url;
  };

  const createCourse = async (formData, imageFile) => {
    let imageUrl = formData.image;
    if (imageFile) imageUrl = await uploadImage(imageFile);

    const response = await authFetch(API.create_course, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${getToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: formData.name,
        slug: formData.slug,
        short_description: formData.short_description,
        description: formData.description,
        image: imageUrl,
        price: formData.price,
        status: formData.status,
        display_order: formData.display_order,
        category_ids: formData.category_ids,
        teacher_ids: formData.teacher_ids,
      }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Ошибка создания');
    }
    toast.success('Курс создан');
    return await response.json();
  };

  const updateCourse = async (id, formData, imageFile) => {
    let imageUrl = formData.image;
    if (imageFile) imageUrl = await uploadImage(imageFile);

    const response = await authFetch(`${API.update_course}?id=${id}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${getToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: formData.name,
        short_description: formData.short_description,
        description: formData.description,
        image: imageUrl,
        price: formData.price,
        status: formData.status,
        display_order: formData.display_order,
        category_ids: formData.category_ids,
      }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Ошибка обновления');
    }
    toast.success('Курс обновлён');
    return await response.json();
  };

  const teachingCourseDetail = async (slug, { setCourse, setLoading, navigate, toast }) => {
    try {
      const response = await authFetch(API.teaching_course(slug));
      if (!response.ok) throw new Error('Курс не найден');
      const data = await response.json();
      setCourse(data);
    } catch (err) {
      toast.error('Не удалось загрузить курс');
      console.log(err.message);
      navigate('/teaching');
    } finally {
      setLoading(false);
    }
  };

  const createModule = async(course_id, formData) => {
    const response = await authFetch(API.create_module, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${getToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        course_id: course_id,
        name: formData.name,
        description: formData.description,
        slug: formData.slug,
        display_order: formData.display_order
      }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Ошибка создания');
    }
    toast.success('Модуль создан');
    return await response.json();
  }
  const getModule = async(module_id, {setModule}) => {
    const response = await authFetch(API.get_module(module_id));
    if (!response.ok) throw new Error('Ошибка получения');
    const data = await response.json();
    setModule(data); 
  }

  const getModuleSlug = async(module_slug, {setModule}) => {
    const response = await authFetch(API.get_module_slug(module_slug));
    if (!response.ok) throw new Error('Ошибка получения');
    const data = await response.json();
    setModule(data); 
  }

  const updateModule = async (module_id, formData) => {
    const response = await authFetch(API.update_module(module_id), {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${getToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Ошибка обновления');
    }
    toast.success('Модуль обновлён');
    return await response.json();
  };

  const deleteModule = async(module_id) => {
    const response = await authFetch(API.delete_module(module_id), {
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
    toast.success('Модуль удален');
    return await response.json();
  }
  
  const createLesson = async(lesson_id, formData) => {
    const response = await authFetch(API.create_lesson, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${getToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Ошибка создания');
    }
    toast.success('Урок создан');
    return await response.json();
  }

  const deleteLesson = async(lesson_id) => {
    const response = await authFetch(API.delete_lesson(lesson_id), {
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
    toast.success('Урок удален');
    return await response.json();
  }

  return { createCourse, updateCourse, teachingCourseDetail, createModule, getModule, getModuleSlug, updateModule, deleteModule, createLesson, deleteLesson, uploadImage };
};

