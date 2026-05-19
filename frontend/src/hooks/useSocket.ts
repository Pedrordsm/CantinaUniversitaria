import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import { useQueryClient } from '@tanstack/react-query';

export function useSocket() {
  const { token, isAuthenticated } = useAuthStore();
  const socketRef = useRef<Socket | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isAuthenticated || !token) return;

    const socket = io('http://localhost:3001', {
      auth: { token },
      transports: ['websocket'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Socket conectado');
    });

    socket.on('notification', (data: { title: string; message: string; type: string; order_id?: string }) => {
      // Exibe toast baseado no tipo
      const icons: Record<string, string> = {
        new_order: '🛒',
        order_accepted: '👍',
        order_ready: '✅',
        order_cancelled: '❌',
        payment_confirmed: '💳',
      };

      const icon = icons[data.type] || '🔔';
      toast(`${icon} ${data.message}`, {
        duration: 5000,
        style: {
          background: data.type === 'order_cancelled' ? '#fee2e2' : '#dcfce7',
          color: '#1f2937',
          border: `1px solid ${data.type === 'order_cancelled' ? '#fca5a5' : '#86efac'}`,
        },
      });

      // Invalida queries relevantes
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    });

    socket.on('new_order', () => {
      // Som de notificação para funcionários
      try {
        const audioCtx = new AudioContext();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.frequency.value = 880;
        gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
        oscillator.start(audioCtx.currentTime);
        oscillator.stop(audioCtx.currentTime + 0.5);
      } catch {
        // Ignora erro de áudio
      }

      queryClient.invalidateQueries({ queryKey: ['orders'] });
    });

    socket.on('disconnect', () => {
      console.log('Socket desconectado');
    });

    return () => {
      socket.disconnect();
    };
  }, [isAuthenticated, token, queryClient]);

  return socketRef.current;
}
