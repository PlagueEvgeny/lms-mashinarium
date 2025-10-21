import { API } from "../config/api.js";

export const apiClient = async (endpoint, { method = 'GET', body, token } = {}) => {
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const config = { method, headers };
  if (body) config.body = body;

  const res = await fetch(API + endpoint, config);

  const data = await res.json().catch(() => null);
  if (!res.ok) throw data || { error: 'Ошибка авторизации' };
  return data;
};
