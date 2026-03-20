import { API } from '../services/api.js';
import toast from 'react-hot-toast';

export const useTeacher = () => {
  const getToken = () => localStorage.getItem('access_token');

  const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(API.create_course_image, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${getToken()}`,
      },
      body: formData,
    });

    if (!response.ok) throw new Error('Ошибка загрузки изображения');
    const data = await response.json();
    return data.image_url;
  };

  const createCourse = async (formData, imageFile) => {
    let imageUrl = formData.image;

    if (imageFile) {
      imageUrl = await uploadImage(imageFile);
    }

    const response = await fetch(API.create_course, {
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

  return { createCourse, uploadImage };
};
