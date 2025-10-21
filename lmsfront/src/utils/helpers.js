import defaultAvatar from '../images/default-avatar.jpg';
import { API } from '../config/api.js';

export const getAvatarUrl = (avatarPath) => {
  if (!avatarPath || avatarPath === 'null' || avatarPath === 'undefined') {
    return defaultAvatar;
  }
  
  if (avatarPath.startsWith('http') || avatarPath.startsWith('data:')) {
    return avatarPath;
  }
  
  // Убираем лишние слеши в пути
  const cleanPath = avatarPath.replace(/^\/+/, '');
  return `${API.base}/${cleanPath}`;
};