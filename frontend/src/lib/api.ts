import axios from 'axios';
import { config } from './config';
import { demoAdapter } from './demoApi';

const api = axios.create({
  baseURL: config.apiUrl,
  adapter: config.isDemoMode ? demoAdapter : undefined,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Injeta token em todas as requisições
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Trata erros globais
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = `${config.appBasePath}login`;
    }
    return Promise.reject(error);
  }
);

export default api;
