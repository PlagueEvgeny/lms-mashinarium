import { API } from '../services/api';

export const refreshAccessToken = async () => {
  const response = await fetch(API.refresh, {
    method: 'POST',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Session expired');
  }

  const data = await response.json();
  localStorage.setItem('access_token', data.access_token);
  return data.access_token;
};

export const authFetch = async (url, options = {}) => {
  let token = localStorage.getItem('access_token');

  let response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
    credentials: 'include',
  });

  if (response.status === 401) {
    try {
      token = await refreshAccessToken();

      response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
      });
    } catch (err) {
      localStorage.removeItem('access_token');
      window.location.href = '/login';
      throw err;
    }
  }

  return response;
};
