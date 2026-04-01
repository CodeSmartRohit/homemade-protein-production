import axios from 'axios';
import Cookies from 'js-cookie';

const getBaseUrl = () => {
  let url = process.env.NEXT_PUBLIC_API_URL || 'https://homemade-protein-production-production.up.railway.app/api';
  if (url.endsWith('/')) url = url.slice(0, -1);
  if (!url.endsWith('/api')) url = `${url}/api`;
  return url;
};

const api = axios.create({
  baseURL: getBaseUrl(),
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = Cookies.get('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    // Attempt token refresh on 401
    // (We'll assume backend has /auth/refresh logic that works via cookies or separate request)
    // For now we'll just reject the error, we can add a retry logic if specified.
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      // Depending on backend, if it uses HttpOnly refresh cookie, we might call a refresh endpoint here.
      // E.g. await axios.post('/auth/refresh')
      
      // For now, if 401, maybe logout user by removing token and redirecting.
      Cookies.remove('accessToken');
      if (typeof window !== 'undefined') {
        // window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
