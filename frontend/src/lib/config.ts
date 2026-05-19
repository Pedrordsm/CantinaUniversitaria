const apiUrl = import.meta.env.VITE_API_URL || '/api';
const socketUrl =
  import.meta.env.VITE_SOCKET_URL || (import.meta.env.DEV ? 'http://localhost:3001' : window.location.origin);

export const config = {
  apiUrl,
  socketUrl,
};
