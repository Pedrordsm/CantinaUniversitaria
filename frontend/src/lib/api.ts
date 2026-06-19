import axios from 'axios';
import { config } from './config';
import { demoAdapter } from './demoApi';

const api = axios.create({
  baseURL: '/api',
  // Remove o adapter demo para usar o backend real.
  // Defina isDemoMode: true em config.ts para voltar ao modo offline.
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
      // Não redireciona se já está na página de login ou registro
      const isAuthPage = window.location.pathname.includes('login') || window.location.pathname.includes('register');
      if (!isAuthPage) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = `${config.appBasePath}login`;
      }
    }
    return Promise.reject(error);
  }
);

export default api;
