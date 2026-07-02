import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { io, Socket } from 'socket.io-client';
import toast from 'react-hot-toast';

let socket: Socket | null = null;

export function useSocket() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    // Reutiliza conexão existente
    if (socket?.connected) return;

    socket = io(window.location.origin, {
      path: '/socket.io',
      auth: { token: `Bearer ${token}` },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 10,
    });

    socket.on('connect', () => {
      console.log('🔌 Socket conectado');
    });

    socket.on('connect_error', (err) => {
      console.warn('Socket erro de conexão:', err.message);
    });

    // Novo pedido chegou (para funcionários/gerentes)
    socket.on('new_order', () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast('Novo pedido recebido!', { icon: '🛎️' });
    });

    // Status de um pedido foi atualizado
    socket.on('order_updated', () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    });

    // Notificação genérica para o usuário
    socket.on('notification', (data: { titulo: string; mensagem: string }) => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast(data.mensagem, { icon: '🔔', duration: 5000 });
    });

    return () => {
      socket?.disconnect();
      socket = null;
    };
  }, [queryClient]);
}
