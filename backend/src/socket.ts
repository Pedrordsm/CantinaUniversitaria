import { Server as HttpServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import jwt from 'jsonwebtoken';
import { JwtPayload } from './types';

let io: SocketServer;

export function initSocket(httpServer: HttpServer): SocketServer {
  io = new SocketServer(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token?.replace(/^Bearer\s+/i, '');
    if (!token) {
      return next(new Error('Token não fornecido'));
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as JwtPayload;
      socket.data.userId = decoded.userId;
      socket.data.role = decoded.role;
      next();
    } catch {
      next(new Error('Token inválido'));
    }
  });

  io.on('connection', (socket) => {
    const { userId, role } = socket.data;

    // Coloca o socket nas salas do usuário e da role
    socket.join(`user:${userId}`);
    socket.join(`role:${role}`);

    console.log(`🔌 Socket conectado: user:${userId} (${role})`);

    socket.on('disconnect', () => {
      console.log(`🔌 Socket desconectado: user:${userId}`);
    });
  });

  return io;
}

export function getIO(): SocketServer {
  if (!io) throw new Error('Socket.io não foi inicializado');
  return io;
}

// Helpers para emitir eventos

export function emitToUser(userId: number, event: string, data: object) {
  getIO().to(`user:${userId}`).emit(event, data);
}

export function emitToRole(role: string, event: string, data: object) {
  getIO().to(`role:${role}`).emit(event, data);
}
