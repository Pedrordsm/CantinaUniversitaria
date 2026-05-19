const isDemoMode = !import.meta.env.DEV && !import.meta.env.VITE_API_URL;
const apiUrl = import.meta.env.VITE_API_URL || '/api';
const socketUrl =
  import.meta.env.VITE_SOCKET_URL || (import.meta.env.DEV ? 'http://localhost:3001' : window.location.origin);
const appBasePath = import.meta.env.BASE_URL;

export const config = {
  apiUrl,
  socketUrl,
  appBasePath,
  isDemoMode,
};
